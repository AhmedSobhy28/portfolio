        // --- Live search + status filter for the backlog grid (real client-side filtering, no fake stats) ---
        const backlogItems = Array.from(document.querySelectorAll("#backlog-grid .backlog-card"));
        const searchInput = document.getElementById("backlog-search-input");
        const tabs = document.querySelectorAll(".backlog-tab");
        const emptyState = document.getElementById("backlog-empty-state");
        let activeFilter = "all";

        function updateCounts() {
            const counts = { all: backlogItems.length, active: 0, idea: 0 };
            backlogItems.forEach((item) => counts[item.dataset.status]++);
            document.getElementById("count-all").textContent = counts.all;
            document.getElementById("count-active").textContent = counts.active;
            document.getElementById("count-idea").textContent = counts.idea;
        }

        function applyFilters() {
            const query = searchInput.value.trim().toLowerCase();
            let visibleCount = 0;

            backlogItems.forEach((item) => {
                const matchesStatus = activeFilter === "all" || item.dataset.status === activeFilter;
                const matchesSearch = !query || item.dataset.search.includes(query);
                const show = matchesStatus && matchesSearch;
                item.style.display = show ? "" : "none";
                if (show) visibleCount++;
            });

            emptyState.hidden = visibleCount !== 0;
        }

        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                tabs.forEach((t) => t.classList.remove("active"));
                tab.classList.add("active");
                activeFilter = tab.dataset.filter;
                applyFilters();
            });
        });

        searchInput.addEventListener("input", applyFilters);

        updateCounts();
        applyFilters();

        // --- Idea form: char counter + pre-filled mailto: + confirmation toast ---
        const detailsField = document.getElementById("idea-details");
        const detailsCount = document.getElementById("idea-details-count");
        detailsField.addEventListener("input", () => {
            detailsCount.textContent = `${detailsField.value.length} / 500`;
        });

        document.getElementById("idea-form")?.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("idea-name").value.trim();
            const title = document.getElementById("idea-title").value.trim();
            const details = detailsField.value.trim();

            const subject = encodeURIComponent(`Project idea: ${title || "Untitled"}`);
            const bodyLines = [
                name ? `From: ${name}` : null,
                title ? `Idea: ${title}` : null,
                details ? `\nDetails:\n${details}` : null,
            ].filter(Boolean);
            const body = encodeURIComponent(bodyLines.join("\n"));

            window.location.href = `mailto:ah.sobhy07@gmail.com?subject=${subject}&body=${body}`;

            const toast = document.getElementById("idea-toast");
            toast.classList.add("active");
            setTimeout(() => toast.classList.remove("active"), 4000);
        });