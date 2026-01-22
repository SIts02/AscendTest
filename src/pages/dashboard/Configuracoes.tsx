
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { 
  Bell, 
  Settings, 
  Shield, 
  Globe, 
  PaintBucket, 
  Save,
  Loader2,
  AlertCircle
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";

const Configuracoes = () => {
  useEffect(() => {
    document.title = "MoMoney | Configurações";
  }, []);

  const { t, i18n } = useTranslation();
  
  const { 
    preferences, 
    setPreferences, 
    savePreferences, 
    loading, 
    saving 
  } = useUserPreferences();

  const [isModified, setIsModified] = useState(false);

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences({
      ...preferences,
      [key]: value
    });
    
    // If changing language, update i18n immediately
    if (key === 'language') {
      i18n.changeLanguage(value);
    }
    
    setIsModified(true);
  };

  const handleSavePreferences = async () => {
    const success = await savePreferences(preferences);
    if (success) {
      setIsModified(false);
    }
  };

  const handleResetSettings = () => {
    setPreferences({
      ...preferences,
      theme: "system",
      language: "pt-BR",
      currency: "BRL",
      show_balance: true,
      date_format: "dd/MM/yyyy",
    });
    
    // Update i18n when resetting language
    i18n.changeLanguage("pt-BR");
    
    setIsModified(true);
    toast.info(t("settings.defaults_restored"));
  };

  if (loading) {
    return (
      <DashboardLayout activePage={t("sidebar.settings")}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-10 w-10 animate-spin text-momoney-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage={t("sidebar.settings")}>
      <div className="grid gap-6">
        {isModified && (
          <Alert variant="default" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle>{t("settings.unsaved_changes")}</AlertTitle>
            <AlertDescription>
              {t("settings.unsaved_changes_desc")}
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="mb-4 bg-white dark:bg-gray-800 border dark:border-gray-700">
            <TabsTrigger value="appearance" className="flex items-center gap-2 data-[state=active]:bg-momoney-100 dark:data-[state=active]:bg-momoney-900">
              <PaintBucket className="h-4 w-4" />
              <span>{t("settings.appearance")}</span>
            </TabsTrigger>
            <TabsTrigger value="localization" className="flex items-center gap-2 data-[state=active]:bg-momoney-100 dark:data-[state=active]:bg-momoney-900">
              <Globe className="h-4 w-4" />
              <span>{t("settings.localization")}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-momoney-100 dark:data-[state=active]:bg-momoney-900">
              <Shield className="h-4 w-4" />
              <span>{t("settings.security")}</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card className="animate-fade-in dark-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PaintBucket className="h-5 w-5" />
                  {t("settings.appearance")}
                </CardTitle>
                <CardDescription>{t("settings.appearance_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>{t("settings.theme")}</Label>
                  <RadioGroup 
                    value={preferences.theme} 
                    onValueChange={(value: 'light' | 'dark' | 'system') => handlePreferenceChange('theme', value)}
                    className="flex flex-col space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="theme-light" />
                      <Label htmlFor="theme-light">{t("settings.light")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="theme-dark" />
                      <Label htmlFor="theme-dark">{t("settings.dark")}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="theme-system" />
                      <Label htmlFor="theme-system">{t("settings.system")}</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>{t("settings.show_balance")}</Label>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-sm font-medium">{t("settings.show_values")}</span>
                      <div className="text-xs text-muted-foreground">
                        {t("settings.show_values_desc")}
                      </div>
                    </div>
                    <Switch 
                      checked={preferences.show_balance} 
                      onCheckedChange={(value) => handlePreferenceChange('show_balance', value)} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Localization Tab */}
          <TabsContent value="localization">
            <Card className="animate-fade-in dark-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t("settings.localization")}
                </CardTitle>
                <CardDescription>{t("settings.localization_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>{t("settings.language")}</Label>
                  <Select 
                    value={preferences.language} 
                    onValueChange={(value) => handlePreferenceChange('language', value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800">
                      <SelectValue placeholder={t("settings.select_language")} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800">
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <Label>{t("settings.currency")}</Label>
                  <Select 
                    value={preferences.currency} 
                    onValueChange={(value) => handlePreferenceChange('currency', value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800">
                      <SelectValue placeholder={t("settings.select_currency")} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800">
                      <SelectItem value="BRL">Real (R$)</SelectItem>
                      <SelectItem value="USD">Dólar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <Label>{t("settings.date_format")}</Label>
                  <Select 
                    value={preferences.date_format} 
                    onValueChange={(value) => handlePreferenceChange('date_format', value)}
                  >
                    <SelectTrigger className="bg-white dark:bg-gray-800">
                      <SelectValue placeholder={t("settings.select_date_format")} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800">
                      <SelectItem value="dd/MM/yyyy">DD/MM/AAAA</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/DD/AAAA</SelectItem>
                      <SelectItem value="yyyy-MM-dd">AAAA-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t("settings.security")}
                </CardTitle>
                <CardDescription>{t("settings.security_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <TwoFactorSetup />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleResetSettings}
            className="border-gray-200 dark:border-gray-700"
          >
            {t("settings.restore_defaults")}
          </Button>
          <Button 
            variant="default"
            onClick={handleSavePreferences}
            className="gap-2 bg-momoney-600 hover:bg-momoney-700 text-white"
            disabled={saving || !isModified}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-1" />}
            {saving ? t("settings.saving") : t("settings.save_preferences")}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
