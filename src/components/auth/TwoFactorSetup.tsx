import { useState } from 'react';
import { useMFA } from '@/hooks/useMFA';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ShieldCheck, 
  ShieldOff, 
  Loader2, 
  Smartphone,
  Copy,
  Check,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export function TwoFactorSetup() {
  const {
    isLoading,
    isEnrolling,
    isVerifying,
    hasMFAEnabled,
    verifiedFactors,
    qrCode,
    secret,
    startEnrollment,
    verifyEnrollment,
    unenrollFactor,
    cancelEnrollment,
  } = useMFA();

  const [verificationCode, setVerificationCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const handleStartSetup = async () => {
    const result = await startEnrollment();
    if (result.success) {
      setShowSetup(true);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) return;
    
    const result = await verifyEnrollment(verificationCode);
    if (result.success) {
      setShowSetup(false);
      setVerificationCode('');
    }
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) return;
    if (verifiedFactors.length > 0) {
      const result = await unenrollFactor(verifiedFactors[0].id, disableCode);
      if (result.success) {
        setShowDisableConfirm(false);
        setDisableCode('');
      }
    }
  };

  const handleCancelSetup = () => {
    cancelEnrollment();
    setShowSetup(false);
    setVerificationCode('');
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className={cn(
        "border-2 transition-colors",
        hasMFAEnabled 
          ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20" 
          : "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20"
      )}>
        <CardContent className="flex items-center gap-4 py-4">
          {hasMFAEnabled ? (
            <>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-700 dark:text-green-300">
                  Autenticação de Dois Fatores Ativa
                </h3>
                <p className="text-sm text-green-600/80 dark:text-green-400/80">
                  Sua conta está protegida com 2FA
                </p>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-600">
                Ativo
              </Badge>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <ShieldOff className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-700 dark:text-amber-300">
                  Autenticação de Dois Fatores Desativada
                </h3>
                <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                  Adicione uma camada extra de segurança
                </p>
              </div>
              <Badge variant="outline" className="border-amber-500 text-amber-600">
                Desativado
              </Badge>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={(open) => !open && handleCancelSetup()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Configurar Autenticação de Dois Fatores
            </DialogTitle>
            <DialogDescription>
              Use um aplicativo autenticador como Google Authenticator ou Authy
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Step 1: QR Code */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                Escaneie o QR Code com seu aplicativo
              </Label>
              
              {qrCode ? (
                <div className="flex justify-center p-6 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 w-fit mx-auto">
                  <div 
                    dangerouslySetInnerHTML={{ __html: qrCode }} 
                    className="w-56 h-56 [&>svg]:w-full [&>svg]:h-full"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-56 bg-muted rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Manual entry */}
            {secret && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Ou insira este código manualmente:
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono break-all">
                    {secret}
                  </code>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copySecret}
                  >
                    {copiedSecret ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Verification */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                Digite o código de 6 dígitos
              </Label>
              
              <div className="flex justify-center p-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <InputOTP 
                  maxLength={6} 
                  value={verificationCode}
                  onChange={setVerificationCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelSetup}>
              Cancelar
            </Button>
            <Button 
              onClick={handleVerify}
              disabled={verificationCode.length !== 6 || isVerifying}
            >
              {isVerifying && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Verificar e Ativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <Dialog open={showDisableConfirm} onOpenChange={setShowDisableConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Desativar Autenticação de Dois Fatores?
            </DialogTitle>
            <DialogDescription>
              Isso removerá a proteção adicional da sua conta. Você terá que configurar novamente se quiser reativar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert variant="default" className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Confirmação de Segurança</AlertTitle>
              <AlertDescription>
                Para desativar o 2FA, insira o código do seu autenticador:
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <span className="text-sm">Código de 6 dígitos</span>
              </Label>
              
              <div className="flex justify-center p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <InputOTP 
                  maxLength={6} 
                  value={disableCode}
                  onChange={setDisableCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => {
              setShowDisableConfirm(false);
              setDisableCode('');
            }}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDisable}
              disabled={disableCode.length !== 6}
            >
              Desativar 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4">
        {!hasMFAEnabled ? (
          <Button 
            onClick={handleStartSetup}
            disabled={isEnrolling}
            className="w-full gap-2"
          >
            {isEnrolling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Smartphone className="h-4 w-4" />
            )}
            Configurar Autenticação de Dois Fatores
          </Button>
        ) : (
          <Button 
            variant="outline"
            onClick={() => setShowDisableConfirm(true)}
            className="w-full gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <ShieldOff className="h-4 w-4" />
            Desativar Autenticação de Dois Fatores
          </Button>
        )}
      </div>

      {/* Info Alert */}
      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertTitle>Como funciona?</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>
            A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta. 
            Além da sua senha, você precisará de um código gerado pelo seu aplicativo autenticador.
          </p>
          <p className="text-xs text-muted-foreground">
            Aplicativos recomendados: Google Authenticator, Authy, Microsoft Authenticator
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
