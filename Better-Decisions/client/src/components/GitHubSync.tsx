import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Github, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface GitHubSyncProps {
  projectId: string;
}

interface Repository {
  full_name: string;
  name: string;
  owner: string;
  private: boolean;
  description: string | null;
  updated_at: string;
}

export function GitHubSync({ projectId }: GitHubSyncProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchRepos();
    }
  }, [isOpen, isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      // Try to fetch repos to see if user is authenticated
      const res = await fetch('/api/github/repos');
      if (res.ok) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const connectGitHub = () => {
    // Redirect to better-auth GitHub OAuth
    window.location.href = '/api/auth/sign-in/github';
  };

  const fetchRepos = async () => {
    try {
      const res = await fetch('/api/github/repos');
      if (!res.ok) {
        throw new Error('Failed to fetch repositories');
      }
      const data = await res.json();
      setRepos(data.repositories || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch repositories');
      setRepos([]);
    }
  };

  const syncPRs = async () => {
    if (selectedRepos.length === 0) {
      toast.error('Please select at least one repository');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          repositories: selectedRepos,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to sync PRs');
      }

      const data = await res.json();
      toast.success(`Successfully synced ${data.synced} PRs!`);
      setIsOpen(false);
      setSelectedRepos([]);

      // Refresh the page to show new PRs
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to sync PRs');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleRepo = (repoFullName: string) => {
    setSelectedRepos(prev =>
      prev.includes(repoFullName)
        ? prev.filter(r => r !== repoFullName)
        : [...prev, repoFullName]
    );
  };

  if (isCheckingAuth) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Github className="w-4 h-4" />
          Sync GitHub PRs
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Sync GitHub Pull Requests
          </DialogTitle>
          <DialogDescription>
            Import merged pull requests from your GitHub repositories as code events in the timeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isAuthenticated ? (
            <Card className="p-6 bg-secondary/20 border-primary/20">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Connect Your GitHub Account</h3>
                  <p className="text-sm text-muted-foreground">
                    Securely authenticate with GitHub to access your repositories
                  </p>
                </div>
                <Button onClick={connectGitHub} className="gap-2">
                  <Github className="w-4 h-4" />
                  Connect GitHub
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-green-500">
                <CheckCircle2 className="w-4 h-4" />
                GitHub connected
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Repositories</label>
                <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-3">
                  {repos.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No repositories found
                    </div>
                  ) : (
                    repos.map(repo => (
                      <Card
                        key={repo.full_name}
                        className={`p-3 cursor-pointer transition-all hover:border-primary/50 ${
                          selectedRepos.includes(repo.full_name)
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card/50'
                        }`}
                        onClick={() => toggleRepo(repo.full_name)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {repo.full_name}
                              </span>
                              {repo.private && (
                                <Badge variant="outline" className="text-[10px]">
                                  <Lock className="w-2 h-2 mr-1" />
                                  Private
                                </Badge>
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {repo.description}
                              </p>
                            )}
                          </div>
                          {selectedRepos.includes(repo.full_name) && (
                            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {selectedRepos.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedRepos.length} {selectedRepos.length === 1 ? 'repository' : 'repositories'} selected
                </div>
              )}

              <Button
                onClick={syncPRs}
                disabled={isSyncing || selectedRepos.length === 0}
                className="w-full gap-2"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Syncing PRs...
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4" />
                    Sync {selectedRepos.length > 0 ? `${selectedRepos.length} ` : ''}Pull Requests
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
