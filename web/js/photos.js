/* Stock photos: made small on the phone (≈ 60–120 KB), kept in the shop's Google Drive,
 * and fetched only when someone taps to see one — lists never load pictures. */
import { call } from './api.js';
import { h, modal, busy, toast } from './ui.js';
import { t } from './i18n.js';

const seen = new Map(); // photoId -> data URL, for this session

export function shrinkPhoto(file, max = 900) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      let q = 0.75, url = c.toDataURL('image/jpeg', q);
      while (url.length > 280000 && q > 0.35) { q -= 0.1; url = c.toDataURL('image/jpeg', q); }
      URL.revokeObjectURL(img.src);
      resolve(url);
    };
    img.onerror = () => reject(new Error(t('Could not read this picture')));
    img.src = URL.createObjectURL(file);
  });
}

/** Opens the camera / gallery, saves the photo for this stock item. Returns the new photoId. */
export function takePhoto(item) {
  return new Promise((resolve) => {
    const input = h('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'hidden' });
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      input.remove();
      if (!file) return resolve(null);
      await busy(null, async () => {
        const data = await shrinkPhoto(file);
        const r = await call('stock.photoSet', { id: item.id, data });
        seen.set(r.photoId, data);
        toast(t('Photo saved'));
        resolve(r.photoId);
      }, t('Saving photo…'));
    });
    document.body.appendChild(input);
    input.click();
  });
}

/** Shows the photo of one item (loaded now, then kept for this session). */
export async function showPhoto(item, canEdit, onChange) {
  const box = h('div', { class: 'photo-box' }, h('div', { class: 'hint' }, t('Loading photo…')));
  const load = async () => {
    try {
      let url = seen.get(item.photoId);
      if (!url) { url = (await call('stock.photo', { id: item.id })).data; seen.set(item.photoId, url); }
      box.replaceChildren(h('img', { src: url, alt: item.name, class: 'photo-big' }));
    } catch (e) { box.replaceChildren(h('div', { class: 'error-box' }, e.message)); }
  };
  load();
  const actions = canEdit ? [{ label: t('Change photo'), value: 'change' }, { label: t('Remove photo'), value: 'remove', danger: true }] : [];
  const v = await modal((item.tag ? item.tag + ' · ' : '') + item.name, box, actions);
  if (v === 'change') { const id = await takePhoto(item); if (id && onChange) onChange(); }
  if (v === 'remove') {
    await busy(null, async () => { await call('stock.photoSet', { id: item.id, data: '' }); toast(t('Photo removed')); });
    if (onChange) onChange();
  }
}
