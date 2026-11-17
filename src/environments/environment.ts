// Configuración para desarrollo (ng serve).
//
// FIREBASE: pega aquí la configuración de tu app web de Firebase
// (Consola de Firebase → Configuración del proyecto → Tus apps → SDK config).
// Estos valores NO son secretos: Firebase los diseñó para ir en el cliente.
// La protección está en Authentication → Settings → Authorized domains
// y en las reglas de seguridad de Firebase. Ver docs/SEGURIDAD.md.
export const environment = {
  production: false,
  firebase: {
    apiKey: 'PEGAR_AQUI',
    authDomain: 'PEGAR_AQUI.firebaseapp.com',
    projectId: 'PEGAR_AQUI',
    appId: 'PEGAR_AQUI',
  },
  // Backend propio (no hay por ahora). Si se agrega, el interceptor le enviará el token de Firebase.
  apiUrl: '',
  // API del catálogo de cartas Pokémon TCG (https://tcgdex.dev)
  catalogUrl: 'https://api.tcgdex.net/v2',
  catalogLang: 'es',
};
