/**
 * The Shape Shifting Club — order & booking log
 * ------------------------------------------------------------
 * Paste this into a Google Apps Script project (script.new). It writes to the
 * sheet in SHEET_ID below. Deploy as a Web App. Full steps: backend/SETUP.md
 *
 * What it does for every order / consultation booking from the website:
 *   1. Validates and cleans every field (never trusts the browser).
 *   2. Recalculates the price from its own price list.
 *   3. Adds a row to the "Orders" sheet (Status column starts as "New").
 *   4. Emails Hasnain a notification.
 *   5. Emails the customer a receipt, if they gave an email address.
 *
 * Abuse protection: honeypot field, per-phone and global rate limits,
 * length caps, spreadsheet-formula injection guard, plain-text emails only.
 */

// ====== SETTINGS — edit these ======
const NOTIFY_EMAIL = 'shapeshiftingclub@gmail.com';
const BUSINESS_NAME = 'The Shape Shifting Club';
const WHATSAPP_DISPLAY = '+92 325 5251454';
const SEND_CUSTOMER_EMAIL = true;
// The Google Sheet that stores orders (the long ID in its URL)
const SHEET_ID = '12evk0Kowfe558oeoN9Bv2Tc7hi2tBZF9Ml6lSYofv0Y';
// ===================================

const SHEET_NAME = 'Orders';
const HEADERS = ['Received (PK time)', 'Order #', 'Type', 'Status', 'Name', 'WhatsApp', 'Email', 'City',
  'Items', 'Total (PKR)', 'Payment', 'Goals', 'Trains at', 'Preferred day', 'Time', 'Note'];

// Prices live HERE, on the server. The website's numbers are never trusted.
const PRODUCTS = {
  workout:   { name: 'Workout Plan (PDF)',               price: 2500 },
  nutrition: { name: 'Nutrition Plan (PDF)',             price: 2500 },
  bundle:    { name: 'Workout + Nutrition Bundle (PDF)', price: 3500 },
  consult:   { name: '1 Hour Consultation',              price: 1000 }
};
const PAYMENTS = ['JazzCash', 'Easypaisa', 'Bank Transfer'];
const SLOTS = ['10am to 11am', '12pm to 1pm', '3pm to 4pm', '6pm to 7pm', '8pm to 9pm', '10pm to 11pm'];
const GOALS = ['Weight Loss', 'Muscle Building', 'Strength & Endurance', 'Healthy Eating', 'General Fitness'];
const TRAIN = ['Gym', 'Home'];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents || e.postData.contents.length > 10000) return reply_(false, 'bad request');
    let p;
    try { p = JSON.parse(e.postData.contents); } catch (err) { return reply_(false, 'bad json'); }
    if (!p || typeof p !== 'object') return reply_(false, 'bad request');

    if (p.company) return reply_(true, 'ok'); // honeypot filled → bot; pretend success

    const type = p.type === 'consult' ? 'consult' : 'order';
    const name = clean_(p.name, 60);
    const phone = String(p.phone || '').replace(/\D/g, '');
    const email = clean_(p.email, 120).toLowerCase();
    const city = clean_(p.city, 40);
    const payment = PAYMENTS.indexOf(p.payment) >= 0 ? p.payment : '';

    if (name.length < 2) return reply_(false, 'name');
    if (!/^\d{9,15}$/.test(phone)) return reply_(false, 'phone');
    if (email && !/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(email)) return reply_(false, 'email');
    if (!payment) return reply_(false, 'fields');

    // Items: only known product ids, no duplicates, max 4
    const seen = {};
    let ids = (Array.isArray(p.items) ? p.items : []).filter(function (id) {
      if (typeof id !== 'string' || !PRODUCTS.hasOwnProperty(id) || seen[id]) return false;
      seen[id] = true; return true;
    }).slice(0, 4);
    if (type === 'consult') ids = ['consult'];
    if (ids.indexOf('bundle') >= 0) ids = ids.filter(function (id) { return id !== 'workout' && id !== 'nutrition'; });
    if (!ids.length) return reply_(false, 'items');
    const total = ids.reduce(function (s, id) { return s + PRODUCTS[id].price; }, 0);
    const itemNames = ids.map(function (id) { return PRODUCTS[id].name + ' (' + PRODUCTS[id].price + ')'; }).join(', ');

    // Rate limits: 3 per phone per 10 min, 60 per hour overall
    const cache = CacheService.getScriptCache();
    const pk = 'p_' + phone, gk = 'g_' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHH');
    const pc = Number(cache.get(pk) || 0), gc = Number(cache.get(gk) || 0);
    if (pc >= 3 || gc >= 60) return reply_(false, 'rate');
    cache.put(pk, String(pc + 1), 600); cache.put(gk, String(gc + 1), 3600);

    const orderId = /^SSC(-C)?-\d{6}-[A-Z0-9]{5}$/.test(p.orderId) ? p.orderId
      : 'SSC-' + Utilities.formatDate(new Date(), 'Asia/Karachi', 'yyMMdd') + '-' + Utilities.getUuid().slice(0, 5).toUpperCase();

    const row = [
      Utilities.formatDate(new Date(), 'Asia/Karachi', 'yyyy-MM-dd HH:mm'), orderId,
      type === 'consult' ? 'Consultation' : 'Order', 'New', name, '+' + phone, email, city,
      itemNames, total, payment,
      (Array.isArray(p.goals) ? p.goals : []).filter(function (g) { return GOALS.indexOf(g) >= 0; }).slice(0, 5).join(', '), TRAIN.indexOf(p.train) >= 0 ? p.train : '',
      /^\d{4}-\d{2}-\d{2}$/.test(String(p.date || '')) ? p.date : '',
      SLOTS.indexOf(p.slot) >= 0 ? p.slot : '', clean_(p.question, 500)
    ].map(safeCell_);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try { sheet_().appendRow(row); } finally { lock.releaseLock(); }

    notifyOwner_(type, orderId, row);
    if (SEND_CUSTOMER_EMAIL && email) receiptToCustomer_(type, orderId, name, email, itemNames, total, payment);

    return reply_(true, orderId);
  } catch (err) {
    console.error(err);
    return reply_(false, 'server');
  }
}

