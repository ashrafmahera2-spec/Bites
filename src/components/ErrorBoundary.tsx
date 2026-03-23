import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => {
  let errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
  
  try {
    if (error?.message) {
      const parsedError = JSON.parse(error.message);
      if (parsedError.error && parsedError.error.includes('Missing or insufficient permissions')) {
        errorMessage = 'عذراً، ليس لديك الصلاحيات الكافية للقيام بهذا الإجراء.';
      }
    }
  } catch (e) {
    // Not a JSON error message
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-red-100">
        <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={48} className="text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">عذراً، حدث خطأ ما</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          {errorMessage}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-orange-700 transition-all"
        >
          <RefreshCcw size={20} />
          إعادة تحميل الصفحة
        </button>
      </div>
    </div>
  );
};

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
