#!/usr/bin/env node
// Check a rendered page for the layout mistakes a person sees at once, in headless Chrome:
//   moves    hovering or focusing a control moves other elements (a state that changes size)
//   overflow the page scrolls sideways, or an element sticks out of the viewport
//   clipped  text cut off inside a box, with no ellipsis or line clamp to say so
//   headings a lower heading renders larger than a higher one (an h2 bigger than the h1)
//   targets  a control smaller than 24 x 24 px, or a field's text under 16 px, at a phone width
//   contrast text below WCAG AA against its background (4.5:1, 3:1 for large text), light and dark
// Each page is loaded at every width (375 and 1280 by default) with device emulation, since headless
// Chrome's window never goes below 500 px. Elements inside [data-check-skip] are not checked.
//
// usage: node tools/check-page.mjs [--widths 375,1280] [--shots DIR] [--json] [--only a,b] URL|FILE ...
// CHROME=<Chrome binary> overrides the browser. Exit 0: no findings; 1: findings; 2: could not check.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CHECKS = ["moves", "overflow", "clipped", "headings", "targets", "contrast"];
const args = process.argv.slice(2);
const opt = { widths: [375, 1280], shots: "", json: false, only: CHECKS };
const urls = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--widths") opt.widths = args[++i].split(",").map(Number);
  else if (a === "--shots") opt.shots = args[++i];
  else if (a === "--json") opt.json = true;
  else if (a === "--only") opt.only = args[++i].split(",");
  else if (a.startsWith("--")) usage(`unknown option ${a}`);
  else urls.push(/^[a-z]+:/i.test(a) ? a : pathToFileURL(resolve(a)).href);
}
if (!urls.length) usage("no page given");
for (const c of opt.only) if (!CHECKS.includes(c)) usage(`unknown check ${c}; checks: ${CHECKS.join(", ")}`);
if (opt.widths.some((w) => !(w >= 200 && w <= 4000))) usage("--widths takes numbers like 375,1280");

function usage(msg) {
  console.error(`check-page: ${msg}\nusage: node tools/check-page.mjs [--widths 375,1280] [--shots DIR] [--json] ` +
    `[--only ${CHECKS.join(",")}] URL|FILE ...`);
  process.exit(2);
}

function chromePath() {
  if (process.env.CHROME) return process.env.CHROME;
  const known = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium", "/usr/bin/google-chrome", "/usr/bin/chromium"];
  const found = known.find((p) => existsSync(p));
  if (!found) usage("no Chrome found; set CHROME to the Chrome binary");
  return found;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "check-page-"));
const proc = spawn(chromePath(), ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--remote-debugging-port=0",
  "--no-first-run", "--no-default-browser-check", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
function quit(code) {
  proc.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(code);
}

let port;
for (let i = 0; i < 100 && !port; i++) {
  await sleep(100);
  try { port = readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n")[0]; } catch {}
}
if (!port) { console.error("check-page: Chrome did not start"); quit(2); }
let target;
for (let i = 0; i < 50 && !target; i++) {
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {}
  if (!target) await sleep(100);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let seq = 0;
const waiting = new Map();
const events = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && waiting.has(m.id)) {
    const { ok, fail } = waiting.get(m.id);
    waiting.delete(m.id);
    m.error ? fail(new Error(`${m.error.message}`)) : ok(m.result);
  } else if (m.method && events.has(m.method)) events.get(m.method)(m.params);
});
function send(method, params = {}) {
  return new Promise((ok, fail) => {
    const id = ++seq;
    waiting.set(id, { ok, fail });
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => waiting.has(id) && (waiting.delete(id), fail(new Error(`${method} timed out`))), 20000);
  });
}
async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
const once = (method) => new Promise((r) => events.set(method, (p) => { events.delete(method); r(p); }));

