        // Wave Scroll Logic
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

        // Mobile Menu Logic
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

        // Live Diagnostic Terminals Generator
        const sysTerminal = document.getElementById('sys-terminal');
        const sysMessages = [
            "> Pinging external AWS nodes... [OK]",
            "> Scanning for vulnerabilities... [0 FOUND]",
            "> Running background cron jobs...",
            "<span style='color: var(--accent-cyan);'>> SSL Handshake verified securely.</span>",
            "> CPU temperature: 42°C [STABLE]",
            "> Routing traffic through proxy..."
        ];

        const netTerminal = document.getElementById('net-terminal');
        const netMessages = [
            "> Analyzing deep packet inspection...",
            "> Deflecting DDOS packets from Region [X]...",
            "<span style='color: var(--text-bright);'>> Establishing secure SSH tunnel...</span>",
            "> Refreshing DNS cache...",
            "<span style='color: var(--accent-alert);'>> Unauthorized access attempt logged.</span>",
            "> System integrity at 100%."
        ];

        let sysIndex = 0;
        let netIndex = 0;

        setInterval(() => {
            if (sysTerminal.children.length > 6) sysTerminal.removeChild(sysTerminal.firstChild);
            const newLine = document.createElement('span');
            newLine.innerHTML = sysMessages[sysIndex];
            sysTerminal.appendChild(newLine);
            sysIndex = (sysIndex + 1) % sysMessages.length;
        }, 2500);

        setInterval(() => {
            if (netTerminal.children.length > 6) netTerminal.removeChild(netTerminal.firstChild);
            const newLine = document.createElement('span');
            newLine.innerHTML = netMessages[netIndex];
            netTerminal.appendChild(newLine);
            netIndex = (netIndex + 1) % netMessages.length;
        }, 3200);