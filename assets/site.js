/* ==========================================================
   Casa 2.0 — Shared site behavior
   - Nav scroll state
   - Mobile burger overlay + overlay-close
   - IntersectionObserver reveal (.visible)
   - Parallax hero, card tilt, magnetic buttons
   - Contact form validation
   - Edit-mode (Tweaks) protocol bridge
   ========================================================== */
(function(){
  'use strict';
  document.documentElement.classList.add('js');

  /* ---------- OGNI PAGINA NUOVA PARTE DALL'ALTO ----------
     Aprendo un'altra pagina (o ricaricando) il browser, o la cornice che ospita
     l'anteprima, poteva lasciarti a metà o in fondo. Si torna in cima, tranne
     quando il link punta a un'ancora (#sezione) o si usa "indietro". */
  (function(){
    const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (nav && nav.type === 'back_forward') return;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (location.hash) return;
    const top = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      try { document.documentElement.scrollIntoView({ block: 'start', behavior: 'instant' }); } catch (e) {}
    };
    top();
    /* al "load" (immagini e mappa arrivate) si torna su SOLO se la persona non ha ancora
       iniziato a scorrere: prima la riportava in cima mentre stava leggendo */
    let moved = false;
    const mark = () => { moved = true; };
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(ev => addEventListener(ev, mark, { once: true, passive: true }));
    window.addEventListener('load', () => { if (!moved && window.scrollY < 40) top(); }, { once: true });
  })();

  /* ---------- NAV SCROLL STATE ---------- */
  const nav = document.getElementById('nav');
  if(nav){
    const isSolid = nav.classList.contains('solid');
    const setNav = () => { if(!isSolid) nav.classList.toggle('scrolled', window.scrollY > 40); };
    setNav();
    window.addEventListener('scroll', setNav, {passive:true});
  }

  /* ---------- BURGER / MOBILE OVERLAY ---------- */
  const burger  = document.getElementById('burger');
  const overlay = document.getElementById('nav-overlay');
  if(burger && overlay){
    const closeOverlay = () => {
      burger.classList.remove('open');
      overlay.classList.remove('open');
      document.getElementById('nav')?.classList.remove('menu-open');
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };
    burger.addEventListener('click', ()=>{
      const open = !burger.classList.contains('open');
      burger.classList.toggle('open', open);
      overlay.classList.toggle('open', open);
      document.getElementById('nav')?.classList.toggle('menu-open', open);
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.getElementById('overlay-close')?.addEventListener('click', closeOverlay);
    overlay.querySelectorAll('a').forEach(a => a.addEventListener('click', closeOverlay));
    const here = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
    overlay.querySelectorAll('a:not(.btn)').forEach(a => { if ((a.getAttribute('href') || '').replace(/\.html$/, '') === (here || 'index')) a.setAttribute('aria-current', 'page'); });
  }

  /* ---------- REVEAL OBSERVER (base + direzionali + stagger + line) ---------- */
  const REVEAL_SEL = '.reveal, .reveal--left, .reveal--right, .reveal--up, .reveal--scale, .stagger, .line-reveal';
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll(REVEAL_SEL).forEach(el => io.observe(el));
  } else {
    document.querySelectorAll(REVEAL_SEL).forEach(el => el.classList.add('visible'));
  }

  /* ---------- PARALLAX HERO ---------- */
  const heroBg = document.querySelector('.hero__bg');
  if(heroBg){
    let ticking = false;
    window.addEventListener('scroll', ()=>{
      if(ticking) return;
      requestAnimationFrame(()=>{
        const y = window.scrollY;
        if(y < window.innerHeight * 1.2)
          heroBg.style.transform = `scale(1.06) translateY(${y * 0.22}px)`;
        ticking = false;
      });
      ticking = true;
    }, {passive:true});
  }

  /* ---------- MAGNETIC BUTTONS ---------- */
  document.querySelectorAll('.btn--lg').forEach(btn=>{
    btn.addEventListener('mousemove', e=>{
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width/2);
      const dy = e.clientY - (r.top  + r.height/2);
      btn.style.transform = `translateY(-2px) translate(${dx*0.12}px,${dy*0.12}px)`;
    });
    btn.addEventListener('mouseleave', ()=>{ btn.style.transform = ''; });
  });

  /* ---------- CARD TILT ---------- */
  document.querySelectorAll('.pillar').forEach(card=>{
    card.addEventListener('mousemove', e=>{
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x*4}deg) rotateX(${-y*3}deg) translateZ(4px)`;
    });
    card.addEventListener('mouseleave', ()=>{
      card.style.transform = '';
      card.style.transition = 'transform 500ms cubic-bezier(0.16,1,0.3,1)';
      setTimeout(()=>{ card.style.transition = ''; }, 500);
    });
  });

  /* ---------- INVIO RICHIESTE (contatti + valutazione) ----------
     1. POST a /api/lead → salvata nel database D1 + notifica all'agenzia
     2. solo se il server non è raggiungibile → email già compilata (la richiesta non si perde mai)
     Il messaggio di conferma compare SOLO quando la richiesta è davvero salvata. */
  const LEAD_EMAIL = 'info@casaduepuntozero.net';
  async function submitLead(payload){
    try{
      const res = await fetch('/api/lead', { method:'POST', headers:{ 'Content-Type':'application/json', Accept:'application/json' },
        body: JSON.stringify({ ...payload, pagina: location.pathname }) });
      const data = await res.json().catch(()=>({}));
      if(res.ok && data.ok) return { ok:true, id:data.id };
      if(res.status === 422 || res.status === 429) return { ok:false, error:data.error, field:data.field };
      return { ok:false, offline:true };
    }catch(e){ return { ok:false, offline:true }; }
  }
  function mailtoFallback(subject, lines){
    const body = encodeURIComponent(lines.filter(Boolean).join('\n'));
    window.location.href = `mailto:${LEAD_EMAIL}?subject=${encodeURIComponent(subject)}&body=${body}`;
  }
  window.Casa20 = window.Casa20 || {};
  window.Casa20.submitLead = submitLead;
  window.Casa20.mailtoFallback = mailtoFallback;

  const form    = document.getElementById('contact-form');
  const fstatus = document.getElementById('form-status');
  if(form && fstatus){
    const readFields = () => {
      const f = new FormData(form);
      return {
        nome:    (f.get('nome')    || '').trim(),
        cognome: (f.get('cognome') || '').trim(),
        email:   (f.get('email')   || '').trim(),
        tel:     (f.get('telefono')|| '').trim(),
        msg:     (f.get('messaggio')|| '').trim(),
        news:    !!f.get('newsletter'),
        privacy: !!f.get('privacy'),
        website: (f.get('website') || '')
      };
    };
    const say = (msg, type) => { fstatus.className = 'form-status' + (type ? ' ' + type : ''); fstatus.textContent = msg; };
    const mark = (name) => { const el = form.elements[name]; if(el){ el.setAttribute('aria-invalid','true'); el.focus(); } };
    form.addEventListener('input', e => e.target.removeAttribute('aria-invalid'));
    const validate = (d) => {
      say('');
      if(!d.nome){ say('Inserisci il nome.', 'error'); mark('nome'); return false; }
      if(!d.cognome){ say('Inserisci il cognome.', 'error'); mark('cognome'); return false; }
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)){ say('Inserisci un’email valida.', 'error'); mark('email'); return false; }
      if(!d.privacy){ say('Per inviare serve il consenso alla privacy.', 'error'); mark('privacy'); return false; }
      return true;
    };

    form.addEventListener('submit', async e=>{
      e.preventDefault();
      const d = readFields();
      if(!validate(d)) return;
      const btn = form.querySelector('[type="submit"]');
      const label = btn ? btn.innerHTML : '';
      if(btn){ btn.disabled = true; btn.textContent = 'Invio in corso…'; }
      const r = await submitLead({ form:'contatti', nome:d.nome, cognome:d.cognome, email:d.email, telefono:d.tel,
        messaggio:d.msg, newsletter:d.news, privacy:d.privacy, website:d.website });
      if(btn){ btn.disabled = false; btn.innerHTML = label; }
      if(r.ok){
        say('Richiesta ricevuta. Ti ricontattiamo entro 24 ore.', 'success');
        form.reset();
        form.classList.add('is-sent');
      } else if(r.offline){
        mailtoFallback('Richiesta dal sito — ' + d.nome + ' ' + d.cognome,
          [`Nome: ${d.nome} ${d.cognome}`, `Email: ${d.email}`, `Telefono: ${d.tel || '—'}`, `Newsletter: ${d.news ? 'Sì' : 'No'}`, '', 'Messaggio:', d.msg || '—']);
        say('Il nostro server non risponde: si è aperta la tua email con il messaggio già pronto, premi “Invia”. Oppure chiamaci al 338 844 9030.', 'error');
      } else {
        say(r.error || 'Controlla i dati inseriti.', 'error');
        if(r.field) mark(r.field);
      }
    });

    // WhatsApp quick-send: porta i dati del form direttamente in chat
    const wa = document.getElementById('form-whatsapp');
    if(wa){
      wa.addEventListener('click', (e)=>{
        const d = readFields();
        const text = encodeURIComponent(`Ciao Casa 2.0! Sono ${d.nome||''} ${d.cognome||''}.\n${d.msg ? d.msg : 'Vorrei informazioni.'}\n(email: ${d.email||'—'}, tel: ${d.tel||'—'})`);
        wa.href = `https://wa.me/393388449030?text=${text}`;
      });
    }
  }

  /* ---------- TWEAKS / EDIT-MODE PROTOCOL ---------- */
  const tweaks = document.getElementById('tweaks');
  if(tweaks){
    window.addEventListener('message', (ev)=>{
      const t = ev.data && ev.data.type;
      if(t === '__activate_edit_mode')   tweaks.classList.add('open');
      if(t === '__deactivate_edit_mode') tweaks.classList.remove('open');
    });
    const closer = document.getElementById('tweaks-close');
    if(closer) closer.addEventListener('click', ()=>{
      tweaks.classList.remove('open');
      try{ window.parent.postMessage({type:'__edit_mode_dismissed'}, '*'); }catch(e){}
    });
    try{ window.parent.postMessage({type:'__edit_mode_available'}, '*'); }catch(e){}
  }

  /* ---------- SCROLL PROGRESS BAR ---------- */
  (function(){
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    let tick=false;
    const upd = ()=>{
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max>0 ? h.scrollTop/max : 0;
      bar.style.transform = `scaleX(${p})`;
      tick=false;
    };
    window.addEventListener('scroll', ()=>{ if(!tick){ tick=true; requestAnimationFrame(upd); } }, {passive:true});
    upd();
  })();

  /* ---------- CLICK RIPPLE su pulsanti e card ---------- */
  (function(){
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce) return;
    // SKIP ripple sugli <a> di navigazione/CTA — il primo click deve arrivare al link senza interferenze
    document.addEventListener('pointerdown', e=>{
      const t = e.target.closest('.pcard, .vmember, .lf-btn');  // NO .btn / NO .immo__cta / NO .boss__btn (sono <a>)
      if(!t) return;
      const r = t.getBoundingClientRect();
      const span = document.createElement('span');
      span.className = 'ripple';
      const size = Math.max(r.width, r.height)*1.1;
      span.style.width = span.style.height = size+'px';
      span.style.left = (e.clientX - r.left)+'px';
      span.style.top  = (e.clientY - r.top)+'px';
      const pos = getComputedStyle(t).position;
      if(pos === 'static') t.style.position = 'relative';
      t.style.overflow = 'hidden';
      t.appendChild(span);
      setTimeout(()=>span.remove(), 650);
    }, {passive:true});
  })();

  /* ---------- FLOATING CTA DUAL — SEMPRE VISIBILE su tutte le pagine
     eccetto valuta + contattaci (dove l'utente è già in conversione) */
  (function(){
    const path = location.pathname;
    if(/\/(valuta|contattaci|admin)(\.html)?\/?$/i.test(path)) return;   /* Cloudflare serve anche /valuta senza .html */
    if(document.querySelector('.fab')) return; // idempotente
    const fab = document.createElement('div');
    fab.className = 'fab is-expanded';
    const waMsg = encodeURIComponent('Ciao Casa 2.0, vorrei più informazioni.');
    fab.innerHTML = `
      <a class="fab--primary" href="valuta.html" aria-label="Valutazione gratuita">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12 L12 4 L21 12 M5 10 L5 20 L19 20 L19 10"/></svg>
        Valutazione gratuita
      </a>
      <a class="fab--wa" href="https://wa.me/393388449030?text=${waMsg}" target="_blank" rel="noopener" aria-label="Scrivici su WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.06c-.24.68-1.42 1.31-1.96 1.36-.5.05-.96.23-3.23-.67-2.72-1.07-4.45-3.84-4.58-4.02-.13-.18-1.1-1.46-1.1-2.79s.7-1.98.94-2.25c.24-.27.53-.34.7-.34h.5c.16.01.38-.06.59.45.24.58.81 2 .88 2.15.07.14.12.31.02.49-.09.18-.14.29-.27.45-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.6.75 1.87.89.27.14.45.2.52.31.07.12.07.66-.17 1.34z"/></svg>
        WhatsApp
      </a>`;
    document.body.appendChild(fab);
    const hero = document.querySelector('.hero, .page-header, .valuta-hero');
    const limit = () => hero ? Math.max(hero.offsetHeight * 0.6, 240) : 240;
    let lim = limit();
    const upd = () => fab.classList.toggle('is-visible', window.scrollY > lim);
    window.addEventListener('scroll', upd, {passive:true});
    window.addEventListener('resize', () => { lim = limit(); upd(); });
    upd();
  })();

  /* ---------- EXIT-INTENT MODAL ----------
     Nessun timer: compare SOLO quando l'utente sta lasciando il sito, cioè quando il
     puntatore esce dalla finestra dal bordo alto (verso schede / barra indirizzi / chiudi)
     con un movimento deciso. Uno spostamento lento verso il menu non lo attiva.
     - solo desktop (su telefono non esiste un "gesto di uscita" affidabile)
     - al massimo una volta ogni 14 giorni
     - mai su valuta/contattaci, mai se l'utente ha già cliccato un contatto o la valutazione */
  (function(){
    const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if(!fine) return;
    if(/\/(valuta|contattaci|privacy|cookie|admin)(\.html)?\/?$/i.test(location.pathname)) return;
    let last = 0; try{ last = Number(localStorage.getItem('casa2_exit_at') || 0); }catch(e){}
    if(Date.now() - last < 14*24*3600*1000) return;
    let shown = false, engaged = false, lastY = null, lastT = 0, upSpeed = 0;
    document.addEventListener('click', e=>{
      if(e.target.closest('a[href^="tel:"], a[href*="wa.me"], a[href*="valuta.html"], a[href*="contattaci.html"], a[href^="mailto:"]')) engaged = true;
    });
    document.addEventListener('mousemove', e=>{
      const now = performance.now();
      if(lastY !== null){ upSpeed = (lastY - e.clientY) / Math.max(now - lastT, 1); }
      lastY = e.clientY; lastT = now;
    }, {passive:true});
    function build(){
      const m = document.createElement('div'); m.id='exit-modal';
      m.innerHTML = `
        <div class="em-card" role="dialog" aria-modal="true" aria-labelledby="em-title" tabindex="-1">
          <button type="button" class="em-close" aria-label="Chiudi">&times;</button>
          <p class="em-eyebrow">Prima di andare</p>
          <h3 id="em-title">Sai quanto vale<br/>la tua casa?</h3>
          <p>Lasciaci l’indirizzo: ti ricontattiamo entro 24 ore e ti diamo una stima basata sui dati reali del mercato di Tivoli. Gratuita e senza impegno.</p>
          <div class="em-cta">
            <a class="btn btn--lg" href="valuta.html">Richiedi la valutazione gratuita</a>
            <a class="btn btn--whatsapp" href="https://wa.me/393388449030" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm5.8 14.06c-.24.68-1.42 1.31-1.96 1.36-.5.05-.96.23-3.23-.67-2.72-1.07-4.45-3.84-4.58-4.02-.13-.18-1.1-1.46-1.1-2.79s.7-1.98.94-2.25c.24-.27.53-.34.7-.34h.5c.16.01.38-.06.59.45.24.58.81 2 .88 2.15.07.14.12.31.02.49-.09.18-.14.29-.27.45-.14.16-.29.36-.41.48-.14.14-.28.29-.12.56.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.6.75 1.87.89.27.14.45.2.52.31.07.12.07.66-.17 1.34z"/></svg>Scrivici su WhatsApp</a>
          </div>
        </div>`;
      document.body.appendChild(m);
      const prev = document.activeElement;
      requestAnimationFrame(()=>{ m.classList.add('is-visible'); m.querySelector('.em-card').focus({preventScroll:true}); });
      const onKey = e=>{ if(e.key==='Escape') dismiss(); };
      const dismiss = ()=>{ m.classList.remove('is-visible'); document.removeEventListener('keydown', onKey); setTimeout(()=> m.remove(), 500); if(prev && prev.focus) prev.focus(); };
      m.querySelector('.em-close').addEventListener('click', dismiss);
      m.addEventListener('click', e=>{ if(e.target === m) dismiss(); });
      document.addEventListener('keydown', onKey);
    }
    document.addEventListener('mouseout', e=>{
      if(shown || engaged) return;
      if(e.relatedTarget || e.toElement) return;       /* si sta solo spostando tra elementi della pagina */
      if(e.clientY > 6) return;                         /* uscita laterale o dal basso: non è un'uscita dal sito */
      if(upSpeed < 0.5) return;                         /* movimento lento verso il menu: ignorato */
      if(document.getElementById('cookie-banner')) return;
      shown = true;
      try{ localStorage.setItem('casa2_exit_at', String(Date.now())); }catch(e){}
      build();
    });
  })();

  /* ---------- COOKIE BANNER GDPR ----------
     Mostra il banner solo se non c'è ancora consenso registrato.
     Eventi: window.__casa2_loadAnalytics() viene chiamato solo dopo accept. */
  (function(){
    if(localStorage.getItem('casa2_cookie') ) return;
    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = `
      <p>Usiamo cookie tecnici essenziali per il funzionamento del sito e, con il tuo consenso, cookie di analisi anonimi per migliorare l'esperienza. Nessun dato di profilazione. <a href="cookie.html">Cookie Policy</a> · <a href="privacy.html">Privacy</a>.</p>
      <div class="cb-actions">
        <button type="button" data-cb="decline">Solo essenziali</button>
        <button type="button" class="is-primary" data-cb="accept">Accetta tutti</button>
      </div>`;
    document.body.appendChild(banner);
    document.body.classList.add('cookie-active');
    requestAnimationFrame(()=> banner.classList.add('is-visible'));
    const finish = (val)=>{
      localStorage.setItem('casa2_cookie', val);
      localStorage.setItem('casa2_cookie_at', new Date().toISOString());
      banner.classList.remove('is-visible');
      document.body.classList.remove('cookie-active');
      setTimeout(()=> banner.remove(), 600);
      if(val === 'accept' && typeof window.__casa2_loadAnalytics === 'function'){
        window.__casa2_loadAnalytics();
      }
    };
    banner.querySelector('[data-cb="accept"]').addEventListener('click', ()=> finish('accept'));
    banner.querySelector('[data-cb="decline"]').addEventListener('click', ()=> finish('decline'));
  })();

  /* ---------- NUMBER TICKER (conteggio su scroll) — adattato da MagicUI ---------- */
  (function(){
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nums = document.querySelectorAll('.trust__num em');
    if(!nums.length) return;
    const ease = t => 1 - Math.pow(1 - t, 3);
    const run = (el)=>{
      const target = parseInt(el.dataset.target ?? el.textContent, 10);
      if(isNaN(target)) return;
      if(reduce){ el.textContent = target; return; }
      const dur = 1500; const t0 = performance.now();
      const tick = (now)=>{
        const p = Math.min((now - t0)/dur, 1);
        el.textContent = Math.round(ease(p) * target);
        if(p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if('IntersectionObserver' in window){
      const io = new IntersectionObserver((es)=>{
        es.forEach(e=>{ if(e.isIntersecting){ run(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.6 });
      nums.forEach(n=>{ n.dataset.target = parseInt(n.textContent,10); n.textContent='0'; io.observe(n); });
    }
  })();

  /* ---------- ANNO CORRENTE NEL FOOTER ---------- */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* La copia verso Make/n8n ora la fa il server (/api/lead, variabile LEAD_WEBHOOK_URL): nessun URL esposto nel browser. */
  window.Casa20.persistTweak = function(edits){
    try{ window.parent.postMessage({type:'__edit_mode_set_keys', edits}, '*'); }catch(e){}
  };

  /* ---------- ANALYTICS GATED (carica solo dopo consenso esplicito) ----------
     Quando hai i ti tuoi ID, rimpiazza ANALYTICS_ID / CLARITY_ID.
     I cookie banner accept → richiama questa funzione automaticamente. */
  window.__casa2_loadAnalytics = function(){
    const GA4_ID = '';         // es: 'G-XXXXXXXXXX'  -- mettilo dopo
    const CLARITY_ID = '';     // es: 'abcdef1234'    -- mettilo dopo
    if(GA4_ID){
      const s1 = document.createElement('script'); s1.async=true; s1.src='https://www.googletagmanager.com/gtag/js?id='+GA4_ID;
      document.head.appendChild(s1);
      window.dataLayer = window.dataLayer || [];
      function gtag(){ dataLayer.push(arguments); }
      window.gtag = gtag;
      gtag('js', new Date()); gtag('config', GA4_ID, { anonymize_ip:true });
    }
    if(CLARITY_ID){
      (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, 'clarity', 'script', CLARITY_ID);
    }
  };
  // Se già acconsentito in sessione precedente, carica subito
  if(localStorage.getItem('casa2_cookie') === 'accept'){
    requestAnimationFrame(()=> window.__casa2_loadAnalytics && window.__casa2_loadAnalytics());
  }
})();
