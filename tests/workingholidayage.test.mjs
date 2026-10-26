import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';
const html = readFileSync(new URL('../workingholidayage/index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
function load(today = '2026-10-26T12:00:00') {
  const elements = new Map();
  class Element {
    constructor(id = '') { this.id = id; this.value = ''; this.style = {}; this.dataset = {}; this.attrs = {}; this.options = []; this.children = []; this.listeners = {}; this.hidden = false; this.classList = { toggle() {} }; this._html = ''; }
    set innerHTML(value) { this._html = value; this.value = ''; this.options = []; }
    get innerHTML() { return this._html; }
    add(option) { this.options.push(option); }
    addEventListener(event, handler) { this.listeners[event] = handler; }
    appendChild(child) { this.children.push(child); if (child.id) elements.set(child.id, child); }
    insertBefore(child) { assert.ok(child, 'selected country introduction must exist'); }
    setAttribute(name, value) { this.attrs[name] = value; }
    removeAttribute(name) { delete this.attrs[name]; }
    focus() { this.focused = true; }
    getBoundingClientRect() { return { top: 0 }; }
  }
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) elements.set(id, new Element(id));
  const calculator = new Element();
  const document = {
    documentElement: new Element(),
    getElementById: id => elements.get(id) || null,
    createElement: () => new Element(),
    getElementsByTagName: () => [{ parentNode: { insertBefore() {} } }],
    querySelector: selector => selector === '.map-section .calculator' ? calculator : null,
    querySelectorAll: selector => selector === '.country-card' ? elements.get('countryList').children : [],
  };
  class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : [today])); } }
  const stored = new Map();
  const context = vm.createContext({ document, Date: FixedDate, Option: class { constructor(text, value) { this.text = text; this.value = value; } }, localStorage: { getItem: k => stored.get(k), setItem: (k,v) => stored.set(k,v) }, window: { matchMedia: () => ({ matches: false, addEventListener() {} }), scrollTo() {}, innerHeight: 800, scrollY: 0 } });
  Object.defineProperty(context, "dataLayer", { get: () => context.window.dataLayer });
  scripts.forEach(s => vm.runInContext(s, context));
  const run = code => vm.runInContext(code, context);
  const birth = (y,m,d) => { for (const [id,v] of [['year',y],['month',m],['day',d]]) elements.get(id).value = String(v); };
  return { elements, run, birth, stored };
}
test('initial render, country selection, theme and source display', () => {
  const app = load();
  assert.equal(app.elements.get('countryPicker').options.length,29);
  assert.equal(app.elements.get('countryList').children.length,29);
  assert.match(app.elements.get('result').innerHTML,/재외동포청/);
  app.run('selectCountry("japan")');
  assert.equal(app.elements.get('countryPicker').value,'japan');
  assert.match(app.elements.get('ageRule').textContent,/만 30세/);
  app.elements.get('themeToggle').listeners.click();
  assert.equal(app.stored.get('workingholidayage-theme'),'dark');
});
test('missing, invalid and future birth dates show inline errors and focus', () => {
  const app = load();
  app.run('findEligibleCountries()');
  assert.match(app.elements.get('birthError').textContent,/모두 선택/);
  assert.ok(app.elements.get('year').focused);
  app.birth(2026,10,27); app.run('findEligibleCountries()');
  assert.match(app.elements.get('birthError').textContent,/미래/);
  app.birth(2001,2,29); app.run('findEligibleCountries()');
  assert.match(app.elements.get('birthError').textContent,/올바른 날짜/);
});
test('18th birthday begins eligibility and 36th birthday ends Canadian eligibility', () => {
  const app = load();
  app.birth(2008,10,27); app.run('calculateAge()');
  assert.match(app.elements.get('result').innerHTML,/아직 연령 기준 미충족/);
  app.birth(2008,10,26); app.run('calculateAge()');
  assert.match(app.elements.get('result').innerHTML,/🟢 연령 기준 충족/);
  app.birth(1990,10,27); app.run('calculateAge()');
  assert.match(app.elements.get('result').innerHTML,/D-0/);
  app.birth(1990,10,26); app.run('calculateAge()');
  assert.match(app.elements.get('result').innerHTML,/연령 기준 초과/);
});
test('Japan exception is explained in selected and overall results', () => {
  const app = load(); app.birth(1998,10,26); app.run('selectCountry("japan")');
  assert.match(app.elements.get('result').innerHTML,/예외 확인 필요/);
  app.run('findEligibleCountries()');
  const output = app.elements.get('allCountriesResult').innerHTML;
  assert.match(output,/만 26~30세/);
  assert.doesNotMatch(output,/data-country-code="japan"/);
  assert.doesNotMatch(output,/data-country-code="finland"/);
  assert.match(output,/계산 기준일/);
});
test('no matches and pending country still offer explanation and sources', () => {
  const app = load(); app.birth(1980,1,1); app.run('findEligibleCountries()');
  assert.match(app.elements.get('allCountriesResult').innerHTML,/기본 연령 기준을 충족하는 국가·지역이 없습니다/);
  app.run('selectCountry("finland")');
  assert.match(app.elements.get('result').innerHTML,/발효 예정/);
  assert.match(app.elements.get('result').innerHTML,/https:\/\/whic/);
});
test('leap birthday and calendar-day countdown across daylight saving', () => {
  const app = load('2027-02-28T12:00:00'); app.birth(1996,2,29); app.run('selectCountry("netherlands")');
  assert.match(app.elements.get('result').innerHTML,/D-0/);
  assert.match(app.elements.get('result').innerHTML,/2027년 2월 28일/);
  const dst = load('2026-03-08T12:00:00'); dst.birth(1990,3,10); dst.run('calculateAge()');
  assert.match(dst.elements.get('result').innerHTML,/D-1/);
});
test('result clearing, month length and nested disclosure keyboard handling', () => {
  const app = load(); app.birth(2000,1,31);
  app.elements.get('month').value='2'; app.elements.get('month').listeners.change();
  assert.equal(app.elements.get('day').value,'');
  assert.equal(app.elements.get('day').options.length,29);
  let prevented=false;
  app.elements.get('allCountriesResult').listeners.keydown({ key:'Enter', target:{ closest: selector => selector === 'details, summary, a, button' ? {} : null }, preventDefault(){prevented=true;} });
  assert.equal(prevented,false);
});
test('registered age rules are preserved from the backup', () => {
  const original=readFileSync(new URL('../backups/workingholidayage/original-2026-10-26/index.html',import.meta.url),'utf8');
  const rules = s => [...s.matchAll(/(\w+):\s*\{ name: "([^"]+)",\s*flag: "[^"]+", minAge: (\d+), maxAge: (\d+)(, pending: true)? \}/g)].map(m=>m.slice(1));
  assert.equal(rules(html).length,29);
  assert.deepEqual(rules(html),rules(original));
});
