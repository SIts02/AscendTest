import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageCircle,
  LogOut,
  Loader2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Bug,
  Lightbulb,
  ThumbsUp,
  AlertCircle,
  Eye,
  Edit,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Feedback {
  id: string;
  user_id: string | null;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  rating: number | null;
  user_email: string | null;
  status: 'pending' | 'reviewed' | 'in_progress' | 'resolved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';
type FeedbackStatus = 'pending' | 'reviewed' | 'in_progress' | 'resolved' | 'rejected';

const AdminFeedbacks = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, session } = useAdminAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    document.title = "Ascend Admin | Feedbacks";
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login', { replace: true });
      return;
    }
    loadFeedbacks();

  }, [isAuthenticated, navigate]);

  const loadFeedbacks = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFeedbacks(data || []);
    } catch (error: any) {
      console.error('Error loading feedbacks:', error);
      toast.error('Erro ao carregar feedbacks');

      if (error.message?.includes('JWT') || error.code === 'PGRST301') {
        logout();
        navigate('/admin/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (id: string, status: FeedbackStatus, notes?: string) => {
    try {
      setUpdating(true);

      const updateData: any = { status };
      if (notes !== undefined) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from('user_feedback')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast.success('Feedback atualizado');
      await loadFeedbacks();
      setNotesDialogOpen(false);
      setSelectedFeedback(null);
    } catch (error: any) {
      console.error('Error updating feedback:', error);
      toast.error(error.message || 'Erro ao atualizar feedback');

      if (error.message?.includes('JWT') || error.code === 'PGRST301') {
        logout();
        navigate('/admin/login', { replace: true });
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenNotes = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setAdminNotes(feedback.admin_notes || '');
    setNotesDialogOpen(true);
  };

  const handleSaveNotes = () => {
    if (!selectedFeedback) return;
    updateFeedbackStatus(selectedFeedback.id, selectedFeedback.status, adminNotes);
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
        return 'Bug';
      case 'feature':
        return 'Funcionalidade';
      case 'improvement':
        return 'Melhoria';
      default:
        return 'Outro';
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    const variants: Record<FeedbackStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      pending: { label: 'Pendente', variant: 'secondary', icon: Clock },
      reviewed: { label: 'Revisado', variant: 'default', icon: Eye },
      in_progress: { label: 'Em Andamento', variant: 'default', icon: Loader2 },
      resolved: { label: 'Resolvido', variant: 'default', icon: CheckCircle },
      rejected: { label: 'Rejeitado', variant: 'destructive', icon: XCircle }
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = searchQuery === '' ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || f.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: feedbacks.length,
    pending: feedbacks.filter(f => f.status === 'pending').length,
    resolved: feedbacks.filter(f => f.status === 'resolved').length,
    averageRating: feedbacks.filter(f => f.rating).length > 0
      ? (feedbacks.filter(f => f.rating).reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.filter(f => f.rating).length).toFixed(1)
      : '0.0'
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Painel Admin - Feedbacks
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Gerencie feedbacks e sugestões dos usuários
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="border-white/10 text-gray-300 hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
              <p className="text-sm text-gray-400">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
              <p className="text-sm text-gray-400">Pendentes</p>
              <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
              <p className="text-sm text-gray-400">Resolvidos</p>
              <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4">
              <p className="text-sm text-gray-400">Avaliação Média</p>
              <p className="text-2xl font-bold text-white flex items-center gap-1">
                {stats.averageRating}
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              </p>
            </CardContent>
          </Card>
        </div>

        {}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature">Funcionalidade</SelectItem>
                  <SelectItem value="improvement">Melhoria</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="reviewed">Revisado</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Feedbacks ({filteredFeedbacks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                Nenhum feedback encontrado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-gray-300">Data</TableHead>
                      <TableHead className="text-gray-300">Tipo</TableHead>
                      <TableHead className="text-gray-300">Título</TableHead>
                      <TableHead className="text-gray-300">Avaliação</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeedbacks.map((feedback) => (
                      <TableRow key={feedback.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-gray-300">
                          {format(new Date(feedback.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1 border-white/20 text-gray-300">
                            {getTypeIcon(feedback.type)}
                            {getTypeLabel(feedback.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white font-medium max-w-xs truncate">
                          {feedback.title}
                        </TableCell>
                        <TableCell>
                          {feedback.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-gray-300">{feedback.rating}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(feedback.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenNotes(feedback)}
                              className="text-gray-300 hover:text-white"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Select
                              value={feedback.status}
                              onValueChange={(value) => updateFeedbackStatus(feedback.id, value as FeedbackStatus)}
                            >
                              <SelectTrigger className="w-32 h-8 bg-white/5 border-white/10 text-white text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="reviewed">Revisado</SelectItem>
                                <SelectItem value="in_progress">Em Andamento</SelectItem>
                                <SelectItem value="resolved">Resolvido</SelectItem>
                                <SelectItem value="rejected">Rejeitado</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="bg-slate-800 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Detalhes do Feedback</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedFeedback && format(new Date(selectedFeedback.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Título</Label>
                <p className="text-white font-medium">{selectedFeedback.title}</p>
              </div>
              <div>
                <Label className="text-gray-300">Tipo</Label>
                <Badge variant="outline" className="gap-1 border-white/20 text-gray-300">
                  {getTypeIcon(selectedFeedback.type)}
                  {getTypeLabel(selectedFeedback.type)}
                </Badge>
              </div>
              <div>
                <Label className="text-gray-300">Descrição</Label>
                <p className="text-white whitespace-pre-wrap bg-white/5 p-3 rounded border border-white/10">
                  {selectedFeedback.description}
                </p>
              </div>
              {selectedFeedback.rating && (
                <div>
                  <Label className="text-gray-300">Avaliação</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${star <= selectedFeedback.rating!
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-500'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="admin-notes" className="text-gray-300">Notas do Admin</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Adicione notas sobre este feedback..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotesDialogOpen(false)}
              className="border-white/10 text-gray-300"
            >
              Fechar
            </Button>
            <Button
              onClick={handleSaveNotes}
              disabled={updating}
              className="bg-primary hover:bg-primary/80"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Notas'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFeedbacks;