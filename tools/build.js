#!/usr/bin/env node
/**
 * Builds the single-file backend (dist/Code.gs) that the shop owner pastes into Apps Script,
 * and copies the shared calculation engine into the web app.
 *   node tools/build.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const calc = fs.readFileSync(path.join(root, 'shared/calc.js'), 'utf8');
const srcDir = path.join(root, 'apps-script/src');
const parts = fs.readdirSync(srcDir).filter((f) => f.endsWith('.js')).sort();

let out = '/* DukanKaApp backend — GENERATED FILE, do not edit. Source: apps-script/src + shared/calc.js */\n\n';
out += parts.map((f) => `/* ===== ${f} ===== */\n` + fs.readFileSync(path.join(srcDir, f), 'utf8')).join('\n');
out += '\n/* ===== shared/calc.js ===== */\n' + calc;

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/Code.gs'), out);
fs.copyFileSync(path.join(root, 'apps-script/appsscript.json'), path.join(root, 'dist/appsscript.json'));
fs.writeFileSync(path.join(root, 'web/js/calc.js'),
  '/* Copied from shared/calc.js by tools/build.js — edit that file instead. */\n' + calc);
console.log('Built dist/Code.gs (' + Math.round(out.length / 1024) + ' KB) and web/js/calc.js');
