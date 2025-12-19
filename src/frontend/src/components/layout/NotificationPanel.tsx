/**
 * NotificationPanel Component
 * Displays persistent notifications with M3 purple theme
 * Validates: Requirements 5.1, 5.2, 5.3
 */

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications'
import {
  Bell,
  X,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Trash2,
  CheckCheck,
} from 'lucide-react'
import type { Notification, NotificationType } from '@/api/notifications'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement>
}

// Notification type colors (M3 purple theme)
const notificationStyles: Record<
  NotificationType,
  { bg: string; text: string; icon: React.ReactNode }
> = {
  habit_reminder: {
    bg: 'bg-primary-50',
    text: 'text-primary-700',
    icon: <Flame className="w-4 h-4 text-primary-500" />,
  },
  achievement: {
    bg: 'bg-secondary-50',
    text: 'text-secondary-700',
    icon: <Trophy className="w-4 h-4 text-secondary-500" />,
  },
  daily_complete: {
    bg: 'bg-primary-100',
    text: 'text-primary-700',
    icon: <CheckCircle2 className="w-4 h-4 text-primary-600" />,
  },
  system: {
    bg: 'bg-neutral-50',
    text: 'text-neutral-700',
    icon: <Bell className="w-4 h-4 text-neutral-500" />,
  },
}

export function NotificationPanel({ isOpen, onClose, anchorRef }: NotificationPanelProps) {
  const { data, isLoading } = useNotifications({ limit: 50 })
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const deleteNotification = useDeleteNotification()
  const panelRef = React.useRef<HTMLDivElement>(null)

  // Close on click outside
  React.useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose, anchorRef])

  // Close on escape
  React.useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate()
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNotification.mutate(id)
  }

  if (!isOpen) return null

  // Calculate position
  const anchorRect = anchorRef.current?.getBoundingClientRect()
  const top = anchorRect ? anchorRect.bottom + 8 : 0
  const right = anchorRect ? window.innerWidth - anchorRect.right : 0

  const notifications = data?.notifications || []
  const unreadCount = data?.unread_count || 0

  return createPortal(
    <div
      ref={panelRef}
      className={cn(
        'fixed z-50 w-80 bg-surface-container-high rounded-2xl border border-outline-variant',
        'animate-fade-in'
      )}
      style={{ top, right }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-neutral-700">通知</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
              {unreadCount} 未读
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="p-1.5 rounded-md text-primary-500 hover:text-primary-600 hover:bg-primary-50"
              title="全部标为已读"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-neutral-500">
            <div className="w-6 h-6 mx-auto mb-2 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-sm">加载中...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-neutral-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无通知</p>
            <p className="text-xs mt-1 text-neutral-400">完成习惯打卡后会收到通知</p>
          </div>
        ) : (
          <div className="py-2">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string, e: React.MouseEvent) => void
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const style = notificationStyles[notification.type] || notificationStyles.system
  const isAtRisk = notification.data?.at_risk

  // Format time - backend returns UTC time without timezone suffix
  const timeAgo = React.useMemo(() => {
    // Append 'Z' to indicate UTC if not already present
    const utcTimeStr = notification.created_at.endsWith('Z') 
      ? notification.created_at 
      : notification.created_at + 'Z'
    const date = new Date(utcTimeStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    return date.toLocaleDateString('zh-CN')
  }, [notification.created_at])

  return (
    <div
      onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
      className={cn(
        'mx-2 px-2 py-3 cursor-pointer transition-colors rounded-lg',
        'hover:bg-neutral-50',
        !notification.is_read && 'bg-primary-50/30'
      )}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            isAtRisk ? 'bg-amber-100' : style.bg
          )}
        >
          {isAtRisk ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : style.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                'text-sm font-medium',
                notification.is_read ? 'text-neutral-600' : 'text-neutral-800'
              )}
            >
              {notification.title}
            </p>
            <button
              onClick={(e) => onDelete(notification.id, e)}
              className="flex-shrink-0 p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p
            className={cn(
              'text-xs mt-0.5',
              notification.is_read ? 'text-neutral-400' : 'text-neutral-500'
            )}
          >
            {notification.message}
          </p>
          <p className="text-xs text-neutral-400 mt-1">{timeAgo}</p>
        </div>

        {/* Unread indicator */}
        {!notification.is_read && (
          <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary-500" />
        )}
      </div>
    </div>
  )
}
