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
      <DialogContent className="max-w-md bg-slate-950 border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
        <DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {success ? (
              <>
                <div className="p-4 rounded-full bg-gradient-to-br from-emerald-500/30 via-green-500/30 to-cyan-500/30 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/40">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                </div>
                <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-cyan-400 text-center">
                  Tentativa de Pagamento
                </DialogTitle>
              </>
            ) : (
              <>
                <div className="p-4 rounded-full bg-gradient-to-br from-red-500/30 via-pink-500/30 to-orange-500/30 border-2 border-red-500/50 shadow-lg shadow-red-500/40">
                  <XCircle className="w-16 h-16 text-red-400" />
                </div>
                <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-400 to-orange-400 text-center">
                  Falha no Pagamento
                </DialogTitle>
              </>
            )}
            <DialogDescription className="text-zinc-200 text-center text-base px-4">
              {message}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex justify-center pb-2">
          <Button
            onClick={onClose}
            className={`px-8 ${
              success
                ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-cyan-500 hover:from-emerald-600 hover:via-green-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/30'
                : 'bg-gradient-to-r from-red-500 via-pink-500 to-orange-500 hover:from-red-600 hover:via-pink-600 hover:to-orange-600 shadow-lg shadow-red-500/30'
            } text-white font-semibold`}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
