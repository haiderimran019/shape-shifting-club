/* The Shape Shifting Club: site script.
   Security: visitor input is never inserted as HTML. It only goes into an encoded
   WhatsApp link or a JSON body for the order log. Cart contents are checked
   against PRODUCTS, so a tampered cart can't inject markup or change prices. */
(function () {
'use strict';

const CFG = window.SSC_CONFIG || {};
const WA = String(CFG.WHATSAPP || '').replace(/\D/g, '');
const INSTA = /^https:\/\/(www\.)?instagram\.com\//.test(CFG.INSTAGRAM || '') ? CFG.INSTAGRAM : 'https://www.instagram.com/';
const track = (n, p) => { try { window.sscTrack && window.sscTrack(n, p); } catch (e) {} };

/* ---------- Icons ---------- */
const sv = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const ICONS = {
  dumbbell: sv('<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/>'),
  apple: sv('<path d="M12 7c-1.5-1.2-4-1.4-5.6.2C4.5 9 5 13 6.5 16c1.2 2.4 2.8 4 4.2 3.6.6-.2 1-.5 1.3-.5s.7.3 1.3.5c1.4.4 3-1.2 4.2-3.6 1.5-3 2-7-.1-8.8C15.9 5.6 13.5 5.8 12 7Z"/><path d="M12 7c0-2 1-3.5 3-4"/>'),
  bundle: sv('<path d="M8 3h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M4 7v13a2 2 0 0 0 2 2h10"/><path d="M10 11h6M10 15h6"/>'),
  clock: sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  cart: sv('<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>'),
  check: sv('<path d="m5 12 5 5 9-10"/>', 'stroke-width="2.6"'),
  x: sv('<path d="M6 6l12 12M18 6 6 18"/>', 'stroke-width="2.4"'),
  plus: sv('<path d="M12 5v14M5 12h14"/>', 'stroke-width="2.4"'),
  arrowR: sv('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  copy: sv('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  lock: sv('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  home: sv('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  grid: sv('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'),
  trophy: sv('<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M16 5h3v2a3 3 0 0 1-3 3M8 5H5v2a3 3 0 0 0 3 3"/><path d="M12 13v4M8 21h8M9 17h6"/>'),
  calendar: sv('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  moon: sv('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>', 'class="moon"'),
  sun: sv('<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 'class="sun"'),
  insta: sv('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>'),
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1a8.2 8.2 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.8.4 3.5 3.5 0 0 0-1.1 2.6 6 6 0 0 0 1.3 3.2 13.8 13.8 0 0 0 5.3 4.7c2 .8 2.7.9 3.7.7a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.3ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8Zm0-21.6A11.8 11.8 0 0 0 1.8 17.9L.1 24l6.3-1.7A11.8 11.8 0 1 0 12 .2Z"/></svg>'
};

/* ---------- Catalog (same prices as the banner) ---------- */
const PRODUCTS = {
  workout:{id:'workout',name:'Workout Plan',wa:'🏋️ Workout Plan (PDF)',type:'PDF plan',icon:'dumbbell',price:1500,was:4000,
    sub:'A training plan built around your goal, schedule and equipment.',
    feats:['Fat loss or muscle gain focus','Strength and endurance','Home or gym options','Exercise demo links']},
  nutrition:{id:'nutrition',name:'Nutrition Plan',wa:'🥗 Nutrition Plan (PDF)',type:'PDF plan',icon:'apple',price:1500,was:4000,
    sub:'Desi friendly meals with calories and macros set for you.',
    feats:['Personalized meal plan','Calorie and macro targets','Pakistani food swaps','Easy to follow every day']},
  bundle:{id:'bundle',name:'Workout + Nutrition',wa:'📋 Workout + Nutrition Bundle (PDF)',type:'Best value',icon:'bundle',price:2400,was:8000,featured:true,
    sub:'Workout and nutrition plans designed to fit into the same routine.',
    feats:['Full workout plan','Full nutrition plan','Both synced to one goal','Priority WhatsApp replies']},
  consult:{id:'consult',name:'1 Hour Consultation',wa:'🧠 1 Hour Consultation',type:'1 hour, on WhatsApp',icon:'clock',price:1000,was:2000,
    sub:'One hour with Hasnain on chat, voice or video to plan your journey.',
    feats:['Goal and lifestyle review','Training history and form','Questions answered live','Clear plan recommendation']}
};
const fmt = n => Number(n).toLocaleString('en-PK');
const pkr = n => 'PKR ' + fmt(n);

const store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} },
  del(k){ try{ localStorage.removeItem(k); }catch(e){} }
};

/* ---------- Cart ---------- */
const Cart = {
  key:'ssc_cart',
  get(){
    let raw; try{ raw = JSON.parse(store.get(this.key)); }catch(e){ raw = null; }
    if(!Array.isArray(raw)) return [];
    return [...new Set(raw.filter(id => typeof id === 'string' && Object.prototype.hasOwnProperty.call(PRODUCTS, id)))];
  },
  set(items){ store.set(this.key, JSON.stringify(items)); updateCount(true); document.dispatchEvent(new Event('cart:change')); },
  clear(){ store.del(this.key); updateCount(false); },
  add(id){
    let items = this.get(), note = null;
    if(items.includes(id)) return {ok:false};
    if((id === 'workout' || id === 'nutrition') && items.includes('bundle')) return {ok:false, covered:true};
    if(id === 'bundle') items = items.filter(i => i !== 'workout' && i !== 'nutrition');
    if(id === 'workout' || id === 'nutrition'){
      const other = id === 'workout' ? 'nutrition' : 'workout';
      if(items.includes(other)){ items = items.filter(i => i !== other); id = 'bundle'; note = 'Switched to the bundle. You save PKR 600.'; }
    }
    items.push(id); this.set(items); return {ok:true, id, note};
  },
  remove(id){ this.set(this.get().filter(i => i !== id)); },
  totals(){
    const items = this.get().map(i => PRODUCTS[i]);
    const total = items.reduce((s,p) => s + p.price, 0), was = items.reduce((s,p) => s + p.was, 0);
    return {items,total,was,save:was-total};
  }
};

function updateCount(bump){
  const n = Cart.get().length;
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = n; el.classList.toggle('show', n > 0);
    if(bump){ el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
  });
  document.querySelectorAll('.cart-link').forEach(a => a.setAttribute('aria-label', `Cart, ${n} item${n===1?'':'s'}`));
}

function toast(text, linkText, href){
  let t = document.querySelector('.toast');
  if(!t){ t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role','status'); t.setAttribute('aria-live','polite'); document.body.appendChild(t); }
  t.textContent = '';
  const s = document.createElement('span'); s.textContent = text; t.appendChild(s);
  if(linkText){ const a = document.createElement('a'); a.href = href; a.textContent = linkText; t.appendChild(a); }
  t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3600);
}

function addToCart(id){
  const r = Cart.add(id);
  if(!r.ok){ toast(r.covered ? 'Already included in your bundle.' : 'Already in your cart.', 'View cart', 'cart.html'); return; }
  toast(r.note || `${PRODUCTS[r.id].name} added.`, 'Checkout', 'cart.html');
  track('add_to_cart', {item:r.id, value:PRODUCTS[r.id].price, currency:'PKR'});
  refreshButtons();
}

function refreshButtons(){
  const items = Cart.get();
  document.querySelectorAll('[data-add]').forEach(b => {
    const id = b.dataset.add;
    const inCart = items.includes(id) || (items.includes('bundle') && (id === 'workout' || id === 'nutrition'));
    b.classList.toggle('added', inCart);
    b.setAttribute('aria-pressed', inCart ? 'true' : 'false');
    const l = b.querySelector('.lbl'); if(l) l.textContent = inCart ? 'Added to cart' : (b.dataset.label || 'Add to cart');
    const ic = b.querySelector('.bi'); if(ic) ic.innerHTML = inCart ? ICONS.check : ICONS.cart;
  });
}

/* ---------- Plan cards (static catalog data only) ---------- */
function planCard(p, i){
  return `<article class="plan ${p.featured ? 'featured' : ''} reveal d${(i%3)+1}">
    ${p.featured ? '<span class="badge">Most popular</span>' : ''}
    <div class="ic">${ICONS[p.icon]}</div>
    <h3>${p.name}</h3>
    <p class="sub">${p.sub}</p>
    <div class="price"><span class="now"><small>PKR</small>${fmt(p.price)}</span><span class="was"><span class="sr-only">Was </span>PKR ${fmt(p.was)}</span></div>
    <div class="price-note">You save PKR ${fmt(p.was-p.price)}</div>
    <ul class="ticks">${p.feats.map(f => `<li>${ICONS.check}<span>${f}</span></li>`).join('')}</ul>
    <button type="button" class="btn ${p.featured ? 'btn-primary' : 'btn-secondary'} btn-block" data-add="${p.id}"><span class="bi">${ICONS.cart}</span><span class="lbl">Add to cart</span></button>
  </article>`;
}
function renderPlans(){
  document.querySelectorAll('[data-plans]').forEach(el => {
    el.innerHTML = el.dataset.plans.split(',').filter(id => PRODUCTS[id]).map((id,i) => planCard(PRODUCTS[id], i)).join('');
  });
}

/* ---------- Shared header / footer / phone tab bar ---------- */
function layout(){
  const page = document.body.dataset.page;
  const links = [['index.html','Home','home'],['programs.html','Plans','programs'],['results.html','Results','results'],['about.html','About','about'],['consultation.html','Consultation','consult']];
  const tabs = [['index.html','Home','home','home'],['programs.html','Plans','programs','grid'],['results.html','Results','results','trophy'],['consultation.html','Book','consult','calendar'],['cart.html','Cart','cart','cart']];
  const waLink = `https://wa.me/${WA}`;
  const nav = document.getElementById('nav');
  if(nav) nav.outerHTML = `<a class="skip" href="#main">Skip to content</a><header class="nav"><div class="wrap">
    <a href="index.html" class="logo" aria-label="The Shape Shifting Club home"><img src="assets/logo.svg" alt="" width="46" height="46"><span>Shape<b>Shifting</b> Club</span></a>
    <nav class="nav-links" aria-label="Main">${links.map(l => `<a href="${l[0]}"${page===l[2]?' aria-current="page"':''}>${l[1]}</a>`).join('')}</nav>
    <div class="nav-actions">
      <button type="button" class="icon-btn theme-toggle" aria-label="Switch between light and dark mode">${ICONS.moon}${ICONS.sun}</button>
      <a href="cart.html" class="icon-btn cart-link" aria-label="Cart">${ICONS.cart}<span class="cart-count" aria-hidden="true">0</span></a>
      <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="icon-btn wa-icon" aria-label="WhatsApp">${ICONS.wa}</a>
      <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm wa-nav">${ICONS.wa} WhatsApp</a>
    </div></div></header>
    <nav class="tabbar" aria-label="Quick navigation">${tabs.map(t => `<a href="${t[0]}"${page===t[2]?' aria-current="page"':''}${t[2]==='cart'?' class="cart-link"':''}>${ICONS[t[3]]}<span>${t[1]}</span>${t[2]==='cart'?'<span class="cart-count" aria-hidden="true">0</span>':''}</a>`).join('')}</nav>`;

  const foot = document.getElementById('footer');
  if(foot) foot.outerHTML = `<footer><div class="wrap">
    <div class="foot">
      <div><a href="index.html" class="logo"><img src="assets/logo.svg" alt="" width="64" height="64"><span>Shape<b>Shifting</b> Club</span></a>
        <p>Personalized fitness and nutrition for men and women across Pakistan. Better today, stronger tomorrow.</p>
        <div class="socials"><a href="${INSTA}" target="_blank" rel="noopener noreferrer" aria-label="Instagram">${ICONS.insta}</a><a href="${waLink}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">${ICONS.wa}</a></div></div>
      <div><h2>Pages</h2><ul>${links.map(l => `<li><a href="${l[0]}">${l[1]}</a></li>`).join('')}</ul></div>
      <div><h2>Plans</h2><ul><li><a href="programs.html">Workout Plan</a></li><li><a href="programs.html">Nutrition Plan</a></li><li><a href="programs.html">Workout + Nutrition Bundle</a></li><li><a href="consultation.html">1 Hour Consultation</a></li></ul></div>
      <div><h2>Contact</h2><ul><li><a href="${waLink}" target="_blank" rel="noopener noreferrer">+92 325 5251454</a></li><li><a href="${INSTA}" target="_blank" rel="noopener noreferrer">@theshapeshifting.club</a></li><li>Online coaching, all over Pakistan</li></ul></div>
    </div>
    <div class="copy"><span>© ${new Date().getFullYear()} The Shape Shifting Club</span><span>Real people. Real progress. Together.</span></div>
  </div></footer>
  <a class="wa-float" href="https://wa.me/${WA}?text=${encodeURIComponent('Hi Hasnain! 👋 I found you on your website and want to know more about your plans.')}" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">${ICONS.wa}</a>`;

  const tt = document.querySelector('.theme-toggle');
  if(tt) tt.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next); store.set('ssc_theme', next);
  });
}

