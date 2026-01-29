import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine(data => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const Perfil = () => {
  useEffect(() => {
    document.title = "MoMoney | Perfil";
  }, []);

  const { user } = useAuth();
  const {
    profile,
    isLoading,
    updateProfile,
    uploadAvatar,
    isUpdating,
    isUploading
  } = useProfile();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || "",
        email: profile.email || "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [profile, form]);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      uploadAvatar(file);
    }
  };

  const handleSaveProfile = (values: z.infer<typeof formSchema>) => {
    updateProfile({
      name: values.name,
      email: values.email,
    });

    if (values.password) {

      toast.info("Funcionalidade de troca de senha será implementada em breve");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <DashboardLayout activePage="Perfil">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-momoney-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePage="Perfil">
      <div className="grid gap-6">
        <Card className="w-full animate-fade-in">
          <CardHeader>
            <CardTitle>Seu Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-8">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24 ring-4 ring-offset-4 ring-momoney-200">
                  {profile?.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.name} />
                  ) : (
                    <AvatarFallback className="bg-momoney-100 text-momoney-600 text-xl">
                      {profile?.name ? getInitials(profile.name) : "??"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <Input
                    type="file"
                    id="avatar"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    accept="image/*"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('avatar')?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Alterar foto'
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex-1 w-full">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSaveProfile)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="seu@email.com" {...field} disabled />
                          </FormControl>
                          <FormDescription>
                            O email não pode ser alterado
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nova senha (opcional)</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar nova senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="submit"
                        disabled={isUpdating}
                        className="bg-momoney-600 hover:bg-momoney-700"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          'Salvar alterações'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Perfil;