document.addEventListener("DOMContentLoaded", () => {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);

  // 1a. Nav bar: shrink after a small scroll threshold + a thin scroll-position
  // bar along its bottom edge. (Same behavior as main.js — this page just has
  // no sections to spy on, so its "06. DASHBOARD" tab stays active as set in
  // the markup.)
  const navBar = document.querySelector(".cyber-nav");
  const scrollProgressBar = document.getElementById("scroll-progress");

  function updateNavOnScroll() {
    if (!navBar) return;
    navBar.classList.toggle("scrolled", window.scrollY > 60);

    if (scrollProgressBar) {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      scrollProgressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }
  }
  window.addEventListener("scroll", updateNavOnScroll, { passive: true });
  updateNavOnScroll();

  // 1b. Parallax Wave Scroll Logic
  const waveSvg = document.querySelector(".cyber-wave-svg");
  if (waveSvg) {
    window.addEventListener("scroll", () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
      const moveAmount = scrollPercent * -66.66;
      requestAnimationFrame(() => {
        waveSvg.style.transform = `translateY(${moveAmount}%)`;
      });
    });
  }

  // 2. Mobile Menu Toggle Logic
  const mobileMenuBtn = document.querySelector(".mobile-menu-toggle");
  const navLinksContainer = document.querySelector(".nav-links");

  if (mobileMenuBtn && navLinksContainer) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinksContainer.classList.toggle("active");
      const icon = mobileMenuBtn.querySelector("i");
      if (navLinksContainer.classList.contains("active")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-xmark");
      } else {
        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");
      }
    });
  }

  // 3. Active Builds: animate progress bars in on scroll
  const progressFills = document.querySelectorAll(".progress-fill[data-progress]");
  if (progressFills.length) {
    const progressObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            el.style.width = `${el.dataset.progress}%`;
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.3 },
    );
    progressFills.forEach((el) => progressObserver.observe(el));
  }

  // 4. Contact CTA: reveal heading/paragraph/buttons on scroll
  const contactSection = document.querySelector(".contact-section");
  if (contactSection) {
    const contactObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 },
    );
    contactObserver.observe(contactSection);
  }

  // 5. Featured project cards: same interactive 3D tilt + cursor glow as the
  // homepage project cards.
  const projectCards = document.querySelectorAll(".project-card");
  projectCards.forEach((card) => {
    const bg = card.querySelector(".card-interactive-bg");
    if (!bg) return;

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;

      const glowColor =
        getComputedStyle(card).getPropertyValue("--theme-glow").trim() ||
        "rgba(0, 229, 255, 0.15)";

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      bg.style.background = `radial-gradient(circle at ${x}px ${y}px, ${glowColor}, transparent 60%)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
      bg.style.background = `none`;
      card.style.transition = `transform 0.5s ease, box-shadow 0.4s ease, border-color 0.4s ease`;
    });

    card.addEventListener("mouseenter", () => {
      card.style.transition = `none`;
    });
  });
});
