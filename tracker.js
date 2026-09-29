/* DWT Digital — tracker d'audience cookieless.
   Envoie un "bip" au Worker a chaque page + evenements cles (form, audit).
   Aucun cookie, aucune donnee perso cote client. Fire-and-forget : n'impacte jamais la page. */
(function () {
  "use strict";
  var ENDPOINT = "https://dwt-admin.darellwilliampro1.workers.dev/track";

  function source() {
    try {
      var u = new URL(location.href);
      var utm = u.searchParams.get("utm_source");
      if (utm) return utm.toLowerCase().slice(0, 40);
      var ref = document.referrer || "";
      if (!ref) return "direct";
      var h = new URL(ref).hostname.replace(/^www\./, "").toLowerCase();
      if (/instagram|l\.instagram|ig\./.test(h)) return "instagram";
      if (/linkedin|lnkd\.in/.test(h)) return "linkedin";
      if (/facebook|fb\.me|m\.facebook|fb\./.test(h)) return "facebook";
      if (/google\./.test(h)) return "google";
      if (/bing\./.test(h)) return "bing";
      if (/t\.co|twitter|x\.com/.test(h)) return "twitter";
      if (/tiktok/.test(h)) return "tiktok";
      if (/youtube|youtu\.be/.test(h)) return "youtube";
      if (h === location.hostname) return "interne";
      return h.slice(0, 60);
    } catch (e) { return "direct"; }
  }

  function device() {
    try {
      var w = window.innerWidth || document.documentElement.clientWidth || 0;
      if (w && w < 768) return "mobile";
      if (w && w < 1024) return "tablet";
      return "desktop";
    } catch (e) { return "desktop"; }
  }

  function send(event) {
    try {
      var payload = JSON.stringify({
        event: event || "pageview",
        page: location.pathname || "/",
        referrer: (document.referrer || "").slice(0, 300),
        source: source(),
        device: device()
      });
      // text/plain => requete CORS "simple" (pas de preflight) => sendBeacon fiable au unload
      var blob = new Blob([payload], { type: "text/plain;charset=UTF-8" });
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob)) return;
      fetch(ENDPOINT, { method: "POST", body: payload, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(function () {});
    } catch (e) {}
  }

  // 1) vue de page
  send("pageview");

  // 2) evenements cles — delegation, sans toucher aux handlers existants
  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (f && (f.id === "contactForm" || (f.querySelector && f.querySelector("#consentement, [name='consentement']")))) send("form_submit");
  }, true);

  document.addEventListener("click", function (e) {
    var el = e.target && e.target.closest ? e.target.closest("a, button") : null;
    if (!el) return;
    var t = ((el.textContent || "") + " " + (el.getAttribute("href") || "") + " " + (el.getAttribute("data-dwt") || "")).toLowerCase();
    if (t.indexOf("audit") >= 0) send("audit_click");
  }, true);
})();
