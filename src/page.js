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
