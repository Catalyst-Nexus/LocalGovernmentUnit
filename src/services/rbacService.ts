import { supabase } from './supabase'

export interface User {
  id: string
  username: string
  email: string
  status: 'active' | 'inactive'
  created_at: string
  is_super_admin: boolean
}

export interface Role {
  id: string
  role_name: string
  role_code: string
  is_active?: boolean
  created_at: string
}

export interface Module {
  id: string
  module_name: string
  route_path: string
  is_active: boolean
  created_at: string
  icons?: string | null
}

export interface UserRole {
  user_id: string
  role_id: string
  created_at: string
}

export interface RoleModuleAccess {
  role_id: string
  module_id: string
  created_at: string
}

export interface Facility {
  id: string
  facility_name: string
  is_active: boolean
  created_at: string
}

export interface UserFacility {
  user_id: string
  facilities_id: string
  created_at: string
}

export interface Permission {
  id: string
  module_id: string
  action_type: string
  permission_code: string
  description: string
  created_at: string
}

export interface RolePermission {
  role_id: string
  permission_id: string
  created_at: string
}

// Fetch all users from pending_users table
export const fetchUsers = async (): Promise<User[]> => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('pending_users')
      .select('id, username, email, created_at, is_confirmed')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    interface PendingUserData {
      id: string
      username: string
      email: string
      created_at: string
      is_confirmed: boolean
    }

    const users: User[] = (data || []).map((user: PendingUserData) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      status: user.is_confirmed ? ('active' as const) : ('inactive' as const),
      created_at: user.created_at,
      is_super_admin: false,
    }))

    return users
  } catch (err) {
    console.error('Error in fetchUsers:', err)
    return []
  }
}

// Fetch all roles
export const fetchRoles = async (): Promise<Role[]> => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching roles:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Error in fetchRoles:', err)
    return []
  }
}

// Fetch all active modules
export const fetchModules = async (): Promise<Module[]> => {
  if (!supabase) return []

  try {
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
  } catch (err) {
    console.error('Error in fetchModules:', err)
    return []
  }
}

// Assign a role to a user
export const assignRoleToUser = async (
  userId: string,
  roleId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase not configured' }

  try {
    // Check if the assignment already exists
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId)
      .eq('role_id', roleId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      return { success: false, error: `Error checking role assignment: ${checkError.message}` }
    }

    if (existingRole) {
      return { success: true } // Role already assigned
    }

    // First, remove any existing role assignment (assuming one role per user)
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .match({ user_id: userId })

    if (deleteError) {
      console.error('Error removing old role:', deleteError)
    }

    // Assign the new role
    const { error } = await supabase.from('user_roles').insert([
      {
        user_id: userId,
        role_id: roleId,
      },
    ])

    if (error) {
      return { success: false, error: `Failed to assign role: ${error.message}` }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// Get roles assigned to a user
export const getUserRoles = async (userId: string): Promise<Role[]> => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        roles:role_id (
          id,
          role_name,
          role_code,
          created_at
        )
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user roles:', error)
      return []
    }

    return (data as unknown as Array<{ roles: Role[] }>)?.map((entry) => entry.roles).flat().filter(Boolean) || []
  } catch (err) {
    console.error('Error in getUserRoles:', err)
    return []
  }
}

// Assign modules to a role
export const assignModulesToRole = async (
  roleId: string,
  moduleIds: string[]
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase not configured' }

  try {
    // Remove all existing module assignments for this role
    const { error: deleteError } = await supabase
      .from('role_module_access')
      .delete()
      .eq('role_id', roleId)

    if (deleteError) {
      console.error('Error removing old module assignments:', deleteError)
    }

    // Add new module assignments
    if (moduleIds.length > 0) {
      const assignments = moduleIds.map((moduleId) => ({
        role_id: roleId,
        module_id: moduleId,
      }))

      const { error } = await supabase.from('role_module_access').insert(assignments)

      if (error) {
        const msg = error.message || error.details || error.hint || JSON.stringify(error)
        return { success: false, error: `Failed to assign modules: ${msg}` }
      }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// Get modules assigned to a role
export const getRoleModules = async (roleId: string): Promise<Module[]> => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('role_module_access')
      .select('module_id, modules:module_id(id, module_name, route_path, icons, is_active, created_at)')
      .eq('role_id', roleId)

    if (error) {
      console.error('Error fetching role modules:', error)
      return []
    }

    interface RoleModuleEntry {
      modules: Module
    }

    return (data as unknown as RoleModuleEntry[] | null)?.map((entry) => entry.modules).filter(Boolean) || []
  } catch (err) {
    console.error('Error in getRoleModules:', err)
    return []
  }
}

// Get all role-module assignments
export const fetchRoleModuleAssignments = async (): Promise<RoleModuleAccess[]> => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('role_module_access')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching role module assignments:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Error in fetchRoleModuleAssignments:', err)
    return []
  }
}