// Runs in the page: measures, and the checks that need only the DOM.
const PAGE_LIB = String.raw`(() => {
  const skip = (el) => !!el.closest("[data-check-skip]");
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.opacity !== "0"; };
  const describe = (el) => { let d = el.tagName.toLowerCase();
    if (el.id) d += "#" + el.id;
    if (el.classList.length) d += "." + [...el.classList].slice(0, 3).join(".");
    if (el.type && el.tagName === "INPUT") d += "[type=" + el.type + "]";
    const t = (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ");
    return t ? d + ' "' + t.slice(0, 40) + '"' : d; };
  const CONTROLS = "a[href], button, input:not([type=hidden]), select, textarea, summary, label, [tabindex]:not([tabindex='-1']), [role=button]";
  const lib = { describe };
  lib.controls = () => { const els = [...document.querySelectorAll(CONTROLS)].filter((el) => !skip(el) && visible(el));
    window.__ck_controls = els; return els.length; };
  const outOfFlow = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) {
    const p = getComputedStyle(e).position; if (p === "absolute" || p === "fixed" || p === "sticky") return true; } return false; };
  const near = (el) => { const r = el.getBoundingClientRect(); return r.bottom > -innerHeight && r.top < 2 * innerHeight; };
  lib.prepare = (i) => { const c = window.__ck_controls[i];
    c.scrollIntoView({ block: "center", inline: "nearest" });
    window.__ck_watch = [...document.body.querySelectorAll("*")].filter((el) => el !== c && !c.contains(el) && !el.contains(c)
      && !skip(el) && !outOfFlow(el) && near(el));
    const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, what: describe(c) }; };
  lib.snap = () => window.__ck_watch.map((el) => { const r = el.getBoundingClientRect();
    return [r.left + scrollX, r.top + scrollY, r.width, r.height]; });
  lib.settle = async () => { let a = lib.snap();
    for (let t = 0; t < 10; t++) { await new Promise((r) => setTimeout(r, 100)); const b = lib.snap();
      if (!lib.moved(a, b).n) { window.__ck_base = b; return true; } a = b; }
    return false; };
  lib.since = () => lib.moved(window.__ck_base, lib.snap());
  lib.focus = (i) => { window.__ck_controls[i].focus({ preventScroll: true }); };
  lib.blur = (i) => { window.__ck_controls[i].blur(); };
  lib.moved = (a, b) => { let n = 0, worst = 0, example = "";
    for (let k = 0; k < a.length; k++) { const d = Math.max(...a[k].map((v, j) => Math.abs(v - b[k][j])));
      if (d > 0.5) { n++; if (d > worst) { worst = d; example = describe(window.__ck_watch[k]); } } }
    return { n, worst: Math.round(worst * 10) / 10, example }; };
  const scrollsX = (el) => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
    const o = getComputedStyle(e).overflowX; if (o !== "visible") return true; } return false; };
  lib.overflow = () => { const out = []; const vw = document.documentElement.clientWidth;
    const sw = document.scrollingElement.scrollWidth;
    if (sw > vw + 1) out.push({ check: "overflow", what: "page", detail: "scrolls sideways: " + sw + " px wide in a " + vw + " px viewport" });
    for (const el of document.body.querySelectorAll("*")) { if (skip(el) || !visible(el) || scrollsX(el)) continue;
      const r = el.getBoundingClientRect(); if (r.right > vw + 1 && r.left < vw) {
        out.push({ check: "overflow", what: describe(el), detail: "right edge at " + Math.round(r.right) + " px, viewport " + vw + " px" });
        if (out.length > 6) break; } }
    return out; };
  const pen = document.createElement("canvas").getContext("2d");
  lib.clipped = () => { const out = [];
    for (const el of document.querySelectorAll("input[placeholder], textarea[placeholder]")) {
      if (skip(el) || !visible(el) || el.value || el.tagName === "TEXTAREA") continue;
      const s = getComputedStyle(el), ph = getComputedStyle(el, "::placeholder");
      pen.font = ph.font || s.font;
      const room = el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
      const need = pen.measureText(el.placeholder).width;
      if (need > room + 1) out.push({ check: "clipped", what: describe(el), detail: "placeholder \"" + el.placeholder.slice(0, 40) + "\" needs " + Math.round(need) + " px, the field shows " + Math.round(room) });
    }
    for (const el of document.body.querySelectorAll("*")) { if (skip(el) || !visible(el)) continue;
      if (["INPUT", "SELECT", "TEXTAREA", "IMG", "VIDEO", "CANVAS", "IFRAME", "svg"].includes(el.tagName)) continue;
      const s = getComputedStyle(el);
      const hidesX = ["hidden", "clip"].includes(s.overflowX), hidesY = ["hidden", "clip"].includes(s.overflowY);
      if (!hidesX && !hidesY) continue;
      if (s.textOverflow === "ellipsis" || s.webkitLineClamp !== "none" && s.webkitLineClamp) continue;
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const cutX = hidesX && el.scrollWidth > el.clientWidth + 1, cutY = hidesY && el.scrollHeight > el.clientHeight + 1;
      if (cutX || cutY) out.push({ check: "clipped", what: describe(el), detail: "text cut off " + (cutX ? "at the side" : "at the bottom") + " with no ellipsis" });
      if (out.length > 10) break; }
    return out; };
  lib.headings = () => { const hs = [...document.querySelectorAll("h1,h2,h3,h4")].filter((h) => !skip(h) && visible(h))
      .map((h) => ({ level: +h.tagName[1], size: parseFloat(getComputedStyle(h).fontSize), what: describe(h) }));
    const out = []; const seen = new Set();
    for (const lo of hs) for (const hi of hs) if (hi.level < lo.level && lo.size > hi.size + 0.5) {
      const key = hi.level + ">" + lo.level; if (seen.has(key)) continue; seen.add(key);
      out.push({ check: "headings", what: lo.what, detail: "h" + lo.level + " renders at " + lo.size + " px, larger than h" + hi.level + " " + hi.what + " at " + hi.size + " px" }); }
    return out; };
  lib.targets = () => { const out = [];
    const els = document.querySelectorAll("button, select, summary, input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]), a.button, [role=button]");
    for (const el of els) { if (skip(el) || !visible(el)) continue; const r = el.getBoundingClientRect();
      if (r.width < 24 || r.height < 24) out.push({ check: "targets", what: describe(el), detail: Math.round(r.width) + " x " + Math.round(r.height) + " px, under 24 x 24" });
      if (out.length > 10) break; }
    for (const el of document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]):not([type=color]), select, textarea")) {
      if (skip(el) || !visible(el)) continue; const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 16) out.push({ check: "targets", what: describe(el), detail: "text at " + fs + " px: iOS zooms into a field under 16 px" });
      if (out.length > 14) break; }
    return out; };
  const parse = (c) => { let m = c.match(/^rgba?\(([\d.]+),?\s*([\d.]+),?\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\)/);
    if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : +m[4]];
    m = c.match(/^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.]+))?\)/);
    if (m) return [m[1] * 255, m[2] * 255, m[3] * 255, m[4] === undefined ? 1 : +m[4]];
    return null; };
  const over = (top, under) => { const a = top[3]; return [0, 1, 2].map((k) => top[k] * a + under[k] * (1 - a)).concat(1); };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const backdrop = (el) => { const layers = []; let opacity = 1;
    for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e);
      opacity *= parseFloat(s.opacity);
      if (s.backgroundImage !== "none") return null;
      const c = parse(s.backgroundColor); if (c === null) return null;
      if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } }
    let bg = parse(getComputedStyle(document.documentElement).backgroundColor) || [255, 255, 255, 1];
    if (bg[3] < 1) bg = over(bg, [255, 255, 255, 1]);
    for (const l of layers.reverse()) bg = over(l, bg);
    return { bg, opacity }; };
  lib.contrast = () => { const groups = new Map(); let unknown = 0;
    for (const el of document.body.querySelectorAll("*")) { if (skip(el) || !visible(el) || el.disabled) continue;
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const s = getComputedStyle(el); const fg = parse(s.color); const b = backdrop(el);
      if (!fg || !b) { unknown++; continue; }
      const text = over([fg[0], fg[1], fg[2], fg[3] * b.opacity], b.bg);
      const size = parseFloat(s.fontSize), bold = parseInt(s.fontWeight) >= 700;
      const need = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
      const r = ratio(text, b.bg);
      if (r + 0.005 < need) { const key = s.color + "|" + b.opacity.toFixed(2) + "|" + b.bg.map(Math.round).join(",");
        const g = groups.get(key) || { n: 0, r, need, what: describe(el) }; g.n++; groups.set(key, g); } }
    return [...groups.values()].sort((a, b) => a.r - b.r).slice(0, 8).map((g) => ({ check: "contrast", what: g.what,
      detail: "contrast " + g.r.toFixed(2) + ":1, needs " + g.need + ":1" + (g.n > 1 ? " (" + g.n + " elements like it)" : "") })); };
  window.__ck = lib;
})()`;

