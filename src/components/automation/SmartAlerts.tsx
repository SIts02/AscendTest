import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Bell, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAutomation } from '@/hooks/useAutomation';
import { useCategories } from '@/hooks/useCategories';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

export const SmartAlerts = () => {
  const { alerts, createAlert, deleteAlert } = useAutomation();
  const { categories } = useCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    alert_type: 'budget_limit' as 'budget_limit' | 'goal_milestone' | 'unusual_spending' | 'recurring_reminder' | 'custom',
    title: '',
    message: '',
    threshold_value: '',
    category_id: '',
    frequency: 'immediate' as 'immediate' | 'daily' | 'weekly' | 'monthly',
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    const threshold = formData.threshold_value ? parseFloat(formData.threshold_value) : null;

    await createAlert({
      alert_type: formData.alert_type,
      title: formData.title,
      message: formData.message,
      threshold_value: threshold,
      category_id: formData.category_id || null,
      frequency: formData.frequency,
      is_active: formData.is_active
    });

    setFormData({
      alert_type: 'budget_limit',
      title: '',
      message: '',
      threshold_value: '',
      category_id: '',
      frequency: 'immediate',
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
              <Bell className="h-5 w-5" />
              Alertas Inteligentes
            </CardTitle>
            <CardDescription>
              Configure alertas personalizados para suas finanças
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Alerta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Alerta Inteligente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Orçamento Excedido"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Mensagem do alerta"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="alert_type">Tipo</Label>
                    <Select value={formData.alert_type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, alert_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="budget_limit">Limite de Orçamento</SelectItem>
                        <SelectItem value="goal_milestone">Meta</SelectItem>
                        <SelectItem value="unusual_spending">Gasto Incomum</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="threshold_value">Valor Limite</Label>
                    <Input
                      id="threshold_value"
                      type="number"
                      step="0.01"
                      value={formData.threshold_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, threshold_value: e.target.value }))}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar Alerta</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts?.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum alerta configurado</p>
            </div>
          ) : (
            alerts?.map(alert => (
              <Card key={alert.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <Badge variant={alert.is_active ? "default" : "secondary"}>
                        {alert.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAlert(alert.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};