import { Component, ErrorInfo, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
        />
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  onReset?: () => void
  onGoHome?: () => void
  className?: string
}

export function ErrorFallback({ error, onReset, onGoHome, className }: ErrorFallbackProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px] p-8',
        'text-center',
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-error-50 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-error-500" />
      </div>

      <h2 className="text-xl font-semibold text-neutral-900 mb-2">出错了</h2>
      <p className="text-neutral-500 mb-2 max-w-md">
        应用遇到了一个问题，请尝试刷新页面或返回首页
      </p>

      {error && (
        <details className="mb-6 max-w-md">
          <summary className="text-sm text-neutral-400 cursor-pointer hover:text-neutral-600">
            查看错误详情
          </summary>
          <pre className="mt-2 p-3 bg-neutral-100 rounded-lg text-xs text-left overflow-auto max-h-32">
            {error.message}
          </pre>
        </details>
      )}

      <div className="flex gap-3">
        {onReset && (
          <Button
            onClick={onReset}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </Button>
        )}
        {onGoHome && (
          <Button
            onClick={onGoHome}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            返回首页
          </Button>
        )}
      </div>
    </div>
  )
}
