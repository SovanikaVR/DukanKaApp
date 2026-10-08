// Builds docs/USER_GUIDE.md (Hindi + English) from web/js/help-content.js, so the app help and the guide never differ.
import { writeFileSync } from 'fs';
import { HELP } from '../web/js/help-content.js';

const VIDEO = { start: 1, sale: 1, girvi: 1, orders: 1, dues: 1, mistakes: 1 };
const APP = 'https://sovanikavr.github.io/DukanKaApp/';
let md = `# DukanKaApp — User guide / उपयोग गाइड

Every part of the app, step by step, in Hindi and English. The same guide is inside the app: tap **Help / मदद** on Home, or the **?** at the top of any screen.

ऐप का हर हिस्सा, कदम-दर-कदम, हिंदी और अंग्रेज़ी में। यही गाइड ऐप के अंदर भी है: होम पर **मदद** दबाएँ, या किसी भी स्क्रीन पर ऊपर **?** दबाएँ।

**Videos (Hindi) / वीडियो (हिंदी):** ${Object.keys(VIDEO).map((k) => `[${HELP.find((x) => x.id === k).title.hi}](${APP}videos/${k}.mp4)`).join(' · ')}

## Contents / विषय

${HELP.map((x, i) => `${i + 1}. [${x.title.hi} — ${x.title.en}](#${x.id})`).join('\n')}

`;
for (const x of HELP) {
  md += `<a id="${x.id}"></a>\n\n## ${x.title.hi} — ${x.title.en}\n\n`;
  if (VIDEO[x.id]) md += `▶ **वीडियो / Video:** [${x.id}.mp4](${APP}videos/${x.id}.mp4)\n\n`;
  md += `**हिंदी**\n\n${x.what.hi}\n\n${x.steps.map((s, i) => `${i + 1}. ${s.hi}`).join('\n')}\n\n`;
  if (x.tips.length) md += `ध्यान दें:\n\n${x.tips.map((s) => `- ${s.hi}`).join('\n')}\n\n`;
  md += `**English**\n\n${x.what.en}\n\n${x.steps.map((s, i) => `${i + 1}. ${s.en}`).join('\n')}\n\n`;
  if (x.tips.length) md += `Good to know:\n\n${x.tips.map((s) => `- ${s.en}`).join('\n')}\n\n`;
}
writeFileSync(new URL('../docs/USER_GUIDE.md', import.meta.url), md);
console.log('Wrote docs/USER_GUIDE.md');