// Fetch all facilities
export const fetchFacilities = async (): Promise<Facility[]> => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching facilities:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Error in fetchFacilities:', err)
    return []
  }
}

// Assign facilities to a user
export const assignFacilitiesToUser = async (
  userId: string,
  facilityIds: string[]
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase not configured' }

  try {
    // Remove all existing facility assignments for this user
    const { error: deleteError } = await supabase
      .from('user_facilities')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error removing old facility assignments:', deleteError)
    }

    // Add new facility assignments
    if (facilityIds.length > 0) {
      const assignments = facilityIds.map((facilityId) => ({
        user_id: userId,
        facilities_id: facilityId,
      }))

      const { error } = await supabase.from('user_facilities').insert(assignments)

      if (error) {
        return { success: false, error: `Failed to assign facilities: ${error.message}` }
      }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

// Get facilities assigned to a user
export const getUserFacilities = async (userId: string): Promise<Facility[]> => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('user_facilities')
      .select(`
        facilities:facilities_id (
          id,
          facility_name,
          is_active,
          created_at
        )
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user facilities:', error)
      return []
    }

    return (data as unknown as Array<{ facilities: Facility[] }>)?.map((entry) => entry.facilities).flat().filter(Boolean) || []
  } catch (err) {
    console.error('Error in getUserFacilities:', err)
    return []
  }
}    

// Get all user-facility assignments
export const fetchUserFacilityAssignments = async (): Promise<UserFacility[]> => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('user_facilities')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user facility assignments:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Error in fetchUserFacilityAssignments:', err)
    return []
  }
}

// Get all user-role assignments with user and role details
export const fetchUserRoleAssignments = async () => {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role_id,
        created_at,
        pending_users:user_id (id, username, email),
        roles:role_id (id, role_name, role_code)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user role assignments:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Error in fetchUserRoleAssignments:', err)
    return []
  }
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export const fetchPermissions = async (): Promise<Permission[]> => {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { console.error('Error fetching permissions:', error); return [] }
    return data || []
  } catch (err) { console.error('Error in fetchPermissions:', err); return [] }
}

export const createPermission = async (
  payload: Omit<Permission, 'id' | 'created_at'>
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase not configured' }
  try {
    const { error } = await supabase.from('permissions').insert([payload])
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export const updatePermission = async (
  id: string,
  payload: Partial<Omit<Permission, 'id' | 'created_at'>>
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase not configured' }
  try {
    const { error } = await supabase.from('permissions').update(payload).eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export const deletePermission = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase not configured' }
  try {
    const { error } = await supabase.from('permissions').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ─── Role Permissions ─────────────────────────────────────────────────────────

export const getRolePermissions = async (roleId: string): Promise<Permission[]> => {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permissions:permission_id (
          id,
          module_id,
          action_type,
          permission_code,
          description,
          created_at
        )
      `)
      .eq('role_id', roleId)
    if (error) { console.error('Error fetching role permissions:', error); return [] }
    return (data as unknown as Array<{ permissions: Permission[] }>)?.map((e) => e.permissions).flat().filter(Boolean) || []
  } catch (err) { console.error('Error in getRolePermissions:', err); return [] }
}

export const assignPermissionsToRole = async (
  roleId: string,
  permissionIds: string[]
): Promise<{ success: boolean; error?: string }> => {
  if (!supabase) return { success: false, error: 'Supabase not configured' }
  try {
    const { error: del } = await supabase
      .from('role_permissions')
      .delete()
      .match({ role_id: roleId })
    if (del) console.error('Error removing old role permissions:', del)

    if (permissionIds.length > 0) {
      const { error } = await supabase
        .from('role_permissions')
        .insert(permissionIds.map((pid) => ({ role_id: roleId, permission_id: pid })))
      if (error) return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
