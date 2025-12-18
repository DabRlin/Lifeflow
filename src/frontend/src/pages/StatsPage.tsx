/**
 * StatsPage Component
 * Main statistics dashboard with overview, trends, and visualizations
 * Requirements: 7.1-7.7
 */

import * as React from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useDailyRing, useStatsOverview } from '@/hooks/useStats'
import { DailyRing, HeatmapCalendar } from '@/components/habit'
import { StatCard, TrendChart } from '@/components/stats'
import { LoadingSkeleton, EmptyState, StatCardSkeleton } from '@/components/common'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { aggregateCheckinsByDate } from '@/lib/heatmap'
import { calculateTrendData } from '@/lib/stats'
import {
  CheckCircle2,
  Clock,
  Flame,
  Target,
  TrendingUp,
  Calendar,
  BarChart3,
} from 'lucide-react'
import type { CheckinRecord } from '@/api/types'
import { tasksApi } from '@/api/tasks'
import { useQuery } from '@tanstack/react-query'

export function StatsPage() {
  // Fetch data
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useTasks()
  const { data: dailyRingData, isLoading: ringLoading } = useDailyRing()
  const { data: statsOverview, isLoading: statsLoading } = useStatsOverview()

  // Filter habit tasks
  const habits = React.useMemo(() => {
    if (!tasks) return []
    return tasks.filter((task) => task.is_habit && !task.is_deleted)
  }, [tasks])

  // Get today's date
  const today = React.useMemo(() => new Date().toISOString().split('T')[0], [])

  // Fetch all check-in records for heatmap and trends
  const { data: allCheckins, isLoading: checkinsLoading } = useQuery({
    queryKey: ['all-checkins-stats'],
    queryFn: async () => {
      const allRecords: CheckinRecord[] = []
      for (const habit of habits) {
        try {
          const records = await tasksApi.getCheckins(habit.id, 365)
          allRecords.push(...records)
        } catch {
          // Ignore errors for individual habits
        }
      }
      return allRecords
    },
    enabled: habits.length > 0,
  })


  // Aggregate check-ins for heatmap
  const heatmapData = React.useMemo(() => {
    if (!allCheckins) return []
    return aggregateCheckinsByDate(allCheckins)
  }, [allCheckins])

  // Calculate trend data for the last 14 days
  const trendData = React.useMemo(() => {
    if (!allCheckins) return []
    return calculateTrendData(allCheckins, 14, today)
  }, [allCheckins, today])

  // Calculate local stats from tasks
  const localStats = React.useMemo(() => {
    if (!tasks) return null
    
    const activeTasks = tasks.filter((t) => !t.is_deleted)
    const habitTasks = activeTasks.filter((t) => t.is_habit)
    const completedToday = habitTasks.filter((t) => t.last_checkin_date === today).length
    const longestStreak = habitTasks.reduce((max, t) => Math.max(max, t.longest_streak || 0), 0)
    const totalCurrentStreak = habitTasks.reduce((sum, t) => sum + (t.current_streak || 0), 0)
    
    return {
      totalTasks: activeTasks.length,
      totalHabits: habitTasks.length,
      completedToday,
      longestStreak,
      totalCurrentStreak,
      completionRate: habitTasks.length > 0 
        ? Math.round((completedToday / habitTasks.length) * 100) 
        : 0,
    }
  }, [tasks, today])

  const isLoading = tasksLoading || ringLoading || statsLoading

  if (tasksError) {
    return (
      <div className="p-6">
        <EmptyState
          type="default"
          title="加载失败"
          description="无法加载统计数据，请检查网络连接"
          actionLabel="重试"
          onAction={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">统计仪表盘</h1>
        <p className="text-neutral-500 mt-1">查看你的进度和成就</p>
      </div>

      {/* Daily Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Ring Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-5 h-5 text-primary-500" />
              今日进度
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            {isLoading ? (
              <LoadingSkeleton variant="circular" width={180} height={180} />
            ) : (
              <DailyRing
                completed={dailyRingData?.completed_habits ?? localStats?.completedToday ?? 0}
                total={dailyRingData?.total_habits ?? localStats?.totalHabits ?? 0}
                size="lg"
              />
            )}
          </CardContent>
        </Card>


        {/* Stats Cards Grid */}
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
                icon={<BarChart3 className="w-5 h-5" />}
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
                title="完成率"
                value={statsOverview?.completion_rate ?? localStats?.completionRate ?? 0}
                suffix="%"
                icon={<TrendingUp className="w-5 h-5" />}
                colorScheme="primary"
              />
            </>
          )}
        </div>
      </div>

      {/* Trend Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-5 h-5 text-primary-500" />
            打卡趋势（近14天）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checkinsLoading || tasksLoading ? (
            <LoadingSkeleton className="h-64" />
          ) : trendData.length > 0 ? (
            <TrendChart
              data={trendData}
              label="打卡次数"
              height={240}
              colorScheme="primary"
              className="border-0 shadow-none p-0"
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-neutral-400">
              暂无打卡数据
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="习惯总数"
              value={localStats?.totalHabits ?? 0}
              icon={<Target className="w-5 h-5" />}
              colorScheme="primary"
            />
            <StatCard
              title="待完成任务"
              value={statsOverview?.pending_tasks ?? (localStats?.totalTasks ?? 0) - (localStats?.completedToday ?? 0)}
              icon={<Clock className="w-5 h-5" />}
              colorScheme="warning"
            />
            <StatCard
              title="累计连胜天数"
              value={localStats?.totalCurrentStreak ?? 0}
              suffix="天"
              icon={<Flame className="w-5 h-5" />}
              colorScheme="success"
            />
          </>
        )}
      </div>

      {/* Heatmap Calendar Section */}
      {habits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-5 h-5 text-primary-500" />
              年度打卡日历
            </CardTitle>
          </CardHeader>
          <CardContent>
            {checkinsLoading ? (
              <LoadingSkeleton className="h-52" />
            ) : (
              <HeatmapCalendar
                data={heatmapData}
                year={new Date().getFullYear()}
                height={220}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && (!tasks || tasks.length === 0) && (
        <EmptyState
          type="default"
          title="暂无数据"
          description="开始创建任务和习惯，这里将展示你的统计数据"
        />
      )}
    </div>
  )
}
