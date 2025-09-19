import { apiRequest } from './queryClient';
import { type User } from '@shared/schema';

export interface AuthUser {
  _id: string;
  email: string;
  role: string;
  name: string;
  verified: boolean;
}

export async function login(email: string, password: string, role: string): Promise<AuthUser> {
  const response = await apiRequest('POST', '/api/login', { email, password, role });
  const data = await response.json();
  return data.user;
}

export async function register(userData: { name: string; email: string; password: string; role: string; specialty?: string }): Promise<void> {
  await apiRequest('POST', '/api/register', userData);
}

export async function logout(): Promise<void> {
  await apiRequest('POST', '/api/logout');
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const response = await apiRequest('GET', '/api/me');
    const data = await response.json();
    return data.user;
  } catch (error) {
    return null;
  }
}
