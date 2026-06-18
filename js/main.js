document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. Cinematic 4-Second Loader ---
    const loaderBar = document.querySelector('.loader-bar');
    const loaderPercentage = document.querySelector('.loader-percentage');
    let progress = 0;

    // 1. Force Scroll to Top on Refresh (منع المتصفح من تذكر مكان الـ Scroll)
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // 2. Parallax Wave Scroll Logic (ربط حركة الـ Wave بالـ Scroll)
    const waveSvg = document.querySelector('.cyber-wave-svg');
    
    if (waveSvg) {
        window.addEventListener('scroll', () => {
            // حساب نسبة النزول في الموقع (من 0 إلى 1)
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = scrollTop / docHeight;

            // تحريك الـ Wave للأعلى بشكل متناسق مع النزول
            // تم اختيار -66.66% لأن طول الـ SVG هو 300vh
            const moveAmount = scrollPercent * -66.66;
            
            // استخدام requestAnimationFrame لضمان نعومة الحركة بدون تقطيع
            requestAnimationFrame(() => {
                waveSvg.style.transform = `translateY(${moveAmount}%)`;
            });
        });
    }
    
    const interval = setInterval(() => {
        progress += 1;
        loaderBar.style.width = `${progress}%`;
        loaderPercentage.innerText = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                document.getElementById('loader').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('loader').style.display = 'none';
                    document.getElementById('main-content').style.opacity = '1';
                }, 800);
            }, 400); 
        }
    }, 35); 


    // --- 2. Orbiting Atmosphere Logic ---
    const orbitIcons = document.querySelectorAll('.orbit-icon');
    
    // The animation loop for the orbiting elements
    function animateOrbit() {
        const time = Date.now() * 0.0005; // Adjust speed here
        
        // Dynamic radius based on screen size for responsiveness
        const orbitRadiusX = Math.min(window.innerWidth * 0.4, 450); 
        const orbitRadiusY = Math.min(window.innerWidth * 0.15, 150); // Elliptical height creates 3D depth
        
        orbitIcons.forEach((icon, index) => {
            // Space them out evenly around the circle
            const angle = time + (index / orbitIcons.length) * Math.PI * 2;
            
            // Calculate X and Y on an ellipse
            const x = Math.cos(angle) * orbitRadiusX;
            const y = Math.sin(angle) * orbitRadiusY;
            
            // Apply scale based on Y position to fake 3D depth (smaller when "behind")
            const scale = (y + orbitRadiusY) / (orbitRadiusY * 2) * 0.5 + 0.5; 
            const zIndex = Math.round(scale * 10);
            
            icon.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
            icon.style.zIndex = zIndex;
            
            // Dim elements slightly when they are "behind" the planet
            icon.style.opacity = scale < 0.75 ? 0.4 : 1;
        });
        
        requestAnimationFrame(animateOrbit);
    }
    animateOrbit();


    // --- 3. Three.js Digital Earth Background ---
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); 
    container.appendChild(renderer.domElement);

    // Using SphereGeometry to create the Earth planet shape
    const geometry = new THREE.SphereGeometry(6, 32, 32); 
    
    // Wireframe material to give it that digital/cyber mapping look
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x00E5FF, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.05 
    });
    
    const digitalEarth = new THREE.Mesh(geometry, material);
    scene.add(digitalEarth);
    
    // Add ambient stars/data particles in the background
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 300;
    const posArray = new Float32Array(particlesCount * 3);
    
    for(let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 25;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
        size: 0.02,
        color: 0x64748B,
        transparent: true,
        opacity: 0.3
    });
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    camera.position.z = 12;

    // 3D Animation Loop
    function animateThreeJS() {
        requestAnimationFrame(animateThreeJS);
        
        // Earth rotation
        digitalEarth.rotation.y += 0.002;
        digitalEarth.rotation.x = 0.2; // Slight tilt like Earth's axis
        
        // Particle slow rotation
        particlesMesh.rotation.y -= 0.0005;

        renderer.render(scene, camera);
    }
    animateThreeJS();

    // Responsive Canvas Resizing
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- 4. System_Bio Terminal Typewriter Effect ---
    const aboutSection = document.getElementById('about');
    const aboutParagraphs = document.querySelectorAll('.about-text p');
    let typeWriterTriggered = false;

    if (aboutSection && aboutParagraphs.length > 0) {
        // Cache original text and clear DOM
        const textPayloads = Array.from(aboutParagraphs).map(p => {
            const text = p.textContent;
            p.textContent = '';
            return text;
        });

        // Recursive typing function with randomized mechanical delay
        const typeNode = (element, text, index, callback) => {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                // Random delay between 15ms and 35ms for realistic terminal rendering
                const mechanicalDelay = Math.random() * 20 + 15;
                setTimeout(() => typeNode(element, text, index + 1, callback), mechanicalDelay);
            } else if (callback) {
                setTimeout(callback, 400); // Pause before next block
            }
        };

        const executeTypewriterSequence = () => {
            aboutParagraphs[0].classList.add('typing-active');
            
            // Execute Block 1
            typeNode(aboutParagraphs[0], textPayloads[0], 0, () => {
                aboutParagraphs[0].classList.remove('typing-active');
                
                // Proceed to Block 2 if it exists
                if (aboutParagraphs[1]) {
                    aboutParagraphs[1].classList.add('typing-active');
                    typeNode(aboutParagraphs[1], textPayloads[1], 0, () => {
                        aboutParagraphs[1].classList.remove('typing-active');
                        
                        // Execute Sys Specs fade in after typing completes
                        const sysSpecs = document.querySelector('.sys-specs');
                        if (sysSpecs) {
                            sysSpecs.style.transition = 'opacity 1s ease';
                            sysSpecs.style.opacity = '1';
                        }
                    });
                }
            });
        };

        // Hide sys-specs initially to reveal them after typing
        const sysSpecs = document.querySelector('.sys-specs');
        if (sysSpecs) sysSpecs.style.opacity = '0';

        // Trigger on scroll
        const aboutObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !typeWriterTriggered) {
                    typeWriterTriggered = true;
                    // Add slight delay after scrolling into view before executing
                    setTimeout(executeTypewriterSequence, 300); 
                    aboutObserver.disconnect();
                }
            });
        }, { threshold: 0.4 });

        aboutObserver.observe(aboutSection);
    }
    // Mobile Menu Toggle Logic
    const mobileMenuBtn = document.querySelector('.mobile-menu-toggle');
    const navLinksContainer = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinksContainer) {
        mobileMenuBtn.addEventListener('click', () => {
            // إضافة أو إزالة كلاس active لفتح وقفل القائمة
            navLinksContainer.classList.toggle('active');
            
            // تغيير الأيقونة من ثلاث شرط إلى علامة X
            const icon = mobileMenuBtn.querySelector('i');
            if (navLinksContainer.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }
    // --- 4. Hero Image Pop-out Logic (Mobile Interaction) ---
    const heroImgWrapper = document.querySelector('.hero-image-wrapper');
    
    if (heroImgWrapper) {
        // عند الضغط على الصورة
        heroImgWrapper.addEventListener('click', (e) => {
            e.stopPropagation(); // يمنع الضغطة من التأثير على باقي الصفحة
            heroImgWrapper.classList.toggle('pop-out');
        });

        // عند الضغط في أي مكان آخر في الشاشة
        document.addEventListener('click', (e) => {
            if (!heroImgWrapper.contains(e.target)) {
                heroImgWrapper.classList.remove('pop-out');
            }
        });
    }
});