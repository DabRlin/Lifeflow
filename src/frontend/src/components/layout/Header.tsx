import * as React from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useUnreadCount, useGenerateReminders, useGenerateAtRiskNotifications } from '@/hooks/useNotifications'
import { Menu, Bell, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'
import { NotificationPanel } from './NotificationPanel'

// Page title mapping
const pageTitles: Record<string, string> = {
  '/': '首页',
  '/tasks': '任务管理',
  '/habits': '习惯追踪',
  '/life': '生活记录',
  '/stats': '数据统计',
  '/settings': '设置',
}

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const location = useLocation()
  const { toggleSidebar } = useUIStore()
  const { data: unreadData } = useUnreadCount()
  const generateReminders = useGenerateReminders()
  const generateAtRisk = useGenerateAtRiskNotifications()
  const [showNotifications, setShowNotifications] = React.useState(false)
  const notificationButtonRef = React.useRef<HTMLButtonElement>(null)

  const pageTitle = pageTitles[location.pathname] || 'LifeFlow'

  // Get unread count from API
  const unreadCount = unreadData?.count || 0

  // Generate notifications on first load of the day
  React.useEffect(() => {
    const lastGenDate = localStorage.getItem('lifeflow_last_notification_gen')
    const today = new Date().toISOString().split('T')[0]
    
    if (lastGenDate !== today) {
      // Generate reminders and at-risk notifications
      generateReminders.mutate()
      generateAtRisk.mutate()
      localStorage.setItem('lifeflow_last_notification_gen', today)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-surface border-b border-neutral-300',
        // Total height = 32px (titlebar) + 48px (content) = 80px, matching sidebar
        'h-20 flex flex-col',
        className
      )}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Top spacer for macOS window controls alignment */}
      <div className="h-8 flex-shrink-0" />

      {/* Header content - aligned with sidebar logo area */}
      <div className="h-12 flex items-center justify-between px-4 flex-shrink-0">
        {/* Left section - no-drag to allow button clicks */}
        <div
          className="flex items-center gap-4"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Page title */}
          <h1 className="text-lg font-semibold text-neutral-700">{pageTitle}</h1>
        </div>

        {/* Right section - no-drag to allow button clicks */}
        <div
          className="flex items-center gap-2"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {/* Refresh button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.reload()}
            title="刷新页面"
            className="text-neutral-600 hover:text-primary-500 hover:bg-surface-container-high"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {/* Notifications */}
          <Button
            ref={notificationButtonRef}
            variant="ghost"
            size="icon"
            title="通知"
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              'relative text-neutral-600 hover:text-primary-500 hover:bg-surface-container-high',
              showNotifications && 'text-primary-500 bg-surface-container-high'
            )}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-primary-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>

          {/* Notification Panel */}
          <NotificationPanel
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            anchorRef={notificationButtonRef}
          />
        </div>
      </div>
    </header>
  )
}
