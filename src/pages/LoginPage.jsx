import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Lock, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

const LoginPage = ({ userType, onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha e-mail e senha.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // API CORRETA do Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (authError) {
        let errorMessage = "Credenciais inválidas.";
        
        if (authError.message === "Invalid login credentials") {
          errorMessage = "E-mail ou senha incorretos.";
        } else if (authError.message === "Too many requests") {
          errorMessage = "Muitas tentativas. Tente novamente em alguns minutos.";
        }
        
        toast({
          title: "Erro no login",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      if (authData?.user) {
        // Metadados do token (fonte de verdade para role/username)
        const tokenUsername = authData.user.user_metadata?.username || email.split('@')[0]
        const tokenRole = authData.user.user_metadata?.role || 'USER'

        // Opcional: buscar perfil complementar na app_users
        let profile = null
        try {
          const { data: profileData } = await supabase
            .from('app_users')
            .select('id, email, name, role')
            .eq('id', authData.user.id)
            .single()
          profile = profileData || null
        } catch (_) {
          profile = null
        }

        // Determinar role efetiva
        const effectiveRole = (profile?.role || tokenRole) === 'ADMIN' ? 'admin' : 'collaborator'

        // Checar tipo de usuário
        if (effectiveRole !== userType) {
          toast({
            title: "Acesso negado",
            description: `Esta conta não tem permissão para acessar como ${userType === 'admin' ? 'administrador' : 'colaborador'}.`,
            variant: "destructive"
          })
          return
        }

        const displayName = profile?.name || tokenUsername

        toast({
          title: "Login realizado!",
          description: `Bem-vindo(a), ${displayName}!`,
          className: 'bg-secondary text-secondary-foreground'
        })

        // Converter para formato esperado pela aplicação
        const appUser = {
          id: authData.user.id,
          email: authData.user.email,
          name: displayName,
          type: userType,
          role: effectiveRole,
          createdAt: new Date().toISOString()
        }

        onLogin(appUser)
      }
    } catch (error) {
      toast({
        title: "Erro na autenticação",
        description: error.message || "Ocorreu um erro durante a autenticação.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-lg shadow-custom-light p-8 border border-border">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center bg-primary">
              {userType === 'admin' ? (
                <Shield className="w-8 h-8 text-primary-foreground" />
              ) : (
                <Users className="w-8 h-8 text-primary-foreground" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {userType === 'admin' ? 'Administrador' : 'Colaborador'}
            </h2>
            <p className="text-muted-foreground">
              Entre com suas credenciais
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-semibold">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-11 h-12 border-input focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-semibold">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-11 h-12 border-input focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-accent rounded-lg border border-border">
            <p className="text-sm text-accent-foreground text-center">
              💡 <strong>Dica:</strong> Use qualquer e-mail e senha para criar uma conta automaticamente
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;