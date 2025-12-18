import { createBrowserRouter, createHashRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { MainLayout } from '@/components/layout'
import { LoadingSkeleton } from '@/components/common'

// Lazy load pages for code splitting with named exports
const HomePage = lazy(() =>
  import('@/pages/HomePage').then(module => ({ default: module.HomePage }))
)
const TasksPage = lazy(() =>
  import('@/pages/TasksPage').then(module => ({ default: module.TasksPage }))
)
const HabitsPage = lazy(() =>
  import('@/pages/HabitsPage').then(module => ({ default: module.HabitsPage }))
)
const LifePage = lazy(() =>
  import('@/pages/LifePage').then(module => ({ default: module.LifePage }))
)
const StatsPage = lazy(() =>
  import('@/pages/StatsPage').then(module => ({ default: module.StatsPage }))
)
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then(module => ({ default: module.SettingsPage }))
)

// Suspense wrapper for lazy loaded components
function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

// Use hash router for Electron compatibility
const createRouter = import.meta.env.DEV ? createBrowserRouter : createHashRouter

export const router = createRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: (
          <LazyPage>
            <HomePage />
          </LazyPage>
        ),
      },
      {
        path: 'tasks',
        element: (
          <LazyPage>
            <TasksPage />
          </LazyPage>
        ),
      },
      {
        path: 'habits',
        element: (
          <LazyPage>
            <HabitsPage />
          </LazyPage>
        ),
      },
      {
        path: 'life',
        element: (
          <LazyPage>
            <LifePage />
          </LazyPage>
        ),
      },
      {
        path: 'stats',
        element: (
          <LazyPage>
            <StatsPage />
          </LazyPage>
        ),
      },
      {
        path: 'settings',
        element: (
          <LazyPage>
            <SettingsPage />
          </LazyPage>
        ),
      },
    ],
  },
])
