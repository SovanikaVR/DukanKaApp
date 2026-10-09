/* Small DOM helpers and shared form pieces (no framework, no build step). */
import { t, getLang } from './i18n.js';
import { useRid } from './api.js';

// replaceChildren() that, like h(), skips null/false (so "cond ? el : null" never prints "null").
if (typeof Element !== 'undefined' && !Element.prototype._dkPatched) {
  const orig = Element.prototype.replaceChildren;
  Element.prototype.replaceChildren = function (...kids) {
    return orig.apply(this, kids.flat(Infinity).filter((k) => k !== null && k !== undefined && k !== false));
  };
  Element.prototype._dkPatched = true;
}

/** h('div', {class:'x', onclick: fn}, 'text', child, [children]) */
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
    kids.unshift(attrs); attrs = null;
  }
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'placeholder' || k === 'aria-label' || k === 'title') el.setAttribute(k, t(String(v)));
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  append(el, kids);
  return el;
}

function append(el, kids) {
  for (const k of kids) {
    if (k === null || k === undefined || k === false) continue;
    if (Array.isArray(k)) append(el, k);
    // Plain text is passed through t(), so Hindi mode translates every known label automatically.
    else el.appendChild(k instanceof Node ? k : document.createTextNode(typeof k === 'string' ? t(k) : String(k)));
  }
}

export const $ = (sel, root = document) => root.querySelector(sel);

/** Navigate to a screen, e.g. go('bill/S123'). Re-renders even when already there. */
export function go(path, opts = {}) {
  const target = '#/' + path;
  // The user left the screen while it was saving: stay where they are (the save itself is done).
  if (saving && location.hash !== saveFrom) return;
  if (location.hash === target) window.dispatchEvent(new HashChangeEvent('hashchange'));
  // After a save, replace the form in history: the Back button then cannot reopen a filled form.
  else if (opts.replace || saving) location.replace(target);
  else location.hash = target;
}

/* ---------- formatting ---------- */

export const inr = (n, d = 0) => (parseFloat(n) < 0 && Math.abs(parseFloat(n)) >= (d ? 0.005 : 0.5) ? '−₹' + Calc.inr(-parseFloat(n), d) : '₹' + Calc.inr(Math.abs(parseFloat(n) || 0), d));
export const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
};
export const g3 = (n) => (Math.round(num(n) * 1000) / 1000).toFixed(3);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fdate(s) {
  if (!s) return '';
  const [y, m, d] = String(s).slice(0, 10).split('-');
  return `${+d} ${MONTHS[+m - 1]} ${y}`;
}
export function todayStr() {
  const d = new Date(Date.now() + 5.5 * 3600000);
  return d.toISOString().slice(0, 10);
}

/* ---------- feedback ---------- */

export function toast(msg, kind = 'ok') {
  document.querySelectorAll('.toast').forEach((x) => x.remove());
  const el = h('div', { class: 'toast ' + kind, role: 'status' }, t(String(msg)));
  document.body.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, kind === 'err' ? 5000 : 2600);
}

/* ---------- saving: one at a time, with a full-screen "Saving…" cover ---------- */

let saving = false;
let saveFrom = '';
let cover = null;
export function isSaving() { return saving; }

function showCover(text) {
  if (!cover) {
    cover = h('div', { class: 'cover', role: 'alert', 'aria-live': 'assertive' },
      h('div', { class: 'cover-box' }, h('span', { class: 'spinner big' }), h('div', { class: 'cover-text' })));
  }
  cover.querySelector('.cover-text').textContent = t(text || 'Saving… please wait');
  if (!cover.isConnected) document.body.appendChild(cover);
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}
function hideCover() { if (cover) cover.remove(); }

/**
 * Runs a save. While it runs the whole screen is covered, so nothing can be tapped twice
 * (the same girvi cannot be released two times). Errors are shown as a message.
 */
export async function busy(btn, fn, text) {
  if (saving) return undefined;
  saving = true;
  saveFrom = location.hash;
  // One request id per form: if the reply is lost and the user taps Save again, the shop saves it only once.
  if (btn) { btn._rid = btn._rid || (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)); useRid(btn._rid); }
  const slow = setTimeout(() => { if (cover) cover.querySelector('.cover-text').textContent = t('Internet is slow… still saving, please wait'); }, 12000);
  const label = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = t('Please wait…'); }
  showCover(text);
  let ok = false;
  try { const res = await fn(); ok = true; return res; }
  catch (e) { toast(friendly(e), 'err'); return undefined; }
  finally {
    clearTimeout(slow);
    useRid(null);
    if (ok && btn) btn._rid = null;
    saving = false;
    hideCover();
    if (btn && btn.isConnected) { btn.disabled = false; btn.textContent = label; }
  }
}

