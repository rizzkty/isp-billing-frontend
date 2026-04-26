import { Component } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('🔴 ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex items-center justify-center p-8">
                    <div className="bg-white border border-red-100 rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-black text-gray-800 mb-2">Terjadi Kesalahan</h2>
                        <p className="text-gray-500 text-sm mb-2">
                            Halaman ini mengalami error dan tidak bisa ditampilkan.
                        </p>
                        <details className="text-left bg-gray-50 rounded-xl p-3 mb-6 text-xs text-red-600 font-mono">
                            <summary className="cursor-pointer font-bold text-gray-600 mb-1">Detail Error (untuk Developer)</summary>
                            {this.state.error?.toString()}
                        </details>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Coba Lagi
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
