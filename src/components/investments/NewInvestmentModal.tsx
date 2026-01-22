
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useFormatters } from "@/hooks/useFormatters";

interface NewInvestmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddInvestment?: (investment: any) => void;
}

const assetTypes = [
  { id: "stocks", name: "Ações", icon: "📈" },
  { id: "fixed_income", name: "Renda Fixa", icon: "💵" },
  { id: "real_estate", name: "Fundos Imobiliários", icon: "🏢" },
  { id: "crypto", name: "Criptomoedas", icon: "₿" },
  { id: "treasury", name: "Tesouro Direto", icon: "🏛️" },
  { id: "savings", name: "Poupança", icon: "💰" },
  { id: "international", name: "Investimentos Internacionais", icon: "🌎" },
];

const NewInvestmentModal = ({ open, onOpenChange, onAddInvestment }: NewInvestmentModalProps) => {
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState("");
  const [amount, setAmount] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date());
  const { formatCurrency } = useFormatters();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !assetType || !amount || !purchasePrice || !purchaseDate) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const newInvestment = {
      id: `inv-${Date.now()}`,
      name,
      type: assetType,
      amount: parseFloat(amount),
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate,
      currentPrice: parseFloat(purchasePrice), // Inicialmente igual ao preço de compra
      totalValue: parseFloat(amount) * parseFloat(purchasePrice),
      variation: 0, // Variação inicial é 0
      createdAt: new Date(),
    };

    if (onAddInvestment) {
      onAddInvestment(newInvestment);
    }

    toast.success("Investimento adicionado com sucesso!", {
      description: `${name} foi adicionado à sua carteira.`,
    });

    // Reset form
    setName("");
    setAssetType("");
    setAmount("");
    setPurchasePrice("");
    setPurchaseDate(new Date());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-green-600">
            <BarChart3 className="mr-2 h-5 w-5" />
            Novo Investimento
          </DialogTitle>
          <DialogDescription>
            Adicione um novo investimento à sua carteira.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          <div className="grid gap-5">
            <div className="grid gap-3">
              <Label htmlFor="investment-name" className="text-sm font-medium text-gray-700">Nome do Investimento *</Label>
              <Input 
                id="investment-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ex: PETR4, Tesouro Selic 2026, etc."
                className="shadow-sm"
                required
              />
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="asset-type" className="text-sm font-medium text-gray-700">Tipo de Ativo *</Label>
              <Select value={assetType} onValueChange={setAssetType} required>
                <SelectTrigger id="asset-type" className="rounded-xl border-gray-200 shadow-sm bg-white h-10">
                  <SelectValue placeholder="Selecione um tipo de ativo" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {assetTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id} className="rounded-lg my-0.5 focus:bg-green-50">
                      <div className="flex items-center">
                        <span className="mr-2">{type.icon}</span>
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">Quantidade *</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  placeholder="10"
                  min="0"
                  step="0.01"
                  className="shadow-sm"
                  required
                />
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="purchase-price" className="text-sm font-medium text-gray-700">Preço de Compra (R$) *</Label>
                <Input 
                  id="purchase-price" 
                  type="number" 
                  value={purchasePrice} 
                  onChange={(e) => setPurchasePrice(e.target.value)} 
                  placeholder="25.75"
                  min="0"
                  step="0.01"
                  className="shadow-sm"
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="purchase-date" className="text-sm font-medium text-gray-700">Data de Compra *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="purchase-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal shadow-sm h-10 border-gray-200",
                      !purchaseDate && "text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    {purchaseDate ? format(purchaseDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl border-gray-200 shadow-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={purchaseDate}
                    onSelect={setPurchaseDate}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => date > new Date()}
                    className="rounded-xl border-0 p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              size="lg"
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="success"
              size="lg"
              className="rounded-xl"
            >
              Adicionar Investimento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewInvestmentModal;
