self.addEventListener('install', e => {
  console.log('Service Worker: Installed');
});

self.addEventListener('activate', e => {
  console.log('Service Worker: Activated');
  // Elimina cachés antiguos
});

self.addEventListener('fetch', e => {
  console.log('Service Worker: Fetching');
  // Aquí puedes manejar las solicitudes de red
});