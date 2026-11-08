# Shape Shifting Club

The Shape Shifting Club website is a static site for fitness and nutrition coaching. It provides information about the coaching plans, results, and consultations, with ordering and customer enquiries handled through WhatsApp.

- **Live website:** [shapeshiftingclub.vercel.app](https://shapeshiftingclub.vercel.app/)
- **Hosting:** Vercel
- **Technology:** HTML, CSS, JavaScript, and Python 3 (for generating pages)

## Pages

- Home
- Programs
- Results
- About
- Consultation
- Cart

## Run locally

From the repository root, start a local web server:

```sh
cd "Hasnains Website"
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Update the website

Page content is maintained in `Hasnains Website/pages/`. After editing a page, regenerate the published HTML files:

```sh
cd "Hasnains Website"
python3 tools/build.py
```

The build script uses Python's standard library; no package installation is needed to generate the pages. Commit the updated source and generated HTML files, then push to `main` to deploy through Vercel.

Site-wide contact and order settings are in `Hasnains Website/js/config.js`. Order logging and the Google Apps Script setup are documented in [`Hasnains Website/backend/SETUP.md`](Hasnains%20Website/backend/SETUP.md).

## Repository layout

```text
README.md                   Project overview and local setup
vercel.json                 Routes site requests to the website directory
Hasnains Website/
  pages/                    Source content for each page
  tools/build.py            Generates the published HTML pages
  *.html                    Generated pages served by Vercel
  css/                      Styles
  js/                       Site behavior and configuration
  assets/                   Images and icons
  backend/                  Order integration and setup notes
```
