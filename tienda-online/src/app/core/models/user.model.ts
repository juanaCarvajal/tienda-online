/** Datos que se envían al endpoint POST /auth/login. */
export interface LoginRequest {
  username: string;
  password: string;
}

/** Usuario autenticado devuelto por DummyJSON. */
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
}

/** Respuesta de POST /auth/login. */
export interface LoginResponse extends User {
  accessToken: string;
  refreshToken: string;
}

/** Respuesta de POST /auth/refresh. */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
