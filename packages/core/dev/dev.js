// Shared helper for the core dev pages, loaded right after the UMD bundle.
// Adds a small corner panel linking back to the index and, once a chart
// renders, an SVG/Canvas switch showing the first chart's renderer.
// `?renderer=canvas` (or `svg`) applies that renderer to every chart's first
// render, so any chart page can be checked in both.
(function () {
  var params = new URLSearchParams(location.search);
  var renderer = params.get("renderer");
  var current = renderer || "svg";
  var panel, toggle;

  function link(text, href, active) {
    var a = document.createElement("a");
    a.textContent = text;
    a.href = href;
    if (active) a.className = "active";
    return a;
  }

  function rendererHref(value) {
    var next = new URLSearchParams(location.search);
    next.set("renderer", value);
    return location.pathname + "?" + next.toString() + location.hash;
  }

  function showToggle() {
    if (toggle || !panel) return;
    toggle = document.createElement("span");
    toggle.appendChild(link("SVG", rendererHref("svg"), current === "svg"));
    toggle.appendChild(
      link("Canvas", rendererHref("canvas"), current === "canvas"),
    );
    panel.appendChild(toggle);
  }

  function mount() {
    var style = document.createElement("style");
    style.textContent =
      "#d3plus-dev-panel{position:fixed;right:6px;bottom:6px;z-index:2147483647;" +
      "display:flex;gap:8px;align-items:center;padding:3px 8px;border-radius:4px;" +
      "background:rgba(255,255,255,0.9);box-shadow:0 1px 3px rgba(0,0,0,0.3);" +
      "font:11px/1.4 sans-serif;opacity:0.6}" +
      "#d3plus-dev-panel:hover{opacity:1}" +
      "#d3plus-dev-panel span{display:flex;gap:6px}" +
      "#d3plus-dev-panel a{color:#555;text-decoration:none}" +
      "#d3plus-dev-panel a.active{color:#000;font-weight:bold}";
    document.head.appendChild(style);
    panel = document.createElement("nav");
    panel.id = "d3plus-dev-panel";
    panel.appendChild(link("Index", "/"));
    document.body.appendChild(panel);
    if (rendered) showToggle();
  }

  var rendered = false;
  var Viz = window.d3plus && window.d3plus.Viz;
  if (Viz) {
    var seen = new WeakSet();
    var render = Viz.prototype.render;
    Viz.prototype.render = function () {
      if (!seen.has(this)) {
        seen.add(this);
        if (renderer) this.renderer(renderer);
        if (!rendered) current = this.renderer() || "svg";
      }
      rendered = true;
      showToggle();
      return render.apply(this, arguments);
    };
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
