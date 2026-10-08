/* In-app user guide: list of modules, and one page per module (English / Hindi). */
import { h, screen, icon } from '../ui.js';
import { t, getLang, setLang } from '../i18n.js';
import { HELP } from '../help-content.js';

const VIDEOS = { start: 1, sale: 1, girvi: 1, orders: 1, dues: 1, mistakes: 1 };

function langSwitch() {
  const b = (code, label) => h('button', { class: getLang() === code ? 'on' : '', onclick: () => { setLang(code); document.dispatchEvent(new Event('dk-lang')); } }, label);
  return h('div', { class: 'seg' }, b('en', 'English'), b('hi', 'हिंदी'));
}

export function index() {
  const L = getLang() === 'hi' ? 'hi' : 'en';
  return screen(t('Help'), L === 'hi' ? 'हर हिस्से की आसान गाइड' : 'A simple guide to every part of the app', [
    langSwitch(),
    h('div', { class: 'help-list' }, HELP.map((x) => h('a', { class: 'help-item', href: '#/help/' + x.id }, icon(x.icon, 24),
      h('span', null, x.title[L], h('span', { class: 'hs' }, x.what[L].split('. ')[0].replace(/\.$/, '') + (VIDEOS[x.id] ? ' · ▶' : ''))))))
  ], null, { help: '' });
}

export function topic({ topic: id }) {
  const L = getLang() === 'hi' ? 'hi' : 'en';
  const x = HELP.find((y) => y.id === id) || HELP[0];
  const video = VIDEOS[x.id] ? h('video', { class: 'help-video', controls: true, preload: 'none', playsinline: true, src: 'videos/' + x.id + '.mp4',
    poster: 'videos/' + x.id + '.jpg' }) : null;
  return screen(x.title[L], L === 'hi' ? 'मदद' : 'Help', [
    langSwitch(),
    h('div', { class: 'card help-body' },
      h('p', null, x.what[L]),
      video ? h('div', { class: 'hint' }, L === 'hi' ? '▶ हिंदी वीडियो (स्क्रीन पर लिखा हुआ)' : '▶ Video in Hindi (with captions)') : null,
      video,
      h('h3', null, L === 'hi' ? 'कैसे करें' : 'How to do it'),
      h('ol', null, x.steps.map((s) => h('li', null, s[L])))),
    x.tips.length ? h('div', { class: 'help-tip' }, h('b', null, L === 'hi' ? 'ध्यान दें' : 'Good to know'),
      h('ul', null, x.tips.map((s) => h('li', null, s[L])))) : null,
    h('a', { class: 'btn2', href: '#/help' }, L === 'hi' ? 'सारी गाइड' : 'All guides')
  ], null, { back: '#/help', help: '' });
}