/* ---------- Crossing marquee strips ---------- */
function marquees(){
  document.querySelectorAll('.strip-track').forEach(t => {
    const one = t.dataset.words.split('|').map(w => `<span class="strip-item">${w}<i>✦</i></span>`).join('');
    t.innerHTML = one.repeat(6);
  });
  document.querySelectorAll('.strips').forEach(s => s.setAttribute('aria-hidden','true'));
}

/* ---------- Cursor: gradient glow + dot + ring ---------- */
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
function cursor(){
  if(!fine || calm) return;
  const glow = document.createElement('div'), dot = document.createElement('div'), ring = document.createElement('div');
  glow.className = 'cursor-glow'; dot.className = 'cursor-dot'; ring.className = 'cursor-ring';
  document.body.append(glow, dot, ring);
  let mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my, gx = mx, gy = my;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; document.body.classList.add('cursor-on'); }, {passive:true});
  document.addEventListener('mouseleave', () => document.body.classList.remove('cursor-on'));
  (function loop(){
    rx += (mx - rx) * .22; ry += (my - ry) * .22; gx += (mx - gx) * .08; gy += (my - gy) * .08;
    dot.style.transform = `translate(${mx-3}px,${my-3}px)`;
    const w = ring.offsetWidth; ring.style.transform = `translate(${rx-w/2}px,${ry-w/2}px)`;
    glow.style.transform = `translate(${gx-310}px,${gy-310}px)`;
    requestAnimationFrame(loop);
  })();
  document.addEventListener('mouseover', e => ring.classList.toggle('hover', !!e.target.closest('a,button,.choice,label,.plan')));
}

/* ---------- Motion: reveals, split headings, counters, tilt, magnet, parallax ---------- */
function splitWords(){
  document.querySelectorAll('.split-words').forEach(el => {
    // static, trusted heading markup only
    el.innerHTML = el.innerHTML.split(/(<[^>]+>|\s+)/).map(part => (!part || /^\s+$/.test(part) || part.startsWith('<')) ? (part || '') : `<span class="w"><span>${part}</span></span>`).join('');
    el.querySelectorAll('.w>span').forEach((s,i) => s.style.transitionDelay = (i*0.05)+'s');
  });
}
function countUp(el){
  const end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1600;
  (function f(t){ const p = Math.min((t - t0)/dur, 1); el.textContent = Math.round(end * (1 - Math.pow(1-p, 4))) + suf; if(p < 1) requestAnimationFrame(f); })(t0);
}
function reveals(){
  const els = document.querySelectorAll('.reveal,.stagger,.split-words,[data-count]');
  if(!('IntersectionObserver' in window) || calm){ els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if(!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    if(e.target.dataset.count) countUp(e.target);
  }), {threshold:.12, rootMargin:'0px 0px -40px 0px'});
  els.forEach(el => io.observe(el));
}
function motion(){
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('ready')));
  if(calm) return;
  const hero = document.querySelector('.hero');
  if(hero){ document.body.classList.add('has-hero'); const tog = () => document.body.classList.toggle('past-hero', scrollY > hero.offsetHeight * .6); addEventListener('scroll', tog, {passive:true}); tog(); }
  const fig = document.querySelector('.hero-figure img');
  if(fig) addEventListener('scroll', () => { const y = Math.min(scrollY, 900); fig.style.transform = `translateY(${y*0.12}px) scale(${1 + y*0.00008})`; }, {passive:true});
  if(!fine) return;
  document.addEventListener('mousemove', e => {
    const c = e.target.closest && e.target.closest('.plan'); if(!c) return;
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left)/r.width, y = (e.clientY - r.top)/r.height;
    c.style.setProperty('--mx', x*100 + '%'); c.style.setProperty('--my', y*100 + '%');
    c.style.transform = `perspective(900px) rotateX(${(0.5-y)*5}deg) rotateY(${(x-0.5)*6}deg) translateY(-6px)`;
  });
  document.addEventListener('mouseout', e => { const c = e.target.closest && e.target.closest('.plan'); if(c && !c.contains(e.relatedTarget)) c.style.transform = ''; });
  document.querySelectorAll('.hero .btn-primary,.cta .btn').forEach(b => {
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX-r.left-r.width/2)*.18}px,${(e.clientY-r.top-r.height/2)*.28}px)`; });
    b.addEventListener('mouseleave', () => b.style.transform = '');
  });
}
/* Instant page loads: prefetch same-site pages on intent, plus the main pages when idle */
function prefetch(){
  const done = new Set([location.pathname.replace(/^\//, '') || 'index.html']);
  const go = href => {
    if(!href || done.has(href)) return; done.add(href);
    const l = document.createElement('link'); l.rel = 'prefetch'; l.href = href; document.head.appendChild(l);
  };
  const local = a => a && a.origin === location.origin && /\.html$/.test(a.pathname) ? a.pathname.replace(/^\//, '') : null;
  ['pointerover','touchstart','focusin'].forEach(ev => document.addEventListener(ev, e => go(local(e.target.closest && e.target.closest('a'))), {passive:true}));
  const idle = window.requestIdleCallback || (f => setTimeout(f, 1500));
  idle(() => ['programs.html','cart.html','consultation.html'].forEach(go));
}
/* swipe dots for horizontal card rows on phones */
function swipeDots(){
  document.querySelectorAll('.plans').forEach(row => {
    const n = row.children.length; if(n < 2) return;
    const dots = document.createElement('div'); dots.className = 'swipe-dots'; dots.setAttribute('aria-hidden','true');
    dots.innerHTML = '<i></i>'.repeat(n); row.after(dots);
    const upd = () => { const i = Math.round(row.scrollLeft / (row.children[0].offsetWidth + 14)); [...dots.children].forEach((d,k) => d.classList.toggle('on', k === Math.min(i, n-1))); };
    row.addEventListener('scroll', upd, {passive:true}); upd();
    const feat = [...row.children].findIndex(c => c.classList.contains('featured'));
    if(feat > 0 && matchMedia('(max-width:900px)').matches) requestAnimationFrame(() => { row.scrollLeft = feat * (row.children[0].offsetWidth + 14) - 0; upd(); });
  });
}

/* ---------- FAQ ---------- */
function faq(){
  document.querySelectorAll('.qa').forEach((qa,k) => {
    const b = qa.querySelector('button'), ans = qa.querySelector('.ans');
    b.insertAdjacentHTML('beforeend', `<span class="pm">${ICONS.plus}</span>`);
    ans.id = 'faq-' + k; b.setAttribute('aria-controls', ans.id); b.setAttribute('aria-expanded','false');
    b.addEventListener('click', () => { const open = qa.classList.toggle('open'); b.setAttribute('aria-expanded', open); ans.style.maxHeight = open ? ans.scrollHeight + 'px' : 0; });
  });
}

/* ---------- Results (real client photos from js/results.js) ---------- */
function results(){
  const root = document.getElementById('tx-root'); if(!root) return;
  const safePath = p => typeof p === 'string' && /^assets\/results\/[\w.-]+\.(jpe?g|png|webp)$/i.test(p);
  const list = (window.SSC_RESULTS || []).filter(r => r && safePath(r.before) && safePath(r.after) && r.name);
  if(!list.length){ root.hidden = true; return; }
  document.getElementById('tx-empty') && (document.getElementById('tx-empty').hidden = true);
  const track = root.querySelector('.tx-track');
  list.forEach(r => {
    const card = document.createElement('article'); card.className = 'tx';
    card.innerHTML = `<div class="pair"><figure><img loading="lazy" alt=""><figcaption>Before</figcaption></figure><figure><img loading="lazy" alt=""><figcaption>After</figcaption></figure><span class="pill"></span></div><h3></h3><p></p>`;
    const [a,b] = card.querySelectorAll('img');
    a.src = r.before; a.alt = `${r.name} before`; b.src = r.after; b.alt = `${r.name} after`;
    card.querySelector('.pill').textContent = r.tag || 'Real Results, No Crash Diets';
    card.querySelector('h3').textContent = r.name;
    card.querySelector('p').textContent = r.quote || '';
    track.appendChild(card);
  });
  const step = dir => track.scrollBy({left: dir * (track.firstElementChild.offsetWidth + 20), behavior:'smooth'});
  root.querySelector('.prev').onclick = () => step(-1);
  root.querySelector('.next').onclick = () => step(1);
}

/* =========================================================
   Lead capture: validation, logging, WhatsApp hand-off
   ========================================================= */
const clean = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001F\u007F<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
function normalizePhone(raw){
  const s = String(raw || '').trim(); let d = s.replace(/\D/g, '');
  if(/^03\d{9}$/.test(d)) return '92' + d.slice(1);
  if(/^3\d{9}$/.test(d)) return '92' + d;
  if(/^923\d{9}$/.test(d)) return d;
  if(/^00\d{9,15}$/.test(d)) d = d.slice(2);
  if((s.startsWith('+') || s.startsWith('00')) && /^\d{9,15}$/.test(d) && !d.startsWith('92')) return d;
  return null;
}
const prettyPhone = d => /^92\d{10}$/.test(d) ? `+92 ${d.slice(2,5)} ${d.slice(5)}` : '+' + d;
const validEmail = e => !e || /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i.test(e);
const GOALS = ['Weight Loss','Muscle Building','Strength & Endurance','Healthy Eating','General Fitness'];
const TRAIN = ['Gym','Home'];
const PAY = ['JazzCash','Easypaisa','Bank Transfer'];

function makeOrderId(prefix){
  const d = new Date(), ymd = String(d.getFullYear()).slice(2) + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', buf = new Uint8Array(5);
  crypto.getRandomValues(buf);
  return `${prefix}-${ymd}-${[...buf].map(b => chars[b % chars.length]).join('')}`;
}

function setError(form, name, msg){
  const el = form.querySelector(`[name="${name}"]`); if(!el) return;
  const field = el.closest('.field'); let m = field.querySelector('.msg');
  if(!m){ m = document.createElement('div'); m.className = 'msg'; m.id = 'err-' + name; m.setAttribute('role','alert'); field.appendChild(m); }
  m.textContent = msg || '';
  field.classList.toggle('err', !!msg);
  form.querySelectorAll(`[name="${name}"]`).forEach(i => { if(msg){ i.setAttribute('aria-invalid','true'); i.setAttribute('aria-describedby', m.id); } else i.removeAttribute('aria-invalid'); });
}
const val = (form, name) => { const el = form.querySelector(`[name="${name}"]:checked`) || form.querySelector(`[name="${name}"]:not([type=radio])`); return el ? el.value : ''; };

function readLead(form){
  return {
    name: clean(val(form,'name'), 60), phoneRaw: val(form,'phone'), email: clean(val(form,'email'), 120).toLowerCase(),
    city: clean(val(form,'city'), 40), train: val(form,'train'), goals: [...form.querySelectorAll('[name="goal"]:checked')].map(i => i.value).filter(g => GOALS.includes(g)), payment: val(form,'pay'),
    honeypot: val(form,'company')
  };
}
function validateLead(form, d){
  let ok = true;
  const req = (name, cond, msg) => { setError(form, name, cond ? '' : msg); if(!cond) ok = false; };
  req('name', d.name.length >= 2 && /\p{L}/u.test(d.name), 'Please enter your name.');
  d.phone = normalizePhone(d.phoneRaw);
  req('phone', !!d.phone, 'Enter a valid WhatsApp number, for example 03XX XXXXXXX.');
  req('train', TRAIN.includes(d.train), 'Please choose one.');
  req('goal', d.goals.length > 0, 'Pick at least one goal.');
  req('pay', PAY.includes(d.payment), 'Please choose how you will pay.');
  req('email', validEmail(d.email), "That email doesn't look right. You can also leave it empty.");
  return ok;
}
function focusFirstError(form){ const f = form.querySelector('[aria-invalid="true"]'); if(f){ f.focus({preventScroll:true}); f.closest('.field').scrollIntoView({behavior:'smooth', block:'center'}); } }

function throttled(){
  const last = +store.get('ssc_last_submit') || 0;
  if(Date.now() - last < 15000) return true;
  store.set('ssc_last_submit', String(Date.now())); return false;
}

/* Logs the lead to the Google Sheet (if configured). text/plain + no-cors avoids a preflight;
   keepalive lets it finish while WhatsApp opens. */
function logLead(payload){
  const url = CFG.ORDER_ENDPOINT;
  if(!url || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) return;
  try{
    fetch(url, {method:'POST', mode:'no-cors', keepalive:true, credentials:'omit', referrerPolicy:'no-referrer',
      headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(payload)}).catch(() => {});
  }catch(e){}
}
const waUrl = text => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
function openWhatsApp(url){ const w = window.open(url, '_blank', 'noopener,noreferrer'); if(!w) location.href = url; }

/* Message the customer sends to Hasnain (matches his welcome template) */
function orderMessage(kind, id, items, total, d, extra){
  const lines = [
    kind === 'consult' ? `Hi Hasnain! 👋 I'd like to book a consultation with The Shape Shifting Club. ⚡🔥` : `Hi Hasnain! 👋 I'd like to join The Shape Shifting Club. ⚡🔥`,
    '',
    `🧾 ${kind === 'consult' ? 'Booking' : 'Order'}: ${id}`,
    ...items.map(p => `${p.wa}: ${pkr(p.price)}`),
    `💰 Total: ${pkr(total)}`,
    '',
    `🔵 Name: ${d.name}`,
    `🔵 Contact Number: ${prettyPhone(d.phone)}`,
    `🔵 I train at: ${d.train === 'Gym' ? 'the gym 🏋️' : 'home 🏠'}`,
    `🔵 Main goals:`,
    ...d.goals.map(g => `   ✅ ${g}`)
  ];
  if(extra) lines.push(...extra);
  if(d.city) lines.push(`📍 City: ${d.city}`);
  if(d.email) lines.push(`✉️ Email: ${d.email}`);
  lines.push(`💳 Payment: ${d.payment}`, '', `I'll send my payment screenshot here. Let's get started! 💪`);
  return lines.join('\n');
}

function showDone(root, kind, orderId, url, total, payment){
  const P = CFG.PAYMENT || {};
  const paid = `Hi Hasnain! 👋 I've paid ${pkr(total)} for ${kind === 'consult' ? 'booking' : 'order'} ${orderId} by ${payment}. Here is my payment screenshot: 📩`;
  const row = (label, value, copy) => `<div class="pay-row"><span>${label}</span><b>${value}</b>${copy ? `<button type="button" class="copy-btn" data-copy="${copy}" aria-label="Copy ${label}">${ICONS.copy}<span>Copy</span></button>` : ''}</div>`;
  root.innerHTML = `<div class="card done"><div class="big-ic">${ICONS.check}</div>
    <h2>Almost there!</h2>
    <p>Thank you for taking the next step with The Shape Shifting Club! ⚡ Send the WhatsApp message that just opened, then complete your payment below to ${kind === 'consult' ? 'confirm your session' : 'receive your personalised plan'}.</p>
    <div class="oid"></div>
    <div class="pay-card">
      <h3>Payment details</h3>
      ${row('Account title', P.TITLE || '')}
      ${row('Wallet', P.WALLETS || '')}
      ${row('Account number', P.NUMBER || '', P.NUMBER)}
      ${row('IBAN', P.IBAN || '', P.IBAN)}
      ${row('Amount', pkr(total), String(total))}
      <p class="pay-note">📩 Once paid, send a screenshot of the receipt on WhatsApp. Hasnain will verify it and start setting up your ${kind === 'consult' ? 'session' : 'plan'}! 💪</p>
    </div>
    <div class="row" style="justify-content:center"><a class="btn btn-primary paid-wa" target="_blank" rel="noopener noreferrer">${ICONS.wa} I've paid, send screenshot</a><a class="btn btn-secondary wa-again" target="_blank" rel="noopener noreferrer">Open my order chat again</a></div></div>`;
  root.querySelector('.oid').textContent = orderId;
  root.querySelector('.wa-again').href = url;
  root.querySelector('.paid-wa').href = waUrl(paid);
  root.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const v = b.dataset.copy;
    try { await navigator.clipboard.writeText(v); }
    catch(e){ const ta = document.createElement('textarea'); ta.value = v; ta.setAttribute('readonly',''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); }catch(_){} ta.remove(); }
    const s = b.querySelector('span'); s.textContent = 'Copied'; b.classList.add('ok'); setTimeout(() => { s.textContent = 'Copy'; b.classList.remove('ok'); }, 1600);
  }));
  root.scrollIntoView({behavior:'smooth', block:'start'});
}

/* Shared form fields (static markup) */
const choiceGroup = (name, label, opts, multi, hint) => `<div class="field full" role="${multi ? 'group' : 'radiogroup'}" aria-label="${label}"><span class="lbl">${label}${hint ? ` <span class="hint">${hint}</span>` : ''}</span><div class="choices">${opts.map(o => `<label class="choice"><input type="${multi ? 'checkbox' : 'radio'}" name="${name}" value="${o[0]}"><span>${multi ? ICONS.check : ''}${o[1]}</span></label>`).join('')}</div></div>`;
const leadFields = () => `
  <div class="field"><label for="f-name">Your name</label><input class="input" id="f-name" name="name" autocomplete="name" maxlength="60" placeholder="Your full name" required></div>
  <div class="field"><label for="f-phone">WhatsApp number</label><input class="input" id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="Your WhatsApp number" required></div>
  ${choiceGroup('train','Where do you train?',[['Gym','🏋️ Gym'],['Home','🏠 Home']])}
  ${choiceGroup('goal','Your goals',GOALS.map(g => [g, g]),true,'(pick one or more)')}
  ${choiceGroup('pay','How will you pay?',[['JazzCash','JazzCash'],['Easypaisa','Easypaisa'],['Bank Transfer','Bank transfer']])}
  <div class="field"><label for="f-city">City <span class="opt">(optional)</span></label><input class="input" id="f-city" name="city" autocomplete="address-level2" maxlength="40" placeholder="Your city"></div>
  <div class="field"><label for="f-email">Email <span class="opt">(optional, for receipt)</span></label><input class="input" id="f-email" name="email" type="email" autocomplete="email" maxlength="120" placeholder="Your email"></div>
  <div class="hp" aria-hidden="true"><label>Company <input name="company" tabindex="-1" autocomplete="off"></label></div>`;

