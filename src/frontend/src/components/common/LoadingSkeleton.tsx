import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  count?: number
}

export function LoadingSkeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  count = 1,
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-neutral-200 rounded'

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    card: 'rounded-lg h-32',
  }

  const style: React.CSSProperties = {
    width: width,
    height: height,
  }

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  ))

  if (count === 1) return items[0]

  return <div className="space-y-3">{items}</div>
}

// Preset skeleton components
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card p-4 space-y-3', className)}>
      <LoadingSkeleton variant="text" width="60%" />
      <LoadingSkeleton variant="text" width="100%" />
      <LoadingSkeleton variant="text" width="80%" />
    </div>
  )
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <LoadingSkeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton variant="text" width="70%" />
            <LoadingSkeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3">
        <LoadingSkeleton variant="circular" width={48} height={48} />
        <div className="space-y-2">
          <LoadingSkeleton variant="text" width={80} height={14} />
          <LoadingSkeleton variant="text" width={60} height={24} />
        </div>
      </div>
    </div>
  )
}
