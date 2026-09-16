document.addEventListener("DOMContentLoaded", () => {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);

  // 1a. Nav bar: shrink after a small scroll threshold + a thin scroll-position
  // bar along its bottom edge.
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

  // 1b. Nav scroll-spy: highlights the tab for whichever section is currently
  // in view. Sections without their own tab (e.g. #upcoming) fall back to the
  // nearest section above them via sectionToNavKey.
  const navLinksBySection = {};
  document.querySelectorAll(".nav-links a[data-nav-section]").forEach((a) => {
    navLinksBySection[a.dataset.navSection] = a;
  });
  const sectionToNavKey = {
    hero: "hero",
    about: "about",
    engines: "engines",
    upcoming: "engines",
    credentials: "credentials",
    tech: "tech",
    contact: "contact",
  };
  const spySections = Object.keys(sectionToNavKey)
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (spySections.length && Object.keys(navLinksBySection).length) {
    const setActiveNav = (sectionId) => {
      const key = sectionToNavKey[sectionId];
      const link = navLinksBySection[key];
      if (!link) return;
      Object.values(navLinksBySection).forEach((a) =>
        a.classList.remove("active"),
      );
      link.classList.add("active");
    };

    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveNav(entry.target.id);
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    spySections.forEach((section) => spyObserver.observe(section));
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
    // على الموبايل نصف القطر الأفقي القديم (58% من عرض الشاشة) كان بيطلع
    // الأيقونات برة حدود الشاشة فتتقص (الـ hero عنده overflow:hidden) —
    // عشان كده كان بيبان 4 أيقونات بس. دلوقتي بنسيب هامش 56px من كل ناحية
    // (زودناها من 48 عشان تسمية زي "Python" ماتلزقش في حافة الشاشة).
    const orbitRadiusX = isMobile
      ? Math.max(90, window.innerWidth / 2 - 56)
      : Math.min(window.innerWidth * 0.42, 480);
    // والرأسي بقى متعلق بارتفاع الشاشة مش عرضها، عشان ميتصادمش مع النص
    const orbitRadiusY = isMobile
      ? Math.min(window.innerHeight * 0.15, 115)
      : Math.min(window.innerWidth * 0.17, 175);

    if (orbitRing) {
      orbitRing.style.width = `${orbitRadiusX * 2}px`;
      orbitRing.style.height = `${orbitRadiusY * 2}px`;
    }

    // على الموبايل الاسم بقى سطرين (AHMED فوق، SOBHY تحت) حوالين نفس
    // نقطة المركز اللي الأيقونات بتلف حواليها، فلازم نمنع الأيقونة تعدي
    // من نفس الشريط الرأسي اللي الاسم قاعد فيه، وإلا هتغطي على الحروف
    // زي ما كان بيحصل. الشريط ده اتوسع شوية عشان الصورة بقت أكبر ومحتاجة
    // مساحة رأسية أكبر حواليها. بندفع أي نقطة قريبة من المنتصف لبرة الشريط ده.
    const nameBandHalf = 0;

    orbitIcons.forEach((icon, index) => {
      const angle = time + (index / orbitIcons.length) * Math.PI * 2;
      const x = Math.cos(angle) * orbitRadiusX;
      let y = Math.sin(angle) * orbitRadiusY;
      if (nameBandHalf && Math.abs(y) < nameBandHalf) {
        y = (y >= 0 ? nameBandHalf : -nameBandHalf) + y * 0.15;
      }
      const scale = ((y + orbitRadiusY) / (orbitRadiusY * 2)) * 0.5 + 0.5;
      const zIndex = Math.round(scale * 10);

      // الـ -50% بتخلي مركز الأيقونة هو اللي على المدار، بدل الركن
      // الشمال العلوي — فرق واضح على الموبايل لما الأيقونة تقرب من الحافة.
      icon.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%)) scale(${scale})`;
      icon.style.zIndex = zIndex;
      icon.style.opacity = scale < 0.75 ? 0.4 : 1;
    });

    requestAnimationFrame(animateOrbit);
  }
  animateOrbit();

  // --- 3. Three.js Digital Earth Background ---
  // اتفعلت تاني على الموبايل، لكن بإعدادات أخف بكتير من الديسكتوب:
  // segments أقل، بدون antialias، devicePixelRatio مقصوص، عقد/جسيمات أقل
  // بكتير (أو معدومة). isMobileViewport بتتحسب هنا وبتتبعت لكل جزء
  // من الإعداد تحت عشان يختار النسخة الخفيفة بدل ما يلغي الكرة خالص.
  const container = document.getElementById("canvas-container");
  const navBarEl = document.querySelector(".cyber-nav");
  const isMobileViewport = window.innerWidth <= 768;

  if (container && typeof THREE !== "undefined") {
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
    // على الموبايل: بدون antialias (تكلفتها عالية على الـ GPU الضعيف)
    // وpixel ratio مقصوص لـ 1.5 كحد أقصى بدل ما ياخد الـ devicePixelRatio
    // الحقيقي (اللي ممكن يبقى 3 على شاشات الـ retina وده بيربّع تكلفة الرندر).
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobileViewport,
      powerPreference: isMobileViewport ? "low-power" : "default",
    });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(
      isMobileViewport
        ? Math.min(window.devicePixelRatio, 1.5)
        : window.devicePixelRatio,
    );
    container.appendChild(renderer.domElement);

    const globeRadius = 6;
    // segments أقل بكتير على الموبايل (16 بدل 40) — الفرق البصري في شكل
    // wireframe شبه معدوم لأن الخطوط أصلاً رفيعة وشفافة، لكن الفرق في
    // عدد الـ triangles (وبالتالي تكلفة الرندر) كبير جداً.
    const sphereSegs = isMobileViewport ? 16 : 40;
    const geometry = new THREE.SphereGeometry(globeRadius, sphereSegs, sphereSegs);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.13,
    });
    const digitalEarth = new THREE.Mesh(geometry, material);
    scene.add(digitalEarth);

    const outerSegs = isMobileViewport ? 8 : 20;
    const outerGeo = new THREE.SphereGeometry(globeRadius * 1.07, outerSegs, outerSegs);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.04,
    });
    const outerSphere = new THREE.Mesh(outerGeo, outerMat);
    scene.add(outerSphere);

    // شبكة النقط (nodeGroup) بتضاعف عدد الـ draw calls من غير فايدة بصرية
    // كبيرة على شاشة صغيرة — بنسيبها بس على الديسكتوب.
    // نص على مستوى الدالة عشان لوب الأنيميشن يقدر يوصله حتى لو اتعرّف
    // جوه شرط الديسكتوب بس (null على الموبايل يبقى معناها "متعرفش").
    let nodeMat = null;
    if (!isMobileViewport) {
      const nodeGeo = new THREE.SphereGeometry(0.07, 6, 6);
      nodeMat = new THREE.MeshBasicMaterial({
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
    }

    const equatorSegs = isMobileViewport ? 4 : 8;
    const equatorTube = isMobileViewport ? 40 : 120;
    const equatorGeo = new THREE.TorusGeometry(globeRadius, 0.025, equatorSegs, equatorTube);
    const equatorMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.45,
    });
    const equatorRing = new THREE.Mesh(equatorGeo, equatorMat);
    equatorRing.rotation.x = Math.PI / 2;
    digitalEarth.add(equatorRing);

    // حقل الجسيمات كان 400 نقطة — على الموبايل بقى 60 بس (تأثير خفيف
    // في الخلفية من غير ما يبقى عبء حقيقي على الـ GPU).
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = isMobileViewport ? 60 : 400;
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
      if (nodeMat) nodeMat.opacity = 0.55 + Math.sin(animTime * 1.5) * 0.35;
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

  // --- 8. Contact section: reveal heading/paragraph/buttons on scroll ---
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

  // --- 9. Universal Dynamic 3D Interactive Cards Logic ---
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
