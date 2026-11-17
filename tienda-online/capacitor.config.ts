import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ucompensar.tiendaonline',
  appName: 'Tienda Online',
  // Carpeta que genera `npm run build` (Angular 17+ usa /browser)
  webDir: 'dist/tienda-online/browser',
  server: {
    // La app se sirve como https://localhost dentro del WebView
    androidScheme: 'https',
  },
  android: {
    // No permitir contenido HTTP dentro de una página HTTPS
    allowMixedContent: false,
  },
};

export default config;
