document.addEventListener('DOMContentLoaded', () => {
    const audioContainer = document.getElementById('audioNamesContainer');
    const listContainer = document.getElementById('listNamesContainer');
    const audio = document.getElementById('audioPlayer');
    const playBtn = document.getElementById('playBtn');
    const pauseBtn = document.getElementById('pauseBtn');

    const currentNameDisplay = document.getElementById('currentNameDisplay');
    const displayName = document.getElementById('displayName');
    const displayMeaning = document.getElementById('displayMeaning');
    const displayExplanation = document.getElementById('displayExplanation');

    const tabBtns = document.querySelectorAll('.tab-btn');
    const views = document.querySelectorAll('.view-section');
    const themeToggle = document.getElementById('themeToggle');
    const searchInput = document.getElementById('searchInput');

    let activeIndex = -1;
    const tasbihData = JSON.parse(localStorage.getItem('tasbihCounts')) || {};

    // متغيرات للمشاركة كصورة
    let nameToShare = '';
    let meaningToShare = '';
    let explanationToShare = '';

    const shareModal = document.getElementById('shareModal');
    const shareLightBtn = document.getElementById('shareLightBtn');
    const shareDarkBtn = document.getElementById('shareDarkBtn');
    const closeShareModalBtn = document.getElementById('closeShareModalBtn');

    // بيانات ركن الأطفال
    let kidsStars = parseInt(localStorage.getItem('kidsStars')) || 0;
    const kidsStarsCountDisplay = document.getElementById('kidsStarsCount');

    // أزرار التبويبات الفرعية
    const kidsTabBtns = document.querySelectorAll('.kids-tab-btn');
    const kidsGameViews = document.querySelectorAll('.kids-game-view');

    // --- 1. المظهر والخطوط ---
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
    function updateThemeIcon(theme) { themeToggle.textContent = theme === 'light' ? '🌙' : '☀️'; }

    const htmlElement = document.documentElement;
    let currentFontSize = parseInt(localStorage.getItem('siteFontSize')) || 16;
    htmlElement.style.fontSize = `${currentFontSize}px`;
    document.getElementById('fontIncrease').addEventListener('click', () => { if (currentFontSize < 24) { currentFontSize += 2; htmlElement.style.fontSize = `${currentFontSize}px`; localStorage.setItem('siteFontSize', currentFontSize); } });
    document.getElementById('fontDecrease').addEventListener('click', () => { if (currentFontSize > 12) { currentFontSize -= 2; htmlElement.style.fontSize = `${currentFontSize}px`; localStorage.setItem('siteFontSize', currentFontSize); } });

    // --- 2. السكرول والبحث ---
    window.addEventListener('scroll', () => { document.body.classList.toggle('is-scrolled', window.scrollY > 80); });
    let isUserScrolling = false; let scrollTimeout;
    const pauseAutoScroll = () => { isUserScrolling = true; clearTimeout(scrollTimeout); scrollTimeout = setTimeout(() => { isUserScrolling = false; }, 2500); };
    window.addEventListener('wheel', pauseAutoScroll, { passive: true });
    window.addEventListener('touchmove', pauseAutoScroll, { passive: true });

    const removeTashkeel = (text) => text.replace(/[\u0617-\u061A\u064B-\u0652]/g, "");
    searchInput.addEventListener('input', (e) => {
        const term = removeTashkeel(e.target.value.trim().toLowerCase());
        document.querySelectorAll('.name-card, .list-item').forEach(card => {
            card.style.display = removeTashkeel(card.textContent.toLowerCase()).includes(term) ? '' : 'none';
        });
    });

    // --- 3. التبويبات الرئيسية ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            views.forEach(v => v.style.display = 'none');
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'block';
            if (targetId !== 'audioView') { audio.pause(); pauseBtn.style.display = 'none'; playBtn.style.display = 'inline-block'; }
            if (targetId === 'kidsView') { initKidsGames(); }
        });
    });

    kidsTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            kidsTabBtns.forEach(b => b.classList.remove('active'));
            kidsGameViews.forEach(v => v.style.display = 'none');
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-game')).style.display = 'block';
        });
    });

    // --- 4. رسم المحتوى الأساسي وتفعيل المشاركة كصورة ---
    function renderData() {
        const audioFragment = document.createDocumentFragment(); const listFragment = document.createDocumentFragment();
        asmaUlHusna.forEach((item, index) => {
            let currentCount = tasbihData[item.id] || 0;
            // 🌟 إرسال التفسير أيضاً ضمن بيانات زر المشاركة
            let actionsHTML = item.id <= 99 ? `<div class="card-actions"><button class="action-btn tasbih-btn" data-id="${item.id}">📿 تسبيح (<span class="count">${currentCount}</span>)</button><button class="action-btn share-btn" data-name="${item.name}" data-meaning="${item.meaning}" data-explanation="${item.explanation}">📸 شارك كصورة</button></div>` : '';

            const audioCard = document.createElement('div'); audioCard.className = 'name-card glass'; audioCard.id = `name-${index}`;
            audioCard.innerHTML = `<h2>${item.name}</h2><p class="card-meaning">${item.meaning}</p><p class="card-explanation">${item.explanation}</p>${actionsHTML}`;
            audioFragment.appendChild(audioCard);

            const listItem = document.createElement('div'); listItem.className = 'list-item glass';
            listItem.innerHTML = `<h3>${item.id ? item.id + '.' : ''} ${item.name}</h3><div class="meaning">المعنى: ${item.meaning}</div><div class="explanation">سبب التسمية: ${item.explanation}</div>${actionsHTML}`;
            listFragment.appendChild(listItem);
        });
        audioContainer.appendChild(audioFragment); listContainer.appendChild(listFragment);

        activateInteractionButtons();
    }

    function activateInteractionButtons() {
        document.querySelectorAll('.tasbih-btn').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); const id = btn.getAttribute('data-id'); tasbihData[id] = (tasbihData[id] || 0) + 1; localStorage.setItem('tasbihCounts', JSON.stringify(tasbihData)); document.querySelectorAll(`.tasbih-btn[data-id="${id}"] .count`).forEach(span => span.textContent = tasbihData[id]); });
        });

        // 🌟 عرض نافذة اختيار المظهر عند ضغط زر المشاركة
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                nameToShare = btn.getAttribute('data-name');
                meaningToShare = btn.getAttribute('data-meaning');
                explanationToShare = btn.getAttribute('data-explanation');
                shareModal.style.display = 'flex';
            });
        });
    }

    // 🌟 منطق إغلاق النافذة وتوليد الصورة
    closeShareModalBtn.addEventListener('click', () => { shareModal.style.display = 'none'; });

    const captureAndShare = async (theme) => {
        shareModal.style.display = 'none'; // إخفاء النافذة للبدء

        const captureCard = document.getElementById('captureCard');
        document.getElementById('capName').textContent = nameToShare;
        document.getElementById('capMeaning').textContent = meaningToShare;
        document.getElementById('capExplanation').textContent = explanationToShare;

        // تعيين الثيم المطلوب (light أو dark)
        captureCard.className = `capture-card ${theme}`;

        try {
            // أخذ سكرين شوت برمجية للكارت
            const canvas = await html2canvas(captureCard, {
                scale: 2, // جودة عالية HD
                useCORS: true,
                backgroundColor: null // للحفاظ على الشفافية والتدرجات
            });

            // تحويلها لصورة قابلة للتحميل
            const imageURL = canvas.toDataURL('image/png');

            // تحميل الصورة تلقائياً لجهاز المستخدم ليشاركها
            const link = document.createElement('a');
            link.download = `اسم_الله_${nameToShare.replace(/\s+/g, '_')}.png`;
            link.href = imageURL;
            link.click();

        } catch (error) {
            console.error('Error generating image', error);
            alert('حدث خطأ أثناء إنشاء الصورة. يرجى المحاولة مرة أخرى.');
        }
    };

    shareLightBtn.addEventListener('click', () => captureAndShare('light'));
    shareDarkBtn.addEventListener('click', () => captureAndShare('dark'));

    // --- 5. الصوت ---
    playBtn.addEventListener('click', () => { audio.play(); playBtn.style.display = 'none'; pauseBtn.style.display = 'inline-block'; });
    pauseBtn.addEventListener('click', () => { audio.pause(); pauseBtn.style.display = 'none'; playBtn.style.display = 'inline-block'; });
    audio.addEventListener('ended', () => { pauseBtn.style.display = 'none'; playBtn.style.display = 'inline-block'; });

    audio.addEventListener('timeupdate', () => {
        const currentTime = audio.currentTime;
        const newActiveIndex = asmaUlHusna.findLastIndex(item => currentTime >= item.time);
        if (newActiveIndex !== activeIndex && newActiveIndex !== -1) {
            currentNameDisplay.style.display = 'block'; displayName.textContent = asmaUlHusna[newActiveIndex].name; displayMeaning.textContent = asmaUlHusna[newActiveIndex].meaning; displayExplanation.textContent = asmaUlHusna[newActiveIndex].explanation;
            document.querySelectorAll('#audioNamesContainer .name-card').forEach(card => card.classList.remove('active'));
            for (let i = 0; i <= newActiveIndex; i++) { const card = document.getElementById(`name-${i}`); if (card) card.classList.add('shown'); }
            const activeCard = document.getElementById(`name-${newActiveIndex}`);
            if (activeCard) { activeCard.classList.add('active'); if (!isUserScrolling) { const header = document.getElementById('mainHeader'); window.scrollTo({ top: (activeCard.getBoundingClientRect().top + window.scrollY) - ((header ? header.offsetHeight : 0) + currentNameDisplay.offsetHeight + 40), behavior: 'smooth' }); } }
            activeIndex = newActiveIndex;
        }
    });

    // ==========================================
    // 6. منطق الألعاب (الخريطة والمجرة)
    // ==========================================
    function updateKidsStars() { kidsStarsCountDisplay.textContent = kidsStars; localStorage.setItem('kidsStars', kidsStars); }
    function shuffleArray(array) { let shuffled = [...array]; for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; } return shuffled; }

    let gamesInitialized = false;
    function initKidsGames() { if (gamesInitialized) return; updateKidsStars(); initInteractiveMap(); initGalaxyGame(); gamesInitialized = true; }

    let highestUnlockedNode = parseInt(localStorage.getItem('highestMapNode')) || 1;
    const mapContainer = document.getElementById('mapContainer');
    const quizModal = document.getElementById('quizModal');
    const quizNameEl = document.getElementById('quizName');
    const quizOptionsEl = document.getElementById('quizOptions');

    function initInteractiveMap() {
        mapContainer.innerHTML = ''; const namesToDisplay = asmaUlHusna.filter(item => item.id <= 99).slice(0, 30);
        namesToDisplay.forEach(item => {
            const node = document.createElement('div'); node.className = 'map-node'; node.setAttribute('data-id', item.id);
            if (item.id < highestUnlockedNode) { node.classList.add('completed'); node.innerHTML = '✅'; }
            else if (item.id === highestUnlockedNode) { node.classList.add('unlocked'); node.innerHTML = item.name; }
            else { node.classList.add('locked'); node.innerHTML = '🔒'; }
            node.addEventListener('click', () => { if (item.id === highestUnlockedNode) { openQuiz(item); } });
            mapContainer.appendChild(node);
        });
    }

    function openQuiz(targetItem) {
        quizNameEl.textContent = targetItem.name; quizOptionsEl.innerHTML = '';
        const otherMeanings = asmaUlHusna.filter(i => i.id !== targetItem.id && i.id <= 99);
        const wrongAnswers = shuffleArray(otherMeanings).slice(0, 2); const options = shuffleArray([targetItem, ...wrongAnswers]);
        options.forEach(opt => {
            const btn = document.createElement('button'); btn.className = 'quiz-opt-btn'; btn.textContent = opt.meaning;
            btn.addEventListener('click', () => {
                if (opt.id === targetItem.id) { btn.classList.add('correct'); setTimeout(() => { kidsStars += 10; updateKidsStars(); highestUnlockedNode++; localStorage.setItem('highestMapNode', highestUnlockedNode); quizModal.style.display = 'none'; initInteractiveMap(); }, 1000); }
                else { btn.classList.add('wrong'); setTimeout(() => btn.classList.remove('wrong'), 500); }
            });
            quizOptionsEl.appendChild(btn);
        });
        quizModal.style.display = 'flex';
    }
    document.getElementById('closeQuizBtn').addEventListener('click', () => quizModal.style.display = 'none');

    // المجرة 
    const galaxyContainer = document.getElementById('galaxyContainer');
    const planetModal = document.getElementById('planetModal');
    const planetNameEl = document.getElementById('planetName');
    const planetMeaningEl = document.getElementById('planetMeaning');

    function createBackgroundStars() {
        const starsLayer = document.getElementById('starsLayer');
        if (!starsLayer) return;
        let starsBoxShadow = [];
        for (let i = 0; i < 200; i++) { let x = Math.floor(Math.random() * 2000); let y = Math.floor(Math.random() * 2000); let size = Math.random() < 0.5 ? '1px' : '2px'; let opacity = Math.random().toFixed(2); starsBoxShadow.push(`${x}px ${y}px 0 ${size} rgba(255,255,255,${opacity})`); }
        starsLayer.style.boxShadow = starsBoxShadow.join(', ');
    }

    function initGalaxyGame() { generatePlanets(); }

    function generatePlanets() {
        galaxyContainer.innerHTML = '<div class="stars-layer" id="starsLayer"></div>';
        createBackgroundStars();

        const centerName = asmaUlHusna.find(item => item.id === 1) || asmaUlHusna[0];
        const centerEl = document.createElement('div'); centerEl.className = 'center-sun'; centerEl.textContent = centerName.name;
        centerEl.addEventListener('click', () => { planetNameEl.textContent = centerName.name; planetMeaningEl.textContent = centerName.meaning; planetModal.style.display = 'flex'; });
        galaxyContainer.appendChild(centerEl);

        const otherNames = asmaUlHusna.filter(item => item.id > 1 && item.id <= 99);
        const randomNames = shuffleArray(otherNames).slice(0, 20);
        const glassGradients = ['radial-gradient(circle at 30% 30%, rgba(212,175,55,0.75), rgba(50,40,10,0.85))', 'radial-gradient(circle at 30% 30%, rgba(29,209,161,0.75), rgba(10,50,40,0.85))', 'radial-gradient(circle at 30% 30%, rgba(255,107,107,0.75), rgba(60,20,20,0.85))', 'radial-gradient(circle at 30% 30%, rgba(156,136,255,0.75), rgba(40,30,80,0.85))', 'radial-gradient(circle at 30% 30%, rgba(72,219,251,0.75), rgba(15,45,60,0.85))'];

        for (let i = 0; i < 10; i++) {
            const diameter = (140 + (i * 75)) * 2;
            const orbit = document.createElement('div'); orbit.className = 'orbit-ring'; orbit.style.width = `${diameter}px`; orbit.style.height = `${diameter}px`; orbit.style.marginTop = `-${diameter / 2}px`; orbit.style.marginLeft = `-${diameter / 2}px`;
            const duration = 30 + (i * 12); const direction = i % 2 === 0 ? 'spin-right' : 'spin-left'; const counterDirection = direction === 'spin-right' ? 'spin-left' : 'spin-right';
            orbit.style.animation = `${direction} ${duration}s linear infinite`;

            for (let j = 0; j < 2; j++) {
                const nameItem = randomNames[(i * 2) + j]; if (!nameItem) continue;
                const wrapper = document.createElement('div'); wrapper.className = 'planet-wrapper';
                const angle = (j * 180) + (Math.random() * 45); wrapper.style.transform = `rotate(${angle}deg) translateX(${diameter / 2}px)`;
                const rotationFix = document.createElement('div'); rotationFix.className = 'planet-rotation-fix'; rotationFix.style.animation = `${counterDirection} ${duration}s linear infinite`;
                const planet = document.createElement('div'); planet.className = 'planet'; planet.textContent = nameItem.name; planet.style.background = glassGradients[(i + j) % glassGradients.length];
                planet.style.setProperty('--anti-tilt', `${-angle}deg`);
                planet.addEventListener('click', (e) => { e.stopPropagation(); planetNameEl.textContent = nameItem.name; planetMeaningEl.textContent = nameItem.meaning; planetModal.style.display = 'flex'; kidsStars += 1; updateKidsStars(); });
                rotationFix.appendChild(planet); wrapper.appendChild(rotationFix); orbit.appendChild(wrapper);
            }
            galaxyContainer.appendChild(orbit);
        }
    }
    document.getElementById('refreshGalaxyBtn').addEventListener('click', generatePlanets); document.getElementById('closePlanetBtn').addEventListener('click', () => planetModal.style.display = 'none');
    renderData();
});