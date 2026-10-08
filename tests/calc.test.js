/* Checks for the shared formula engine and girvi interest.  Run: npm test */
const assert = require('assert');
const C = require('../shared/calc.js');

assert.strictEqual(C.evalFormula('Principal * Rate / 100 * Days / 30', { Principal: 60000, Rate: 2, Days: 116 }), 4640);
assert.strictEqual(C.evalFormula('Weight × (100 − Cut) / 100'.replace('−', '-'), { Weight: 10, Cut: 20 }), 8);
assert.strictEqual(C.evalFormula('-2 + 3 * -(1+1)', {}), -8);
assert.strictEqual(C.evalFormula('max(10, 5*3) - Cut% * 100', { Cut: 20 }), -5);
assert.strictEqual(C.evalFormula('round(Weight * Rate)', { weight: 2.25, rate: 15300 }), 34425);
assert.throws(() => C.evalFormula('Principal * ', { Principal: 1 }));
assert.throws(() => C.evalFormula('Foo + 1', {}));
assert.deepStrictEqual(C.formulaNames('Principal * Rate / 100 * Days / 30'), ['Principal', 'Rate', 'Days']);

const s = C.loanStatement({ date: '2026-06-14', principal: 60000, ratePct: 2 }, [], '2026-10-08');
assert.deepStrictEqual(s.rows.map((r) => [r.label, r.days, r.interest]),
  [['Jun 2026', 16, 640], ['Jul 2026', 31, 1240], ['Aug 2026', 31, 1240], ['Sep 2026', 30, 1200], ['Oct 2026', 8, 320]]);
assert.strictEqual(s.totalDue, 64640);

const m = C.loanStatement({ date: '2026-10-01', principal: 10000, ratePct: 3, minDays: 30 }, [], '2026-10-08');
assert.strictEqual(m.totalInterest, 300);

assert.strictEqual(C.inr(152000), '1,52,000');
assert.strictEqual(C.inr(26918.5, 2), '26,918.50');
assert.strictEqual(C.inWords(26918), 'Twenty Six Thousand Nine Hundred Eighteen');
console.log('calc: all checks passed');
