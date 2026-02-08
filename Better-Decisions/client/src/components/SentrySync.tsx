import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SentrySyncProps {
  projectId: string;
}

export function SentrySync({ projectId }: SentrySyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  async function syncSentryErrors() {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sentry/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to sync Sentry errors');
      }

      const data = await res.json();
      toast.success(`Successfully synced ${data.synced} Sentry errors!`);

      // Refresh the page to show new errors
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync Sentry errors');
      console.error('Sentry sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={syncSentryErrors}
      disabled={isSyncing}
      className="gap-2"
    >
      {isSyncing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <AlertTriangle className="w-4 h-4" />
          Sync Sentry Errors
        </>
      )}
    </Button>
  );
}
