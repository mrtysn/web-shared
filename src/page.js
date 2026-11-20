/* Page runtime shared by every house page: the theme follows the reader's preference, links
   open in a new tab, and the contents column marks the section being read. page-vendor writes
   this file, followed by font-picker.js, as ws/page.js. */
(function () {
  var media = matchMedia("(prefers-color-scheme: light)");
  /* A page drawn for one theme says so with <html data-theme-fixed="light">: its colours then
     never mix with the other theme's tokens. */
  var fixed = document.documentElement.getAttribute("data-theme-fixed");
  function theme() {
    document.documentElement.dataset.theme = fixed || (media.matches ? "light" : "dark");
  }
  theme();
  media.addEventListener("change", theme);
})();
document.addEventListener("DOMContentLoaded", function () {
  [].forEach.call(document.querySelectorAll('a[href]:not([href^="#"])'), function (a) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  });
  // Every code block in the text gets a Copy button: pages often carry text meant to be pasted
  // elsewhere. The clipboard API needs a secure context; a selection copy stands in without one.
  [].forEach.call(document.querySelectorAll("main pre"), function (pre) {
    if (pre.closest(".ws-no-copy")) return;
    var wrap = document.createElement("div"), button = document.createElement("button");
    wrap.className = "ws-copy-wrap";
    button.type = "button";
    button.className = "ws-copy";
    button.textContent = "Copy";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(button);
    wrap.appendChild(pre);
    function done(label) {
      button.textContent = label;
      setTimeout(function () { button.textContent = "Copy"; }, 1500);
    }
    function fallback(text) {
      var area = document.createElement("textarea"), ok = false;
      area.value = text;
      area.setAttribute("readonly", "");
      area.className = "ws-copy-buffer";
      document.body.appendChild(area);
      area.select();
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(area);
      done(ok ? "Copied" : "Copy failed");
    }
    button.addEventListener("click", function () {
      var text = pre.textContent.replace(/\n$/, "");
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done("Copied"); }, function () { fallback(text); });
      } else {
        fallback(text);
      }
    });
  });
  var links = [].slice.call(document.querySelectorAll(".ws-toc a"));
  if (!links.length) return;
  var sections = links.map(function (a) {
    return document.getElementById(a.getAttribute("href").slice(1));
  });
  function mark() {
    var at = window.innerHeight * 0.3, current = 0, k;
    for (k = 0; k < sections.length; k++) {
      if (sections[k] && sections[k].getBoundingClientRect().top <= at) current = k;
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = sections.length - 1;
    links.forEach(function (a, n) {
      a.setAttribute("aria-current", n === current ? "true" : "false");
    });
  }
  addEventListener("scroll", mark, { passive: true });
  addEventListener("resize", mark);
  mark();
});

/* Tables in <main> with a header and three or more body rows sort by clicking a header; eight or more
   rows also get a filter box. Opt out with class ws-static. Rows are only reordered or hidden, so links
   and listeners inside cells survive. */
