"""Builds the HTML pages from pages/*.html bodies + one shared <head>.
Run:  python3 tools/build.py   (keeps head/CSP identical on every page)"""
import pathlib, re, hashlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
CSP = ("default-src 'self'; script-src 'self' https://www.googletagmanager.com; "
       "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; "
       "img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com; "
       "connect-src 'self' https://script.google.com https://script.googleusercontent.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; "
       "form-action 'none'; base-uri 'self'; object-src 'none'; frame-src 'none'")
HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="{csp}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0a0b0c">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="assets/hero-athlete-v2.jpg">
<meta property="og:type" content="website">
{robots}<link rel="icon" href="assets/logo.svg" type="image/svg+xml"><link rel="icon" href="assets/favicon-64.png" type="image/png" sizes="64x64">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@104..112,800..900&family=Manrope:wght@400..800&family=Permanent+Marker&display=swap">
<link rel="stylesheet" href="css/style.css">
<script src="js/theme.js"></script>
</head>
<body data-page="{page}">
<div id="nav"></div>
<main id="main">
"""
FOOT = """</main>
<div id="footer"></div>
<script src="js/config.js"></script>
<script src="js/analytics.js"></script>
{extra}<script src="js/main.js"></script>
</body>
</html>
"""
def ver(rel):
    return hashlib.sha1((ROOT / rel).read_bytes()).hexdigest()[:8]
def stamp(html):
    return re.sub(r'(href|src)="((?:css|js)/[\w.-]+\.(?:css|js))"', lambda m: f'{m.group(1)}="{m.group(2)}?v={ver(m.group(2))}"', html)
for src in sorted((ROOT / 'pages').glob('*.html')):
    text = src.read_text()
    meta = dict(re.findall(r'^<!--\s*(\w+):\s*(.*?)\s*-->$', text, re.M))
    body = re.sub(r'^<!--\s*\w+:.*?-->\n', '', text, flags=re.M)
    extra = ''.join(f'<script src="js/{s}"></script>\n' for s in meta.get('scripts', '').split() if s)
    robots = '<meta name="robots" content="noindex">\n' if meta.get('noindex') else ''
    out = HEAD.format(csp=CSP, title=meta['title'], desc=meta['desc'], page=meta['page'], robots=robots) + body + FOOT.format(extra=extra)
    (ROOT / src.name).write_text(stamp(out))
    print('built', src.name)
