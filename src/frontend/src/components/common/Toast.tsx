import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const iconMap = {
  success: <CheckCircle className="w-5 h-5 text-success-500" />,
  error: <XCircle className="w-5 h-5 text-error-500" />,
  info: <Info className="w-5 h-5 text-primary-500" />,
}

const bgMap = {
  success: 'bg-success-50 border-success-200',
  error: 'bg-error-50 border-error-200',
  info: 'bg-primary-50 border-primary-200',
}

export function Toast() {
  const { toastMessage, toastType, hideToast } = useUIStore()

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        hideToast()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage, hideToast])

  if (!toastMessage || !toastType) return null

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'flex items-center gap-3 px-4 py-3',
        'rounded-lg border shadow-elevation-3',
        'animate-slide-up',
        bgMap[toastType]
      )}
      role="alert"
    >
      {iconMap[toastType]}
      <span className="text-sm text-neutral-800">{toastMessage}</span>
      <button
        onClick={hideToast}
        className="ml-2 p-1 rounded hover:bg-black/5 transition-colors"
        aria-label="关闭通知"
      >
        <X className="w-4 h-4 text-neutral-500" />
      </button>
    </div>
  )
}
