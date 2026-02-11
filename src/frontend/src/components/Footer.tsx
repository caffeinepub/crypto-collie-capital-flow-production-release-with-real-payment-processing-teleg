import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-cyan-500/20 bg-zinc-900/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-2">
          <p className="text-sm text-cyan-300/70 text-center">
            © 2025. Construído com{' '}
            <Heart className="inline w-4 h-4 text-red-500 fill-red-500" />{' '}
            usando{' '}
            <a 
              href="https://caffeine.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
