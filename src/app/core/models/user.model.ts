/** Datos del formulario de inicio de sesión. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Datos del formulario de registro. */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/** Usuario autenticado (a partir del usuario de Firebase). */
export interface User {
  /** UID de Firebase */
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Foto de perfil (Google) o avatar generado */
  image: string;
  provider: 'password' | 'google.com' | string;
  emailVerified: boolean;
}
