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
    apiKey: 'AIzaSyB8mCbWYOmvceM98B8Ddex9B2JYeTR_hhs',
    authDomain: 'tienda-online-160c6.firebaseapp.com',
    projectId: 'tienda-online-160c6',
    appId: '1:448220184942:web:a9fc8ac346667a46fc017f',
  },
  // Backend propio (no hay por ahora). Si se agrega, el interceptor le enviará el token de Firebase.
  apiUrl: '',
  // API del catálogo de cartas Pokémon TCG (https://tcgdex.dev)
  catalogUrl: 'https://api.tcgdex.net/v2',
  catalogLang: 'es',
};
