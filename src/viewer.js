/* Picture viewer. A click on a picture inside a gallery (an element with the class ws-gallery or the
   attribute data-ws-viewer) opens it large over the page, with its caption and its place in the
   gallery. The arrow keys, a sideways swipe or the side buttons step through that gallery's
   pictures, wrapping at the ends. Esc, the close button or a click beside the picture closes it, and
   focus goes back to what opened it. The large picture is the href of the link around a picture,
   else the picture itself; the caption is its figure's figcaption, else its title, else its alt.
   A click with a modifier key or another button keeps the link's own behaviour. The viewer is one
   native <dialog> made on first use, and the click is caught on the document, so a gallery added
   later (a single-page app's next route) needs no setup. A Vite site imports it:
   import "<web-shared>/src/viewer.js". */
(function () {
  if (window.wsViewer) return;
  window.wsViewer = true;

  var GALLERY = ".ws-gallery, [data-ws-viewer]";
  // A pointer that moves this far sideways, and further sideways than up or down, is a swipe.
  var SWIPE_PX = 40;

  var style = document.createElement("style");
  style.setAttribute("data-ws", "viewer");
  style.textContent = [
    ":is(.ws-gallery, [data-ws-viewer]) img { cursor: zoom-in; }",
    // The dialog fills the page's box (inset, not 100vw, so a scrollbar gutter the page reserves
    // never pushes it off the right edge); the page shows through its backdrop, nearly hidden.
    "dialog.ws-viewer { box-sizing: border-box; inset: 0; width: auto; height: auto; max-width: none;",
    "  max-height: none; margin: 0; padding: 3.5rem 3.5rem 1rem; border: 0; overflow: hidden;",
    "  background: transparent; color: var(--cfg); touch-action: pinch-zoom; }",
    "dialog.ws-viewer::backdrop { background: color-mix(in oklab, var(--cbg) 97%, transparent); }",
    ".ws-viewer figure { display: flex; flex-direction: column; align-items: center;",
    "  justify-content: center; gap: 0.5rem; height: 100%; margin: 0; }",
    // Never larger than the file, so a small figure is not blown up into a blur.
    ".ws-viewer figure > img { display: block; width: auto; height: auto; max-width: 100%;",
    "  max-height: calc(100dvh - 9rem); margin: 0; object-fit: contain; border-radius: 4px; }",
    ".ws-viewer figcaption { width: auto; max-width: 60ch; margin: 0; text-align: center;",
    "  color: var(--cdark); }",
    ".ws-viewer-count { margin-left: 0.5rem; font-variant-numeric: tabular-nums; white-space: nowrap; }",
    ".ws-viewer button { position: fixed; display: grid; place-items: center; width: 2.6rem;",
    "  height: 2.6rem; margin: 0; padding: 0; border-radius: 50%; }",
    // Each button's mark is a drawn icon whose centre is the button's: a text glyph sits where its
    // font puts it on the line, which is off the middle.
    ".ws-viewer button svg { display: block; width: 1rem; height: 1rem; fill: none; stroke: currentColor;",
    "  stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }",
    ".ws-viewer button:focus-visible { outline: 2px solid var(--clink); outline-offset: 2px; }",
    ".ws-viewer-close { top: 0.5rem; right: 0.5rem; }",
    ".ws-viewer-prev, .ws-viewer-next { top: calc(50% - 1.3rem); }",
    ".ws-viewer-prev { left: 0.5rem; }",
    ".ws-viewer-next { right: 0.5rem; }",
    ".ws-viewer[data-single] :is(.ws-viewer-prev, .ws-viewer-next) { display: none; }",
    // On a phone the picture takes the width and the step buttons move under it.
    "@media (max-width: 30rem) {",
    "  dialog.ws-viewer { padding: 3.5rem 0.5rem 3.5rem; }",
    "  .ws-viewer figure > img { max-height: calc(100dvh - 11rem); }",
    "  .ws-viewer-prev, .ws-viewer-next { top: auto; bottom: 0.5rem; }",
    "}",
  ].join("\n");
  document.head.appendChild(style);

  var dialog, figure, big, caption, count;
  var items = [];
  var at = 0;
  var opener = null;
  var start = null;
  var swiped = false;

  function source(pic) {
    var link = pic.closest("a[href]");
    return link ? link.href : pic.currentSrc || pic.src;
  }

  function text(pic) {
    var fig = pic.closest("figure");
    var cap = fig && fig.querySelector("figcaption");
    return (cap && cap.textContent.trim()) || pic.title || pic.alt || "";
  }

  // The buttons' marks, as paths in a 16 by 16 box centred on (8, 8).
  var ICONS = {
    close: "M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5",
    prev: "M10 3 5 8 10 13",
    next: "M6 3 11 8 6 13",
  };

  function button(cls, label, icon, act) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.setAttribute("aria-label", label);
    b.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="' + ICONS[icon] + '"/></svg>';
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      act();
    });
    return b;
  }

  function build() {
    if (dialog) return;
    dialog = document.createElement("dialog");
    dialog.className = "ws-viewer";
    dialog.setAttribute("aria-label", "Picture");
    figure = document.createElement("figure");
    big = document.createElement("img");
    big.draggable = false;
    var cap = document.createElement("figcaption");
    caption = document.createElement("span");
    count = document.createElement("span");
    count.className = "ws-viewer-count";
    cap.append(caption, count);
    figure.append(big, cap);
    var close = button("ws-viewer-close", "Close", "close", function () {
      dialog.close();
    });
    close.autofocus = true;
    dialog.append(
      figure,
      button("ws-viewer-prev", "Previous picture", "prev", function () {
        show(at - 1);
      }),
      button("ws-viewer-next", "Next picture", "next", function () {
        show(at + 1);
      }),
      close,
    );

    // A click beside the picture and its caption closes the viewer; the click that ends a swipe does not.
    dialog.addEventListener("click", function (e) {
      if (!swiped && (e.target === dialog || e.target === figure)) dialog.close();
    });
    dialog.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        show(at - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        show(at + 1);
      }
    });
    // A swipe on a touch screen is read from touch events: once a finger moves, the browser takes the
    // gesture and cancels the pointer, so a pointerup never comes, while touchend still does. A mouse
    // or pen drag is read from pointer events. One finger only: a second makes it a pinch. While the
    // page is pinch-zoomed, a one-finger drag moves around the picture and steps nothing.
    function swipe(x, y) {
      var dx = x - start.x;
      var dy = y - start.y;
      start = null;
      var zoomed = window.visualViewport && window.visualViewport.scale > 1.01;
      if (!zoomed && items.length > 1 && Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
        swiped = true;
        show(at + (dx < 0 ? 1 : -1));
      }
    }
    dialog.addEventListener(
      "touchstart",
      function (e) {
        var t = e.touches[0];
        start = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
        swiped = false;
      },
      { passive: true },
    );
    dialog.addEventListener("touchend", function (e) {
      if (start && e.touches.length === 0) swipe(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    });
    dialog.addEventListener("touchcancel", function () {
      start = null;
    });
    dialog.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") return;
      start = { x: e.clientX, y: e.clientY };
      swiped = false;
    });
    dialog.addEventListener("pointerup", function (e) {
      if (e.pointerType !== "touch" && start) swipe(e.clientX, e.clientY);
    });
    dialog.addEventListener("close", function () {
      document.documentElement.style.overflow = "";
      big.removeAttribute("src");
      if (opener && opener.isConnected) opener.focus();
    });
    document.body.appendChild(dialog);
  }

  function show(i) {
    at = (i + items.length) % items.length;
    var pic = items[at];
    big.src = source(pic);
    big.alt = pic.alt || "";
    caption.textContent = text(pic);
    count.textContent = items.length > 1 ? at + 1 + " / " + items.length : "";
    // The neighbours load now, so a step shows its picture at once.
    [at - 1, at + 1].forEach(function (j) {
      new Image().src = source(items[(j + items.length) % items.length]);
    });
  }

  function open(gallery, pic) {
    build();
    items = Array.prototype.slice.call(gallery.querySelectorAll("img"));
    opener = pic.closest("a[href]") || pic;
    dialog.toggleAttribute("data-single", items.length < 2);
    show(items.indexOf(pic));
    document.documentElement.style.overflow = "hidden";
    dialog.showModal();
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var t = e.target;
    if (!(t instanceof Element) || (dialog && dialog.contains(t))) return;
    var gallery = t.closest(GALLERY);
    if (!gallery) return;
    var link = t.closest("a[href]");
    var pic = t.closest("img") || (link && link.querySelector("img"));
    if (!pic || !gallery.contains(pic)) return;
    e.preventDefault();
    open(gallery, pic);
  });
})();
