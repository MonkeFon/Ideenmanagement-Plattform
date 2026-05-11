import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4 text-center">
      <ShieldAlert className="h-12 w-12 text-destructive" />
      <h1 className="text-2xl font-bold">Zugriff verweigert</h1>
      <p className="text-muted-foreground">Sie haben nicht die erforderliche Berechtigung.</p>
      <Button asChild variant="outline"><Link to="/dashboard">Zum Dashboard</Link></Button>
    </div>
  );
}

