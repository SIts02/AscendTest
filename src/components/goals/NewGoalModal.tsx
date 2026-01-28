import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Target, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useFormatters } from "@/hooks/useFormatters";
import { goalFormSchema, getFirstError, VALIDATION_LIMITS, sanitizeString } from "@/lib/validators";

interface NewGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddGoal?: (goal: any) => void;
}

const ALLOWED_CATEGORIES = [
  { id: "savings", name: "Poupança", icon: "💰" },
  { id: "travel", name: "Lazer", icon: "✈️" },
  { id: "education", name: "Educação", icon: "🎓" },
  { id: "property", name: "Imóvel", icon: "🏠" },
  { id: "vehicle", name: "Bens", icon: "🚗" },
  { id: "other", name: "Outros", icon: "📦" },
] as const;

type CategoryId = typeof ALLOWED_CATEGORIES[number]['id'];

const NewGoalModal = ({ open, onOpenChange, onAddGoal }: NewGoalModalProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryId | "">("");
  const [targetAmount, setTargetAmount] = useState("");
  const [initialAmount, setInitialAmount] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { formatCurrency } = useFormatters();

  const resetForm = () => {
    setName("");
    setCategory("");
    setTargetAmount("");
    setInitialAmount("");
    setDate(undefined);
    setErrors({});
    setIsSubmitting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedTargetAmount = parseFloat(targetAmount);
    const parsedInitialAmount = parseFloat(initialAmount || "0");

    const validationResult = goalFormSchema.safeParse({
      name: name.trim(),
      category,
      targetAmount: isNaN(parsedTargetAmount) ? 0 : parsedTargetAmount,
      currentAmount: isNaN(parsedInitialAmount) ? 0 : parsedInitialAmount,
      deadline: date,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.errors.forEach(err => {
        const field = err.path[0]?.toString() || 'form';
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error(getFirstError(validationResult.error));
      return;
    }

    if (parsedInitialAmount > parsedTargetAmount) {
      setErrors({ currentAmount: 'Valor inicial não pode ser maior que o valor alvo' });
      toast.error('Valor inicial não pode ser maior que o valor alvo');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {

      const newGoal = {
        id: `goal-${Date.now()}`,
        name: sanitizeString(validationResult.data.name),
        category: validationResult.data.category,
        targetAmount: validationResult.data.targetAmount,
        currentAmount: validationResult.data.currentAmount || 0,
        deadline: validationResult.data.deadline,
        createdAt: new Date(),
        progress: ((validationResult.data.currentAmount || 0) / validationResult.data.targetAmount) * 100,
        status: "em andamento",
      };

      if (onAddGoal) {
        onAddGoal(newGoal);
      }

      toast.success("Meta criada com sucesso!", {
        description: `Sua meta "${validationResult.data.name}" foi adicionada.`,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao criar meta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

        <form onSubmit={handleSubmit} className="space-y-6 mt-2" noValidate>
          <div className="grid gap-5">
            {}
            <div className="grid gap-3">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nome da Meta *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  const value = e.target.value.slice(0, VALIDATION_LIMITS.NAME_MAX);
                  setName(value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder="Ex: Viagem para Europa"
                maxLength={VALIDATION_LIMITS.NAME_MAX}
                className={cn("shadow-sm", errors.name && "border-red-500")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {}
            <div className="grid gap-3">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                Categoria *
              </Label>
              <Select
                value={category}
                onValueChange={(value: CategoryId) => {
                  setCategory(value);
                  if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
                }}
              >
                <SelectTrigger
                  id="category"
                  className={cn(
                    "rounded-xl border-gray-200 shadow-sm bg-white h-10",
                    errors.category && "border-red-500"
                  )}
                >
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white">
                  {ALLOWED_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="rounded-lg my-0.5 focus:bg-blue-50">
                      <div className="flex items-center">
                        <span className="mr-2">{cat.icon}</span>
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            {}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="target-amount" className="text-sm font-medium text-gray-700">
                  Valor Alvo (R$) *
                </Label>
                <Input
                  id="target-amount"
                  type="number"
                  value={targetAmount}
                  onChange={(e) => {

                    const value = e.target.value;
                    if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) <= VALIDATION_LIMITS.AMOUNT_MAX)) {
                      setTargetAmount(value);
                      if (errors.targetAmount) setErrors(prev => ({ ...prev, targetAmount: '' }));
                    }
                  }}
                  placeholder="10000"
                  min="0.01"
                  max={VALIDATION_LIMITS.AMOUNT_MAX}
                  step="0.01"
                  className={cn("shadow-sm", errors.targetAmount && "border-red-500")}
                  aria-invalid={!!errors.targetAmount}
                />
                {errors.targetAmount && (
                  <p className="text-sm text-red-500">{errors.targetAmount}</p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="initial-amount" className="text-sm font-medium text-gray-700">
                  Valor Inicial (R$)
                </Label>
                <Input
                  id="initial-amount"
                  type="number"
                  value={initialAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) <= VALIDATION_LIMITS.AMOUNT_MAX)) {
                      setInitialAmount(value);
                      if (errors.currentAmount) setErrors(prev => ({ ...prev, currentAmount: '' }));
                    }
                  }}
                  placeholder="0"
                  min="0"
                  max={VALIDATION_LIMITS.AMOUNT_MAX}
                  step="0.01"
                  className={cn("shadow-sm", errors.currentAmount && "border-red-500")}
                  aria-invalid={!!errors.currentAmount}
                />
                {errors.currentAmount && (
                  <p className="text-sm text-red-500">{errors.currentAmount}</p>
                )}
              </div>
            </div>

            {}
            <div className="grid gap-3">
              <Label htmlFor="deadline" className="text-sm font-medium text-gray-700">
                Data Limite *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="deadline"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal shadow-sm h-10 border-gray-200",
                      !date && "text-gray-400",
                      errors.deadline && "border-red-500"
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
                    onSelect={(newDate) => {
                      setDate(newDate);
                      if (errors.deadline) setErrors(prev => ({ ...prev, deadline: '' }));
                    }}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => date < new Date()}
                    className="rounded-xl border-0 p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {errors.deadline && (
                <p className="text-sm text-red-500">{errors.deadline}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              size="lg"
              className="rounded-xl"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Adicionar Meta'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewGoalModal;