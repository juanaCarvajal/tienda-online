// Configuración para desarrollo (ng serve / ionic serve).
// IMPORTANTE: aquí NO se guardan claves secretas. Ninguna de las dos APIs requiere API key.
// Si en el futuro se usa una API con clave, debe ir en un backend propio,
// nunca dentro del código de la app (cualquiera puede descompilar el APK/AAB).
export const environment = {
  production: false,
  // API de autenticación (login, sesión, refresh token)
  apiUrl: 'https://dummyjson.com',
  // Minutos de vida del accessToken solicitado a la API.
  tokenExpiresInMins: 30,
  // API del catálogo de cartas Pokémon TCG (https://tcgdex.dev)
  catalogUrl: 'https://api.tcgdex.net/v2',
  catalogLang: 'es',
};
