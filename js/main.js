document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Cinematic Loader — full run on first visit this session, instant skip on repeat
  // visits/pages so returning visitors aren't stuck watching the same 4s intro every time. ---
  const loaderBar = document.querySelector(".loader-bar");
  const loaderPercentage = document.querySelector(".loader-percentage");
  const loaderEl = document.getElementById("loader");
  const mainContentEl = document.getElementById("main-content");
  let hasSeenLoader = false;
  try {
    hasSeenLoader = sessionStorage.getItem("introSeen") === "1";
  } catch (e) {
    // sessionStorage unavailable (privacy mode, etc.) — fall back to always showing the intro.
  }
  let progress = 0;

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);

  if (loaderBar && hasSeenLoader) {
    // Skip straight to the finished state — no bar animation, no fade delay.
    if (loaderEl) loaderEl.style.display = "none";
    if (mainContentEl) mainContentEl.style.opacity = "1";
  }

  // 2. Parallax Wave Scroll Logic
  const waveSvg = document.querySelector(".cyber-wave-svg");

  if (waveSvg) {
    window.addEventListener("scroll", () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollTop / docHeight;
      const moveAmount = scrollPercent * -66.66;

      requestAnimationFrame(() => {
        waveSvg.style.transform = `translateY(${moveAmount}%)`;
      });
    });
  }

  const interval =
    loaderBar && !hasSeenLoader
      ? setInterval(() => {
          progress += 1;
          loaderBar.style.width = `${progress}%`;
          loaderPercentage.innerText = `${progress}%`;

          if (progress >= 100) {
            clearInterval(interval);
            try {
              sessionStorage.setItem("introSeen", "1");
            } catch (e) {
              // Ignore — worst case the intro just plays again next page.
            }
            setTimeout(() => {
              document.getElementById("loader").style.opacity = "0";
              setTimeout(() => {
                document.getElementById("loader").style.display = "none";
                document.getElementById("main-content").style.opacity = "1";
              }, 800);
            }, 400);
          }
        }, 35)
      : null;

  // --- 2. Orbiting Atmosphere Logic ---
  const orbitIcons = document.querySelectorAll(".orbit-icon");
  const orbitSystem = document.getElementById("orbit-system");

  let orbitRing = null;
  if (orbitSystem) {
    orbitRing = document.createElement("div");
    orbitRing.className = "orbit-ring";
    orbitSystem.insertBefore(orbitRing, orbitSystem.firstChild);
  }

  function animateOrbit() {
    const time = Date.now() * 0.0005;
    const isMobile = window.innerWidth <= 768;
    const orbitRadiusX = isMobile
      ? Math.min(window.innerWidth * 0.58, 290)
      : Math.min(window.innerWidth * 0.42, 480);
    const orbitRadiusY = isMobile
      ? Math.min(window.innerWidth * 0.22, 130)
      : Math.min(window.innerWidth * 0.17, 175);

    if (orbitRing) {
      orbitRing.style.width = `${orbitRadiusX * 2}px`;
      orbitRing.style.height = `${orbitRadiusY * 2}px`;
    }

    orbitIcons.forEach((icon, index) => {
      const angle = time + (index / orbitIcons.length) * Math.PI * 2;
      const x = Math.cos(angle) * orbitRadiusX;
      const y = Math.sin(angle) * orbitRadiusY;
      const scale = ((y + orbitRadiusY) / (orbitRadiusY * 2)) * 0.5 + 0.5;
      const zIndex = Math.round(scale * 10);

      icon.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      icon.style.zIndex = zIndex;
      icon.style.opacity = scale < 0.75 ? 0.4 : 1;
    });

    requestAnimationFrame(animateOrbit);
  }
  animateOrbit();

  // --- 3. Three.js Digital Earth Background ---
  // Skipped entirely on mobile widths — see the matching @media rule in style.css. This isn't
  // just hiding the canvas, it avoids creating the WebGL context/renderer/400-particle field at
  // all, which is the real performance cost on phones.
  const container = document.getElementById("canvas-container");
  const navBarEl = document.querySelector(".cyber-nav");
  const isMobileViewport = window.innerWidth <= 768;

  if (container && !isMobileViewport && typeof THREE !== "undefined") {
    function adjustCanvasContainer() {
      const navH = navBarEl ? navBarEl.offsetHeight : 0;
      container.style.top = `${navH}px`;
      container.style.height = `calc(100% - ${navH}px)`;
    }
    adjustCanvasContainer();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const globeRadius = 6;
    const geometry = new THREE.SphereGeometry(globeRadius, 40, 40);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.13,
    });
    const digitalEarth = new THREE.Mesh(geometry, material);
    scene.add(digitalEarth);

    const outerGeo = new THREE.SphereGeometry(globeRadius * 1.07, 20, 20);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.04,
    });
    const outerSphere = new THREE.Mesh(outerGeo, outerMat);
    scene.add(outerSphere);

    const nodeGeo = new THREE.SphereGeometry(0.07, 6, 6);
    const nodeMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.9,
    });
    const nodeGroup = new THREE.Group();
    const latLines = [-60, -30, 0, 30, 60];
    latLines.forEach((lat) => {
      const phi = (90 - lat) * (Math.PI / 180);
      for (let lon = 0; lon < 360; lon += 36) {
        const theta = lon * (Math.PI / 180);
        const node = new THREE.Mesh(nodeGeo, nodeMat);
        node.position.set(
          globeRadius * Math.sin(phi) * Math.cos(theta),
          globeRadius * Math.cos(phi),
          globeRadius * Math.sin(phi) * Math.sin(theta),
        );
        nodeGroup.add(node);
      }
    });
    digitalEarth.add(nodeGroup);

    const equatorGeo = new THREE.TorusGeometry(globeRadius, 0.025, 8, 120);
    const equatorMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.45,
    });
    const equatorRing = new THREE.Mesh(equatorGeo, equatorMat);
    equatorRing.rotation.x = Math.PI / 2;
    digitalEarth.add(equatorRing);

    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 400;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 30;
    }
    particlesGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3),
    );
    const particlesMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.25,
    });
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    function adjustPlanetSize() {
      if (window.innerWidth <= 768) {
        camera.position.z = 18;
      } else {
        camera.position.z = 11;
      }
    }
    adjustPlanetSize();

    window.addEventListener("resize", () => {
      adjustCanvasContainer();
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      adjustPlanetSize();
    });

    let animTime = 0;
    function animateThreeJS() {
      requestAnimationFrame(animateThreeJS);
      animTime += 0.012;
      digitalEarth.rotation.y += 0.0025;
      digitalEarth.rotation.x = 0.2;
      outerSphere.rotation.y -= 0.001;
      outerSphere.rotation.x = -0.1;
      nodeMat.opacity = 0.55 + Math.sin(animTime * 1.5) * 0.35;
      particlesMesh.rotation.y -= 0.0005;
      renderer.render(scene, camera);
    }
    animateThreeJS();
  }

  // --- 4. System_Bio Terminal Typewriter Effect ---
  const aboutSection = document.getElementById("about");
  const aboutParagraphs = document.querySelectorAll(".about-text p");
  let typeWriterTriggered = false;

  if (aboutSection && aboutParagraphs.length > 0) {
    const textPayloads = Array.from(aboutParagraphs).map((p) => {
      const text = p.textContent;
      p.textContent = "";
      return text;
    });

    const typeNode = (element, text, index, callback) => {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        const mechanicalDelay = Math.random() * 20 + 15;
        setTimeout(
          () => typeNode(element, text, index + 1, callback),
          mechanicalDelay,
        );
      } else if (callback) {
        setTimeout(callback, 400);
      }
    };

    const executeTypewriterSequence = () => {
      aboutParagraphs[0].classList.add("typing-active");
      typeNode(aboutParagraphs[0], textPayloads[0], 0, () => {
        aboutParagraphs[0].classList.remove("typing-active");
        if (aboutParagraphs[1]) {
          aboutParagraphs[1].classList.add("typing-active");
          typeNode(aboutParagraphs[1], textPayloads[1], 0, () => {
            aboutParagraphs[1].classList.remove("typing-active");
            const sysSpecs = document.querySelector(".sys-specs");
            if (sysSpecs) {
              sysSpecs.style.transition = "opacity 1s ease";
              sysSpecs.style.opacity = "1";
            }
          });
        }
      });
    };

    const sysSpecs = document.querySelector(".sys-specs");
    if (sysSpecs) sysSpecs.style.opacity = "0";

    const aboutObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !typeWriterTriggered) {
            typeWriterTriggered = true;
            setTimeout(executeTypewriterSequence, 300);
            aboutObserver.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );

    aboutObserver.observe(aboutSection);
  }

  // Mobile Menu Toggle Logic
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

  // Hero Image Pop-out Logic
  const heroImgWrapper = document.querySelector(".hero-image-wrapper");
  if (heroImgWrapper) {
    heroImgWrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      heroImgWrapper.classList.toggle("pop-out");
    });
    document.addEventListener("click", (e) => {
      if (!heroImgWrapper.contains(e.target)) {
        heroImgWrapper.classList.remove("pop-out");
      }
    });
  }

  // --- 5. Active Builds: animate progress bars in on scroll ---
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

  // --- 6. Tech Stack: staggered scroll-reveal ---
  const techBoxes = document.querySelectorAll(".tech-box");
  if (techBoxes.length) {
    const techObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const box = entry.target;
            const siblings = Array.from(
              box.closest(".tech-grid").querySelectorAll(".tech-box"),
            );
            const delayIndex = siblings.indexOf(box);
            setTimeout(() => box.classList.add("is-visible"), delayIndex * 60);
            observer.unobserve(box);
          }
        });
      },
      { threshold: 0.2 },
    );
    techBoxes.forEach((box) => techObserver.observe(box));
  }

  // --- 7. Credential certificate lightbox ---
  const certLightbox = document.getElementById("cert-lightbox");
  const certLightboxImg = document.getElementById("cert-lightbox-img");
  const certLightboxClose = document.getElementById("cert-lightbox-close");

  if (certLightbox && certLightboxImg) {
    document.querySelectorAll(".credential-box[data-cert]").forEach((box) => {
      box.classList.add("has-image");

      const certSrc = box.getAttribute("data-cert");
      if (!box.querySelector(".credential-thumb")) {
        const thumb = document.createElement("img");
        thumb.src = certSrc;
        thumb.alt = `${box.querySelector("h4")?.textContent || "Certificate"} preview`;
        thumb.className = "credential-thumb";
        box.prepend(thumb);
      }
      if (!box.querySelector(".credential-view-hint")) {
        const hint = document.createElement("span");
        hint.className = "credential-view-hint";
        hint.textContent = "Click to view full certificate →";
        box.appendChild(hint);
      }

      box.addEventListener("click", () => {
        certLightboxImg.src = certSrc;
        certLightbox.classList.add("active");
      });
    });

    const closeLightbox = () => certLightbox.classList.remove("active");
    certLightboxClose?.addEventListener("click", closeLightbox);
    certLightbox.addEventListener("click", (e) => {
      if (e.target === certLightbox) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });
  }

  // --- 8. Universal Dynamic 3D Interactive Cards Logic ---
  const projectCards = document.querySelectorAll(".project-card");

  projectCards.forEach((card) => {
    const bg = card.querySelector(".card-interactive-bg");

    if (bg) {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;

        // قراءة لون الـ Glow المتغير من الـ CSS المخصص لكل كارت
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
    }
  });
});
