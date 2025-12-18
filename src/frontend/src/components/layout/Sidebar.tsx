import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import {
  Home,
  CheckSquare,
  Target,
  BookOpen,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { path: '/', label: '首页', icon: <Home className="w-5 h-5" /> },
  { path: '/tasks', label: '任务', icon: <CheckSquare className="w-5 h-5" /> },
  { path: '/habits', label: '习惯', icon: <Target className="w-5 h-5" /> },
  { path: '/life', label: '生活', icon: <BookOpen className="w-5 h-5" /> },
  { path: '/stats', label: '统计', icon: <BarChart3 className="w-5 h-5" /> },
]

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-surface-container border-r border-neutral-300',
        'transition-all duration-300 ease-in-out',
        'flex flex-col'
      )}
      style={{ width: sidebarOpen ? '15rem' : '4rem' }}
    >
      {/* Top section: titlebar drag region + logo, total height matches Header (80px) */}
      <div
        className="h-20 flex-shrink-0 flex flex-col border-b border-neutral-300"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Spacer for macOS window controls */}
        <div className="h-8 flex-shrink-0" />

        {/* Logo area - aligned with Header content */}
        <div className="h-12 flex items-center px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">LF</span>
            </div>
            {sidebarOpen && (
              <span className="font-semibold text-neutral-700 animate-fade-in">
                LifeFlow
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-full',
                    'transition-colors duration-200',
                    'hover:bg-surface-container-high',
                    isActive
                      ? 'bg-secondary-50 text-primary-500 font-medium'
                      : 'text-neutral-600 hover:text-neutral-700',
                    !sidebarOpen && 'justify-center'
                  )
                }
                title={!sidebarOpen ? item.label : undefined}
              >
                {item.icon}
                {sidebarOpen && (
                  <span className="animate-fade-in">{item.label}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-neutral-300 py-4 px-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-full',
              'transition-colors duration-200',
              'hover:bg-surface-container-high',
              isActive
                ? 'bg-secondary-50 text-primary-500 font-medium'
                : 'text-neutral-600 hover:text-neutral-700',
              !sidebarOpen && 'justify-center'
            )
          }
          title={!sidebarOpen ? '设置' : undefined}
        >
          <Settings className="w-5 h-5" />
          {sidebarOpen && <span className="animate-fade-in">设置</span>}
        </NavLink>

        {/* Toggle button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-full',
            'text-neutral-500 hover:text-neutral-600 hover:bg-surface-container-high',
            'transition-colors duration-200',
            !sidebarOpen && 'justify-center'
          )}
          title={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
        >
          {sidebarOpen ? (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="animate-fade-in text-sm">收起</span>
            </>
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  )
}