function doGet() { return reply_(true, 'alive'); }

// ---------- helpers ----------
function clean_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
// Stops "=HYPERLINK(...)" style formula injection when the sheet is opened or exported
function safeCell_(v) {
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(v)) return "'" + v;
  return v;
}
function sheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#39ff14');
    const statusRule = SpreadsheetApp.newDataValidation().requireValueInList(['New', 'Paid', 'Delivered', 'Cancelled'], true).build();
    sh.getRange('D2:D').setDataValidation(statusRule);
  }
  return sh;
}
function notifyOwner_(type, orderId, row) {
  if (!NOTIFY_EMAIL || NOTIFY_EMAIL.indexOf('PUT_') === 0) return;
  const lines = HEADERS.map(function (h, i) { return row[i] ? h + ': ' + row[i] : null; }).filter(Boolean);
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: (type === 'consult' ? '🗓 New consultation booking ' : '🛒 New order ') + orderId + ' · PKR ' + row[9],
    body: lines.join('\n') + '\n\nThe customer was sent to WhatsApp with this order. Mark the Status column in the sheet when paid / delivered.'
  });
}
function receiptToCustomer_(type, orderId, name, email, items, total, payment) {
  MailApp.sendEmail({
    to: email,
    name: BUSINESS_NAME,
    subject: 'Welcome to ' + BUSINESS_NAME + '! ⚡ ' + (type === 'consult' ? 'Booking ' : 'Order ') + orderId,
    body: 'Welcome to ' + BUSINESS_NAME + ', ' + name + '! ⚡🔥\n\n' +
      "We're excited to help you start your transformation journey.\n\n" +
      '🧾 ' + (type === 'consult' ? 'Booking' : 'Order') + ': ' + orderId + '\n' +
      '📋 ' + items + '\n' +
      '💰 Total: PKR ' + total + '\n' +
      '💳 Payment: ' + payment + '\n\n' +
      'Next step: send your payment screenshot on WhatsApp (' + WHATSAPP_DISPLAY + '). ' +
      (type === 'consult' ? 'Hasnain will confirm your time.' : 'Your personalized plan arrives on WhatsApp within 24 hours of payment.') +
      "\n\nLet's get started today! 💪\n\nCoach Hasnain\n" + BUSINESS_NAME + '\n\n' +
      'We will never ask for your card number or passwords.'
  });
}
function reply_(ok, msg) {
  return ContentService.createTextOutput(JSON.stringify({ ok: ok, msg: msg })).setMimeType(ContentService.MimeType.JSON);
}

// One-time setup: gives Hasnain edit access to the orders sheet (run once from the editor)
function shareWithHasnain() {
  SpreadsheetApp.openById(SHEET_ID).addEditor(NOTIFY_EMAIL);
  return 'shared';
}
