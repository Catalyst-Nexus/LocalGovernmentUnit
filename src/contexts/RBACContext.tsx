import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store'

export interface Module {
  id: string
  module_name: string
  route_path: string
  icons: string | null
  is_active: boolean
  created_at: string
}

export interface Permission {
  id: string
  module_id: string
  action_type: string
  permission_code: string
  description: string | null
}

interface RBACContextType {
  modules: Module[]
  userModules: Module[]
  userPermissions: Permission[]
  isLoading: boolean
  isSuperAdmin: boolean
  hasModuleAccess: (moduleIdOrPath: string) => boolean
  hasPermission: (permissionCode: string) => boolean
  refreshPermissions: () => Promise<void>
}

const RBACContext = createContext<RBACContextType | undefined>(undefined)

export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user)
  const [modules, setModules] = useState<Module[]>([])
  const [userModules, setUserModules] = useState<Module[]>([])
  const [userPermissions, setUserPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isSuperAdmin = user?.is_super_admin ?? false

  const fetchAllModules = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) return []

    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching modules:', error)
      return []
    }

    return data || []
  }, [])

  const fetchUserPermissions = useCallback(async (): Promise<{
    permissions: Permission[]
    moduleIds: string[]
  }> => {
    if (!isSupabaseConfigured() || !supabase || !user) {
      return { permissions: [], moduleIds: [] }
    }

    try {
      // Step 1: Get user's roles
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', user.id)

      if (userRolesError) {
        console.error('Error fetching user roles:', userRolesError)
        return { permissions: [], moduleIds: [] }
      }

      const roleIds = userRoles?.map((ur) => ur.role_id) || []

      if (roleIds.length === 0) {
        console.log('User has no roles assigned')
        return { permissions: [], moduleIds: [] }
      }

      // Step 2: Get permissions for those roles
      const { data: rolePermissions, error: rolesPermError } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .in('role_id', roleIds)

      if (rolesPermError) {
        console.error('Error fetching role permissions:', rolesPermError)
        return { permissions: [], moduleIds: [] }
      }

      const permissionIds = [...new Set(rolePermissions?.map((rp) => rp.permission_id) || [])]

      if (permissionIds.length === 0) {
        console.log('User roles have no permissions')
        return { permissions: [], moduleIds: [] }
      }

      // Step 3: Get permission details
      const { data: permissions, error: permsError } = await supabase
        .from('permissions')
        .select('*')
        .in('id', permissionIds)

      if (permsError) {
        console.error('Error fetching permissions:', permsError)
        return { permissions: [], moduleIds: [] }
      }

      const moduleIds = [...new Set(permissions?.map((p) => p.module_id) || [])]

      return {
        permissions: permissions || [],
        moduleIds,
      }
    } catch (err) {
      console.error('Error in fetchUserPermissions:', err)
      return { permissions: [], moduleIds: [] }
    }
  }, [user])

  const refreshPermissions = useCallback(async () => {
    setIsLoading(true)

    try {
      // Fetch all active modules
      const allModules = await fetchAllModules()
      setModules(allModules)

      if (!user) {
        setUserModules([])
        setUserPermissions([])
        setIsLoading(false)
        return
      }

      // Super admin has access to all modules
      if (user.is_super_admin) {
        setUserModules(allModules)
        setUserPermissions([])
        setIsLoading(false)
        return
      }

      // Regular user: fetch based on role permissions
      const { permissions, moduleIds } = await fetchUserPermissions()
      setUserPermissions(permissions)

      // Filter modules based on user's permissions
      const accessibleModules = allModules.filter((m) => moduleIds.includes(m.id))
      setUserModules(accessibleModules)
    } catch (err) {
      console.error('Error refreshing permissions:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user, fetchAllModules, fetchUserPermissions])

  // Check if user has access to a module (by id or route_path)
  const hasModuleAccess = useCallback(
    (moduleIdOrPath: string): boolean => {
      if (isSuperAdmin) return true

      return userModules.some(
        (m) => m.id === moduleIdOrPath || m.route_path === moduleIdOrPath
      )
    },
    [isSuperAdmin, userModules]
  )

  // Check if user has a specific permission
  const hasPermission = useCallback(
    (permissionCode: string): boolean => {
      if (isSuperAdmin) return true

      return userPermissions.some((p) => p.permission_code === permissionCode)
    },
    [isSuperAdmin, userPermissions]
  )

  // Fetch permissions on mount and when user changes
  useEffect(() => {
    refreshPermissions()
  }, [refreshPermissions])

  // Subscribe to real-time changes
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return

    const subscription = supabase
      .channel('rbac_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, () => {
        refreshPermissions()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'role_permissions' }, () => {
        refreshPermissions()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        refreshPermissions()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshPermissions])

  return (
    <RBACContext.Provider
      value={{
        modules,
        userModules,
        userPermissions,
        isLoading,
        isSuperAdmin,
        hasModuleAccess,
        hasPermission,
        refreshPermissions,
      }}
    >
      {children}
    </RBACContext.Provider>
  )
}

export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext)
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider')
  }
  return context
}

export default RBACContext
