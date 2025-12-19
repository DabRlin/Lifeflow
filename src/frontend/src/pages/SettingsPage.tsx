/**
 * SettingsPage Component
 * Application settings with categorized sections
 * Requirements: 8.1-8.5
 */

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from '@/components/common'
import { useSettingsStore } from '@/stores/settings-store'
import { useUIStore } from '@/stores/ui-store'
import { settingsApi } from '@/api/settings'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  BellOff,
  Download,
  Info,
  Settings,
  Database,
  CheckCircle,
  Loader2,
  FileJson,
  Github,
  Heart,
} from 'lucide-react'

// App version info
const APP_INFO = {
  name: 'LifeFlow',
  version: '2.0.0',
  buildDate: '2024-12-18',
  description: '一款简约高效的个人效率应用',
  github: 'https://github.com/DabRlin/Lifeflow',
}

// Setting item component
interface SettingItemProps {
  icon: React.ReactNode
  title: string
  description: string
  action: React.ReactNode
}

function SettingItem({ icon, title, description, action }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-neutral-100 last:border-0">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-neutral-50 rounded-lg text-neutral-600">
          {icon}
        </div>
        <div>
          <h4 className="font-medium text-neutral-900">{title}</h4>
          <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="ml-4 flex-shrink-0">
        {action}
      </div>
    </div>
  )
}

// Toggle switch component
interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
}

function ToggleSwitch({ enabled, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full
        transition-colors duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        ${enabled ? 'bg-primary-600' : 'bg-neutral-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow-sm
          transition-transform duration-200 ease-in-out
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  )
}

export function SettingsPage() {
  const { showToast } = useUIStore()
  const queryClient = useQueryClient()
  const { notificationsEnabled, setNotificationsEnabled } = useSettingsStore()
  const [isExporting, setIsExporting] = React.useState(false)

  // Fetch settings from backend
  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getAll(),
  })

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (updates: Record<string, unknown>) => settingsApi.update(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })

  // Handle notification toggle
  const handleNotificationToggle = React.useCallback(async (enabled: boolean) => {
    // Update local store
    setNotificationsEnabled(enabled)
    
    // Sync to backend
    try {
      await updateSettingsMutation.mutateAsync({ notificationsEnabled: enabled })
      showToast(enabled ? '通知已开启' : '通知已关闭', 'success')
    } catch {
      // Revert on error
      setNotificationsEnabled(!enabled)
      showToast('设置保存失败', 'error')
    }
  }, [setNotificationsEnabled, updateSettingsMutation, showToast])

  // Handle data export
  const handleExportData = React.useCallback(async () => {
    setIsExporting(true)
    try {
      const data = await settingsApi.exportData()
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `lifeflow-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      showToast('数据导出成功', 'success')
    } catch {
      showToast('数据导出失败', 'error')
    } finally {
      setIsExporting(false)
    }
  }, [showToast])

  // Sync notification state from server on load
  React.useEffect(() => {
    if (serverSettings?.notificationsEnabled !== undefined) {
      setNotificationsEnabled(serverSettings.notificationsEnabled)
    }
  }, [serverSettings, setNotificationsEnabled])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <LoadingSkeleton className="h-8 w-32" />
        <LoadingSkeleton className="h-48" />
        <LoadingSkeleton className="h-48" />
        <LoadingSkeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-semibold text-neutral-700 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          设置
        </h1>
        <p className="text-body-md text-neutral-600 mt-1">管理应用偏好和数据</p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            通知设置
          </CardTitle>
          <CardDescription>
            管理应用通知和提醒
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingItem
            icon={notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            title="启用通知"
            description="接收习惯提醒和任务通知"
            action={
              <ToggleSwitch
                enabled={notificationsEnabled}
                onChange={handleNotificationToggle}
                disabled={updateSettingsMutation.isPending}
              />
            }
          />
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            数据管理
          </CardTitle>
          <CardDescription>
            导出和管理你的数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingItem
            icon={<FileJson className="w-5 h-5" />}
            title="导出数据"
            description="将所有数据导出为 JSON 文件"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    导出
                  </>
                )}
              </Button>
            }
          />
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            关于应用
          </CardTitle>
          <CardDescription>
            应用信息和版本
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* App Info */}
          <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{APP_INFO.name}</h3>
              <p className="text-sm text-neutral-500">{APP_INFO.description}</p>
            </div>
          </div>

          {/* Version Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">版本号</p>
              <p className="text-sm font-medium text-neutral-900 mt-1">v{APP_INFO.version}</p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">构建日期</p>
              <p className="text-sm font-medium text-neutral-900 mt-1">{APP_INFO.buildDate}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-sm text-primary-600">
            <CheckCircle className="w-4 h-4" />
            <span>所有服务运行正常</span>
          </div>

          {/* Links */}
          <div className="pt-2 border-t border-neutral-100">
            <a
              href={APP_INFO.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
            >
              <Github className="w-4 h-4" />
              查看源代码
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