async function load(url, width, scheme) {
  await send("Emulation.setDeviceMetricsOverride", { width, height: 800, deviceScaleFactor: width < 600 ? 2 : 1, mobile: width < 600 });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme },
    { name: "prefers-reduced-motion", value: "reduce" }] });
  const loaded = once("Page.loadEventFired");
  const nav = await send("Page.navigate", { url });
  if (nav.errorText) throw new Error(`could not load ${url}: ${nav.errorText}`);
  await Promise.race([loaded, sleep(15000)]);
  const type = await evaluate("document.contentType");
  if (!/html/.test(type)) throw new Error(`${url} answered ${type}, not an HTML page`);
  await evaluate("document.fonts.ready.then(() => true)");
  await evaluate(`(() => { const s = document.createElement("style"); s.setAttribute("data-check-skip", "");
    s.textContent = "*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }";
    document.head.appendChild(s); })()`);
  await sleep(150);
  await evaluate(PAGE_LIB);
}

async function moves() {
  const out = [];
  const n = await evaluate("__ck.controls()");
  const limit = Math.min(n, 250);
  let unsettled = 0;
  const away = () => send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 0, y: 0 });
  for (let i = 0; i < limit; i++) {
    const c = await evaluate(`__ck.prepare(${i})`);
    await away();
    if (!(await evaluate("__ck.settle()"))) { unsettled++; continue; }
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: c.x, y: c.y });
    // A move counts only when it undoes itself once the state ends; one that stays was the
    // page moving on its own (rendering on scroll, late content), not the hover.
    const hovered = await evaluate("__ck.since()");
    await away();
    if (hovered.n && (await evaluate("__ck.since()")).n) { unsettled++; continue; }
    await evaluate(`__ck.focus(${i})`);
    const focused = await evaluate("__ck.since()");
    await evaluate(`__ck.blur(${i})`);
    if (focused.n && (await evaluate("__ck.since()")).n) { unsettled++; continue; }
    for (const [state, m] of [["hover", hovered], ["focus", focused]]) {
      if (m.n) out.push({ check: "moves", what: c.what, detail: `${state} moves ${m.n} other element${m.n > 1 ? "s" : ""} by up to ${m.worst} px (e.g. ${m.example})` });
    }
  }
  if (unsettled) out.push({ check: "note", what: "page", detail: `${unsettled} control${unsettled > 1 ? "s" : ""} not hovered: the page kept moving on its own (late images, rendering on scroll, animation)` });
  if (n > limit) out.push({ check: "note", what: "page", detail: `only the first ${limit} of ${n} controls were hovered` });
  return out;
}

