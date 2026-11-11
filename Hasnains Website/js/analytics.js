/* Analytics: privacy-friendly, no cookies by default.
   1) Vercel Web Analytics: free; turn it on in the Vercel dashboard (Project > Analytics > Enable).
   2) Google Analytics 4: optional; set GA_ID in js/config.js. */
(function () {
  'use strict';
  var cfg = window.SSC_CONFIG || {};
  var onVercel = /\.vercel\.app$/.test(location.hostname) || cfg.FORCE_VERCEL_ANALYTICS;

  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  if (onVercel) {
    var v = document.createElement('script');
    v.defer = true; v.src = '/_vercel/insights/script.js';
    document.head.appendChild(v);
  }

  var id = String(cfg.GA_ID || '');
  if (/^G-[A-Z0-9]{4,12}$/.test(id)) {
    var g = document.createElement('script');
    g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true });
  }

  /* track('add_to_cart', {item:'bundle', value:2400}) */
  window.sscTrack = function (name, params) {
    try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) {}
    try { window.va('event', { name: name, data: params || {} }); } catch (e) {}
  };
})();
