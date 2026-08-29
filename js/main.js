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
  var mobileBar = document.querySelector(".mobile-bar");

  /* ---------- Galvene: ēna pēc ritināšanas ---------- */

  function onScroll() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 10);
    }
    // Josla netraucē, kamēr redzams hero; parādās, tiklīdz tas aizritināts.
    if (mobileBar) {
      mobileBar.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.6);
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

  /* ---------- Pieprasījuma vednis (WhatsApp) ---------- */

  var wizard = document.querySelector(".quote-wizard");

  if (wizard) {
    var panels = Array.prototype.slice.call(
      wizard.querySelectorAll("[data-qw-panel]")
    );
    var stepEl = wizard.querySelector("[data-qw-step]");
    var progressEl = wizard.querySelector("[data-qw-progress]");
    var backBtn = wizard.querySelector("[data-qw-back]");
    var nextBtn = wizard.querySelector("[data-qw-next]");
    var sendBtn = wizard.querySelector("[data-qw-send]");
    var summaryEl = wizard.querySelector("[data-qw-summary]");
    var phone = wizard.getAttribute("data-qw-phone") || "";
    var answers = [];
    var step = 0;
    var lastIndex = panels.length - 1;
    var questionCount = lastIndex;

    // Bez JS vednis vispār neparādās, tāpēc atslēpjam to tikai tagad.
    wizard.hidden = false;

    function answerOf(i) {
      return answers[i] || "";
    }

    function composeMessage() {
      var lines = ["Labdien! Vēlos saņemt piedāvājumu.", ""];
      panels.forEach(function (panel, i) {
        var key = panel.getAttribute("data-qw-key");
        if (key && answerOf(i)) lines.push(key + ": " + answerOf(i));
      });
      return lines.join("\n");
    }

    function render() {
      panels.forEach(function (panel, i) {
        panel.hidden = i !== step;
      });

      var onSummary = step === lastIndex;

      if (stepEl) {
        stepEl.textContent = onSummary
          ? "Kopsavilkums"
          : step + 1 + " / " + questionCount;
      }
      if (progressEl) {
        progressEl.style.width = ((step + 1) / panels.length) * 100 + "%";
      }

      if (backBtn) backBtn.hidden = step === 0;
      if (nextBtn) {
        nextBtn.hidden = onSummary;
        nextBtn.textContent =
          step === questionCount - 1 ? "Skatīt kopsavilkumu" : "Tālāk";
        var optional = panels[step].hasAttribute("data-qw-optional");
        nextBtn.disabled = !optional && !answerOf(step);
      }
      if (sendBtn) sendBtn.hidden = !onSummary;

      if (onSummary) {
        var msg = composeMessage();
        if (summaryEl) summaryEl.textContent = msg;
        if (sendBtn) {
          sendBtn.href =
            "https://wa.me/" + phone + "?text=" + encodeURIComponent(msg);
        }
      }

      var heading = panels[step].querySelector(".qw-q");
      if (heading) heading.focus();
    }

    function go(to) {
      step = Math.max(0, Math.min(lastIndex, to));
      render();
    }

    panels.forEach(function (panel, i) {
      // Izvēles pogas: atzīmē atbildi un pēc mirkļa pati pāriet tālāk.
      panel.querySelectorAll(".qw-chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
          panel.querySelectorAll(".qw-chip").forEach(function (other) {
            other.setAttribute("aria-pressed", other === chip ? "true" : "false");
          });
          answers[i] = chip.getAttribute("data-qw-value") || chip.textContent.trim();
          if (nextBtn) nextBtn.disabled = false;
          setTimeout(function () {
            if (step === i) go(i + 1);
          }, 260);
        });
      });

      // Teksta lauks: atbilde nav obligāta, tāpēc "Tālāk" paliek aktīva.
      var input = panel.querySelector("input[type='text']");
      if (input) {
        input.addEventListener("input", function () {
          answers[i] = input.value.trim();
        });
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            go(i + 1);
          }
        });
      }
    });

    if (backBtn) backBtn.addEventListener("click", function () { go(step - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { go(step + 1); });

    render();
  }

  /* ---------- Kājenes gads ---------- */

  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
