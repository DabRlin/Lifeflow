import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  // Notification settings
  notificationsEnabled: boolean
  setNotificationsEnabled: (enabled: boolean) => void

  // Theme settings (for future use)
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Daily reminder time
  reminderTime: string | null
  setReminderTime: (time: string | null) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Notifications
      notificationsEnabled: false,
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),

      // Reminder
      reminderTime: null,
      setReminderTime: (time) => set({ reminderTime: time }),
    }),
    {
      name: 'lifeflow-settings',
    }
  )
)
