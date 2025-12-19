/**
 * HomePage Component
 * Main dashboard showing today's overview with daily ring, quick stats, and shortcuts
 * Requirements: All - serves as the central hub for the application
 */

import * as React from 'react'
import { Link } from 'react-router-dom'
import { getLocalDateString } from '@/lib/utils'
import { useTasks, useCheckinTask } from '@/hooks/useTasks'
import { useDailyRing, useStatsOverview } from '@/hooks/useStats'
import { useInfiniteLifeEntries } from '@/hooks/useLifeEntries'
import { DailyRing } from '@/components/habit'
import { StatCard } from '@/components/stats'
import { LoadingSkeleton, EmptyState, StatCardSkeleton } from '@/components/common'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/relative-time'
import {
  CheckCircle2,
  Flame,
  Target,
  ListTodo,
  BookOpen,
  BarChart3,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react'
import type { Task, LifeEntry } from '@/api/types'

export function HomePage() {
  const { showToast } = useUIStore()
  const [checkingInId, setCheckingInId] = React.useState<string | null>(null)

  // Fetch data
  const { data: tasks, isLoading: tasksLoading } = useTasks()
  const { data: dailyRingData, isLoading: ringLoading } = useDailyRing()
  const { data: statsOverview, isLoading: statsLoading } = useStatsOverview()
  const { data: lifeEntriesData, isLoading: entriesLoading } = useInfiniteLifeEntries(5)
  const checkinMutation = useCheckinTask()

  // Get today's date in local timezone
  const today = React.useMemo(() => getLocalDateString(), [])

  // Filter habit tasks
  const habits = React.useMemo(() => {
    if (!tasks) return []
    return tasks.filter((task) => task.is_habit && !task.is_deleted)
  }, [tasks])

  // Get incomplete habits for today
  const incompleteHabits = React.useMemo(() => {
    return habits.filter((h) => h.last_checkin_date !== today)
  }, [habits, today])

  // Get recent life entries (first 3)
  const recentEntries = React.useMemo(() => {
    if (!lifeEntriesData?.pages) return []
    const allEntries = lifeEntriesData.pages.flatMap((page) => page.items)
    return allEntries.slice(0, 3)
  }, [lifeEntriesData])

  // Calculate local stats
  const localStats = React.useMemo(() => {
    if (!tasks) return null

    const activeTasks = tasks.filter((t) => !t.is_deleted)
    const habitTasks = activeTasks.filter((t) => t.is_habit)
    const completedToday = habitTasks.filter((t) => t.last_checkin_date === today).length
    const longestStreak = habitTasks.reduce((max, t) => Math.max(max, t.longest_streak || 0), 0)

    return {
      totalTasks: activeTasks.length,
      totalHabits: habitTasks.length,
      completedToday,
      longestStreak,
    }
  }, [tasks, today])

  // Handle check-in
  const handleCheckin = React.useCallback(
    async (habit: Task) => {
      setCheckingInId(habit.id)
      try {
        await checkinMutation.mutateAsync({
          taskId: habit.id,
          data: { timezone_offset: new Date().getTimezoneOffset() },
        })
        showToast(`${habit.title} 打卡成功！`, 'success')
      } catch {
        showToast('打卡失败，请重试', 'error')
      } finally {
        setCheckingInId(null)
      }
    },
    [checkinMutation, showToast]
  )

  const isLoading = tasksLoading || ringLoading || statsLoading

  // Get greeting based on time of day
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了，注意休息'
    if (hour < 12) return '早上好，新的一天开始了'
    if (hour < 14) return '中午好，记得吃午饭'
    if (hour < 18) return '下午好，继续加油'
    return '晚上好，今天辛苦了'
  }, [])

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-700 flex items-center gap-2">
          {greeting}
          <Sparkles className="w-6 h-6 text-primary-400" />
        </h1>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Progress Section */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-5 h-5 text-primary-500" />
              今日进度
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-6">
            {isLoading ? (
              <LoadingSkeleton variant="circular" width={180} height={180} />
            ) : (
              <DailyRing
                completed={dailyRingData?.completed_habits ?? localStats?.completedToday ?? 0}
                total={dailyRingData?.total_habits ?? localStats?.totalHabits ?? 0}
                size="lg"
              />
            )}
            {!isLoading && localStats && localStats.totalHabits > 0 && (
              <p className="text-sm text-neutral-500 mt-2 text-center">
                {localStats.completedToday === localStats.totalHabits
                  ? '🎉 太棒了！今日习惯全部完成'
                  : `还有 ${localStats.totalHabits - localStats.completedToday} 个习惯待完成`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="总任务数"
                value={statsOverview?.total_tasks ?? localStats?.totalTasks ?? 0}
                icon={<ListTodo className="w-5 h-5" />}
                colorScheme="primary"
              />
              <StatCard
                title="今日打卡"
                value={statsOverview?.today_checkins ?? localStats?.completedToday ?? 0}
                icon={<CheckCircle2 className="w-5 h-5" />}
                colorScheme="success"
              />
              <StatCard
                title="最长连胜"
                value={statsOverview?.longest_streak ?? localStats?.longestStreak ?? 0}
                suffix="天"
                icon={<Flame className="w-5 h-5" />}
                colorScheme="warning"
              />
              <StatCard
                title="习惯总数"
                value={localStats?.totalHabits ?? 0}
                icon={<Target className="w-5 h-5" />}
                colorScheme="primary"
              />
            </>
          )}
        </div>
      </div>

      {/* Quick Actions & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incomplete Habits */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="w-5 h-5 text-amber-500" />
                待完成习惯
              </CardTitle>
              <Link to="/habits">
                <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
                  查看全部
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">
                <LoadingSkeleton className="h-14" />
                <LoadingSkeleton className="h-14" />
                <LoadingSkeleton className="h-14" />
              </div>
            ) : incompleteHabits.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-primary-400 mx-auto mb-3" />
                <p className="text-neutral-600 font-medium">今日习惯已全部完成！</p>
                <p className="text-neutral-400 text-sm mt-1">继续保持，你做得很棒</p>
              </div>
            ) : (
              <div className="space-y-2">
                {incompleteHabits.slice(0, 5).map((habit) => (
                  <HabitQuickItem
                    key={habit.id}
                    habit={habit}
                    isCheckingIn={checkingInId === habit.id}
                    onCheckin={handleCheckin}
                  />
                ))}
                {incompleteHabits.length > 5 && (
                  <p className="text-sm text-neutral-400 text-center pt-2">
                    还有 {incompleteHabits.length - 5} 个习惯...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Life Entries */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="w-5 h-5 text-primary-500" />
                最近记录
              </CardTitle>
              <Link to="/life">
                <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
                  查看全部
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {entriesLoading ? (
              <div className="space-y-3">
                <LoadingSkeleton className="h-16" />
                <LoadingSkeleton className="h-16" />
                <LoadingSkeleton className="h-16" />
              </div>
            ) : recentEntries.length === 0 ? (
              <EmptyState
                type="life"
                title="暂无记录"
                description="开始记录你的生活点滴"
                actionLabel="去记录"
                onAction={() => {}}
                className="py-6"
              />
            ) : (
              <div className="space-y-3">
                {recentEntries.map((entry) => (
                  <LifeEntryQuickItem key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            快捷入口
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickNavCard
              to="/tasks"
              icon={<ListTodo className="w-6 h-6" />}
              title="任务管理"
              description="管理你的待办事项"
            />
            <QuickNavCard
              to="/habits"
              icon={<Flame className="w-6 h-6" />}
              title="习惯追踪"
              description="坚持每日习惯"
            />
            <QuickNavCard
              to="/life"
              icon={<BookOpen className="w-6 h-6" />}
              title="生活记录"
              description="记录生活点滴"
            />
            <QuickNavCard
              to="/stats"
              icon={<BarChart3 className="w-6 h-6" />}
              title="统计分析"
              description="查看数据报告"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Quick habit item component for homepage
interface HabitQuickItemProps {
  habit: Task
  isCheckingIn: boolean
  onCheckin: (habit: Task) => void
}

function HabitQuickItem({ habit, isCheckingIn, onCheckin }: HabitQuickItemProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-xl',
        'bg-surface-container-high hover:bg-surface-container-highest',
        'transition-colors duration-200'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0">
          {habit.current_streak > 0 ? (
            <div className="flex items-center gap-1 text-primary-500">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-medium">{habit.current_streak}</span>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-neutral-300" />
          )}
        </div>
        <span className="text-neutral-700 truncate">{habit.title}</span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onCheckin(habit)}
        disabled={isCheckingIn}
        className="flex-shrink-0"
      >
        {isCheckingIn ? (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" />
            打卡中
          </span>
        ) : (
          '打卡'
        )}
      </Button>
    </div>
  )
}

// Quick life entry item component
interface LifeEntryQuickItemProps {
  entry: LifeEntry
}

function LifeEntryQuickItem({ entry }: LifeEntryQuickItemProps) {
  return (
    <div className="p-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors duration-200">
      <p className="text-neutral-700 text-sm line-clamp-2">{entry.content}</p>
      <p className="text-neutral-500 text-xs mt-2">{formatRelativeTime(entry.created_at)}</p>
    </div>
  )
}

// Quick navigation card component
interface QuickNavCardProps {
  to: string
  icon: React.ReactNode
  title: string
  description: string
}

function QuickNavCard({ to, icon, title, description }: QuickNavCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex flex-col items-center p-4 rounded-xl',
        'bg-surface-container-high hover:bg-surface-container-highest',
        'border border-neutral-300',
        'transition-all duration-200',
        'hover:shadow-elevation-1'
      )}
    >
      <div className="mb-2 text-primary-500">{icon}</div>
      <h3 className="font-medium text-neutral-700 text-sm">{title}</h3>
      <p className="text-neutral-600 text-xs mt-1 text-center">{description}</p>
    </Link>
  )
}
