
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useFormatters } from "@/hooks/useFormatters";

interface NewGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddGoal?: (goal: any) => void;
}

const categories = [
  { id: "savings", name: "Poupança", icon: "💰" },
  { id: "travel", name: "Lazer", icon: "✈️" },
  { id: "education", name: "Educação", icon: "🎓" },
  { id: "property", name: "Imóvel", icon: "🏠" },
  { id: "vehicle", name: "Bens", icon: "🚗" },
  { id: "other", name: "Outros", icon: "📦" },
];

const NewGoalModal = ({ open, onOpenChange, onAddGoal }: NewGoalModalProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [initialAmount, setInitialAmount] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const { formatCurrency } = useFormatters();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !category || !targetAmount || !date) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const newGoal = {
      id: `goal-${Date.now()}`,
      name,
      category,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(initialAmount || "0"),
      deadline: date,
      createdAt: new Date(),
      progress: parseFloat(initialAmount || "0") / parseFloat(targetAmount) * 100,
      status: "em andamento",
    };

    if (onAddGoal) {
      onAddGoal(newGoal);
    }

    toast.success("Meta criada com sucesso!", {
      description: `Sua meta "${name}" foi adicionada.`,
    });

    // Reset form
    setName("");
    setCategory("");
    setTargetAmount("");
    setInitialAmount("");
    setDate(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center text-blue-600">
            <Target className="mr-2 h-5 w-5" />
            Nova Meta Financeira
          </DialogTitle>
          <DialogDescription>
            Defina seus objetivos financeiros e acompanhe seu progresso.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          <div className="grid gap-5">
            <div className="grid gap-3">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nome da Meta *</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ex: Viagem para Europa"
                className="shadow-sm"
                required
              />
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">Categoria *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category" className="rounded-xl border-gray-200 shadow-sm bg-white h-10">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="rounded-lg my-0.5 focus:bg-blue-50">
                      <div className="flex items-center">
                        <span className="mr-2">{cat.icon}</span>
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="target-amount" className="text-sm font-medium text-gray-700">Valor Alvo (R$) *</Label>
                <Input 
                  id="target-amount" 
                  type="number" 
                  value={targetAmount} 
                  onChange={(e) => setTargetAmount(e.target.value)} 
                  placeholder="10000"
                  min="0"
                  step="0.01"
                  className="shadow-sm"
                  required
                />
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="initial-amount" className="text-sm font-medium text-gray-700">Valor Inicial (R$)</Label>
                <Input 
                  id="initial-amount" 
                  type="number" 
                  value={initialAmount} 
                  onChange={(e) => setInitialAmount(e.target.value)} 
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="shadow-sm"
                />
              </div>
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="deadline" className="text-sm font-medium text-gray-700">Data Limite *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="deadline"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal shadow-sm h-10 border-gray-200",
                      !date && "text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                    {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl border-gray-200 shadow-lg bg-white" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => date < new Date()}
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
              variant="primary"
              size="lg"
              className="rounded-xl"
            >
              Adicionar Meta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewGoalModal;
