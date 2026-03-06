import { useContext } from "react";
import RBACContext from "@/contexts/RBACContext";
import type { ModulePermissions } from "@/contexts/RBACContext";

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error("useRBAC must be used within an RBACProvider");
  }
  return context;
};

// Custom hook for getting permissions for a specific module
export const useModulePermissions = (
  moduleIdOrPath: string,
): ModulePermissions => {
  const { getModulePermissions } = useRBAC();
  return getModulePermissions(moduleIdOrPath);
};
