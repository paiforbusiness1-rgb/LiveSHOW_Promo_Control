import { User, UserRole } from '../types';
import { notificationService } from './notificationService';

/**
 * USER SERVICE - Mock implementation
 * In production, this would use Firebase Auth or a backend API
 */

// Initial users
const INITIAL_USERS: User[] = [
  {
    id: 'user-001',
    username: 'admin',
    password: 'admin', // En producción, esto debería ser un hash
    role: UserRole.ADMIN,
    name: 'Administrador',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-002',
    username: 'staff',
    password: 'staff1', // En producción, esto debería ser un hash
    role: UserRole.STAFF,
    name: 'Staff Usuario',
    createdAt: new Date().toISOString()
  }
];

let userStore = [...INITIAL_USERS];

export const userService = {
  /**
   * Authenticate a user by username and password
   */
  login: async (username: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay

    const user = userStore.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
      return {
        success: false,
        message: 'Usuario no encontrado.'
      };
    }

    if (user.password !== password) {
      return {
        success: false,
        message: 'Contraseña incorrecta.'
      };
    }

    return {
      success: true,
      user: { ...user, password: '' } // Don't return password
    };
  },

  /**
   * Get all users (admin only)
   */
  getAllUsers: async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return userStore.map(u => ({ ...u, password: '' })); // Don't return passwords
  },

  /**
   * Create a new user (admin only)
   */
  createUser: async (username: string, password: string, name: string, role: UserRole): Promise<{ success: boolean; user?: User; message?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    // Check if username already exists
    if (userStore.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      notificationService.notify('error', 'Usuario Existente', `El usuario "${username}" ya existe.`);
      return {
        success: false,
        message: 'El nombre de usuario ya está en uso.'
      };
    }

    // Validate password
    if (password.length < 4) {
      notificationService.notify('error', 'Contraseña Inválida', 'La contraseña debe tener al menos 4 caracteres.');
      return {
        success: false,
        message: 'La contraseña debe tener al menos 4 caracteres.'
      };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: username.toLowerCase(),
      password: password, // En producción, hash esto
      role,
      name,
      createdAt: new Date().toISOString()
    };

    userStore.push(newUser);
    notificationService.notify('success', 'Usuario Creado', `Usuario "${name}" creado exitosamente.`);

    return {
      success: true,
      user: { ...newUser, password: '' }
    };
  },

  /**
   * Delete a user (admin only)
   */
  deleteUser: async (userId: string, currentUserId: string): Promise<{ success: boolean; message?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Prevent self-deletion
    if (userId === currentUserId) {
      notificationService.notify('error', 'Error', 'No puedes eliminar tu propio usuario.');
      return {
        success: false,
        message: 'No puedes eliminar tu propio usuario.'
      };
    }

    const index = userStore.findIndex(u => u.id === userId);
    if (index === -1) {
      return {
        success: false,
        message: 'Usuario no encontrado.'
      };
    }

    const deletedUser = userStore[index];
    userStore.splice(index, 1);
    notificationService.notify('success', 'Usuario Eliminado', `Usuario "${deletedUser.name}" eliminado.`);

    return {
      success: true
    };
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: string): Promise<User | null> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const user = userStore.find(u => u.id === userId);
    return user ? { ...user, password: '' } : null;
  }
};

