import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  success: boolean;
  message: string;
}

export default function PaymentConfirmationModal({
  isOpen,
  onClose,
  success,
  message,
}: PaymentConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-zinc-900 border-cyan-500/20">
        <DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {success ? (
              <>
                <div className="p-4 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                  <CheckCircle2 className="w-16 h-16 text-green-400" />
                </div>
                <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 text-center">
                  Tentativa de Pagamento
                </DialogTitle>
              </>
            ) : (
              <>
                <div className="p-4 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30">
                  <XCircle className="w-16 h-16 text-red-400" />
                </div>
                <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 text-center">
                  Falha no Pagamento
                </DialogTitle>
              </>
            )}
            <DialogDescription className="text-zinc-300 text-center">
              {message}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex justify-center pt-4">
          <Button
            onClick={onClose}
            className={`${
              success
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
            } text-white font-semibold shadow-lg px-8`}
          >
            {success ? 'Continuar' : 'Tentar Novamente'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
