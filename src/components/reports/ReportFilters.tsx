import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCategories } from '@/hooks/useCategories';
import { ReportFilters as ReportFiltersType } from '@/hooks/useReports';

interface ReportFiltersProps {
  filters: ReportFiltersType;
  onFiltersChange: (filters: ReportFiltersType) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const ReportFilters = ({ filters, onFiltersChange, onApplyFilters, onClearFilters }: ReportFiltersProps) => {
  const { categories } = useCategories();
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.dateRange.start ? new Date(filters.dateRange.start) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.dateRange.end ? new Date(filters.dateRange.end) : undefined
  );

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
    onFiltersChange({
      ...filters,
      dateRange: {
        start: start ? format(start, 'yyyy-MM-dd') : '',
        end: end ? format(end, 'yyyy-MM-dd') : ''
      }
    });
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, categoryId]
      : filters.categories.filter(id => id !== categoryId);
    
    onFiltersChange({
      ...filters,
      categories: newCategories
    });
  };

  const handleTransactionTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...filters.transactionTypes, type]
      : filters.transactionTypes.filter(t => t !== type);
    
    onFiltersChange({
      ...filters,
      transactionTypes: newTypes
    });
  };

  const paymentMethods = ['Dinheiro', 'Cartão de Débito', 'Cartão de Crédito', 'PIX', 'Transferência', 'Boleto'];

  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    const newMethods = checked
      ? [...filters.paymentMethods, method]
      : filters.paymentMethods.filter(m => m !== method);
    
    onFiltersChange({
      ...filters,
      paymentMethods: newMethods
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros do Relatório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range */}
        <div className="space-y-2">
          <Label>Período</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data inicial'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => handleDateRangeChange(date, endDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data final'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => handleDateRangeChange(startDate, date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Transaction Types */}
        <div className="space-y-2">
          <Label>Tipos de Transação</Label>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="income"
                checked={filters.transactionTypes.includes('income')}
                onCheckedChange={(checked) => handleTransactionTypeChange('income', checked as boolean)}
              />
              <Label htmlFor="income">Receitas</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="expense"
                checked={filters.transactionTypes.includes('expense')}
                onCheckedChange={(checked) => handleTransactionTypeChange('expense', checked as boolean)}
              />
              <Label htmlFor="expense">Despesas</Label>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <Label>Categorias</Label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={category.id}
                  checked={filters.categories.includes(category.id)}
                  onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                />
                <Label htmlFor={category.id} className="text-sm">
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Amount Range */}
        <div className="space-y-2">
          <Label>Faixa de Valor</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Valor mínimo"
                value={filters.amountRange.min || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  amountRange: {
                    ...filters.amountRange,
                    min: e.target.value ? Number(e.target.value) : null
                  }
                })}
              />
            </div>
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Valor máximo"
                value={filters.amountRange.max || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  amountRange: {
                    ...filters.amountRange,
                    max: e.target.value ? Number(e.target.value) : null
                  }
                })}
              />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2">
          <Label>Métodos de Pagamento</Label>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => (
              <div key={method} className="flex items-center space-x-2">
                <Checkbox
                  id={method}
                  checked={filters.paymentMethods.includes(method)}
                  onCheckedChange={(checked) => handlePaymentMethodChange(method, checked as boolean)}
                />
                <Label htmlFor={method} className="text-sm">
                  {method}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Description Search */}
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Input
            placeholder="Buscar por descrição..."
            value={filters.description}
            onChange={(e) => onFiltersChange({
              ...filters,
              description: e.target.value
            })}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={onApplyFilters} className="flex-1">
            Aplicar Filtros
          </Button>
          <Button variant="outline" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportFilters;