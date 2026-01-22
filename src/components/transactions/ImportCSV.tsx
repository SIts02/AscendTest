import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, AlertCircle, FileSpreadsheet, Check, X } from 'lucide-react';
import { TransactionFormData } from '@/hooks/useTransactions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
interface ImportCSVProps {
  onImport: (transactions: TransactionFormData[]) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function ImportCSV({
  onImport,
  open,
  onOpenChange
}: ImportCSVProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<TransactionFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping'>('upload');
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<string[]>([]);

  // CSV parser function
  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n');
    return lines.map(line => {
      // Handle quoted values with commas inside them
      const result = [];
      let inQuote = false;
      let currentValue = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          result.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }

      // Add the last value
      result.push(currentValue);
      return result;
    }).filter(row => row.some(cell => cell.trim() !== ''));
  };

  // Guess the correct mappings based on header names
  const guessMappings = (headers: string[]): Record<string, string> => {
    const result: Record<string, string> = {};
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());

    // Map for description
    const descriptionKeywords = ['descrição', 'descricao', 'desc', 'nome', 'title', 'titulo'];
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (descriptionKeywords.some(keyword => lowerHeaders[i].includes(keyword))) {
        result['description'] = headers[i];
        break;
      }
    }

    // Map for amount
    const amountKeywords = ['valor', 'amount', 'price', 'preço', 'preco'];
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (amountKeywords.some(keyword => lowerHeaders[i].includes(keyword))) {
        result['amount'] = headers[i];
        break;
      }
    }

    // Map for date
    const dateKeywords = ['data', 'date', 'dia', 'vencimento'];
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (dateKeywords.some(keyword => lowerHeaders[i].includes(keyword))) {
        result['date'] = headers[i];
        break;
      }
    }

    // Map for category
    const categoryKeywords = ['categoria', 'category', 'tipo', 'type'];
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (categoryKeywords.some(keyword => lowerHeaders[i].includes(keyword))) {
        result['category'] = headers[i];
        break;
      }
    }

    // Map for type (income/expense)
    const typeKeywords = ['tipo', 'type', 'natureza', 'nature'];
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (typeKeywords.some(keyword => lowerHeaders[i].includes(keyword)) && !result['category']) {
        result['type'] = headers[i];
        break;
      }
    }

    // Map for payment method
    const methodKeywords = ['pagamento', 'payment', 'método', 'metodo', 'method'];
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (methodKeywords.some(keyword => lowerHeaders[i].includes(keyword))) {
        result['payment_method'] = headers[i];
        break;
      }
    }

    // Map for status
    const statusKeywords = ['status', 'situação', 'situacao', 'state'];
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (statusKeywords.some(keyword => lowerHeaders[i].includes(keyword))) {
        result['status'] = headers[i];
        break;
      }
    }
    return result;
  };

  // Process uploaded file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) {
      return;
    }
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Por favor, envie um arquivo CSV válido.');
      return;
    }
    setFile(file);
    setLoading(true);
    try {
      const text = await file.text();
      const parsedData = parseCSV(text);
      if (parsedData.length < 2) {
        throw new Error('O arquivo CSV deve conter pelo menos um cabeçalho e uma linha de dados.');
      }
      const headers = parsedData[0].map(header => header.trim().replace(/^"|"$/g, ''));
      setHeaders(headers);

      // Guess initial mappings
      const guessedMappings = guessMappings(headers);
      setMappings(guessedMappings);

      // Generate preview with the first few rows
      const previewData = parsedData.slice(1, Math.min(6, parsedData.length)).map(row => {
        const transaction: Partial<TransactionFormData> = {};

        // Apply mappings to create transaction objects
        headers.forEach((header, index) => {
          const value = row[index]?.trim().replace(/^"|"$/g, '') || '';
          if (guessedMappings.description === header) transaction.description = value;
          if (guessedMappings.amount === header) transaction.amount = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          if (guessedMappings.date === header) {
            // Try to parse the date in various formats
            let date: Date | null = null;
            const dateParsers = [(str: string) => parse(str, 'dd/MM/yyyy', new Date()), (str: string) => parse(str, 'yyyy-MM-dd', new Date()), (str: string) => parse(str, 'MM/dd/yyyy', new Date()), (str: string) => new Date(str)];
            for (const parser of dateParsers) {
              try {
                date = parser(value);
                if (isValid(date)) break;
              } catch (e) {
                // Continue to next parser
              }
            }
            transaction.date = date && isValid(date) ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
          }
          if (guessedMappings.category === header) transaction.category_id = value; // Will need to be mapped to actual IDs later
          if (guessedMappings.type === header) {
            const lowerValue = value.toLowerCase();
            if (lowerValue.includes('receita') || lowerValue.includes('entrada') || lowerValue.includes('income') || lowerValue.includes('+')) {
              transaction.type = 'income';
            } else if (lowerValue.includes('despesa') || lowerValue.includes('saída') || lowerValue.includes('expense') || lowerValue.includes('-')) {
              transaction.type = 'expense';
            } else {
              // Default to expense if unclear
              transaction.type = 'expense';
            }
          }
          if (guessedMappings.payment_method === header) {
            const lowerValue = value.toLowerCase();
            if (lowerValue.includes('cartão de crédito') || lowerValue.includes('credito') || lowerValue.includes('credit')) {
              transaction.payment_method = 'credit';
            } else if (lowerValue.includes('cartão de débito') || lowerValue.includes('debito') || lowerValue.includes('debit')) {
              transaction.payment_method = 'debit';
            } else if (lowerValue.includes('dinheiro') || lowerValue.includes('cash')) {
              transaction.payment_method = 'cash';
            } else if (lowerValue.includes('transferência') || lowerValue.includes('transfer')) {
              transaction.payment_method = 'transfer';
            } else if (lowerValue.includes('pix')) {
              transaction.payment_method = 'pix';
            } else {
              transaction.payment_method = 'other';
            }
          }
          if (guessedMappings.status === header) {
            const lowerValue = value.toLowerCase();
            if (lowerValue.includes('concluído') || lowerValue.includes('concluido') || lowerValue.includes('completed') || lowerValue.includes('pago') || lowerValue.includes('paid')) {
              transaction.status = 'completed';
            } else if (lowerValue.includes('pendente') || lowerValue.includes('pending')) {
              transaction.status = 'pending';
            } else if (lowerValue.includes('agendado') || lowerValue.includes('scheduled')) {
              transaction.status = 'scheduled';
            } else {
              transaction.status = 'completed'; // Default status
            }
          }
        });

        // Set defaults for any missing required fields
        if (!transaction.description) transaction.description = 'Importado do CSV';
        if (!transaction.amount) transaction.amount = 0;
        if (!transaction.date) transaction.date = format(new Date(), 'yyyy-MM-dd');
        if (!transaction.type) transaction.type = 'expense';
        if (!transaction.status) transaction.status = 'completed';
        return transaction as TransactionFormData;
      });
      setPreview(previewData);
      setStep('preview');
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setError('Erro ao processar o arquivo CSV. Verifique o formato do arquivo.');
    } finally {
      setLoading(false);
    }
  };
  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const parsedData = parseCSV(text);
      const headers = parsedData[0].map(header => header.trim().replace(/^"|"$/g, ''));

      // Process all rows except header
      const transactions = parsedData.slice(1).map(row => {
        const transaction: Partial<TransactionFormData> = {};

        // Apply mappings to create transaction objects
        headers.forEach((header, index) => {
          const value = row[index]?.trim().replace(/^"|"$/g, '') || '';
          if (mappings.description === header) transaction.description = value;
          if (mappings.amount === header) transaction.amount = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
          if (mappings.date === header) {
            // Try to parse the date in various formats
            let date: Date | null = null;
            const dateParsers = [(str: string) => parse(str, 'dd/MM/yyyy', new Date()), (str: string) => parse(str, 'yyyy-MM-dd', new Date()), (str: string) => parse(str, 'MM/dd/yyyy', new Date()), (str: string) => new Date(str)];
            for (const parser of dateParsers) {
              try {
                date = parser(value);
                if (isValid(date)) break;
              } catch (e) {
                // Continue to next parser
              }
            }
            transaction.date = date && isValid(date) ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
          }
          if (mappings.category === header) transaction.category_id = null; // Categories would need to be mapped to actual IDs
          if (mappings.type === header) {
            const lowerValue = value.toLowerCase();
            if (lowerValue.includes('receita') || lowerValue.includes('entrada') || lowerValue.includes('income') || lowerValue.includes('+')) {
              transaction.type = 'income';
            } else if (lowerValue.includes('despesa') || lowerValue.includes('saída') || lowerValue.includes('expense') || lowerValue.includes('-')) {
              transaction.type = 'expense';
            } else {
              transaction.type = 'expense';
            }
          }
          if (mappings.payment_method === header) {
            const lowerValue = value.toLowerCase();
            if (lowerValue.includes('cartão de crédito') || lowerValue.includes('credito') || lowerValue.includes('credit')) {
              transaction.payment_method = 'credit';
            } else if (lowerValue.includes('cartão de débito') || lowerValue.includes('debito') || lowerValue.includes('debit')) {
              transaction.payment_method = 'debit';
            } else if (lowerValue.includes('dinheiro') || lowerValue.includes('cash')) {
              transaction.payment_method = 'cash';
            } else if (lowerValue.includes('transferência') || lowerValue.includes('transfer')) {
              transaction.payment_method = 'transfer';
            } else if (lowerValue.includes('pix')) {
              transaction.payment_method = 'pix';
            } else {
              transaction.payment_method = 'other';
            }
          }
          if (mappings.status === header) {
            const lowerValue = value.toLowerCase();
            if (lowerValue.includes('concluído') || lowerValue.includes('concluido') || lowerValue.includes('completed') || lowerValue.includes('pago') || lowerValue.includes('paid')) {
              transaction.status = 'completed';
            } else if (lowerValue.includes('pendente') || lowerValue.includes('pending')) {
              transaction.status = 'pending';
            } else if (lowerValue.includes('agendado') || lowerValue.includes('scheduled')) {
              transaction.status = 'scheduled';
            } else {
              transaction.status = 'completed';
            }
          }
        });

        // Set defaults for any missing required fields
        if (!transaction.description) transaction.description = 'Importado do CSV';
        if (!transaction.amount) transaction.amount = 0;
        if (!transaction.date) transaction.date = format(new Date(), 'yyyy-MM-dd');
        if (!transaction.type) transaction.type = 'expense';
        if (!transaction.status) transaction.status = 'completed';
        return transaction as TransactionFormData;
      });
      if (transactions.length === 0) {
        throw new Error('Nenhuma transação encontrada no arquivo.');
      }

      // Filter out transactions with amount 0 or empty description
      const validTransactions = transactions.filter(t => t.amount > 0 && t.description && t.description.trim() !== '');
      if (validTransactions.length === 0) {
        throw new Error('Nenhuma transação válida encontrada no arquivo.');
      }
      await onImport(validTransactions);
      toast.success(`${validTransactions.length} transações importadas com sucesso!`);

      // Reset state
      setFile(null);
      setPreview([]);
      setStep('upload');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error importing transactions:', error);
      setError(error.message || 'Erro ao importar transações.');
    } finally {
      setLoading(false);
    }
  };
  const resetFile = () => {
    setFile(null);
    setPreview([]);
    setStep('upload');
    setError(null);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#000a0e]/0 rounded-3xl">
        <DialogHeader>
          <DialogTitle>Importar Transações de CSV</DialogTitle>
          <DialogDescription>
            Importe suas transações de um arquivo CSV. Os dados serão analisados e adicionados à sua lista de transações.
          </DialogDescription>
        </DialogHeader>
        
        {error && <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>}
        
        {step === 'upload' && <div className="grid gap-4">
            <div className="border-2 border-dashed rounded-md p-10 text-center">
              <FileSpreadsheet className="mx-auto h-10 w-10 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Arraste seu arquivo CSV ou clique para selecionar</h3>
              <p className="text-sm text-gray-500 mb-4">
                O arquivo deve estar no formato CSV e conter pelo menos as colunas para descrição, valor e data.
              </p>
              <Input type="file" accept=".csv" className="hidden" id="csv-upload" onChange={handleFileUpload} disabled={loading} />
              <label htmlFor="csv-upload">
                <Button asChild variant="outline" disabled={loading}>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar Arquivo
                  </span>
                </Button>
              </label>
            </div>
          </div>}
        
        {step === 'preview' && <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Arquivo: <span className="font-medium text-gray-700">{file?.name}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Transações identificadas: <span className="font-medium text-gray-700">{preview.length}</span>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={resetFile}>
                Alterar arquivo
              </Button>
            </div>
            
            <div>
              <h3 className="text-md font-medium mb-2">Pré-visualização dos dados</h3>
              <div className="border rounded-md max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((transaction, index) => <TableRow key={index}>
                        <TableCell className="font-medium">{transaction.description}</TableCell>
                        <TableCell>
                          {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          {format(parse(transaction.date, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy', {
                      locale: ptBR
                    })}
                        </TableCell>
                        <TableCell>
                          <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {transaction.status === 'completed' && 'Concluído'}
                          {transaction.status === 'pending' && 'Pendente'}
                          {transaction.status === 'scheduled' && 'Agendado'}
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          {step === 'preview' && <Button onClick={handleImport} disabled={loading || preview.length === 0}>
              {loading ? <>
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></span>
                  Importando...
                </> : <>
                  <Check className="mr-2 h-4 w-4" />
                  Importar Transações
                </>}
            </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}