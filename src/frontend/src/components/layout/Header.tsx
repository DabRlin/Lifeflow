import * as React from 'react'
import { useLocation } from 'react-router-dom'
import { cn, getLocalDateString } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useUnreadCount, useGenerateReminders, useGenerateAtRiskNotifications } from '@/hooks/useNotifications'
import { useTasks } from '@/hooks/useTasks'
import { useInfiniteLifeEntries } from '@/hooks/useLifeEntries'
import { useStatsOverview } from '@/hooks/useStats'
import { Menu, Bell, RefreshCw, Calendar, Flame, CheckCircle2, BookOpen, BarChart3, Settings } from 'lucide-react'
import { Button } from '@/components/ui'
import { NotificationPanel } from './NotificationPanel'

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

  // Fetch data for context info
  const { data: tasks } = useTasks()
  const { data: statsOverview } = useStatsOverview()
  const { data: lifeEntriesData } = useInfiniteLifeEntries(1)

  // Get unread count from API
  const unreadCount = unreadData?.count || 0

  // Calculate context data
  const today = React.useMemo(() => getLocalDateString(), [])
  
  const contextData = React.useMemo(() => {
    if (!tasks) return null
    
    const activeTasks = tasks.filter(t => !t.is_deleted)
    const habits = activeTasks.filter(t => t.is_habit)
    const pendingTasks = activeTasks.filter(t => !t.is_habit)
    const completedToday = habits.filter(t => t.last_checkin_date === today).length
    const pendingHabits = habits.length - completedToday
    const longestStreak = habits.reduce((max, t) => Math.max(max, t.longest_streak || 0), 0)
    
    return {
      totalTasks: pendingTasks.length,
      totalHabits: habits.length,
      completedToday,
      pendingHabits,
      longestStreak,
    }
  }, [tasks, today])

  const totalEntries = React.useMemo(() => {
    if (!lifeEntriesData?.pages?.[0]) return 0
    return lifeEntriesData.pages[0].total || 0
  }, [lifeEntriesData])

  // Generate context info based on current page
  const contextInfo = React.useMemo(() => {
    const path = location.pathname
    const now = new Date()
    const dateStr = now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })

    switch (path) {
      case '/':
        return {
          icon: <Calendar className="text-primary-500" />,
          text: dateStr,
          subtext: contextData 
            ? `今日 ${contextData.completedToday}/${contextData.totalHabits} 习惯已完成`
            : null,
        }
      case '/tasks':
        return {
          icon: <CheckCircle2 className="text-primary-500" />,
          text: contextData ? `${contextData.totalTasks} 个任务` : '任务管理',
          subtext: contextData && contextData.pendingHabits > 0 
            ? `${contextData.pendingHabits} 个习惯待打卡`
            : null,
        }
      case '/habits':
        return {
          icon: <Flame className="text-amber-500" />,
          text: contextData 
            ? `今日 ${contextData.completedToday}/${contextData.totalHabits}`
            : '习惯追踪',
          subtext: contextData && contextData.longestStreak > 0
            ? `🔥 最长连胜 ${contextData.longestStreak} 天`
            : null,
        }
      case '/life':
        return {
          icon: <BookOpen className="text-primary-500" />,
          text: totalEntries > 0 ? `共 ${totalEntries} 条记录` : '生活记录',
          subtext: null,
        }
      case '/stats':
        return {
          icon: <BarChart3 className="text-primary-500" />,
          text: statsOverview 
            ? `完成率 ${statsOverview.completion_rate?.toFixed(0) || 0}%`
            : '数据统计',
          subtext: statsOverview && statsOverview.today_checkins > 0
            ? `今日 ${statsOverview.today_checkins} 次打卡`
            : null,
        }
      case '/settings':
        return {
          icon: <Settings className="text-neutral-500" />,
          text: '应用设置',
          subtext: null,
        }
      default:
        return {
          icon: null,
          text: 'LifeFlow',
          subtext: null,
        }
    }
  }, [location.pathname, contextData, totalEntries, statsOverview])

  // Generate notifications on first load of the day
  React.useEffect(() => {
    const lastGenDate = localStorage.getItem('lifeflow_last_notification_gen')
    const todayStr = getLocalDateString()
    
    if (lastGenDate !== todayStr) {
      generateReminders.mutate()
      generateAtRisk.mutate()
      localStorage.setItem('lifeflow_last_notification_gen', todayStr)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <header
      className={cn(
        'sticky top-0 z-30 bg-surface border-b border-neutral-300',
        'h-20 flex flex-col',
        className
      )}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Top spacer for macOS window controls alignment */}
      <div className="h-8 flex-shrink-0" />

      {/* Header content */}
      <div className="h-12 flex items-center justify-between px-4 flex-shrink-0">
        {/* Left section - context info */}
        <div
          className="flex items-center gap-3"
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

          {/* Context info */}
          <div className="flex items-center gap-2.5">
            {contextInfo.icon && (
              <span className="[&>svg]:w-5 [&>svg]:h-5">
                {contextInfo.icon}
              </span>
            )}
            <span className="text-base font-semibold text-neutral-800">
              {contextInfo.text}
            </span>
            {contextInfo.subtext && (
              <>
                <span className="text-neutral-300 font-light">|</span>
                <span className="text-sm font-medium text-neutral-500">
                  {contextInfo.subtext}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right section - actions */}
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