/* ---------- Cart page ---------- */
function cartPage(){
  const root = document.getElementById('cart-root'); if(!root) return;
  const render = () => {
    const {items,total,was,save} = Cart.totals();
    if(!items.length){
      root.innerHTML = `<div class="card empty"><div class="big-ic">${ICONS.cart}</div><h2>Your cart is empty</h2><p>Pick a plan to start your transformation.</p><a href="programs.html" class="btn btn-primary">See plans ${ICONS.arrowR}</a></div>`;
      return;
    }
    const ids = items.map(p => p.id);
    const has = id => ids.includes(id);
    const offer = (icon, tag, title, text, btn, up, primary) => `<div class="offer"><div class="ic">${ICONS[icon]}</div><div><span class="tagline">${tag}</span><b>${title}</b><small>${text}</small></div><button type="button" class="btn ${primary ? 'btn-primary' : 'btn-secondary'} btn-sm" data-up="${up}">${btn}</button></div>`;
    let offers = '';
    if(has('workout') && !has('bundle')) offers += offer('apple','Recommended','Add the Nutrition Plan for just PKR 900 more','Training without the right food is only half the work. Get both plans built around the same goal.','Upgrade · +PKR 900','bundle',true);
    else if(has('nutrition') && !has('bundle')) offers += offer('dumbbell','Recommended','Add the Workout Plan for just PKR 900 more','Pair your meals with a training plan made for you and see results faster.','Upgrade · +PKR 900','bundle',true);
    else if(!has('bundle')) offers += offer('bundle','Most popular','Add the full Workout + Nutrition bundle','Everything you need to transform, for PKR 2,400 instead of 8,000.','Add bundle','bundle',true);
    if(!has('consult')) offers += offer('clock','Half price today','Add a 1 hour call with Hasnain · PKR 1,000','Go through your plan together so you start right from day one. Usually PKR 2,000.','Add call','consult',false);
    if(!offers) offers = `<div class="complete">${ICONS.check}<span>You've got the complete package. Great choice!</span></div>`;
    const pct = Math.round(save / was * 100);
    const savebar = `<div class="savebar"><div class="track"><div class="fill" style="width:${pct}%"></div></div><small>You're saving <b>${pkr(save)}</b> (${pct}% off)</small></div>`;
    root.innerHTML = `<div class="cart-layout">
      <div><div class="cart-list">${items.map(p => `<div class="citem"><div class="ic">${ICONS[p.icon]}</div><div><h3>${p.name}</h3><small>${p.type}</small></div>
        <div class="cp"><s><span class="sr-only">Was </span>${pkr(p.was)}</s><b>${pkr(p.price)}</b></div><button type="button" class="rm" data-rm="${p.id}" aria-label="Remove ${p.name}">${ICONS.x}</button></div>`).join('')}</div>${offers}
        <div class="card" style="margin-top:14px"><div class="srow"><span>Original price</span><s>${pkr(was)}</s></div><div class="srow save"><span>You save</span><span>${pkr(save)}</span></div><div class="srow total"><span>Total</span><span>${pkr(total)}</span></div>${savebar}</div></div>
      <aside class="card summary" aria-labelledby="sumh"><h2 id="sumh">Your details</h2>
        <form id="checkout" class="form" novalidate>${leadFields()}
          <div class="field full"><button class="btn btn-primary btn-block">${ICONS.wa} Order on WhatsApp · ${pkr(total)}</button>
          <p class="note">This opens WhatsApp with your order ready to send. By ordering you agree to be contacted on WhatsApp.</p></div>
        </form>
        <div class="secure">${ICONS.lock}<span>Pay by JazzCash, Easypaisa or bank transfer on WhatsApp. We never ask for card details or passwords.</span></div>
      </aside></div>`;
    root.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => Cart.remove(b.dataset.rm));
    root.querySelectorAll('[data-up]').forEach(b => b.onclick = () => addToCart(b.dataset.up));
    const form = root.querySelector('#checkout');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const d = readLead(form);
      if(!validateLead(form, d)){ focusFirstError(form); return; }
      if(d.honeypot) return;
      if(throttled()){ toast('Please wait a few seconds and try again.'); return; }
      const {items, total} = Cart.totals(); if(!items.length) return;
      const orderId = makeOrderId('SSC');
      const url = waUrl(orderMessage('order', orderId, items, total, d));
      logLead({type:'order', orderId, items:items.map(p => p.id), name:d.name, phone:d.phone, email:d.email, city:d.city, train:d.train, goals:d.goals, payment:d.payment, company:d.honeypot});
      track('purchase', {transaction_id:orderId, value:total, currency:'PKR', items:items.map(p => p.id).join(',')});
      openWhatsApp(url);
      Cart.clear(); document.removeEventListener('cart:change', render);
      showDone(root, 'order', orderId, url, total, d.payment); refreshButtons();
    });
  };
  render(); document.addEventListener('cart:change', render);
  if(Cart.get().length) track('begin_checkout', {value:Cart.totals().total, currency:'PKR'});
}

