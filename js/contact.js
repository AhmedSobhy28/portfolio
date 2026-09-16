// Contact form submit script
const form = document.getElementById('secure-form');
const submitBtn = document.getElementById('submit-btn');
const formStatus = document.getElementById('form-status');

// Get a free access key at https://web3forms.com (enter ah.sobhy07@gmail.com,
// they email you the key — no account/dashboard needed). Paste it below.
const WEB3FORMS_ACCESS_KEY = 'ed940e1c-04af-412f-8db9-115cd2c06a2d';

const DEFAULT_STATUS_TEXT = formStatus ? formStatus.textContent.trim() : '';

// Form Submit: real delivery straight to my inbox via Web3Forms — the message
// is sent from this page itself, no email client on the visitor's end required.
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameVal = document.getElementById('name').value.trim();
    const emailVal = document.getElementById('email').value.trim();
    const messageVal = document.getElementById('message').value.trim();

    submitBtn.style.pointerEvents = 'none';
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    if (formStatus) {
        formStatus.textContent = 'Sending...';
        formStatus.className = 'form-note';
    }

    try {
        if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR_ACCESS_KEY_HERE') {
            throw new Error('missing-key');
        }

        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                access_key: WEB3FORMS_ACCESS_KEY,
                subject: `Portfolio contact from ${nameVal || 'a visitor'}`,
                name: nameVal,
                email: emailVal,
                message: messageVal,
            }),
        });

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'submit-failed');
        }

        submitBtn.innerHTML = '<i class="fas fa-check"></i> Sent!';
        if (formStatus) {
            formStatus.textContent = "Thanks — your message landed in my inbox. I'll get back to you soon.";
            formStatus.className = 'form-note form-note-success';
        }
        form.reset();
    } catch (err) {
        submitBtn.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Couldn\'t send';
        if (formStatus) {
            formStatus.innerHTML = 'Something went wrong. You can also email me directly at <a href="mailto:ah.sobhy07@gmail.com">ah.sobhy07@gmail.com</a>.';
            formStatus.className = 'form-note form-note-error';
        }
    } finally {
        setTimeout(() => {
            submitBtn.style.pointerEvents = 'auto';
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
            if (formStatus && formStatus.className === 'form-note') {
                formStatus.textContent = DEFAULT_STATUS_TEXT;
            }
        }, 3000);
    }
});

// 1. Force Scroll to Top & Wave Animation Logic
if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
window.scrollTo(0, 0);

const waveSvg = document.querySelector('.cyber-wave-svg');
if (waveSvg) {
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;
        const moveAmount = scrollPercent * -66.66;
        requestAnimationFrame(() => {
            waveSvg.style.transform = `translateY(${moveAmount}%)`;
        });
    });
}

// Mobile Menu Toggle Logic
const mobileMenuBtn = document.querySelector('.mobile-menu-toggle');
const navLinksContainer = document.querySelector('.nav-links');

if (mobileMenuBtn && navLinksContainer) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinksContainer.classList.toggle('active');
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
