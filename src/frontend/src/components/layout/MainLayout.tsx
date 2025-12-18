import { Outlet } from 'react-router-dom'
import { useUIStore } from '@/stores/ui-store'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Toast } from '@/components/common/Toast'

interface MainLayoutProps {
  children?: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div
        className="min-h-screen transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarOpen ? '15rem' : '4rem' }}
      >
        {/* Header */}
        <Header />

        {/* Page content - hide scrollbar for cleaner look */}
        <main className="p-6 overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
          {children || <Outlet />}
        </main>
      </div>

      {/* Toast notifications */}
      <Toast />
    </div>
  )
}