/** Turns programming errors into a plain message; shop messages pass through. */
export function friendly(e) {
  const m = e && e.message ? e.message : String(e);
  if (/undefined|null|is not a function|reading|Unexpected token|export named/i.test(m)) return t('Something went wrong. Please try again.');
  return m;
}

export function modal(title, body, actions = []) {
  return new Promise((resolve) => {
    // A dialog belongs to the screen it was opened on: going Back closes it.
    const onNav = () => close(null);
    window.addEventListener('hashchange', onNav);
    const close = (v) => { window.removeEventListener('hashchange', onNav); wrap.remove(); resolve(v); };
    const wrap = h('div', { class: 'modal-wrap', onclick: (e) => { if (e.target === wrap) close(null); } },
      h('div', { class: 'modal', role: 'dialog', 'aria-label': title }, 
        h('div', { class: 'modal-title' }, title),
        h('div', { class: 'modal-body' }, body),
        h('div', { class: 'modal-actions' },
          h('button', { class: 'btn2', onclick: () => close(null) }, t('Cancel')),
          actions.map((a) => h('button', { class: a.danger ? 'btn danger' : 'btn', onclick: () => close(a.value ?? true) }, a.label)))));
    document.body.appendChild(wrap);
  });
}

/** Asks for one or more values in a dialog. fields: [{key,label,type,value}] -> {key: value} or null */
export async function ask(title, fields, okLabel) {
  const inputs = fields.map((f) => {
    if (f.options) {
      const s = seg(f.options, f.value, null);
      return { key: f.key, el: h('div', { class: 'f' }, h('span', { class: 'lbl' }, f.label), s), get: () => s.get() };
    }
    const el = field(f.label, { type: f.type, value: f.value });
    return { key: f.key, el, get: () => el.input.value };
  });
  setTimeout(() => { const i = document.querySelector('.modal .inp'); if (i) i.focus(); }, 50);
  const ok = await modal(title, h('div', { class: 'stack' }, inputs.map((i) => i.el)), [{ label: okLabel || t('Save'), value: true }]);
  if (!ok) return null;
  const out = {};
  inputs.forEach((i) => { out[i.key] = i.get(); });
  return out;
}

export const confirmBox = (title, text, okLabel) =>
  modal(title, h('p', text), [{ label: okLabel || t('Yes'), value: true }]);

/* ---------- layout pieces ---------- */

const HELP_OF = {
  sale: 'sale', bill: 'sale', bills: 'sale', loans: 'girvi', 'loan-new': 'girvi', loan: 'girvi', orders: 'orders',
  'order-new': 'orders', order: 'orders', repairs: 'repair', 'repair-new': 'repair', repair: 'repair', stock: 'stock',
  'stock-add': 'stock', oldgold: 'oldgold', melt: 'melt', parties: 'partners', party: 'partners', cash: 'cash',
  reports: 'reports', settings: 'settings', dues: 'dues', search: 'customers', customer: 'customers',
  'customer-edit': 'customers', rate: 'rate'
};

export function topbar(title, sub, opts = {}) {
  const first = location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  const topic = opts.help || HELP_OF[first];
  return h('header', { class: 'top' },
    h('a', { class: 'back', href: opts.back || '#/home', 'aria-label': t('Back') }, icon('back')),
    h('div', { class: 'top-text' }, h('div', { class: 'top-title' }, title), sub ? h('div', { class: 'top-sub' }, sub) : null),
    opts.right || null,
    topic ? h('a', { class: 'help-btn', href: '#/help/' + topic, 'aria-label': t('Help') }, icon('help')) : null);
}

export function screen(title, sub, body, foot, opts) {
  return h('div', { class: 'screen' }, topbar(title, sub, opts),
    h('main', { class: 'body' }, body),
    foot ? h('footer', { class: 'foot' }, foot) : null);
}

export const sec = (text) => h('div', { class: 'sec' }, text);
export const card = (...kids) => h('div', { class: 'card' }, ...kids);
export const kv = (a, b, cls) => h('div', { class: 'kv ' + (cls || '') }, h('span', a), h('span', b));
export const grid = (n, ...kids) => h('div', { class: 'grid g' + n }, ...kids);

