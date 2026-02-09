"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
            <h2 className="mb-2 text-lg font-bold text-red-800 dark:text-red-200">Something went wrong</h2>
            <p className="text-sm text-red-700 dark:text-red-300">
              An unexpected error occurred. Please refresh the page or try again later.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-red-600 dark:text-red-400">Error details</summary>
                <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs dark:bg-red-900/30">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
