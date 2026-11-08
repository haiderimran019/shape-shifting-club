# Order log: what's set up

Every order or consultation booking on the website is logged automatically.

- **Google Sheet:** "Shape Shifting Club Orders", owned by thehaiderimran19@gmail.com,
  shared as editor with shapeshiftingclub@gmail.com
  https://docs.google.com/spreadsheets/d/12evk0Kowfe558oeoN9Bv2Tc7hi2tBZF9Ml6lSYofv0Y/edit
  Orders land in the **Orders** tab. Use the Status column: New → Paid → Delivered / Cancelled.
- **Script:** Apps Script project (standalone) running as thehaiderimran19@gmail.com
  https://script.google.com/u/0/home/projects/1WRF3YfZtoQpnvList5qMuZUUUe8Uq405wwbh9_hfDMadq6MNZVpZYKAV/edit
  Code copy: `backend/google-apps-script.gs`
- **Web app URL** (already in `js/config.js` → ORDER_ENDPOINT):
  https://script.google.com/macros/s/AKfycbzLq82apWEDY9ShWggRlRIsjvgHX6ACjst93FgsrUiWW3E_eyPRIB8qEtP5VxVrYx4j/exec
- **Emails:** each order emails shapeshiftingclub@gmail.com, and the customer gets a welcome/receipt if they gave an email.

## Changing the script later
Edit it in the Apps Script project, then **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**.
The URL stays the same, so the website needs no change.

## If prices change
Change them in both `js/main.js` (PRODUCTS) and the script (PRODUCTS), then redeploy both.

## Protection built in
Prices recalculated server-side, all fields length-limited and cleaned, spreadsheet-formula injection blocked,
honeypot for bots, max 3 orders per phone per 10 minutes and 60 per hour overall, plain-text emails only.
