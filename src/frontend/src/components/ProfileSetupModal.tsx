import { useState, useEffect } from 'react';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '@/hooks/useSubscription';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSetupModal() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { mutate: saveProfile, isPending } = useSaveCallerUserProfile();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const isAuthenticated = !!identity;

  // Show modal if user is authenticated but has no profile
  useEffect(() => {
    if (isAuthenticated && !profileLoading && isFetched && userProfile === null) {
      setIsOpen(true);
    }
  }, [isAuthenticated, profileLoading, isFetched, userProfile]);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Por favor, insira seu nome');
      return;
    }

    saveProfile(
      {
        name: name.trim(),
        email: email.trim() || undefined,
        createdAt: BigInt(Date.now()),
      },
      {
        onSuccess: () => {
          toast.success('Perfil criado com sucesso!');
          setIsOpen(false);
        },
        onError: (error: any) => {
          toast.error(error.message || 'Erro ao salvar perfil');
        },
      }
    );
  };

  if (!isAuthenticated || isInitializing || profileLoading || !isFetched) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md bg-zinc-900 border-cyan-500/20">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <User className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 text-center">
            Bem-vindo ao Crypto Collie!
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-center">
            Complete seu perfil para começar a usar a plataforma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-cyan-300">
              Nome *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-cyan-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-cyan-300">
              Email (opcional)
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-cyan-500"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={isPending || !name.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold shadow-lg"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              'Continuar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
