
(() => {
  const navbar = document.getElementById("siteNavbar");

  /* Navbar background blur on scroll */
  function updateNavbarChrome() {
    if (!navbar) return;
    const scrolled = window.scrollY > 10;
    navbar.classList.toggle("navbar-scrolled", scrolled);
  }
  updateNavbarChrome();
  window.addEventListener("scroll", updateNavbarChrome, { passive: true });

  /* Always start pages at the top (fix refresh-at-bottom issue) */
  if (window.history && "scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }
  window.addEventListener("load", () => {
    // Jump to top first to avoid restoring an old scroll position
    window.scrollTo(0, 0);
    
    // Auto-open enquiry modal on page load
    const enquiryModal = document.getElementById("enquiryModal");
    if (enquiryModal) {
      const modal = new bootstrap.Modal(enquiryModal, {
        backdrop: true,
        keyboard: true
      });
      // Small delay to ensure page is fully loaded
      setTimeout(() => {
        modal.show();
      }, 500);
    }
  });

  /* Smooth-scroll with fixed navbar offset */
  const navHeight = () => (navbar ? navbar.getBoundingClientRect().height : 64);

  function scrollToHash(hash) {
    const id = (hash || "").replace("#", "");
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;

    const y = window.scrollY + el.getBoundingClientRect().top - (navHeight() + 12);
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    scrollToHash(href);
    history.pushState(null, "", href);
  });

  window.addEventListener("load", () => {
    // After ensuring we are at the top, if there is a hash, scroll to that section smoothly
    if (location.hash) scrollToHash(location.hash);
  });

  /* Scroll reveal animations */
  const revealEls = Array.from(document.querySelectorAll(".reveal-on-scroll"));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* Button ripple (premium micro-interaction) */
  function attachRipple(btn) {
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      // Respect reduced motion
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const span = document.createElement("span");
      span.className = "ripple";
      span.style.width = `${size}px`;
      span.style.height = `${size}px`;
      span.style.left = `${x}px`;
      span.style.top = `${y}px`;
      btn.appendChild(span);

      window.setTimeout(() => span.remove(), 750);
    });
  }

  /* Enquiry form interactions (supports inline + modal forms) */
  function initEnquiryForm({ formId, disclaimerId, submitBtnId, otpBtnId }) {
    const form = document.getElementById(formId);
    if (!form) return;

    const disclaimer = disclaimerId ? document.getElementById(disclaimerId) : null;
    const submitBtn = submitBtnId ? document.getElementById(submitBtnId) : null;
    const otpBtn = otpBtnId ? document.getElementById(otpBtnId) : null;

    attachRipple(submitBtn);
    attachRipple(otpBtn);

    function updateSubmitState() {
      if (!submitBtn || !disclaimer) return;
      submitBtn.disabled = !disclaimer.checked;
    }

    if (disclaimer) {
      disclaimer.addEventListener("change", updateSubmitState);
      updateSubmitState();
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // UI replica only: keep submit disabled by policy until checkbox is checked.
      // If enabled, we still prevent actual submission.
    });

    /* OTP button countdown (UI only, scoped per form) */
    let otpTimer = null;
    function startOtpCountdown(seconds = 30) {
      if (!otpBtn) return;
      let remaining = seconds;
      otpBtn.disabled = true;
      otpBtn.textContent = `Resend (${remaining}s)`;

      otpTimer = window.setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          window.clearInterval(otpTimer);
          otpTimer = null;
          otpBtn.disabled = false;
          otpBtn.textContent = "Get OTP";
          return;
        }
        otpBtn.textContent = `Resend (${remaining}s)`;
      }, 1000);
    }

    if (otpBtn) {
      otpBtn.addEventListener("click", () => {
        if (otpTimer) return;
        startOtpCountdown(30);
      });
    }
  }

  // Initialise inline enquiry form (inside hero/banner)
  initEnquiryForm({
    formId: "enquiryForm",
    disclaimerId: "disclaimerCheck",
    submitBtnId: "submitBtn"
  });

  // Initialise popup enquiry form (modal)
  initEnquiryForm({
    formId: "enquiryFormModal",
    disclaimerId: "disclaimerCheckModal",
    submitBtnId: "submitBtnModal"
  });

  /* Open enquiry modal from any specialisation card click/keypress */
  function openEnquiryModal(programName = "") {
    const modalEl = document.getElementById("enquiryModal");
    if (!modalEl || typeof bootstrap === "undefined") return;

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl, {
      backdrop: true,
      keyboard: true
    });

    if (programName) {
      const programSelect = document.getElementById("programModal");
      if (programSelect) {
        const match = Array.from(programSelect.options).find(
          (opt) => opt.textContent.trim().toLowerCase() === programName.trim().toLowerCase()
        );
        programSelect.value = match ? match.value : "";
      }
    }

    modal.show();
  }

  const specCards = Array.from(document.querySelectorAll(".spec-card"));
  specCards.forEach((card) => {
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    const programTitle = card.querySelector(".spec-title")?.textContent?.trim() || "";
    const activate = () => openEnquiryModal(programTitle);

    card.addEventListener("click", activate);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate();
      }
    });
  });

  /* Animated counters (statistics) */
  function parseCounterText(text) {
    // Supports formats like "157K+", "82K+", "8K+"
    const raw = String(text || "").trim();
    const hasPlus = raw.endsWith("+");
    const clean = raw.replace("+", "").trim();

    const k = /k$/i.test(clean);
    const base = clean.replace(/k$/i, "");
    const n = Number(base.replace(/,/g, ""));
    if (!Number.isFinite(n)) return null;

    return {
      value: k ? n * 1000 : n,
      suffix: (k ? "K" : "") + (hasPlus ? "+" : "")
    };
  }

  function formatCounter(value, suffix) {
    // If original was K-based, format back to K with no decimals for clean UI.
    if (/K/i.test(suffix)) {
      const k = Math.round(value / 1000);
      return `${k}K${suffix.includes("+") ? "+" : ""}`;
    }
    return `${Math.round(value)}${suffix.includes("+") ? "+" : ""}`;
  }

  function animateCounter(el, target, suffix) {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.textContent = formatCounter(target, suffix);
      return;
    }

    const start = 0;
    const duration = 1100;
    const t0 = performance.now();

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function frame(now) {
      const p = Math.min(1, (now - t0) / duration);
      const eased = easeOutCubic(p);
      const current = start + (target - start) * eased;
      el.textContent = formatCounter(current, suffix);
      if (p < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  const statValues = Array.from(document.querySelectorAll(".stat-value"));
  statValues.forEach((el) => {
    const parsed = parseCounterText(el.textContent);
    if (!parsed) return;
    el.dataset.counterTarget = String(parsed.value);
    el.dataset.counterSuffix = parsed.suffix;
  });

  if ("IntersectionObserver" in window && statValues.length) {
    const counterIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = Number(el.dataset.counterTarget || "");
          const suffix = el.dataset.counterSuffix || "";
          if (!Number.isFinite(target)) return;
          if (el.dataset.counterDone === "1") return;
          el.dataset.counterDone = "1";
          animateCounter(el, target, suffix);
          counterIO.unobserve(el);
        });
      },
      { threshold: 0.35 }
    );
    statValues.forEach((el) => counterIO.observe(el));
  }

  /* Initialize Swiper for Testimonials */
  const testimonialSwiper = new Swiper('.mySwiper', {
    effect: 'coverflow',
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: 2,
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    speed: 600,
    coverflowEffect: {
      rotate: 0,
      stretch: 0,
      depth: 100,
      modifier: 1.5,
      slideShadows: true,
    },
    breakpoints: {
      320: {
        slidesPerView: 1,
        centeredSlides: true,
      },
      768: {
        slidesPerView: 1.2,
        centeredSlides: true,
      },
      1024: {
        slidesPerView: 2,
        centeredSlides: true,
      }
    }
  });
})();


/* Mobile brochure click -> Download + Open Enquiry Modal */
document.addEventListener("DOMContentLoaded", () => {
  const brochureBtn = document.getElementById("mobileBrochureBtn");

  if (!brochureBtn) return;

  brochureBtn.addEventListener("click", () => {
    /* 1️⃣ Trigger brochure download */
    const brochureLink = document.createElement("a");
    // 🔁 change path if needed
    brochureLink.download = "NMIMS-Online-Brochure.pdf";
    document.body.appendChild(brochureLink);
    brochureLink.click();
    brochureLink.remove();

    /* 2️⃣ Open enquiry modal */
    const enquiryModal = document.getElementById("enquiryModal");
    if (enquiryModal && typeof bootstrap !== "undefined") {
      const modal = bootstrap.Modal.getOrCreateInstance(enquiryModal);
      modal.show();
    }
  });
});

