export enum UserRole {
  ADMIN = 'admin',
  SUPPORT = 'support',
  COMMERCIAL = 'commercial',
  TEACHER = 'teacher',
  DESIGNER = 'designer',
  CS = 'cs'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
} 