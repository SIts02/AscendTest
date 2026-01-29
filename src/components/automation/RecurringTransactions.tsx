import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Repeat, TrendingUp, TrendingDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAutomation } from '@/hooks/useAutomation';
import { useCategories } from '@/hooks/useCategories';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useFormatters } from '@/hooks/useFormatters';

export const RecurringTransactions = () => {
  const { recurringTransactions, createRecurringTransaction, deleteRecurringTransaction } = useAutomation();
  const { categories } = useCategories();
  const { formatCurrency } = useFormatters();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    template_name: '',
    amount: '',
    description: '',
    category_id: '',
    type: 'expense' as 'income' | 'expense',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    frequency_interval: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    payment_method: '',
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.template_name || !formData.amount || !formData.description) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um valor válido',
        variant: 'destructive'
      });
      return;
    }

    const startDate = new Date(formData.start_date);
    const nextExecutionDate = new Date(startDate);

    switch (formData.frequency) {
      case 'daily':
        nextExecutionDate.setDate(startDate.getDate() + formData.frequency_interval);
        break;
      case 'weekly':
        nextExecutionDate.setDate(startDate.getDate() + (7 * formData.frequency_interval));
        break;
      case 'monthly':
        nextExecutionDate.setMonth(startDate.getMonth() + formData.frequency_interval);
        break;
      case 'yearly':
        nextExecutionDate.setFullYear(startDate.getFullYear() + formData.frequency_interval);
        break;
    }

    await createRecurringTransaction({
      template_name: formData.template_name,
      amount: amount,
      description: formData.description,
      category_id: formData.category_id || null,
      type: formData.type,
      frequency: formData.frequency,
      frequency_interval: formData.frequency_interval,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      next_execution_date: nextExecutionDate.toISOString().split('T')[0],
      payment_method: formData.payment_method || null,
      is_active: formData.is_active
    });

    setFormData({
      template_name: '',
      amount: '',
      description: '',
      category_id: '',
      type: 'expense',
      frequency: 'monthly',
      frequency_interval: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      payment_method: '',
      is_active: true
    });
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Transações Recorrentes
            </CardTitle>
            <CardDescription>
              Gerencie transações que se repetem automaticamente
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Transação Recorrente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template_name">Nome</Label>
                    <Input
                      id="template_name"
                      value={formData.template_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                      placeholder="Ex: Aluguel"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Valor</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da transação"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category_id">Categoria</Label>
                    <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.filter(c => c.type === formData.type).map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Transação</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recurringTransactions?.length === 0 ? (
            <div className="text-center py-8">
              <Repeat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma transação recorrente configurada</p>
            </div>
          ) : (
            recurringTransactions?.map(transaction => (
              <Card key={transaction.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <h4 className="font-semibold">{transaction.template_name}</h4>
                      </div>
                      <Badge variant={transaction.is_active ? "default" : "secondary"}>
                        {transaction.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{transaction.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(transaction.amount)}
                      </span>
                      <span className="text-muted-foreground">
                        {transaction.frequency}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRecurringTransaction(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};