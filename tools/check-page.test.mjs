// node --test tools/check-page.test.mjs  (needs Chrome; CHROME=<binary> to choose one)
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
function check(page) {
  try {
    return { code: 0, report: JSON.parse(execFileSync("node", [join(here, "check-page.mjs"), "--json", join(here, "fixtures", page)], { encoding: "utf8" })) };
  } catch (err) {
    return { code: err.status, report: err.stdout ? JSON.parse(err.stdout) : null, stderr: String(err.stderr) };
  }
}

test("a page with every mistake fails each check", () => {
  const { code, report } = check("bad.html");
  assert.equal(code, 1);
  const narrow = report.find((r) => r.width === 375).findings;
  const kinds = new Set(narrow.map((f) => f.check));
  for (const k of ["moves", "overflow", "clipped", "headings", "targets", "contrast"]) assert.ok(kinds.has(k), `no ${k} finding`);
  assert.ok(narrow.some((f) => f.check === "moves" && /hover/.test(f.detail) && /Hover me/.test(f.what)));
  assert.ok(narrow.some((f) => f.check === "moves" && /focus/.test(f.detail)));
  assert.ok(narrow.some((f) => f.check === "clipped" && /placeholder/.test(f.detail)));
  assert.ok(narrow.some((f) => f.check === "clipped" && /div\.cut/.test(f.what)));
});

test("a page with none passes at both widths", () => {
  const { code, report, stderr } = check("good.html");
  assert.equal(code, 0, JSON.stringify(report ?? stderr));
  assert.deepEqual(report.map((r) => r.width), [375, 1280]);
});

test("a page that is not HTML cannot be checked", () => {
  const { code } = check("../check-page.mjs");
  assert.equal(code, 2);
});
