/**
 * Google Analytics (GA4) — carga centralizada.
 * Para cambiar el ID de medición, edita SOLO la línea de abajo.
 * Todas las páginas del sitio cargan este archivo, así que un solo cambio
 * aquí actualiza el sitio completo (antes había que editar 7 archivos).
 */
(function () {
  var GA_MEASUREMENT_ID = 'G-2E76ZJ5862';

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
})();
