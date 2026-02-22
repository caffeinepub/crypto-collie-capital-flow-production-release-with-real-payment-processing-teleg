import { Heart } from 'lucide-react';

export default function Footer() {
  const appIdentifier = encodeURIComponent(window.location.hostname || 'crypto-collie');
  const caffeineUrl = `https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`;
  
  return (
    <footer className="border-t-2 border-border bg-card/95 backdrop-blur-xl mt-auto shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-2">
          <p className="text-sm text-muted-foreground text-center font-medium">
            © {new Date().getFullYear()}. Construído com{' '}
            <Heart className="inline w-4 h-4 text-destructive fill-destructive" />{' '}
            usando{' '}
            <a 
              href={caffeineUrl}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 hover:underline font-semibold transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
