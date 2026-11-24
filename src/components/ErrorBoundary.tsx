import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FEFEFE] dark:bg-[#041006] px-6 text-center">
          <div className="max-w-md rounded-2xl bg-[#F5F6F6] dark:bg-[#0A1815] p-8">
            <h1 className="font-display text-xl font-extrabold text-[#07170B] dark:text-[#FEFEFE]">
              Terjadi Gangguan Sementara
            </h1>
            <p className="mt-2 text-sm text-[#3D4D42] dark:text-[#B5C4BA]">
              Silakan muat ulang halaman untuk melanjutkan belajar rumus Excel di GridRumus.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-full bg-[#A2DF20] hover:bg-[#93CE18] px-6 py-2.5 text-xs font-bold text-[#07170B] cursor-pointer"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
