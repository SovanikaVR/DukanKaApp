/* English by default; one tap switches the screens to Hindi. In English mode no Hindi is shown. */

import { HI as MORE } from './i18n-hi.js';

const BASE = {
  'Girvi Loan': 'गिरवी लोन', 'New Sale': 'नई बिक्री', 'Buy Old Gold': 'पुराना सोना', 'Orders': 'ऑर्डर',
  'Stock': 'स्टॉक', 'Reports': 'रिपोर्ट', 'Repair': 'रिपेयर', 'Melting': 'गलाई', 'Wholesaler': 'होलसेलर',
  'Karigar': 'कारीगर', 'Settings': 'सेटिंग', 'Cash book': 'कैश बुक', 'Bills': 'बिल',
  "Today's rate": 'आज का भाव', 'Edit': 'बदलें', 'Search name, surname, mobile…': 'नाम, सरनेम, मोबाइल से खोजें…',
  'Needs attention today': 'आज ध्यान दें', 'Order deliveries due': 'आज की डिलीवरी', 'Late orders': 'लेट ऑर्डर',
  'Loans older than 12 months': '12 महीने से पुराने लोन', 'Repairs ready to hand over': 'तैयार रिपेयर',
  'Save': 'सेव करें', 'Cancel': 'रद्द करें', 'Yes': 'हाँ', 'Back': 'वापस', 'Please wait…': 'रुकिए…',
  'Loading…': 'लोड हो रहा है…', 'Mobile number': 'मोबाइल नंबर', 'First name': 'नाम', 'Surname': 'सरनेम',
  'Village': 'गाँव', 'Item': 'आइटम', 'Weight (g)': 'वजन (g)', 'Rate ₹/g': 'भाव ₹/g', 'Making ₹/g': 'मेकिंग ₹/g',
  'Purity %': 'प्योरिटी %', 'Cash': 'कैश', 'UPI': 'UPI', 'Udhaar': 'उधार', 'Save bill': 'बिल सेव करें',
  'GST bill': 'GST बिल', 'Non-GST (estimate)': 'बिना GST (एस्टिमेट)', 'Old gold taken in': 'पुराना सोना लिया',
  'Customer cut %': 'ग्राहक कटौती %', 'Our purity estimate %': 'हमारा प्योरिटी अंदाज़ %',
  'Loan amount (₹)': 'लोन राशि (₹)', 'Interest ₹ per 100 / month': 'ब्याज ₹ प्रति 100 / माह',
  'Release girvi': 'गिरवी छुड़ाना', 'Take from customer': 'ग्राहक से लेना', 'Pay to customer': 'ग्राहक को देना',
  'Send PDF on WhatsApp': 'WhatsApp पर PDF भेजें', 'Print': 'प्रिंट', 'Download PDF': 'PDF डाउनलोड',
  'Log out': 'लॉग आउट', 'Log in': 'लॉग इन', 'Login name': 'लॉगिन नाम', 'PIN': 'पिन',
  'New customer': 'नया ग्राहक', 'Customer': 'ग्राहक', 'Delivery date': 'डिलीवरी तारीख', 'Date': 'तारीख',
  'Profit today': 'आज का प्रॉफिट', 'Total': 'कुल', 'Balance': 'बाकी', 'Advance': 'एडवांस'
};
const HI = Object.assign({}, BASE, MORE);


let lang = (() => { try { return localStorage.getItem('dk_lang') || 'en'; } catch (e) { return 'en'; } })();

export function t(s) {
  if (lang !== 'hi' || typeof s !== 'string') return s;
  if (HI[s]) return HI[s];
  const k = s.trim();
  if (k !== s && HI[k]) return s.replace(k, HI[k]);
  return s;
}
export function getLang() { return lang; }
export function setLang(l) {
  lang = l === 'hi' ? 'hi' : 'en';
  try { localStorage.setItem('dk_lang', lang); } catch (e) { /* ignore */ }
  document.documentElement.lang = lang;
}
