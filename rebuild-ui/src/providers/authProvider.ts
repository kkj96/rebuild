import type { AuthProvider } from '@refinedev/core';
import type { User } from '../types';

// Demo user data
const DEMO_USERS: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin',
    role: 'admin',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  },
  {
    id: '2',
    email: 'editor@example.com',
    name: 'Editor',
    role: 'editor',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=editor',
  },
];

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    // Demo login - In production, call API
    const user = DEMO_USERS.find((u) => u.email === email);

    if (user && password === 'password') {
      localStorage.setItem('auth_token', 'demo-token-' + user.id);
      localStorage.setItem('auth_user', JSON.stringify(user));

      return {
        success: true,
        redirectTo: '/',
      };
    }

    return {
      success: false,
      error: {
        name: 'LoginError',
        message: 'Invalid email or password.',
      },
    };
  },

  logout: async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');

    return {
      success: true,
      redirectTo: '/login',
    };
  },

  check: async () => {
    const token = localStorage.getItem('auth_token');

    if (token) {
      return { authenticated: true };
    }

    return {
      authenticated: false,
      redirectTo: '/login',
    };
  },

  getPermissions: async () => {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      const user: User = JSON.parse(userStr);
      return user.role;
    }
    return null;
  },

  getIdentity: async () => {
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      const user: User = JSON.parse(userStr);
      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        email: user.email,
        role: user.role,
      };
    }
    return null;
  },

  onError: async (error) => {
    if (error.status === 401 || error.status === 403) {
      return {
        logout: true,
        redirectTo: '/login',
      };
    }
    return { error };
  },
};
