export interface User {
  id: string;
  email: string;
  full_name?: string;
  language?: string;
  created_at?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

export interface SignUpParams {
  email: string;
  password: string;
  full_name?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

