        // Terminal Reaction Script
        const form = document.getElementById('secure-form');
        const submitBtn = document.getElementById('submit-btn');
        const terminalOutput = document.getElementById('terminal-output');

        // Form Submit: real delivery via mailto: (matches backlog.html's honest pattern),
        // wrapped in the terminal animation for flavor. Nothing here claims a server-side
        // send — the actual send happens when the user's mail client opens.
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameVal = document.getElementById('name').value.trim();
            const emailVal = document.getElementById('email').value.trim();
            const messageVal = document.getElementById('message').value.trim();

            // Visual lock of the button
            submitBtn.style.pointerEvents = 'none';
            submitBtn.style.background = 'var(--accent-alert)';
            submitBtn.style.color = '#000';
            submitBtn.innerHTML = '<i class="fas fa-skull"></i> EXECUTING...';

            // Terminal sequence array — describes what's actually happening (building the
            // email + handing off to the mail client), not a fake server round-trip.
            const sequence = [
                "<span class='system-alert'>> COMPOSING SECURE PAYLOAD...</span>",
                "> Validating fields...",
                "<span class='system-cyan'>> Packing payload for local mail client...</span>",
                "> Handing off to OS mail handler...",
                "<span class='system-green' style='color: #00FF66;'>> MAIL CLIENT LAUNCH READY.</span>"
            ];

            terminalOutput.innerHTML = ''; // Clear terminal
            let i = 0;

            function printLine() {
                if (i < sequence.length) {
                    terminalOutput.innerHTML += sequence[i] + "<br>";
                    terminalOutput.scrollTop = terminalOutput.scrollHeight;
                    i++;
                    setTimeout(printLine, Math.random() * 400 + 200); // Random delay 200-600ms
                } else {
                    terminalOutput.innerHTML += "> <span style='animation: blink 1s infinite;'>_</span>";

                    // Actually open the mail client with the message pre-filled.
                    const subject = encodeURIComponent(`Portfolio contact from ${nameVal || 'a visitor'}`);
                    const bodyLines = [
                        `From: ${nameVal}`,
                        `Reply-to: ${emailVal}`,
                        '',
                        messageVal
                    ];
                    const body = encodeURIComponent(bodyLines.join('\n'));
                    window.location.href = `mailto:ah.sobhy07@gmail.com?subject=${subject}&body=${body}`;

                    // Reset Button after sequence
                    setTimeout(() => {
                        submitBtn.style.pointerEvents = 'auto';
                        submitBtn.style.background = 'transparent';
                        submitBtn.style.color = 'var(--accent-alert)';
                        submitBtn.innerHTML = '<i class="fas fa-radiation" style="margin-right: 10px;"></i> Transmit New Package';
                        form.reset();
                    }, 2000);
                }
            }

            printLine();
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