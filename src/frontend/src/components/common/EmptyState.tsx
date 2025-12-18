import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Inbox, FileText, CheckSquare, Target, BarChart3 } from 'lucide-react'

type EmptyStateType = 'default' | 'tasks' | 'habits' | 'life' | 'stats'

interface EmptyStateProps {
  type?: EmptyStateType
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

const presets: Record<EmptyStateType, { icon: React.ReactNode; title: string; description: string }> = {
  default: {
    icon: <Inbox className="w-12 h-12" />,
    title: '暂无数据',
    description: '这里还没有任何内容',
  },
  tasks: {
    icon: <CheckSquare className="w-12 h-12" />,
    title: '暂无任务',
    description: '创建你的第一个任务，开始高效管理工作',
  },
  habits: {
    icon: <Target className="w-12 h-12" />,
    title: '暂无习惯',
    description: '添加一个习惯，开始培养好习惯',
  },
  life: {
    icon: <FileText className="w-12 h-12" />,
    title: '暂无记录',
    description: '记录你的第一条生活点滴',
  },
  stats: {
    icon: <BarChart3 className="w-12 h-12" />,
    title: '暂无统计数据',
    description: '完成一些任务后，这里会显示你的统计数据',
  },
}

export function EmptyState({
  type = 'default',
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const preset = presets[type]

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4',
        'text-center',
        className
      )}
    >
      <div className="text-neutral-300 mb-4">{preset.icon}</div>
      <h3 className="text-lg font-medium text-neutral-700 mb-2">
        {title || preset.title}
      </h3>
      <p 
        className="text-sm text-neutral-500 mb-6"
        style={{ maxWidth: '24rem' }}
      >
        {description || preset.description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="btn-primary px-6 py-2">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
