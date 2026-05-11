import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-muted-foreground">Diese Seite existiert nicht.</p>
      <Button asChild><Link to="/">Zur Startseite</Link></Button>
    </div>
  );
}

