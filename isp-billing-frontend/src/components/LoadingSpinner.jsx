export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Memuat...', 
  fullScreen = false,
  overlay = false
}) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const content = (
    <div className="bg-white/70 dark:bg-slate-900/75 border border-white/20 dark:border-slate-800/40 shadow-2xl p-6 rounded-2xl backdrop-blur-xl flex flex-col items-center justify-center gap-4 transition-all duration-300 scale-95 hover:scale-100">
      <div className="relative flex items-center justify-center">
        {/* Glow behind the spinner */}
        <div className="absolute w-12 h-12 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full blur-md opacity-30 animate-pulse"></div>
        
        {/* Customized Gradient Spinner SVG */}
        <svg className={`animate-spin ${sizeClasses[size] || sizeClasses.md} text-blue-600`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
          <path className="opacity-90" fill="url(#spinner-gradient-spinner)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          <defs>
            <linearGradient id="spinner-gradient-spinner" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {text && (
        <p className="bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent text-sm font-semibold tracking-wide animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-300 animate-fadeIn">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-30 rounded-lg transition-all duration-300 animate-fadeIn">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="animate-pulse space-y-4">
      {/* Header skeleton */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-gray-200 rounded" />
        ))}
      </div>
      {/* Rows skeleton */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="flex-1 h-4 bg-gray-100 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-8 bg-gray-200 rounded w-1/2" />
    </div>
  );
}