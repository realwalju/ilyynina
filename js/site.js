/* Rendering, shared by every page. Everything it shows comes from
   window.SITE in config.js; each block only runs if its element exists. */
(function () {
  'use strict';
  const S = window.SITE;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const on = (sel, fn) => { const el = $(sel); if (el) fn(el); };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const allEmotes = S.emotes.concat(S.emotesExtra || []);
  const emoteById = Object.fromEntries(allEmotes);
  const emoteUrl = (name, format = 'default') =>
    'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_' + emoteById[name] + '/' + format + '/dark/3.0';
  // Twitch embeds refuse to load unless told which host they are framed on.
  const parent = () => location.hostname || 'localhost';
  const TWITCH = 'https://www.twitch.tv/' + S.twitchHandle;
  const PLAY = '<span class="clip-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg></span>';

  function copy(text, done) {
    if (!navigator.clipboard) return done(false);
    navigator.clipboard.writeText(text).then(() => done(true), () => done(false));
  }

  /* --- Header + footer: one copy here instead of one per page. ------------ */
  const PAGES = [['home', 'index.html', 'Home'], ['watch', 'watch.html', 'Watch'], ['play', 'play.html', 'Play'], ['emotes', 'emotes.html', 'Emotes'],
                 ['setup', 'setup.html', 'Setup'], ['about', 'about.html', 'About'], ['links', 'links/', 'Links']];
  const here = document.body.dataset.page;
  on('[data-header]', (el) => {
    el.innerHTML =
      '<div class="wrap nav">' +
        '<a class="brand" href="index.html" aria-label="ilyynina, home">' +
          '<span class="brand-chrome">NINA</span><span class="brand-handle">ilyynina</span></a>' +
        '<nav class="nav-menu" aria-label="Main">' + PAGES.map(([id, href, label]) =>
          '<a href="' + href + '"' + (id === here ? ' aria-current="page"' : '') + '>' + label + '</a>').join('') +
        '</nav>' +
        '<a class="btn btn-primary nav-cta" href="' + TWITCH + '" target="_blank" rel="noopener noreferrer">Watch on Twitch</a>' +
      '</div>';
  });
  on('[data-footer]', (el) => {
    el.innerHTML =
      '<div class="wrap footer-inner">' +
        '<span class="brand-chrome">NINA</span>' +
        '<p>&copy; ' + new Date().getFullYear() + ' ilyynina. Prototype - not yet official.</p>' +
        // Her "hi hi hi hi hi hi hi hi hi hi" stream title, as a button.
        '<button class="hi-btn" type="button" data-hi>hi hi hi hi hi</button>' +
        '<p class="footer-credit">Built by WalJu</p>' +
      '</div>';
    $('[data-hi]', el).addEventListener('click', () => rain(['Hi', 'Wave', 'Howdy']));
  });

  /* --- Emote effects ------------------------------------------------------ */
  function burst(name, box) {
    if (reduceMotion()) return;
    for (let i = 0; i < 7; i++) {
      const img = document.createElement('img');
      img.src = emoteUrl(name);
      img.className = 'emote-pop';
      img.alt = '';
      img.style.left = (box.left + box.width / 2 - 22 + (Math.random() - 0.5) * 140) + 'px';
      img.style.top = (box.top + (Math.random() - 0.5) * 30) + 'px';
      img.style.setProperty('--r', (Math.random() * 50 - 25) + 'deg');
      img.style.animationDelay = (i * 60) + 'ms';
      document.body.appendChild(img);
      img.addEventListener('animationend', () => img.remove());
    }
  }
  function rain(names) {
    if (reduceMotion()) return;
    for (let i = 0; i < 26; i++) {
      const img = document.createElement('img');
      img.src = emoteUrl(names[i % names.length]);
      img.className = 'emote-rain';
      img.alt = '';
      img.style.left = (Math.random() * 96) + 'vw';
      img.style.setProperty('--r', (Math.random() * 80 - 40) + 'deg');
      img.style.animationDelay = (Math.random() * 900) + 'ms';
      img.style.animationDuration = (1600 + Math.random() * 1200) + 'ms';
      document.body.appendChild(img);
      img.addEventListener('animationend', () => img.remove());
    }
  }

  /* --- Static fills ------------------------------------------------------- */
  document.addEventListener('error', (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (img.getAttribute('src') === S.avatar) {
      img.src = 'assets/photos/nina-portrait.jpg';
      img.alt = 'Nina';
    } else if (img.alt === '' && img.src.includes('/emoticons/')) {
      img.style.visibility = 'hidden';
    }
  }, true);
  on('[data-tagline]', (el) => { el.textContent = S.tagline; });
  on('[data-avatar]', (el) => { el.src = S.avatar; });
  $$('[data-emote-img]').forEach((img) => {
    img.src = emoteUrl(img.dataset.emoteImg, img.hasAttribute('data-emote-static') ? 'static' : 'default');
  });
  $$('[data-code]').forEach((el) => { el.textContent = S.creatorCode; });

  /* Static emote artwork drifts in the margins; headings keep it in flow. */
  function decorativeEmote(name, className) {
    const img = document.createElement('img');
    img.src = emoteUrl(name, 'static');
    img.className = className;
    img.width = img.height = 112;
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    return img;
  }
  $$('[data-kicker-emote]').forEach((el) => {
    el.prepend(decorativeEmote(el.dataset.kickerEmote, 'kicker-emote'));
  });
  $$('[data-emote-sprinkles]').forEach((el) => {
    const layer = document.createElement('div');
    layer.className = 'emote-sprinkles';
    layer.setAttribute('aria-hidden', 'true');
    el.dataset.emoteSprinkles.split(/\s+/).filter(Boolean).slice(0, 3).forEach((name) => {
      const sticker = document.createElement('span');
      sticker.className = 'section-emote';
      sticker.appendChild(decorativeEmote(name, ''));
      layer.appendChild(sticker);
    });
    el.prepend(layer);
  });

  /* --- Off stream: local photos, linked back to her original posts. ------- */
  const photoImage = (p) =>
    '<img src="' + esc(p.src) + '" width="' + p.width + '" height="' + p.height +
    '" alt="' + esc(p.alt) + '" loading="lazy" decoding="async">';
  $$('[data-about-photo]').forEach((el) => {
    el.href = TWITCH;
    el.innerHTML = photoImage({ src: S.avatar, width: 600, height: 600, alt: "Nina's Twitch profile picture." }) +
      '<span class="portrait-caption"><span>Nina</span><span>Twitch channel <span aria-hidden="true">&#8599;</span></span></span>';
  });
  $$('[data-photos]').forEach((el) => {
    el.innerHTML = S.photos.map((p) =>
      '<li><a class="photo-card" href="' + esc(p.url) + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="photo-frame">' + photoImage(p) + '<span class="photo-open" aria-hidden="true">&#8599;</span></span>' +
        '<span class="photo-caption">' + esc(p.caption) + '</span>' +
        '<time class="photo-date" datetime="' + esc(p.date) + '">' + esc(p.dateLabel) + '</time>' +
      '</a></li>').join('');
  });

  on('[data-ticker]', (el) => {
    el.innerHTML = [0, 1].map(() =>
      S.ticker.map((t) => '<span>' + esc(t) + '</span><i></i>').join('')).join('');
  });

  on('[data-highlights]', (el) => {
    el.innerHTML = S.highlights.map((h) =>
      '<li class="hl">' +
        '<img src="' + emoteUrl(h.emote) + '" width="112" height="112" alt="" loading="lazy">' +
        '<span class="hl-value chrome">' + esc(h.value) + '</span>' +
        '<span class="hl-label">' + esc(h.label) + '</span>' +
        '<p>' + esc(h.note) + '</p>' +
      '</li>').join('');
  });

  on('[data-about]', (el) => { el.innerHTML = S.about.map((p) => '<p>' + esc(p) + '</p>').join(''); });
  on('[data-facts]', (el) => {
    el.innerHTML = S.facts.map((f) => '<div><dt>' + esc(f.k) + '</dt><dd>' + esc(f.v) + '</dd></div>').join('');
  });

  on('[data-timeline]', (el) => {
    el.innerHTML = S.timeline.map((t) =>
      '<li' + (t.big ? ' class="is-big"' : '') + '>' +
        '<span class="tl-date">' + esc(t.date) + '</span>' +
        '<div><h3>' + esc(t.title) + '</h3><p>' + esc(t.note) + '</p></div>' +
      '</li>').join('');
  });

  /* --- Chat lore + commands ----------------------------------------------- */
  $$('[data-lore]').forEach((el) => {
    const list = S.lore.slice(0, Number(el.dataset.limit) || S.lore.length);
    el.innerHTML = list.map((l) =>
      '<li class="lore-card">' +
        '<blockquote>' + esc(l.quote) + '</blockquote>' +
        '<span class="lore-source">' + esc(l.source) + '</span>' +
        '<p>' + esc(l.note) + '</p>' +
      '</li>').join('');
  });
  $$('[data-commands]').forEach((el) => {
    el.innerHTML = S.commands.map((c, i) => {
      const inner = '<strong>' + esc(c.cmd) + '</strong><span>' + esc(c.hint) + '</span>';
      if (c.url) return '<li><a class="cmd" href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a></li>';
      if (c.copy) return '<li><button class="cmd" type="button" data-cmd="' + i + '">' + inner + '</button></li>';
      return '<li><span class="cmd is-static">' + inner + '</span></li>';
    }).join('');
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cmd]');
      if (!btn) return;
      const c = S.commands[btn.dataset.cmd];
      copy(c.copy, (ok) => {
        const span = $('span', btn);
        span.textContent = ok ? 'copied!' : c.hint;
        setTimeout(() => { span.textContent = c.hint; }, 1800);
      });
    });
  });

  /* --- Setup page --------------------------------------------------------- */
  on('[data-copy-settings]', (btn) => {
    btn.addEventListener('click', () => {
      const settings = S.settings.map(([label, value]) => label + ': ' + value).join('\n');
      copy(settings, (ok) => {
        $('[data-settings-status]').textContent = ok ? 'Settings copied.' : 'Clipboard unavailable. Select the settings below to copy them.';
      });
    });
  });
  on('[data-settings]', (el) => {
    el.innerHTML = S.settings.map((s) =>
      '<li><span class="tile-value">' + esc(s[1]) + '</span><span class="tile-label">' + esc(s[0]) + '</span></li>').join('');
  });
  on('[data-binds]', (el) => {
    el.innerHTML = S.binds.map((g) =>
      '<section class="bind-group"><h3>' + esc(g.group) + '</h3><ul>' + g.keys.map((k) =>
        '<li><kbd>' + esc(k[1]) + '</kbd><span>' + esc(k[0]) + '</span></li>').join('') + '</ul></section>').join('');
  });
  on('[data-gear]', (el) => {
    el.innerHTML = S.gear.map((g) =>
      '<li><span class="gear-kind">' + esc(g[0]) + '</span><strong>' + esc(g[1]) + '</strong><span class="gear-note">' + esc(g[2]) + '</span></li>').join('');
  });
  on('[data-setup]', (el) => {
    el.innerHTML = S.setup.map((pc, i) =>
      '<article class="spec">' +
        '<header><span class="spec-no">PC-0' + (i + 1) + '</span><h3>' + esc(pc.name) + '</h3></header>' +
        '<dl>' + pc.parts.map((p) =>
          '<div><dt>' + esc(p[0]) + '</dt><dd>' + esc(p[1]) + '</dd></div>').join('') + '</dl>' +
      '</article>').join('');
  });

  /* --- Socials + contact -------------------------------------------------- */
  const ICONS = {
    twitch: 'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z',
    youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    tiktok: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
    instagram: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm5.5-4a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z',
    x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    discord: 'M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z',
  };
  on('[data-partner-links]', (el) => {
    el.innerHTML = S.links.partners.map((link) =>
      '<li><a class="partner-link" href="' + esc(link.url) + '" target="_blank" rel="sponsored noopener noreferrer">' +
        '<span class="partner-monogram" aria-hidden="true">' + esc(link.brand[0]) + '</span>' +
        '<span><span class="partner-brand">' + esc(link.brand) + '<span class="partner-tag">Partner link</span></span>' +
          '<span class="partner-title">' + esc(link.title) + '</span></span>' +
        '<span class="partner-arrow" aria-hidden="true">&#8599;</span>' +
      '</a></li>').join('');
  });
  on('[data-socials]', (el) => {
    el.innerHTML = S.socials.map((s) =>
      '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' +
        '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="' + ICONS[s.icon] + '"/></svg>' +
        '<span class="social-label">' + esc(s.label) + '</span>' +
        '<span class="social-handle">' + esc(s.handle) + '</span>' +
      '</a></li>').join('');
  });
  on('[data-contact-label]', (el) => { el.textContent = S.contact.label; });
  on('[data-contact-link]', (el) => { el.href = 'mailto:' + S.contact.email; el.textContent = S.contact.email; });

  /* --- Creator code ------------------------------------------------------- */
  on('[data-copy-code]', (btn) => {
    btn.addEventListener('click', () => {
      const status = $('[data-copy-status]');
      copy(S.creatorCode, (ok) => {
        status.textContent = ok ? 'Copied - use it in the Item Shop' : 'Code: ' + S.creatorCode;
        setTimeout(() => { status.textContent = ''; }, 2400);
      });
    });
  });

  /* --- Clips + streams: a facade each, swapped for the player on click. --- */
  function mountFrame(btn, src) {
    const frame = document.createElement('iframe');
    frame.src = src;
    frame.allow = 'autoplay; fullscreen';
    frame.allowFullscreen = true;
    frame.title = btn.getAttribute('aria-label');
    frame.className = 'clip-frame';
    btn.replaceWith(frame);
  }
  on('[data-clips]', (grid) => {
    const list = S.clips.slice(0, Number(grid.dataset.limit) || S.clips.length);
    grid.innerHTML = list.map((c, i) =>
      '<li class="clip">' +
        '<button class="clip-facade" type="button" data-slug="' + esc(c.slug) + '" aria-label="Play clip: ' + esc(c.title) + '">' +
          '<span class="clip-no">CLIP ' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="clip-title">' + esc(c.title) + '</span>' + PLAY +
        '</button>' +
        '<p class="clip-meta">' + esc(c.meta) + ' &middot; <a href="https://clips.twitch.tv/' +
          encodeURIComponent(c.slug) + '" target="_blank" rel="noopener noreferrer">Open clip on Twitch</a></p>' +
      '</li>').join('');
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.clip-facade');
      if (btn) mountFrame(btn, 'https://clips.twitch.tv/embed?clip=' + encodeURIComponent(btn.dataset.slug) +
                               '&parent=' + encodeURIComponent(parent()) + '&autoplay=true');
    });
  });
  on('[data-streams]', (grid) => {
    grid.innerHTML = S.streams.map((v) =>
      '<li class="clip">' +
        '<button class="clip-facade vod-facade" type="button" data-vod="' + esc(v.id) + '" aria-label="Play stream: ' + esc(v.title) + '">' +
          '<img src="https://static-cdn.jtvnw.net/cf_vods/' + esc(v.thumb) + '//thumb/thumb0-640x360.jpg" alt="" loading="lazy" width="640" height="360">' +
          '<span class="vod-length">' + esc(v.length) + '</span>' + PLAY +
        '</button>' +
        '<h3 class="vod-title">' + esc(v.title) + '</h3>' +
        '<p class="clip-meta">' + esc(v.when) + ' &middot; <a href="https://www.twitch.tv/videos/' +
          encodeURIComponent(v.id) + '" target="_blank" rel="noopener noreferrer">Open broadcast on Twitch</a></p>' +
      '</li>').join('');
    // A VOD thumb vanishes when Twitch expires it: fall back to the dotted tile.
    grid.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') e.target.remove(); }, true);
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.vod-facade');
      if (btn) mountFrame(btn, 'https://player.twitch.tv/?video=v' + encodeURIComponent(btn.dataset.vod) +
                               '&parent=' + encodeURIComponent(parent()) + '&autoplay=true');
    });
  });

  /* --- Emote rail (home): the list twice, so the loop has no seam. -------- */
  on('[data-emotes]', (rail) => {
    const items = S.emotes.map((e) =>
      '<li><button type="button" data-emote="' + esc(e[0]) + '" title="ilyyni' + esc(e[0]) + '">' +
        '<img src="' + emoteUrl(e[0]) + '" width="112" height="112" alt="ilyyni' + esc(e[0]) + '" loading="lazy">' +
      '</button></li>').join('');
    rail.innerHTML = items + items.replace(/<li>/g, '<li aria-hidden="true">').replace(/<button /g, '<button tabindex="-1" ');
    rail.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn) burst(btn.dataset.emote, btn.getBoundingClientRect());
    });
  });

  /* --- Emote grid (Emotes page): click copies the chat token. ------------- */
  on('[data-emote-grid]', (grid) => {
    grid.innerHTML = allEmotes.map((e) =>
      '<li><button type="button" data-emote="' + esc(e[0]) + '">' +
        '<img src="' + emoteUrl(e[0]) + '" width="112" height="112" alt="" loading="lazy">' +
        '<span>ilyyni' + esc(e[0]) + '</span>' +
      '</button></li>').join('');
    const search = $('#emote-search');
    const items = Array.from(grid.children);
    function filter() {
      const query = search.value.trim().toLowerCase();
      let count = 0;
      items.forEach((item) => {
        item.hidden = !item.textContent.toLowerCase().includes(query);
        if (!item.hidden) count++;
      });
      $('[data-emote-count]').textContent = count ? count + (count === 1 ? ' emote' : ' emotes') : 'No matches. Try a shorter name.';
    }
    search.addEventListener('input', filter);
    filter();
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const token = 'ilyyni' + btn.dataset.emote;
      burst(btn.dataset.emote, btn.getBoundingClientRect());
      copy(token, (ok) => {
        const status = $('[data-emote-status]');
        status.textContent = ok ? token + ' copied - go spam it' : token;
        status.classList.add('is-on');
        clearTimeout(status._t);
        status._t = setTimeout(() => status.classList.remove('is-on'), 2200);
      });
    });
  });
})();
