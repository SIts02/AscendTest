import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, BarChart3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useFormatters } from "@/hooks/useFormatters";
import { investmentFormSchema, getFirstError, VALIDATION_LIMITS, sanitizeString } from "@/lib/validators";

interface NewInvestmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddInvestment?: (investment: any) => void;
}

const ALLOWED_ASSET_TYPES = [
  { id: "stocks", name: "Ações", icon: "📈" },
  { id: "fixed_income", name: "Renda Fixa", icon: "💵" },
  { id: "real_estate", name: "Fundos Imobiliários", icon: "🏢" },
  { id: "crypto", name: "Criptomoedas", icon: "₿" },
  { id: "treasury", name: "Tesouro Direto", icon: "🏛️" },
  { id: "savings", name: "Poupança", icon: "💰" },
  { id: "international", name: "Investimentos Internacionais", icon: "🌎" },
] as const;

type AssetTypeId = typeof ALLOWED_ASSET_TYPES[number]['id'];

const NewInvestmentModal = ({ open, onOpenChange, onAddInvestment }: NewInvestmentModalProps) => {
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<AssetTypeId | "">("");
  const [amount, setAmount] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { formatCurrency } = useFormatters();

  const resetForm = () => {
    setName("");
    setAssetType("");
    setAmount("");
    setPurchasePrice("");
    setPurchaseDate(new Date());
    setErrors({});
    setIsSubmitting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    const parsedPrice = parseFloat(purchasePrice);

    const validationResult = investmentFormSchema.safeParse({
      name: name.trim(),
      type: assetType,
      amount: isNaN(parsedAmount) ? 0 : parsedAmount,
      purchasePrice: isNaN(parsedPrice) ? 0 : parsedPrice,
      purchaseDate,
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

    setIsSubmitting(true);
    setErrors({});

    try {

      const newInvestment = {
        id: `inv-${Date.now()}`,
        name: sanitizeString(validationResult.data.name),
        type: validationResult.data.type,
        amount: validationResult.data.amount,
        purchasePrice: validationResult.data.purchasePrice,
        purchaseDate: validationResult.data.purchaseDate,
        currentPrice: validationResult.data.purchasePrice,
        totalValue: validationResult.data.amount * validationResult.data.purchasePrice,
        variation: 0,
        createdAt: new Date(),
      };

      if (onAddInvestment) {
        onAddInvestment(newInvestment);
      }

      toast.success("Investimento adicionado com sucesso!", {
        description: `${validationResult.data.name} foi adicionado à sua carteira.`,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao adicionar investimento");
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

        <form onSubmit={handleSubmit} className="space-y-6 mt-2" noValidate>
          <div className="grid gap-5">
            {}
            <div className="grid gap-3">
              <Label htmlFor="investment-name" className="text-sm font-medium text-gray-700">
                Nome do Investimento *
              </Label>
              <Input
                id="investment-name"
                value={name}
                onChange={(e) => {
                  const value = e.target.value.slice(0, VALIDATION_LIMITS.NAME_MAX);
                  setName(value);
                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder="Ex: PETR4, Tesouro Selic 2026, etc."
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
              <Label htmlFor="asset-type" className="text-sm font-medium text-gray-700">
                Tipo de Ativo *
              </Label>
              <Select
                value={assetType}
                onValueChange={(value: AssetTypeId) => {
                  setAssetType(value);
                  if (errors.type) setErrors(prev => ({ ...prev, type: '' }));
                }}
              >
                <SelectTrigger
                  id="asset-type"
                  className={cn(
                    "rounded-xl border-gray-200 shadow-sm bg-white h-10",
                    errors.type && "border-red-500"
                  )}
                >
                  <SelectValue placeholder="Selecione um tipo de ativo" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {ALLOWED_ASSET_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id} className="rounded-lg my-0.5 focus:bg-green-50">
                      <div className="flex items-center">
                        <span className="mr-2">{type.icon}</span>
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type}</p>
              )}
            </div>

            {}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                  Quantidade *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) <= VALIDATION_LIMITS.QUANTITY_MAX)) {
                      setAmount(value);
                      if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                    }
                  }}
                  placeholder="10"
                  min="0.0001"
                  max={VALIDATION_LIMITS.QUANTITY_MAX}
                  step="0.0001"
                  className={cn("shadow-sm", errors.amount && "border-red-500")}
                  aria-invalid={!!errors.amount}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount}</p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="purchase-price" className="text-sm font-medium text-gray-700">
                  Preço de Compra (R$) *
                </Label>
                <Input
                  id="purchase-price"
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) <= VALIDATION_LIMITS.AMOUNT_MAX)) {
                      setPurchasePrice(value);
                      if (errors.purchasePrice) setErrors(prev => ({ ...prev, purchasePrice: '' }));
                    }
                  }}
                  placeholder="25.75"
                  min="0.01"
                  max={VALIDATION_LIMITS.AMOUNT_MAX}
                  step="0.01"
                  className={cn("shadow-sm", errors.purchasePrice && "border-red-500")}
                  aria-invalid={!!errors.purchasePrice}
                />
                {errors.purchasePrice && (
                  <p className="text-sm text-red-500">{errors.purchasePrice}</p>
                )}
              </div>
            </div>

            {}
            <div className="grid gap-3">
              <Label htmlFor="purchase-date" className="text-sm font-medium text-gray-700">
                Data de Compra *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="purchase-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal shadow-sm h-10 border-gray-200",
                      !purchaseDate && "text-gray-400",
                      errors.purchaseDate && "border-red-500"
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
                    onSelect={(newDate) => {
                      setPurchaseDate(newDate);
                      if (errors.purchaseDate) setErrors(prev => ({ ...prev, purchaseDate: '' }));
                    }}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => date > new Date()}
                    className="rounded-xl border-0 p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {errors.purchaseDate && (
                <p className="text-sm text-red-500">{errors.purchaseDate}</p>
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
              variant="success"
              size="lg"
              className="rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                'Adicionar Investimento'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewInvestmentModal;