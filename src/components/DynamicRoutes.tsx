/**
 * DynamicRoutes Component
 * 
 * Automatically generates routes from database modules without code changes.
 * Modules specify their component path in the database, and routes are
 * created dynamically at runtime.
 */

import { lazy, Suspense, useEffect, useState } from 'react'
import { Route } from 'react-router'
import { useRBAC } from '@/contexts/RBACContext'

// Component Registry
// Register all available page components here
// Format: 'path/to/component' -> actual lazy-loaded component
const componentRegistry = {
  // RBAC Views
  'views/rbac/UserActivation': lazy(() => import('@/views/rbac/UserActivation')),
  'views/rbac/RoleManagement': lazy(() => import('@/views/rbac/RoleManagement')),
  'views/rbac/UserManagement': lazy(() => import('@/views/rbac/UserManagement')),
  'views/rbac/ModuleManagement': lazy(() => import('@/views/rbac/ModuleManagement')),
  'views/rbac/FacilitiesManagement': lazy(() => import('@/views/rbac/FacilitiesManagement')),
  
  // Add your custom module components here as you create them
  // Example:
  // 'views/inventory/InventoryManagement': lazy(() => import('@/views/inventory/InventoryManagement')),
  // 'views/animals/AnimalManagement': lazy(() => import('@/views/animals/AnimalManagement')),
}

type ComponentKey = keyof typeof componentRegistry

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-success mx-auto mb-4"></div>
      <p className="text-muted">Loading module...</p>
    </div>
  </div>
)

const DynamicRoutes = () => {
  const { userModules, isLoading } = useRBAC()
  const [validModules, setValidModules] = useState<Array<{ path: string; component: ComponentKey }>>([])

  useEffect(() => {
    if (isLoading) return

    // Filter modules that have valid file paths
    const valid = userModules
      .filter(module => {
        // Check if module has file_path and it exists in registry
        return module.file_path && module.file_path in componentRegistry
      })
      .map(module => ({
        path: module.route_path.replace('/dashboard', ''), // Remove /dashboard prefix
        component: module.file_path as ComponentKey,
      }))

    setValidModules(valid)
  }, [userModules, isLoading])

  if (isLoading) {
    return null
  }

  return (
    <>
      {validModules.map(({ path, component }) => {
        const Component = componentRegistry[component]
        
        return (
          <Route
            key={path}
            path={path}
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Component />
              </Suspense>
            }
          />
        )
      })}
    </>
  )
}

export default DynamicRoutes
