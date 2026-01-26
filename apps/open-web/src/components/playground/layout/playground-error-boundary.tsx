import { Component, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from '@tanstack/react-router';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlaygrorErrorBoundaryProps {
  children: ReactNode;
}

interface PlaygrorErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class PlaygrorErrorBoundary extends Component<PlaygrorErrorBoundaryProps, PlaygrorErrorBoundaryState> {
  constructor(props: PlaygrorErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): PlaygrorErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Playground component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };
}

function ErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleGoBack = () => {
    router.navigate({ to: '/playground' });
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
      <div className="text-destructive flex items-center gap-3">
        <AlertCircle className="h-12 w-12" />
        <h2 className="text-xl font-semibold">{t('playground.errors.loadFailed')}</h2>
      </div>

      {error && (
        <div className="border-border bg-muted/50 max-w-2xl rounded-lg border p-4">
          <p className="text-muted-foreground font-mono text-sm">{error.message}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('playground.errors.tryAgain')}
        </Button>
        <Button variant="default" onClick={handleGoBack}>
          <Home className="mr-2 h-4 w-4" />
          {t('playground.errors.goBack')}
        </Button>
      </div>
    </div>
  );
}