document.addEventListener("DOMContentLoaded", function () {
  var EMPTY = /^(|—|–|-|n\/a|not checked|none)$/i;
  function parseNumber(text) {
    var m = text.match(/\d[\d.,]*/), s, dot, comma, sep, parts;
    if (!m) return null;
    s = m[0].replace(/[.,]+$/, "");
    dot = s.lastIndexOf("."); comma = s.lastIndexOf(",");
    if (dot >= 0 && comma >= 0) {
      sep = dot > comma ? "." : ",";
      s = sep === "." ? s.replace(/,/g, "") : s.replace(/\./g, "").replace(",", ".");
    } else if (dot >= 0 || comma >= 0) {
      sep = dot >= 0 ? "." : ",";
      parts = s.split(sep);
      if (parts.length > 2 || parts[1].length === 3) s = parts.join("");
      else s = parts.join(".");
    }
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }
  [].forEach.call(document.querySelectorAll("main table"), function (table) {
    if (table.classList.contains("ws-static") || !table.tHead || table.tBodies.length !== 1) return;
    var body = table.tBodies[0], rows = [].slice.call(body.rows);
    if (rows.length < 3) return;
    var headRow = table.tHead.rows[table.tHead.rows.length - 1];
    var state = { col: -1, dir: 0 };
    var cells = rows.map(function (row) {
      return [].map.call(row.cells, function (td) {
        var t = td.textContent.replace(/\s+/g, " ").trim();
        return { text: t, empty: EMPTY.test(t), num: parseNumber(t) };
      });
    });
    var info = rows.map(function (row, i) { return { row: row, cells: cells[i], index: i }; });
    function numericColumn(c) {
      var filled = 0, nums = 0;
      info.forEach(function (r) {
        var cell = r.cells[c];
        if (!cell || cell.empty) return;
        filled++;
        if (cell.num !== null) nums++;
      });
      return filled > 0 && nums > filled / 2;
    }
    function apply() {
      var c = state.col, numeric = c >= 0 && state.dir && numericColumn(c), sign = state.dir === -1 ? -1 : 1;
      var sorted = info.slice().sort(function (a, b) {
        if (!state.dir) return a.index - b.index;
        var x = a.cells[c] || { empty: true }, y = b.cells[c] || { empty: true }, r;
        if (numeric) {
          x = x.empty || x.num === null ? { empty: true } : x;
          y = y.empty || y.num === null ? { empty: true } : y;
        }
        if (x.empty || y.empty) return x.empty && y.empty ? a.index - b.index : (x.empty ? 1 : -1);
        r = numeric ? x.num - y.num : x.text.localeCompare(y.text, "tr");
        return r ? r * sign : a.index - b.index;
      });
      sorted.forEach(function (r) { body.appendChild(r.row); });
      [].forEach.call(headRow.cells, function (th, n) {
        var on = n === c && state.dir;
        if (th.querySelector(".ws-sort")) {
          th.setAttribute("aria-sort", on ? (state.dir === 1 ? "ascending" : "descending") : "none");
          th.querySelector(".ws-sort-mark").textContent = on ? (state.dir === 1 ? "▲" : "▼") : "";
        }
      });
    }
    [].forEach.call(headRow.cells, function (th, n) {
      if (th.colSpan > 1) return;
      var button = document.createElement("button"), mark = document.createElement("span");
      button.type = "button";
      button.className = "ws-sort";
      mark.className = "ws-sort-mark";
      mark.setAttribute("aria-hidden", "true");
      while (th.firstChild) button.appendChild(th.firstChild);
      button.appendChild(mark);
      th.appendChild(button);
      th.setAttribute("aria-sort", "none");
      button.addEventListener("click", function () {
        if (state.col !== n) { state.col = n; state.dir = 1; }
        else if (state.dir === 1) state.dir = -1;
        else state.dir = 0;
        apply();
      });
    });
    if (rows.length >= 8) {
      var bar = document.createElement("div"), input = document.createElement("input"), count = document.createElement("span");
      bar.className = "ws-filter";
      input.type = "search";
      input.placeholder = "Filter rows";
      input.setAttribute("aria-label", "Filter rows");
      count.className = "ws-filter-count";
      count.setAttribute("aria-live", "polite");
      bar.appendChild(input);
      bar.appendChild(count);
      table.parentNode.insertBefore(bar, table);
      var haystack = rows.map(function (row) { return row.textContent.replace(/\s+/g, " ").toLocaleLowerCase("tr"); });
      input.addEventListener("input", function () {
        var q = input.value.trim().toLocaleLowerCase("tr"), shown = 0;
        info.forEach(function (r) {
          var hit = !q || haystack[r.index].indexOf(q) >= 0;
          r.row.hidden = !hit;
          if (hit) shown++;
        });
        count.textContent = q ? shown + " of " + rows.length + " rows" : "";
      });
    }
  });
});

/* Task lists on a page that asks for it (<html data-ws-tasks="tick">) are ticked by the reader. A
   tick is kept in this browser's localStorage under the page's path and the line's own text, so a
   rebuilt page keeps the tick of every line whose wording did not change. A box the page's source
   already ticked stays ticked and read-only. The contents column, or the place above the first task
   list on a page without one, shows how many are done. */
document.addEventListener("DOMContentLoaded", function () {
  if (document.documentElement.getAttribute("data-ws-tasks") !== "tick") return;
  var boxes = [].slice.call(document.querySelectorAll('main li > input[type="checkbox"]'));
  if (!boxes.length) return;
  var KEY = "ws-tasks:" + location.pathname, saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { saved = {}; }
  function lineOf(box) {
    var text = "";
    [].forEach.call(box.parentNode.childNodes, function (node) {
      if (node.nodeType === 3) text += node.textContent;
      else if (node.nodeType === 1 && !/^(UL|OL|INPUT)$/.test(node.tagName)) text += node.textContent;
    });
    return text.replace(/\s+/g, " ").trim();
  }
  var count = document.createElement("p"), toc = document.querySelector(".ws-toc");
  count.className = "ws-task-count";
  count.setAttribute("aria-live", "polite");
  if (toc) toc.appendChild(count);
  else {
    var list = boxes[0].parentNode.parentNode;
    list.parentNode.insertBefore(count, list);
  }
  function show() {
    var done = boxes.filter(function (box) { return box.checked; }).length;
    count.textContent = done + " of " + boxes.length + " done";
  }
  boxes.forEach(function (box) {
    var line = lineOf(box);
    box.setAttribute("aria-label", line.slice(0, 80));
    if (box.checked) return;
    box.disabled = false;
    box.checked = saved[line] === true;
    box.addEventListener("change", function () {
      if (box.checked) saved[line] = true;
      else delete saved[line];
      try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
      show();
    });
  });
  show();
});
