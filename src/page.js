/* Page runtime shared by every house page: the theme follows the reader's preference, links
   open in a new tab, and the contents column marks the section being read. page-vendor writes
   this file, followed by font-picker.js, as ws/page.js. */
(function () {
  var media = matchMedia("(prefers-color-scheme: light)");
  function theme() {
    document.documentElement.dataset.theme = media.matches ? "light" : "dark";
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
