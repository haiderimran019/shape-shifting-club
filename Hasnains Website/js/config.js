/* SITE SETTINGS: the only file you need to edit. */
window.SSC_CONFIG = Object.freeze({
  // WhatsApp Business number: digits only, with country code
  WHATSAPP: '923255251454',
  INSTAGRAM: 'https://www.instagram.com/theshapeshifting.club/',

  // Google Sheet order log (see backend/SETUP.md). Empty = orders still go to WhatsApp, just not logged.
  ORDER_ENDPOINT: 'https://script.google.com/macros/s/AKfycbzLq82apWEDY9ShWggRlRIsjvgHX6ACjst93FgsrUiWW3E_eyPRIB8qEtP5VxVrYx4j/exec',

  // Where customers send payment (shown after checkout)
  PAYMENT: Object.freeze({
    TITLE: 'Muhammad Hasnain Asad',
    WALLETS: 'JazzCash / Easypaisa',
    NUMBER: '03126705626',
    IBAN: 'PK47JCMA0807923126705626'
  }),

  // Google Analytics 4 Measurement ID, e.g. 'G-ABC123XYZ'. Empty = off.
  // Vercel Web Analytics works without this (enable it in the Vercel dashboard).
  GA_ID: ''
});