/** Labelled input. type: text|num|tel|date|textarea */
export function field(label, opts = {}) {
  const attrs = {
    class: 'inp', value: opts.value ?? '', placeholder: opts.placeholder || '',
    oninput: opts.oninput, onchange: opts.onchange, readonly: opts.readonly, id: opts.id
  };
  let input;
  if (opts.type === 'textarea') input = h('textarea', Object.assign(attrs, { rows: opts.rows || 2 }));
  else {
    if (opts.type === 'num') { Object.assign(attrs, { inputmode: 'decimal', type: 'text', autocomplete: 'off' }); if (opts.min0 !== false) opts.min0 = true; }
    else if (opts.type === 'tel') Object.assign(attrs, { inputmode: 'tel', type: 'tel', autocomplete: 'off' });
    else if (opts.type === 'date') attrs.type = 'date';
    else if (opts.type === 'pin') Object.assign(attrs, { inputmode: 'numeric', type: 'password', autocomplete: 'current-password' });
    else attrs.type = 'text';
    input = h('input', attrs);
  }
  const wrap = h('label', { class: 'f' + (opts.cls ? ' ' + opts.cls : '') }, h('span', { class: 'lbl' }, label), input,
    opts.hint ? h('span', { class: 'fhint' }, opts.hint) : null);
  if (opts.min0) input.addEventListener('input', () => { if (/-/.test(input.value)) input.value = input.value.replace(/-/g, ''); });
  if (opts.max !== undefined) input.addEventListener('input', () => { if (num(input.value) > opts.max) input.value = String(opts.max); });
  wrap.input = input;
  return wrap;
}

/** Big tap buttons instead of drop-downs. options: [{value,label}] */
export function seg(options, value, onpick) {
  const el = h('div', { class: 'seg', role: 'group' });
  let current = value;
  const draw = () => {
    el.innerHTML = '';
    options.forEach((o) => {
      el.appendChild(h('button', {
        type: 'button', class: o.value === current ? 'on' : '', 'aria-pressed': o.value === current ? 'true' : 'false',
        onclick: () => { current = o.value; draw(); onpick && onpick(o.value); }
      }, typeof o.label === 'string' ? t(o.label) : o.label));
    });
  };
  draw();
  el.get = () => current;
  el.set = (v) => { current = v; draw(); };
  return el;
}

export function chips(list, onpick, cls) {
  return h('div', { class: 'chips ' + (cls || '') },
    list.map((c) => h('button', { type: 'button', class: 'chip' + (c.on ? ' on' : ''), onclick: () => onpick(c.value ?? c.label) }, c.label)));
}

/** Date row that shows today by default and only opens a picker when tapped. */
export function dateField(label, value) {
  const f = field(label, { type: 'date', value: value || todayStr() });
  return f;
}

export function empty(text) { return h('div', { class: 'empty' }, text); }

export function loading() { return h('div', { class: 'loading' }, h('span', { class: 'spinner' }), t('Loading…')); }

/* ---------- icons (inline stroke svg) ---------- */
const ICONS = {
  back: 'M15 18l-6-6 6-6',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5',
  lock: 'M5 10h14v11H5zM8 10V7a4 4 0 0 1 8 0v3',
  bill: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  swap: 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4',
  order: 'M5 4h14v17H5zM9 4h6v3H9zM9 12h6M9 16h4',
  box: 'M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10',
  chart: 'M4 20h16M7 16v-5M12 16V6M17 16v-8',
  wrench: 'M14 6a4 4 0 0 0 5 5l-9 9-3-3 9-9a4 4 0 0 0-2-2z',
  flame: 'M12 3c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-3-1-5 0-7z',
  truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7M7 19a2 2 0 1 0 0-.1M17 19a2 2 0 1 0 0-.1',
  hammer: 'M14 4l6 6-3 3-6-6zM11 7l-8 8 3 3 8-8',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  cash: 'M3 7h18v10H3zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  wa: 'M21 12a9 9 0 0 1-13.2 7.9L3 21l1.2-4.6A9 9 0 1 1 21 12z',
  print: 'M7 8V3h10v5M7 17H4v-7h16v7h-3M7 14h10v7H7z',
  pdf: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  check: 'M5 12l5 5 9-10',
  plus: 'M12 5v14M5 12h14',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01',
  rupee: 'M6 4h12M6 9h12M6 4c6 0 8 2 8 5s-3 5-8 5l8 7',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3'
};
export function icon(name, size = 22) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round'); svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', ICONS[name] || ''); svg.appendChild(p);
  return svg;
}

/* ---------- remembered values (last making ₹/g, last rate %, ...) ---------- */
export function remember(key, val) {
  try {
    if (val === undefined) return localStorage.getItem('dk_last_' + key) || '';
    localStorage.setItem('dk_last_' + key, String(val));
  } catch (e) { /* ignore */ }
  return '';
}
