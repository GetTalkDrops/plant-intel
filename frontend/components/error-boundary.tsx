'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log error details to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // Example:
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   },
    // });

    this.setState({
      errorInfo: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }

    // Reset error state
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-[400px] items-center justify-center p-6">
          <Card className="w-full max-w-md p-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <IconAlertCircle className="h-6 w-6 text-destructive" />
              </div>

              <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>

              <p className="mb-4 text-muted-foreground">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>

              {/* Show error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mb-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    Error Details
                  </summary>
                  <pre className="mt-2 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {this.state.error?.stack}
                    {this.state.errorInfo}
                  </pre>
                </details>
              )}

              <Button onClick={this.handleReset} className="gap-2">
                <IconRefresh className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