/* ---------- Consultation booking ---------- */
function consultForm(){
  const host = document.getElementById('consult-root'); if(!host) return;
  const slots = ['10am to 11am','12pm to 1pm','3pm to 4pm','6pm to 7pm','8pm to 9pm','10pm to 11pm'];
  host.innerHTML = `<form id="consult-form" class="form" novalidate>${leadFields()}
    <div class="field"><label for="f-date">Preferred day</label><input class="input" id="f-date" name="date" type="date" required></div>
    <div class="field"><label for="f-slot">Time</label><select class="input" id="f-slot" name="slot" required><option value="">Choose a time</option>${slots.map(s => `<option>${s}</option>`).join('')}</select></div>
    <div class="field full"><label for="f-q">Anything Hasnain should know? <span class="opt">(optional)</span></label><textarea class="input" id="f-q" name="q" maxlength="500" placeholder="Injuries, schedule or food preferences"></textarea></div>
    <div class="field full"><button class="btn btn-primary btn-block">${ICONS.wa} Book on WhatsApp · PKR 1,000</button><p class="note">Pay on WhatsApp to confirm your slot.</p></div></form>`;
  const form = host.querySelector('form'), date = form.querySelector('[name=date]');
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const t = new Date(); t.setDate(t.getDate()+1); date.min = iso(t); const m = new Date(); m.setDate(m.getDate()+60); date.max = iso(m);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = readLead(form);
    let ok = validateLead(form, d);
    d.date = clean(val(form,'date'), 10); d.slot = val(form,'slot'); d.question = clean(val(form,'q'), 500);
    const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(d.date) && d.date >= date.min && d.date <= date.max;
    setError(form, 'date', dateOk ? '' : 'Pick a day from tomorrow onwards.'); ok = ok && dateOk;
    const slotOk = slots.includes(d.slot); setError(form, 'slot', slotOk ? '' : 'Please choose a time.'); ok = ok && slotOk;
    if(!ok){ focusFirstError(form); return; }
    if(d.honeypot) return;
    if(throttled()){ toast('Please wait a few seconds and try again.'); return; }
    const orderId = makeOrderId('SSC-C');
    const day = new Date(d.date + 'T12:00').toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long'});
    const extra = [`📅 Preferred time: ${day}, ${d.slot}`]; if(d.question) extra.push(`💬 Note: ${d.question}`);
    const url = waUrl(orderMessage('consult', orderId, [PRODUCTS.consult], 1000, d, extra));
    logLead({type:'consult', orderId, items:['consult'], name:d.name, phone:d.phone, email:d.email, city:d.city, train:d.train, goals:d.goals, payment:d.payment, date:d.date, slot:d.slot, question:d.question, company:d.honeypot});
    track('purchase', {transaction_id:orderId, value:1000, currency:'PKR', items:'consult'});
    openWhatsApp(url);
    showDone(host, 'consult', orderId, url, 1000, d.payment);
  });
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  layout(); renderPlans(); marquees(); results(); faq(); splitWords();
  document.addEventListener('click', e => { const b = e.target.closest('[data-add]'); if(b){ e.preventDefault(); addToCart(b.dataset.add); } });
  updateCount(false); refreshButtons();
  cartPage(); consultForm(); swipeDots(); reveals(); cursor(); motion(); prefetch();
});
window.addEventListener('pageshow', e => { if(e.persisted){ updateCount(false); refreshButtons(); } });
})();
