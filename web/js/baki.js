/* Baki reminder on WhatsApp: the shop's standard message (Settings), changed before sending if needed. */
import { S, setting, isOwner, refresh } from './state.js';
import { ask, inr, fdate, toast } from './ui.js';
import { openChat } from './bill.js';
import { call } from './api.js';
import { t } from './i18n.js';

/** Standard message per bill language. {name} {amount} {shop} {since} are filled in. */
export const BAKI_DEFAULT = {
  mr: 'नमस्कार {name},\n{shop} येथे आपली उधारी ₹{amount} बाकी आहे ({since} पासून).\nकृपया लवकरात लवकर उधारी जमा करा.\nधन्यवाद 🙏\n{shop}',
  hi: 'नमस्ते {name} जी,\n{shop} में आपकी उधारी ₹{amount} बाकी है ({since} से).\nकृपया जल्द से जल्द उधारी जमा करें.\nधन्यवाद 🙏\n{shop}',
  en: 'Namaste {name},\nYour baki of ₹{amount} at {shop} is pending (since {since}).\nPlease pay it at the earliest.\nThank you 🙏\n{shop}'
};

export function bakiTemplate() {
  return setting('baki_msg', '') || BAKI_DEFAULT[setting('bill_lang', 'en')] || BAKI_DEFAULT.en;
}

export function bakiText(template, r) {
  return String(template)
    .replace(/\{name\}/g, r.customerName || '')
    .replace(/\{amount\}/g, inr(r.due).replace('₹', ''))
    .replace(/\{shop\}/g, setting('shop_name', ''))
    .replace(/\{since\}/g, r.since ? fdate(r.since) : '');
}

/** r: {customerName, mobile, due, since}. Opens the customer's WhatsApp chat with the message typed in. */
export async function sendBakiReminder(r) {
  if (!r.mobile) { toast(t('No mobile number for this customer'), 'err'); return; }
  const fields = [{ key: 'text', label: t('Message (change it if you want)'), type: 'textarea', rows: 7, value: bakiText(bakiTemplate(), r) }];
  if (isOwner()) fields.push({ key: 'keep', label: t('Use this as the standard message?'), options: [{ value: 'no', label: 'Only this time' }, { value: 'yes', label: 'Yes, for everyone' }], value: 'no' });
  const v = await ask(t('WhatsApp') + ' · ' + r.customerName, fields, t('Open WhatsApp'));
  if (!v || !v.text.trim()) return;
  openChat(r.mobile, v.text.trim());
  if (v.keep === 'yes') {
    // Save as a template: the customer's own details go back to {name}, {amount}… so it fits every customer.
    let tpl = v.text.trim();
    const amt = inr(r.due).replace('₹', '');
    [[r.customerName, '{name}'], [amt, '{amount}'], [r.since ? fdate(r.since) : '', '{since}'], [setting('shop_name', ''), '{shop}']]
      .forEach(([val, key]) => { if (val) tpl = tpl.split(val).join(key); });
    try { await call('settings.save', { baki_msg: tpl }); S.settings.baki_msg = tpl; refresh(); toast(t('Saved as the standard message')); } catch (e) { toast(e.message, 'err'); }
  }
}