const report = [];
let failed = false;
await send("Page.enable");
for (const url of urls) {
  for (const width of opt.widths) {
    const found = [];
    try {
      for (const scheme of ["dark", "light"]) {
        await load(url, width, scheme);
        if (opt.only.includes("contrast")) found.push(...(await evaluate("__ck.contrast()")).map((f) => ({ ...f, detail: `${scheme}: ${f.detail}` })));
        if (opt.shots) {
          mkdirSync(opt.shots, { recursive: true });
          const { cssContentSize } = await send("Page.getLayoutMetrics");
          const h = Math.min(Math.ceil(cssContentSize.height), 6000);
          const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: h, scale: 1 } });
          const name = (new URL(url).pathname.replace(/\/$/, "/index").split("/").filter(Boolean).join("-") || "index").replace(/\.html?$/, "");
          const file = join(opt.shots, `${name}-${width}-${scheme}.png`);
          writeFileSync(file, Buffer.from(shot.data, "base64"));
          if (!opt.json) console.log(`shot ${file}`);
        }
        if (scheme === "light") continue;
        for (const check of ["overflow", "clipped", "headings"]) if (opt.only.includes(check)) found.push(...await evaluate(`__ck.${check}()`));
        if (width < 600 && opt.only.includes("targets")) found.push(...await evaluate("__ck.targets()"));
        if (opt.only.includes("moves")) found.push(...await moves());
      }
    } catch (err) {
      console.error(`check-page: ${url} at ${width} px: ${err.message}`);
      quit(2);
    }
    const notes = found.filter((f) => f.check === "note");
    const findings = found.filter((f) => f.check !== "note");
    report.push({ url, width, findings, notes });
    if (findings.length) failed = true;
  }
}
if (opt.json) console.log(JSON.stringify(report, null, 2));
else for (const r of report) {
  console.log(`${r.findings.length ? "FAIL" : "ok  "} ${r.url} at ${r.width} px${r.findings.length ? `: ${r.findings.length} finding${r.findings.length > 1 ? "s" : ""}` : ""}`);
  for (const f of r.findings) console.log(`  ${f.check.padEnd(8)} ${f.what}: ${f.detail}`);
  for (const f of r.notes) console.log(`  note     ${f.detail}`);
}
ws.close();
quit(failed ? 1 : 0);
