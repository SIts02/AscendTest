import { useState } from 'react';
import { useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  CheckCircle,
  Loader2,
  Star,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Bug,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';
type FeedbackPriority = 'low' | 'medium' | 'high';
type FeedbackRating = 1 | 2 | 3 | 4 | 5 | null;

interface FeedbackFormData {
  type: FeedbackType;
  priority: FeedbackPriority;
  title: string;
  description: string;
  rating: FeedbackRating;
  user_email?: string;
}

const Feedback = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FeedbackFormData>({
    type: 'other',
    priority: 'medium',
    title: '',
    description: '',
    rating: null,
  });

  useEffect(() => {
    document.title = "MoMoney | Feedback";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    try {

      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user?.id,
          type: formData.type,
          priority: formData.priority,
          title: formData.title.trim(),
          description: formData.description.trim(),
          rating: formData.rating,
          user_email: user?.email || formData.user_email,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Feedback enviado com sucesso! Obrigado pela sua contribuição.');
      setSubmitted(true);

      setTimeout(() => {
        setFormData({
          type: 'other',
          priority: 'medium',
          title: '',
          description: '',
          rating: null,
        });
        setSubmitted(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (rating: FeedbackRating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const getTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case 'bug':
        return <Bug className="h-4 w-4" />;
      case 'feature':
        return <Lightbulb className="h-4 w-4" />;
      case 'improvement':
        return <ThumbsUp className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: FeedbackType) => {
    switch (type) {
      case 'bug':
        return 'Bug/Erro';
      case 'feature':
        return 'Nova Funcionalidade';
      case 'improvement':
        return 'Melhoria';
      default:
        return 'Outro';
    }
  };

  return (
    <DashboardLayout activePage="Feedback">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            Feedback
          </h1>
          <p className="text-muted-foreground mt-2">
            Sua opinião é muito importante para nós! Compartilhe sugestões, reporte problemas ou envie ideias.
          </p>
        </div>

        {submitted ? (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-200">Feedback Enviado!</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Obrigado pelo seu feedback! Nossa equipe irá analisar sua mensagem.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Enviar Feedback</CardTitle>
              <CardDescription>
                Ajude-nos a melhorar o MoMoney compartilhando suas ideias e experiências
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {}
                <div className="space-y-3">
                  <Label>Como você avalia sua experiência? (Opcional)</Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleRatingClick(rating as FeedbackRating)}
                        className={`
                          p-2 rounded-lg transition-all hover:scale-110
                          ${formData.rating === rating
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                          }
                        `}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            formData.rating && formData.rating >= rating
                              ? 'fill-current'
                              : ''
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {}
                <div className="space-y-3">
                  <Label>Tipo de Feedback *</Label>
                  <RadioGroup
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as FeedbackType }))}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    {(['bug', 'feature', 'improvement', 'other'] as FeedbackType[]).map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem value={type} id={type} />
                        <Label
                          htmlFor={type}
                          className="flex items-center gap-2 cursor-pointer font-normal"
                        >
                          {getTypeIcon(type)}
                          {getTypeLabel(type)}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {}
                <div className="space-y-3">
                  <Label>Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as FeedbackPriority }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {}
                <div className="space-y-3">
                  <Label htmlFor="title">Título *</Label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Problema ao importar extrato bancário"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={100}
                    required
                  />
                </div>

                {}
                <div className="space-y-3">
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva detalhadamente seu feedback, sugestão ou problema encontrado..."
                    className="min-h-[150px]"
                    maxLength={2000}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/2000 caracteres
                  </p>
                </div>

                {}
                <div className="flex justify-end gap-3">
                  <Button
                    type="submit"
                    disabled={loading || !formData.title.trim() || !formData.description.trim()}
                    className="gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar Feedback
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Heart className="h-5 w-5 text-primary mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold">Por que seu feedback é importante?</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Nos ajuda a identificar e corrigir problemas rapidamente</li>
                  <li>Guia o desenvolvimento de novas funcionalidades</li>
                  <li>Melhora a experiência de todos os usuários</li>
                  <li>Nos permite criar um produto melhor para você</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Feedback;