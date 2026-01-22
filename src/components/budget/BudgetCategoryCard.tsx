import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, ArrowDownRight, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BudgetCategory } from "@/hooks/useBudget";
import { useFormatters } from "@/hooks/useFormatters";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface BudgetCategoryCardProps {
  category: BudgetCategory;
  onUpdateLimit: (id: string, newLimit: number) => Promise<boolean>;
}

const BudgetCategoryCard = ({ category, onUpdateLimit }: BudgetCategoryCardProps) => {
  const { formatCurrency } = useFormatters();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newLimit, setNewLimit] = useState(category.max_amount.toString());

  const getProgressColorClass = (percent: number) => {
    if (percent < 50) return "bg-green-500";
    if (percent < 75) return "bg-amber-500";
    if (percent < 90) return "bg-orange-500";
    return "bg-red-500";
  };

  const handleSaveLimit = async () => {
    const success = await onUpdateLimit(category.id, parseFloat(newLimit));
    if (success) {
      setEditDialogOpen(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 animate-fade-in">
        <div className={`h-1 ${getProgressColorClass(category.percentage)}`}></div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: category.color }} 
              />
              <h3 className="font-medium">{category.name}</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => setEditDialogOpen(true)}
            >
              <Edit2 className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </Button>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{formatCurrency(category.current_amount)}</span>
              <span className="text-gray-500">{formatCurrency(category.max_amount)}</span>
            </div>
            <Progress 
              value={category.percentage} 
              className={`h-2 ${getProgressColorClass(category.percentage)}`}
            />
            <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
              <span>Utilizado: {category.percentage}%</span>
              <span className="flex items-center">
                {category.percentage > 90 ? (
                  <span className="flex items-center text-red-500">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" />
                    Limite próximo
                  </span>
                ) : (
                  <span className="flex items-center text-green-500">
                    <ArrowDownRight className="h-3 w-3 mr-0.5" />
                    Em controle
                  </span>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar limite de {category.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="limit" className="text-right col-span-1">
                Limite:
              </label>
              <Input
                id="limit"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                className="col-span-3"
                type="number"
                min="0"
                step="100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveLimit}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BudgetCategoryCard;
