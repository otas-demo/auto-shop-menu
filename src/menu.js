/* Loads the latest prices from the dashboard and puts them into the page.
 *
 * Every element marked by scripts/build.mjs already shows the built-in price, so if the API
 * is slow or unreachable the page simply keeps those. On the Custom POS page the calculator
 * (custom.js) is started here, after the latest data has arrived or the request has failed.
 */
(function () {
  "use strict";
  var TIMEOUT_MS = 4000;
  var page = document.documentElement.getAttribute("data-menu-page");
  var api = String(window.MENU_API_URL || "").replace(/\/+$/, "");
  var started = false;

  function startCalculator() {
    if (page !== "custom" || started) return;
    started = true;
    var s = document.createElement("script");
    s.src = "custom.js";
    document.body.appendChild(s);
  }

  function forEach(selector, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), fn);
  }

  // values are HTML-escaped by the dashboard; decode one for use as an attribute
  function decode(html) {
    var t = document.createElement("textarea");
    t.innerHTML = html;
    return t.value;
  }

  function apply(values) {
    forEach("[data-m]", function (el) {
      var key = el.getAttribute("data-m");
      if (typeof values[key] === "string") el.innerHTML = values[key];
    });
    forEach("[data-m-href]", function (el) {
      var value = values[el.getAttribute("data-m-href")];
      if (typeof value === "string" && /^https?:\/\//.test(decode(value))) el.setAttribute("href", decode(value));
    });
    // AI table: keep the header row, replace the channel rows
    forEach("[data-m-rows]", function (el) {
      var html = values[el.getAttribute("data-m-rows")];
      if (typeof html !== "string") return;
      forEach("[data-m-rows] > .ai-row", function (row) { row.parentNode.removeChild(row); });
      el.insertAdjacentHTML("beforeend", html);
    });
    // Hardware page: replace the groups, keep the note below them
    forEach("[data-m-groups]", function (el) {
      var html = values[el.getAttribute("data-m-groups")];
      if (typeof html !== "string") return;
      forEach("[data-m-groups] > .hw-group", function (g) { g.parentNode.removeChild(g); });
      el.insertAdjacentHTML("afterbegin", html);
    });
    if (typeof values.customDataJson === "string") {
      window.CUSTOM_DATA = JSON.parse(values.customDataJson);
    }
    // cards were rebuilt, so jump to /hardware#item again
    if (location.hash && location.hash.length > 1) {
      var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) target.scrollIntoView();
    }
  }

  if (!api || !page || !window.fetch) {
    startCalculator();
    return;
  }

  var controller = window.AbortController ? new AbortController() : null;
  var timer = setTimeout(function () {
    if (controller) controller.abort();
    startCalculator(); // keep the built-in prices
  }, TIMEOUT_MS);

  fetch(api + "/api/public/menu?page=" + encodeURIComponent(page), controller ? { signal: controller.signal } : {})
    .then(function (res) {
      if (!res.ok) throw new Error("Menu API " + res.status);
      return res.json();
    })
    .then(function (body) {
      clearTimeout(timer);
      if (!started) apply(body.values || {}); // too late once the calculator has started on built-in data
      startCalculator();
    })
    .catch(function () {
      clearTimeout(timer);
      startCalculator();
    });
})();
