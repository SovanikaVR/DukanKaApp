/*
 * Calc — shared calculation engine used by BOTH the phone app and the Apps Script backend.
 * Edit this file only; tools/build.js copies it into dist/Code.gs and web/js/calc.js.
 *
 * - evalFormula: safe evaluator for the admin-editable formulas (no eval()).
 * - loanStatement: day-wise girvi interest with month-by-month breakdown, top-ups and part payments.
 */
var Calc = (function () {
  var FUNCS = {
    min: Math.min, max: Math.max, round: Math.round, ceil: Math.ceil, floor: Math.floor, abs: Math.abs
  };
  var PREC = { '+': 1, '-': 1, '*': 2, '/': 2, 'u-': 3 };

  function tokenize(expr) {
    var s = String(expr || '').replace(/×/g, '*').replace(/÷/g, '/');
    var out = [];
    var i = 0;
    while (i < s.length) {
      var c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) {
        var j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        var n = parseFloat(s.slice(i, j));
        if (isNaN(n)) throw new Error('Bad number in formula');
        out.push({ t: 'num', v: n });
        i = j; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        var k = i;
        while (k < s.length && /[A-Za-z0-9_]/.test(s[k])) k++;
        out.push({ t: 'id', v: s.slice(i, k) });
        i = k; continue;
      }
      if ('+-*/(),%'.indexOf(c) >= 0) { out.push({ t: 'op', v: c }); i++; continue; }
      throw new Error('Formula has an unknown symbol: ' + c);
    }
    return out;
  }

  /** Shunting-yard to reverse polish notation. */
  function toRpn(tokens) {
    var out = [], stack = [], prev = null;
    for (var i = 0; i < tokens.length; i++) {
      var tk = tokens[i];
      if (tk.t === 'num') out.push(tk);
      else if (tk.t === 'id') {
        var nxt = tokens[i + 1];
        if (nxt && nxt.t === 'op' && nxt.v === '(') stack.push({ t: 'fn', v: tk.v.toLowerCase(), argc: 1 });
        else out.push(tk);
      } else if (tk.v === '%') {
        out.push({ t: 'num', v: 100 }); out.push({ t: 'op', v: '/' });
        prev = { t: 'num' }; continue;
      } else if (tk.v === ',') {
        while (stack.length && stack[stack.length - 1].v !== '(') out.push(stack.pop());
        for (var f = stack.length - 1; f >= 0; f--) if (stack[f].t === 'fn') { stack[f].argc++; break; }
      } else if (tk.v === '(') stack.push(tk);
      else if (tk.v === ')') {
        while (stack.length && stack[stack.length - 1].v !== '(') out.push(stack.pop());
        if (!stack.length) throw new Error('Formula brackets do not match');
        stack.pop();
        if (stack.length && stack[stack.length - 1].t === 'fn') out.push(stack.pop());
      } else {
        var op = tk.v;
        var unary = op === '-' && (!prev || (prev.t === 'op' && prev.v !== ')'));
        if (op === '+' && (!prev || (prev.t === 'op' && prev.v !== ')'))) { prev = tk; continue; }
        if (unary) op = 'u-';
        while (stack.length) {
          var top = stack[stack.length - 1];
          if (top.t === 'op' && top.v !== '(' && PREC[top.v] >= PREC[op] && op !== 'u-') out.push(stack.pop());
          else break;
        }
        stack.push({ t: 'op', v: op });
      }
      prev = tk;
    }
    while (stack.length) {
      var x = stack.pop();
      if (x.v === '(') throw new Error('Formula brackets do not match');
      out.push(x);
    }
    return out;
  }

  function evalFormula(expr, vars) {
    var rpn = toRpn(tokenize(expr));
    var st = [];
    vars = vars || {};
    var lower = {};
    Object.keys(vars).forEach(function (k) { lower[k.toLowerCase()] = vars[k]; });
    for (var i = 0; i < rpn.length; i++) {
      var tk = rpn[i];
      if (tk.t === 'num') st.push(tk.v);
      else if (tk.t === 'id') {
        var key = tk.v.toLowerCase();
        if (!(key in lower)) throw new Error('Unknown name in formula: ' + tk.v);
        var v = parseFloat(String(lower[key]).replace(/,/g, ''));
        st.push(isNaN(v) ? 0 : v);
      } else if (tk.t === 'fn') {
        var fn = FUNCS[tk.v];
        if (!fn) throw new Error('Unknown function in formula: ' + tk.v);
        var args = st.splice(st.length - tk.argc, tk.argc);
        st.push(fn.apply(null, args));
      } else if (tk.v === 'u-') {
        st.push(-st.pop());
      } else {
        var b = st.pop(), a = st.pop();
        if (a === undefined || b === undefined) throw new Error('Formula is incomplete');
        if (tk.v === '+') st.push(a + b);
        else if (tk.v === '-') st.push(a - b);
        else if (tk.v === '*') st.push(a * b);
        else if (tk.v === '/') st.push(b === 0 ? 0 : a / b);
      }
    }
    if (st.length !== 1 || isNaN(st[0])) throw new Error('Formula is incomplete');
    return st[0];
  }

  /** Names used in a formula, e.g. ["Principal","Rate","Days"]. */
  function formulaNames(expr) {
    var seen = {};
    var toks = tokenize(expr);
    toks.forEach(function (t, i) {
      var nxt = toks[i + 1];
      if (t.t === 'id' && !(nxt && nxt.v === '(')) seen[t.v] = 1;
    });
    return Object.keys(seen);
  }

  /* ---------- dates (yyyy-MM-dd strings, no timezone surprises) ---------- */

  function parseD(s) {
    var p = String(s).slice(0, 10).split('-');
    return Date.UTC(+p[0], +p[1] - 1, +p[2]);
  }
  function fmtD(t) {
    var d = new Date(t);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(d.getUTCDate()).padStart(2, '0');
  }
  function daysBetween(a, b) { return Math.round((parseD(b) - parseD(a)) / 86400000); }
  function monthEnd(t) {
    var d = new Date(t);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0);
  }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function monthLabel(t) {
    var d = new Date(t);
    return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }

  function r2(n) { return Math.round(n * 100) / 100; }

  /**
   * Girvi statement up to asOf (yyyy-MM-dd).
   * loan: {date, principal, ratePct, formula?, minDays?}
   * txns: [{date, type: topup|interest|part|close, amount}]
   * Interest is worked out day by day on the principal outstanding, shown month by month.
   * A payment first clears interest due, the rest reduces the principal.
   */
  function loanStatement(loan, txns, asOf, opts) {
    opts = opts || {};
    var formula = loan.formula || opts.formula || 'Principal * Rate / 100 * Days / 30';
    var rate = parseFloat(loan.ratePct) || 0;
    var P = parseFloat(String(loan.principal).replace(/,/g, '')) || 0;
    var A = 0;
    var rows = [];
    var cursor = parseD(loan.date);
    var end = parseD(asOf);
    var totalInterest = 0, paidInterest = 0, paidPrincipal = 0;

    function accrue(to) {
      while (cursor < to) {
        var me = monthEnd(cursor);
        if (me <= cursor) me = monthEnd(cursor + 86400000);
        var chunkEnd = Math.min(to, me);
        var days = Math.round((chunkEnd - cursor) / 86400000);
        if (days > 0) {
          var it = r2(evalFormula(formula, { Principal: P, Rate: rate, Days: days }));
          A += it; totalInterest += it;
          var last = rows[rows.length - 1];
          var label = monthLabel(chunkEnd === me ? chunkEnd : cursor + 86400000);
          if (last && last.kind === 'interest' && last.label === label && last.principal === P) {
            last.days += days; last.interest = r2(last.interest + it); last.to = fmtD(chunkEnd);
          } else {
            rows.push({ kind: 'interest', label: label, from: fmtD(cursor), to: fmtD(chunkEnd),
              days: days, principal: P, interest: it });
          }
        }
        cursor = chunkEnd;
      }
    }

    var events = (txns || []).slice().sort(function (a, b) {
      return parseD(a.date) - parseD(b.date);
    });
    var minDays = parseFloat(loan.minDays !== undefined && loan.minDays !== '' ? loan.minDays : opts.minDays) || 0;
    if (opts.noMinimum) minDays = 0;
    var minDone = false;
    var lent = P; // amount lent, with top-ups: the minimum interest is on this, not on what is left
    function addMinimum(onDate) {
      var d = daysBetween(loan.date, onDate);
      if (minDone || !(minDays > 0) || d >= minDays) return;
      var extra = r2(evalFormula(formula, { Principal: lent, Rate: rate, Days: minDays }) - totalInterest);
      minDone = true;
      if (extra <= 0) return;
      A += extra; totalInterest += extra;
      rows.push({ kind: 'minimum', label: 'Minimum ' + minDays + ' days', days: minDays - d, principal: lent, interest: extra });
    }
    events.forEach(function (e) {
      var t = parseD(e.date);
      if (t > end) return;
      accrue(t);
      // Releasing inside the minimum period: the minimum interest is charged before the release payment.
      if (e.type === 'close') addMinimum(e.date);
      var amt = parseFloat(String(e.amount).replace(/,/g, '')) || 0;
      if (e.type === 'topup') {
        P += amt; lent += amt;
        rows.push({ kind: 'topup', date: e.date, amount: amt, principal: P });
      } else if (e.type === 'interest') {
        A -= amt; paidInterest += amt;
        rows.push({ kind: 'payment', date: e.date, amount: amt, interestPart: amt, principalPart: 0 });
      } else {
        var toInt = Math.min(amt, Math.max(A, 0));
        A -= toInt; paidInterest += toInt;
        var toP = amt - toInt;
        P -= toP; paidPrincipal += toP;
        rows.push({ kind: 'payment', date: e.date, amount: amt, interestPart: r2(toInt), principalPart: r2(toP) });
      }
    });
    accrue(end);

    var totalDays = Math.max(daysBetween(loan.date, asOf), 0);
    addMinimum(asOf);

    return {
      rows: rows,
      totalDays: totalDays,
      principal: r2(P),
      interestDue: r2(A),
      totalInterest: r2(totalInterest),
      paidInterest: r2(paidInterest),
      paidPrincipal: r2(paidPrincipal),
      totalDue: Math.round(P + A)
    };
  }

  /** Indian number format: 152000 -> "1,52,000". */
  function inr(n, decimals) {
    var v = parseFloat(n) || 0;
    var neg = v < 0; v = Math.abs(v);
    var d = decimals || 0;
    var s = v.toFixed(d);
    var parts = s.split('.');
    var x = parts[0];
    var last3 = x.slice(-3);
    var rest = x.slice(0, -3);
    if (rest) last3 = ',' + last3;
    rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    return (neg ? '-' : '') + rest + last3 + (d ? '.' + parts[1] : '');
  }

  /** Rupees in words for invoices, e.g. "Twenty Six Thousand Nine Hundred Eighteen". */
  function inWords(num) {
    var a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
      'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    var b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function two(n) { return n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : ''); }
    function three(n) {
      var h = Math.floor(n / 100), r = n % 100;
      return (h ? a[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : '');
    }
    var n = Math.round(Math.abs(parseFloat(num) || 0));
    if (n === 0) return 'Zero';
    var parts = [];
    var crore = Math.floor(n / 10000000); n %= 10000000;
    var lakh = Math.floor(n / 100000); n %= 100000;
    var th = Math.floor(n / 1000); n %= 1000;
    if (crore) parts.push((crore < 100 ? two(crore) : inWords(crore)) + ' Crore');
    if (lakh) parts.push(two(lakh) + ' Lakh');
    if (th) parts.push(two(th) + ' Thousand');
    if (n) parts.push(three(n));
    return parts.join(' ');
  }

  return {
    evalFormula: evalFormula, formulaNames: formulaNames, loanStatement: loanStatement,
    daysBetween: daysBetween, inr: inr, inWords: inWords, r2: r2
  };
})();

if (typeof module !== 'undefined') module.exports = Calc;
