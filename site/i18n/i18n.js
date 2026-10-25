/* Lightweight DOM translator. English strings in the rendered page are looked up in the
   active locale's dictionary and swapped in place, so React keeps working normally. */
(function () {
  const LOCALES = [
    { code: "en", label: "English", short: "EN", html: "en" },
    { code: "fi", label: "Suomi", short: "FI", html: "fi" },
    { code: "de", label: "Deutsch", short: "DE", html: "de" },
    { code: "es", label: "Español", short: "ES", html: "es" },
    { code: "fr", label: "Français", short: "FR", html: "fr" },
    { code: "pt", label: "Português", short: "PT", html: "pt" },
    { code: "zh", label: "简体中文", short: "中文", html: "zh-Hans" },
  ];
  const STORE = "dp-lang";
  const packs = {};
  const dicts = {};
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const SKIP = "script,style,code,pre,.code,.mono,svg,canvas,[data-no-i18n]";

  function dictFor(code) {
    if (code === "en" || !packs[code]) return null;
    if (dicts[code]) return dicts[code];
    const en = window.DP_I18N_EN || {},
      tr = packs[code],
      d = new Map();
    Object.keys(en).forEach((sec) => {
      const a = en[sec],
        b = tr[sec] || [];
      if (a.length !== b.length)
        console.warn(
          `[i18n] ${code}.${sec}: ${b.length} strings, expected ${a.length}`
        );
      a.forEach((k, i) => {
        if (b[i]) d.set(norm(k), b[i]);
      });
    });
    return (dicts[code] = d);
  }

  function detect() {
    const saved = localStorage.getItem(STORE);
    if (saved && LOCALES.some((l) => l.code === saved)) return saved;
    const langs =
      navigator.languages && navigator.languages.length
        ? navigator.languages
        : [navigator.language || "en"];
    for (const raw of langs) {
      const base = String(raw).toLowerCase().split("-")[0];
      if (LOCALES.some((l) => l.code === base)) return base;
    }
    return "en";
  }

  let current = "en";
  const origText = new WeakMap(),
    lastText = new WeakMap();
  const origAttr = new WeakMap();
  const ATTRS = ["alt", "aria-label", "placeholder", "title"];

  function trText(node, d) {
    const v = node.nodeValue;
    let src;
    if (lastText.has(node) && lastText.get(node) === v)
      src = origText.get(node);
    else {
      src = v;
      origText.set(node, v);
    }
    const key = norm(src);
    let out = src;
    if (d && key && d.has(key)) {
      const lead = src.match(/^\s*/)[0],
        trail = src.match(/\s*$/)[0];
      out = lead + d.get(key) + trail;
    }
    if (out !== v) node.nodeValue = out;
    lastText.set(node, out);
  }

  function trAttrs(el, d) {
    let o = origAttr.get(el);
    ATTRS.forEach((a) => {
      if (!el.hasAttribute(a)) return;
      const v = el.getAttribute(a);
      if (!o) {
        o = {};
        origAttr.set(el, o);
      }
      if (!(a in o) || o["_" + a] !== v) o[a] = v;
      const tr = d && d.get(norm(o[a]));
      const out = tr || o[a];
      if (out !== v) el.setAttribute(a, out);
      o["_" + a] = out;
    });
  }

  function walk(root) {
    const d = dictFor(current);
    if (root.nodeType === 3) {
      if (!root.parentElement || !root.parentElement.closest(SKIP))
        trText(root, d);
      return;
    }
    if (root.nodeType !== 1 || root.closest(SKIP)) return;
    const tw = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (n) => {
          if (n.nodeType !== 1) return NodeFilter.FILTER_ACCEPT;
          if (n.matches(SKIP)) return NodeFilter.FILTER_REJECT;
          trAttrs(n, d);
          return NodeFilter.FILTER_SKIP;
        },
      }
    );
    trAttrs(root, d);
    let n;
    while ((n = tw.nextNode())) if (/\S/.test(n.nodeValue)) trText(n, d);
  }

  let obs = null,
    queued = new Set(),
    raf = 0;
  function flush() {
    raf = 0;
    const items = [...queued];
    queued.clear();
    items.forEach((n) => n.isConnected && walk(n));
    if (obs) obs.takeRecords();
  }
  function observe() {
    if (obs) return;
    obs = new MutationObserver((recs) => {
      recs.forEach((r) => {
        if (r.type === "characterData") {
          if (r.target.nodeValue !== lastText.get(r.target))
            queued.add(r.target);
        } else if (r.type === "attributes") queued.add(r.target);
        else r.addedNodes.forEach((n) => queued.add(n));
      });
      if (queued.size && !raf) raf = requestAnimationFrame(flush);
    });
    obs.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS,
    });
  }

  const listeners = new Set();
  function apply() {
    const loc = LOCALES.find((l) => l.code === current);
    document.documentElement.lang = loc.html;
    const d = dictFor(current);
    if (!document.__dpTitle) document.__dpTitle = document.title;
    document.title =
      (d && d.get(norm(document.__dpTitle))) || document.__dpTitle;
    walk(document.body);
    if (obs) obs.takeRecords();
    listeners.forEach((f) => f(current));
  }

  window.dpI18n = {
    locales: LOCALES,
    get current() {
      return current;
    },
    has(code) {
      return !!packs[code];
    },
    add(code, pack) {
      packs[code] = pack;
      delete dicts[code];
    },
    set(code) {
      if (!LOCALES.some((l) => l.code === code)) return;
      current = code;
      localStorage.setItem(STORE, code);
      apply();
    },
    onChange(f) {
      listeners.add(f);
      return () => listeners.delete(f);
    },
    start() {
      current = detect();
      if (current !== "en" && !packs[current]) current = "en";
      observe();
      apply();
    },
  };
})();
