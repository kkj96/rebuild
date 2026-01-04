import type { AccessControlProvider } from "@refinedev/core";
import type { UserRole } from "../types";

// Role-based permission definitions
const rolePermissions: Record<UserRole, Record<string, string[]>> = {
  admin: {
    users: ["list", "show", "create", "edit", "delete"],
    products: ["list", "show", "create", "edit", "delete"],
    orders: ["list", "show", "create", "edit", "delete"],
    settings: ["list", "show", "edit"],
    builder: ["list", "show", "create", "edit", "delete"],
  },
  editor: {
    users: ["list", "show"],
    products: ["list", "show", "create", "edit"],
    orders: ["list", "show", "edit"],
    settings: ["list", "show"],
    builder: ["list", "show"],
  },
  viewer: {
    users: ["list", "show"],
    products: ["list", "show"],
    orders: ["list", "show"],
    settings: ["list"],
    builder: ["list"],
  },
};

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }) => {
    const userStr = localStorage.getItem("auth_user");

    if (!userStr) {
      return { can: false };
    }

    const user = JSON.parse(userStr);
    const role: UserRole = user.role;

    // Admin has all permissions
    if (role === "admin") {
      return { can: true };
    }

    // Check resource-specific permissions
    const resourcePermissions = rolePermissions[role]?.[resource ?? ""];

    if (!resourcePermissions) {
      return { can: false };
    }

    const hasPermission = resourcePermissions.includes(action ?? "");

    return {
      can: hasPermission,
      reason: hasPermission ? undefined : "You don't have permission to perform this action.",
    };
  },

  options: {
    buttons: {
      enableAccessControl: true,
      hideIfUnauthorized: false,
    },
  },
};
