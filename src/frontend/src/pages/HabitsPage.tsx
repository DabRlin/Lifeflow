/**
 * HabitsPage Component
 * Main page for habit tracking with check-in, streaks, and progress visualization
 * Requirements: 5.1-5.6
 */

import * as React from 'react'
import { getLocalDateString } from '@/lib/utils'
import { useTasks, useCheckinTask, useCreateTask, useDeleteTask, useUpdateTask } from '@/hooks/useTasks'
import { useDailyRing } from '@/hooks/useStats'
import { HabitCard, DailyRing, HeatmapCalendar } from '@/components/habit'
import { LoadingSkeleton, EmptyState } from '@/components/common'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { aggregateCheckinsByDate } from '@/lib/heatmap'
import { useUIStore } from '@/stores/ui-store'
import { Plus, Target, Flame, Calendar } from 'lucide-react'
import type { Task, CheckinRecord } from '@/api/types'
import { tasksApi } from '@/api/tasks'
import { useQuery } from '@tanstack/react-query'

export function HabitsPage() {
  const [checkingInId, setCheckingInId] = React.useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = React.useState(false)
  const [newHabitTitle, setNewHabitTitle] = React.useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<Task | null>(null)
  const [showEditModal, setShowEditModal] = React.useState<Task | null>(null)
  const [editTitle, setEditTitle] = React.useState('')
  const { showToast } = useUIStore()

  // Fetch all tasks and filter habits
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useTasks()
  const { data: dailyRingData } = useDailyRing()
  const checkinMutation = useCheckinTask()
  const createTaskMutation = useCreateTask()
  const deleteTaskMutation = useDeleteTask()
  const updateTaskMutation = useUpdateTask()

  // Filter to only habit tasks
  const habits = React.useMemo(() => {
    if (!tasks) return []
    return tasks.filter(task => task.is_habit && !task.is_deleted)
  }, [tasks])

  // Get today's date in local timezone
  const today = React.useMemo(() => getLocalDateString(), [])

  // Separate completed and incomplete habits
  const { completedHabits, incompleteHabits } = React.useMemo(() => {
    const completed = habits.filter(h => h.last_checkin_date === today)
    const incomplete = habits.filter(h => h.last_checkin_date !== today)
    return { completedHabits: completed, incompleteHabits: incomplete }
  }, [habits, today])

  // Fetch all check-in records for heatmap
  const { data: allCheckins } = useQuery({
    queryKey: ['all-checkins'],
    queryFn: async () => {
      // Fetch check-ins for all habits
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

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalHabits = habits.length
    const completedToday = completedHabits.length
    const longestStreak = habits.reduce((max, h) => Math.max(max, h.longest_streak), 0)
    const currentStreaks = habits.reduce((sum, h) => sum + h.current_streak, 0)
    
    return {
      totalHabits,
      completedToday,
      longestStreak,
      currentStreaks,
    }
  }, [habits, completedHabits])

  // Handle check-in
  const handleCheckin = React.useCallback(async (habit: Task) => {
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
  }, [checkinMutation, showToast])

  // Handle edit
  const handleEdit = React.useCallback((habit: Task) => {
    setEditTitle(habit.title)
    setShowEditModal(habit)
  }, [])

  // Handle save edit
  const handleSaveEdit = React.useCallback(async () => {
    if (!showEditModal || !editTitle.trim()) return
    
    try {
      await updateTaskMutation.mutateAsync({
        taskId: showEditModal.id,
        data: { title: editTitle.trim() },
      })
      setShowEditModal(null)
      setEditTitle('')
      showToast('习惯更新成功！', 'success')
    } catch {
      showToast('更新失败，请重试', 'error')
    }
  }, [showEditModal, editTitle, updateTaskMutation, showToast])

  // Handle delete
  const handleDelete = React.useCallback((habit: Task) => {
    setShowDeleteConfirm(habit)
  }, [])

  // Handle confirm delete
  const handleConfirmDelete = React.useCallback(async () => {
    if (!showDeleteConfirm) return
    
    try {
      await deleteTaskMutation.mutateAsync({ taskId: showDeleteConfirm.id })
      showToast('习惯删除成功！', 'success')
    } catch {
      showToast('删除失败，请重试', 'error')
    } finally {
      setShowDeleteConfirm(null)
    }
  }, [showDeleteConfirm, deleteTaskMutation, showToast])

  // Handle create habit
  const handleCreateHabit = React.useCallback(async () => {
    if (!newHabitTitle.trim()) return
    
    try {
      await createTaskMutation.mutateAsync({
        title: newHabitTitle.trim(),
        is_habit: true,
      })
      setNewHabitTitle('')
      setShowCreateModal(false)
      showToast('习惯创建成功！', 'success')
    } catch {
      showToast('创建失败，请重试', 'error')
    }
  }, [newHabitTitle, createTaskMutation, showToast])

  if (tasksLoading) {
    return (
      <div className="p-6 space-y-6">
        <LoadingSkeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-32" />
        </div>
        <LoadingSkeleton className="h-64" />
      </div>
    )
  }

  if (tasksError) {
    return (
      <div className="p-6">
        <EmptyState
          type="default"
          title="加载失败"
          description="无法加载习惯数据，请检查网络连接"
          actionLabel="重试"
          onAction={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-semibold text-neutral-700">习惯追踪</h1>
          <p className="text-body-md text-neutral-600 mt-1">坚持每天的小习惯，成就更好的自己</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建习惯
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Daily Progress Ring */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex justify-center">
            <DailyRing
              completed={dailyRingData?.completed_habits ?? completedHabits.length}
              total={dailyRingData?.total_habits ?? habits.length}
              size="md"
            />
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-100 rounded-lg">
                <Target className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-body-sm text-neutral-600">总习惯数</p>
                <p className="text-headline-sm font-semibold text-neutral-700">{stats.totalHabits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-100 rounded-lg">
                <Flame className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-body-sm text-neutral-600">最长连胜</p>
                <p className="text-headline-sm font-semibold text-neutral-700">{stats.longestStreak} 天</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-100 rounded-lg">
                <Calendar className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-body-sm text-neutral-600">今日完成</p>
                <p className="text-headline-sm font-semibold text-neutral-700">
                  {stats.completedToday}/{stats.totalHabits}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habits List */}
      {habits.length === 0 ? (
        <EmptyState
          type="habits"
          actionLabel="创建习惯"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Incomplete Habits */}
          {incompleteHabits.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-700 mb-3">
                待完成 ({incompleteHabits.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incompleteHabits.map(habit => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    isCheckingIn={checkingInId === habit.id}
                    onCheckin={handleCheckin}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Habits */}
          {completedHabits.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-700 mb-3">
                已完成 ({completedHabits.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedHabits.map(habit => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    isCheckingIn={checkingInId === habit.id}
                    onCheckin={handleCheckin}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Heatmap Calendar */}
      {habits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              打卡日历
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HeatmapCalendar
              data={heatmapData}
              year={new Date().getFullYear()}
              height={200}
            />
          </CardContent>
        </Card>
      )}

      {/* Create Habit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建习惯"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreateHabit}
              disabled={!newHabitTitle.trim() || createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? '创建中...' : '创建'}
            </Button>
          </>
        }
      >
        <Input
          value={newHabitTitle}
          onChange={(e) => setNewHabitTitle(e.target.value)}
          placeholder="输入习惯名称..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCreateHabit()
            }
          }}
          autoFocus
        />
      </Modal>

      {/* Edit Habit Modal */}
      <Modal
        isOpen={!!showEditModal}
        onClose={() => setShowEditModal(null)}
        title="编辑习惯"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowEditModal(null)}>
              取消
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editTitle.trim() || updateTaskMutation.isPending}
            >
              {updateTaskMutation.isPending ? '保存中...' : '保存'}
            </Button>
          </>
        }
      >
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="输入习惯名称..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSaveEdit()
            }
          }}
          autoFocus
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="确认删除"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? '删除中...' : '删除'}
            </Button>
          </>
        }
      >
        <p>确定要删除习惯 "{showDeleteConfirm?.title}" 吗？此操作无法撤销。</p>
      </Modal>
    </div>
  )
}
