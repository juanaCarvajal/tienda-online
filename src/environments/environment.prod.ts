// Configuración para producción (ng build --configuration production).
// Debe tener la MISMA configuración de Firebase que environment.ts.
export const environment = {
  production: true,
  firebase: {
    apiKey: 'AIzaSyB8mCbWYOmvceM98B8Ddex9B2JYeTR_hhs',
    authDomain: 'tienda-online-160c6.firebaseapp.com',
    projectId: 'tienda-online-160c6',
    appId: '1:448220184942:web:a9fc8ac346667a46fc017f',
  },
  apiUrl: '',
  catalogUrl: 'https://api.tcgdex.net/v2',
  catalogLang: 'es',
};
