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
  const voice = video ? narrate(video, x.id) : null;
  return screen(x.title[L], L === 'hi' ? 'मदद' : 'Help', [
    langSwitch(),
    h('div', { class: 'card help-body' },
      h('p', null, x.what[L]),
      video ? h('div', { class: 'hint' }, L === 'hi' ? '▶ हिंदी वीडियो — मुनीम जी बोलकर समझाते हैं' : '▶ Video in Hindi — Munim ji explains aloud') : null,
      video,
      voice,
      h('h3', null, L === 'hi' ? 'कैसे करें' : 'How to do it'),
      h('ol', null, x.steps.map((s) => h('li', null, s[L])))),
    x.tips.length ? h('div', { class: 'help-tip' }, h('b', null, L === 'hi' ? 'ध्यान दें' : 'Good to know'),
      h('ul', null, x.tips.map((s) => h('li', null, s[L])))) : null,
    h('a', { class: 'btn2', href: '#/help' }, L === 'hi' ? 'सारी गाइड' : 'All guides')
  ], null, { back: '#/help', help: '' });
}

/**
 * Hindi voice for the videos: the phone's own text-to-speech (free, built into Android) reads
 * Munim ji's lines aloud at the right moment. If a line is still being spoken when the next one
 * is due, the video waits for it.
 */
function narrate(video, id) {
  const can = typeof window !== 'undefined' && 'speechSynthesis' in window;
  let on = can;
  let cues = [];
  let next = 0;
  let waiting = false;
  let lastText = '';
  let lastEnd = 0;
  let guard = null;
  // Never leave the video stuck: if the phone does not report the end of a line, carry on anyway.
  const resume = () => { clearTimeout(guard); if (waiting) { waiting = false; video.play().catch(() => {}); } };
  const syn = can ? window.speechSynthesis : null;
  fetch('videos/' + id + '.json').then((r) => r.json()).then((c) => { cues = c; }).catch(() => { cues = []; });

  const hindiVoice = () => (syn.getVoices() || []).find((v) => /^hi/i.test(v.lang)) || null;
  const speak = (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'hi-IN';
    const v = hindiVoice();
    if (v) u.voice = v;
    u.rate = 1;
    u.onend = u.onerror = () => { lastEnd = Date.now(); resume(); };
    lastText = text;
    syn.speak(u);
  };
  const resync = () => { next = cues.findIndex((c) => c.t > video.currentTime); if (next < 0) next = cues.length; };

  if (can) {
    video.addEventListener('timeupdate', () => {
      if (!on || !cues.length) return;
      if (next < cues.length && video.currentTime >= cues[next].t) {
        if (syn.speaking) {
          waiting = true; video.pause();
          clearTimeout(guard); guard = setTimeout(resume, Math.max(1500, lastText.length * 120));
          return;
        }
        speak(cues[next].text);
        next++;
      }
    });
    video.addEventListener('play', () => { if (!waiting) { syn.cancel(); resync(); } });
    video.addEventListener('pause', () => { if (!waiting) syn.cancel(); });
    video.addEventListener('seeked', () => { waiting = false; syn.cancel(); resync(); });
    video.addEventListener('ended', () => { waiting = false; });
    syn.getVoices();
  }
  const label = () => (on ? '🔊 ' + (getLang() === 'hi' ? 'हिंदी आवाज़ चालू' : 'Hindi voice on') : '🔇 ' + (getLang() === 'hi' ? 'आवाज़ बंद' : 'Voice off'));
  const btn = h('button', { class: 'btn2 small', type: 'button', onclick: () => {
    on = !on; if (!on) { syn.cancel(); waiting = false; } else resync(); btn.textContent = label();
  } }, label());
  if (!can) return h('div', { class: 'hint' }, getLang() === 'hi' ? 'इस फ़ोन में आवाज़ नहीं चलती, वीडियो में लिखा हुआ पढ़ें।' : 'This phone cannot speak; read the captions in the video.');
  return h('div', { class: 'stack' }, btn,
    h('div', { class: 'hint' }, getLang() === 'hi' ? 'आवाज़ फ़ोन की अपनी हिंदी आवाज़ से आती है। आवाज़ न आए तो फ़ोन की Settings → भाषा → Text-to-speech में Google और हिंदी चुनें।'
      : 'The voice comes from the phone\'s own Hindi voice. No sound? Phone Settings → Language → Text-to-speech: choose Google and Hindi.'));
}
