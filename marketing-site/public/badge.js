/*!
 * NeuroSpark Verified — Open AI-Age Standard verifier badge
 * MIT License — embed anywhere with:
 *   <script src="https://standard.neurospark.app/badge.js" defer></script>
 *   <neurospark-verified product="my-product"></neurospark-verified>
 *
 * Renders a click-through badge that fetches the latest aggregated score
 * for `product` from the public verifier endpoint. Self-attested ratings
 * are amber; audited ratings (≥50 reports) are green.
 */
(function () {
  if (typeof window === "undefined" || typeof customElements === "undefined") return;
  if (customElements.get("neurospark-verified")) return;

  var ENDPOINT = (window.NEUROSPARK_STANDARD_API || "https://standard.neurospark.app") + "/standard/verify/";

  class NeuroSparkVerified extends HTMLElement {
    constructor() {
      super();
      this._shadow = this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      var product = this.getAttribute("product") || "";
      this.render({ status: "loading", product: product });
      if (!product) {
        this.render({ status: "error", product: product, message: "missing product" });
        return;
      }
      var self = this;
      fetch(ENDPOINT + encodeURIComponent(product), { headers: { accept: "application/json" } })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
        .then(function (data) { self.render({ status: "ok", product: product, data: data }); })
        .catch(function () { self.render({ status: "error", product: product }); });
    }
    render(state) {
      var color = state.status === "ok" && state.data && state.data.status === "audited" ? "#16A34A" : "#D97706";
      var label = state.status === "ok"
        ? (state.data.status === "audited" ? "Audited" : "Self-attested")
        : (state.status === "loading" ? "Verifying…" : "Unverified");
      var count = state.status === "ok" && state.data ? state.data.reportCount + " reports" : "";
      var version = state.status === "ok" && state.data ? "spec v" + state.data.specVersion : "spec v1.0";
      this._shadow.innerHTML =
        '<style>' +
        ':host{all:initial;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:inline-block}' +
        '.b{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid ' + color + ';border-radius:999px;color:' + color + ';font-size:12px;font-weight:600;text-decoration:none;background:#fff}' +
        '.dot{width:8px;height:8px;border-radius:999px;background:' + color + '}' +
        '.muted{color:#6B7280;font-weight:500}' +
        '</style>' +
        '<a class="b" href="https://standard.neurospark.app/verify/' + encodeURIComponent(state.product) + '" target="_blank" rel="noopener">' +
        '  <span class="dot"></span>' +
        '  <span>NeuroSpark Verified · ' + label + '</span>' +
        '  <span class="muted">' + (count ? count + ' · ' : '') + version + '</span>' +
        '</a>';
    }
  }
  customElements.define("neurospark-verified", NeuroSparkVerified);
})();
