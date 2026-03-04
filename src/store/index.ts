import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Settings store using Zustand
interface SettingsState {
  darkMode: boolean
  compactMode: boolean
  fontSize: 'small' | 'medium' | 'large'
  tableDensity: 'comfortable' | 'standard' | 'compact'
  autoLogout: boolean
  highContrast: boolean
  reducedMotion: boolean
  sidebarCollapsed: boolean
  systemLogo: string | null
  setDarkMode: (value: boolean) => void
  setCompactMode: (value: boolean) => void
  setFontSize: (value: 'small' | 'medium' | 'large') => void
  setTableDensity: (value: 'comfortable' | 'standard' | 'compact') => void
  setAutoLogout: (value: boolean) => void
  setHighContrast: (value: boolean) => void
  setReducedMotion: (value: boolean) => void
  setSidebarCollapsed: (value: boolean) => void
  setSystemLogo: (url: string | null) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: false,
      compactMode: false,
      fontSize: 'medium',
      tableDensity: 'standard',
      autoLogout: false,
      highContrast: false,
      reducedMotion: false,
      sidebarCollapsed: false,
      systemLogo: null,
      setDarkMode: (value) => set({ darkMode: value }),
      setCompactMode: (value) => set({ compactMode: value }),
      setFontSize: (value) => set({ fontSize: value }),
      setTableDensity: (value) => set({ tableDensity: value }),
      setAutoLogout: (value) => set({ autoLogout: value }),
      setHighContrast: (value) => set({ highContrast: value }),
      setReducedMotion: (value) => set({ reducedMotion: value }),
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      setSystemLogo: (url) => set({ systemLogo: url }),
    }),
    {
      name: 'settings-storage',
    }
  )
)

// Auth store using Zustand
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface User {
  id: string
  username: string
  email: string
  role: string
  profilePicture?: string | null
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  updateProfilePicture: (url: string | null) => void
  updateUser: (updates: Partial<User>) => void
  setError: (error: string | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          if (!isSupabaseConfigured() || !supabase) {
            set({ error: 'Supabase is not configured', isLoading: false })
            return false
          }

          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (authError) {
            set({ error: authError.message, isLoading: false })
            return false
          }

          if (data.user) {
            const meta = data.user.user_metadata || {}
            const userData: User = {
              id: data.user.id,
              username: meta.username || meta.display_name || email.split('@')[0],
              email: email,
              role: meta.role || 'user',
              profilePicture: meta.profile_picture || null,
            }

            set({ user: userData, isAuthenticated: true, isLoading: false })
            return true
          }

          set({ error: 'Login failed', isLoading: false })
          return false
        } catch (error) {
          const message = error instanceof Error ? error.message : 'An error occurred during login'
          set({ error: message, isLoading: false })
          return false
        }
      },
      logout: async () => {
        try {
          if (isSupabaseConfigured() && supabase) {
            await supabase.auth.signOut()
          }
          set({ user: null, isAuthenticated: false, error: null })
        } catch (error) {
          console.error('Logout error:', error)
          set({ user: null, isAuthenticated: false })
        }
      },
      updateProfilePicture: (url) => {
        set((state) => ({
          user: state.user ? { ...state.user, profilePicture: url } : null,
        }))
      },
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }))
      },
      setError: (error) => {
        set({ error })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
