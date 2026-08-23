/* =====================================================
   ANVARS GRUPA — main.js
   Navigācija, atklāšanās animācijas, skaitītāji, lightbox
   ===================================================== */

(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");
  var siteNav = document.querySelector(".site-nav");
  var desktopMq = window.matchMedia("(min-width: 900px)");

  /* ---------- Galvene: ēna pēc ritināšanas ---------- */

  function onScroll() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 10);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobilā izvēlne ---------- */

  function closeMenu() {
    if (!siteNav) return;
    siteNav.classList.remove("is-open");
    document.body.classList.remove("menu-locked");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var open = siteNav.classList.toggle("is-open");
      document.body.classList.toggle("menu-locked", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Aizvērt izvēlni, kad izvēlas saiti (arī enkura saites tajā pašā lapā)
    siteNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });

    desktopMq.addEventListener("change", function (e) {
      if (e.matches) closeMenu();
    });
  }

  /* ---------- Pakalpojumu izvēlne (akordeons / klikšķis) ---------- */

  document.querySelectorAll(".nav-item.has-dropdown").forEach(function (item) {
    var toggle = item.querySelector(".dropdown-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", function () {
      var open = item.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Darbvirsmā: aizvērt ar Escape vai klikšķi ārpusē
    document.addEventListener("click", function (e) {
      if (!item.contains(e.target)) {
        item.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    item.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        item.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- Atklāšanās animācijas ---------- */

  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- Statistikas skaitītāji ---------- */

  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1400;
    var start = null;

    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // ease-out
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    var countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) {
      countObserver.observe(el);
    });
  } else {
    counters.forEach(function (el) {
      el.textContent =
        el.getAttribute("data-count") + (el.getAttribute("data-suffix") || "");
    });
  }

  /* ---------- Galerijas lightbox ---------- */

  var galleryItems = Array.prototype.slice.call(
    document.querySelectorAll(".gallery-item")
  );

  if (galleryItems.length) {
    var lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-label", "Attēlu galerija");
    lightbox.innerHTML =
      '<button class="lightbox-btn lightbox-close" aria-label="Aizvērt">✕</button>' +
      '<button class="lightbox-btn lightbox-prev" aria-label="Iepriekšējais">‹</button>' +
      '<img alt="">' +
      '<button class="lightbox-btn lightbox-next" aria-label="Nākamais">›</button>' +
      '<span class="lightbox-count"></span>';
    document.body.appendChild(lightbox);

    var lbImg = lightbox.querySelector("img");
    var lbCount = lightbox.querySelector(".lightbox-count");
    var current = 0;

    function show(i) {
      current = (i + galleryItems.length) % galleryItems.length;
      var item = galleryItems[current];
      var full = item.getAttribute("data-full") || item.querySelector("img").src;
      lbImg.src = full;
      lbImg.alt = item.querySelector("img").alt || "";
      lbCount.textContent = current + 1 + " / " + galleryItems.length;
    }

    function openLightbox(i) {
      show(i);
      lightbox.classList.add("is-open");
      document.body.classList.add("menu-locked");
    }

    function closeLightbox() {
      lightbox.classList.remove("is-open");
      document.body.classList.remove("menu-locked");
      lbImg.src = "";
    }

    galleryItems.forEach(function (item, i) {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        openLightbox(i);
      });
    });

    lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
    lightbox.querySelector(".lightbox-prev").addEventListener("click", function () {
      show(current - 1);
    });
    lightbox.querySelector(".lightbox-next").addEventListener("click", function () {
      show(current + 1);
    });

    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
  }

  /* ---------- Kājenes gads ---------- */

  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
