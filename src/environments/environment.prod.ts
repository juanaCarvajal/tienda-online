// Configuración para producción (ng build --configuration production).
// Debe tener la MISMA configuración de Firebase que environment.ts.
export const environment = {
  production: true,
  firebase: {
    apiKey: 'PEGAR_AQUI',
    authDomain: 'PEGAR_AQUI.firebaseapp.com',
    projectId: 'PEGAR_AQUI',
    appId: 'PEGAR_AQUI',
  },
  apiUrl: '',
  catalogUrl: 'https://api.tcgdex.net/v2',
  catalogLang: 'es',
};
