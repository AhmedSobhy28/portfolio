const divisions = [
  {
    name: "AI Division",
    accent: "#ff8a4d",
    lead: "Ebrahim Emad",
    summary: "Structures authorized security data, connects MCP context, and turns technical findings into clear AI-supported insight.",
    icon: "brain"
  },
  {
    name: "Cyber Security Division",
    accent: "#28d7ff",
    lead: "Yussef Helmy",
    summary: "Maps attack surfaces, validates CVEs, selects assessment tools, and guides project hardening practices.",
    icon: "shield"
  },
  {
    name: "Embedded Systems Division",
    accent: "#42dc8c",
    lead: "Yehia Mahmoud",
    summary: "Builds the Raspberry Pi hardware environment, local server foundation, and network integration layer.",
    icon: "chip"
  },
  {
    name: "Network Division",
    accent: "#f4b44a",
    lead: "Yousef Hamdy",
    summary: "Configures the Pi access point, gateway behavior, trusted client flow, firewall policies, and secure service ports.",
    icon: "network"
  },
  {
    name: "Software Division",
    accent: "#7da2ff",
    lead: "Yousef Osama, Farouk Hassan, Nadeen Samy",
    summary: "Owns the desktop application, API integration, real-time UI, WebSocket communication, and report experience.",
    icon: "code"
  },
  {
    name: "Documentation & QA",
    accent: "#d89c62",
    lead: "Ahmed Sobhy",
    summary: "Reviews repository work, validates documentation, tests APIs, and keeps reports consistent across divisions.",
    icon: "doc"
  }
];

const team = [
  { name: "Ephrahim Emad", division: "AI Division", roles: ["Operations Lead"], lead: true },
  { name: "El Sayed", division: "AI Division", roles: ["AI Member"] },
  { name: "Yussef Helmy", division: "Cyber Security Division", roles: ["Cyber Security Specialist"], lead: true },
  { name: "Yehia Mahmoud", division: "Embedded Systems Division", roles: ["Embedded Systems Engineer"], lead: true },
  { name: "Yousef Hanafi", division: "Embedded Systems Division", roles: ["Local Server Engineer"] },
  { name: "Mahmoud Mohamed", division: "Embedded Systems Division", roles: ["Network Integration Engineer"] },
  { name: "Yousef Hamdy", division: "Network Division", roles: ["Network Engineer", "Virtual LAN Architect"], lead: true },
  { name: "Mazen Gamal", division: "Network Division", roles: ["Security Infrastructure Engineer"] },
  { name: "Momen Sheta", division: "Software Division", roles: ["UI/UX Engineer"] },
  { name: "Nada Ebrahim", division: "Software Division", roles: ["UI/UX Engineer"] },
  { name: "Shahd Ashraf", division: "Software Division", roles: ["UI/UX Engineer"] },
  { name: "Khattab Nasser", division: "Software Division", roles: ["Web Developer"] },
  { name: "Yousef Osama", division: "Software Division", roles: ["API & Integration Lead"], lead: true },
  { name: "Farouk Hassan", division: "Software Division", roles: ["Embedded Systems Lead"], lead: true },
  { name: "Nadeen Samy", division: "Software Division", roles: ["Desktop Application Lead"], lead: true },
  { name: "Haidi Hani", division: "Software Division", roles: ["Desktop Application Member"] },
  { name: "Ahmed Sobhy", division: "Documentation & QA", roles: ["HR Head", "Repo Reviewer"], lead: true },
  { name: "Adham Motasem", division: "Documentation & QA", roles: ["AI Reviewer"] },
  { name: "Yasmeen Salem", division: "Documentation & QA", roles: ["Embedded Reviewer"] },
  { name: "Yehia Mohamed", division: "Documentation & QA", roles: ["Software Reviewer", "Security Check"] },
  { name: "Mai El Safy", division: "Documentation & QA", roles: ["Software Reviewer", "API Testing"] },
  { name: "Mohammed Tamer", division: "Documentation & QA", roles: ["Documentation Member"] },
  { name: "Mariam Mahmoud", division: "Documentation & QA", roles: ["Network Reviewer"] },
  { name: "Mohammed Abdullah", division: "Documentation & QA", roles: ["Data Collection"] }
];

const iconPaths = {
  brain: '<path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a3 3 0 0 0 5 2.2"/><path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v1a3 3 0 0 1-5 2.2"/><path d="M12 5v14"/><path d="M8 10h4"/><path d="M12 14h4"/>',
  shield: '<path d="M12 3l7 3v5c0 4.5-2.8 8.5-7 10-4.2-1.5-7-5.5-7-10V6l7-3z"/><path d="M9 12l2 2 4-5"/>',
  chip: '<path d="M8 8h8v8H8z"/><path d="M4 10h4"/><path d="M4 14h4"/><path d="M16 10h4"/><path d="M16 14h4"/><path d="M10 4v4"/><path d="M14 4v4"/><path d="M10 16v4"/><path d="M14 16v4"/>',
  network: '<path d="M12 5v5"/><path d="M6 19v-3a6 6 0 0 1 12 0v3"/><path d="M9 19H3"/><path d="M21 19h-6"/><circle cx="12" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>',
  code: '<path d="M8 9l-4 3 4 3"/><path d="M16 9l4 3-4 3"/><path d="M14 5l-4 14"/>',
  doc: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/>',
  crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z"/>',
  user: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M4 21a8 8 0 0 1 16 0"/>'
};

const divisionGrid = document.querySelector("#divisionGrid");
const teamGrid = document.querySelector("#teamGrid");
const divisionFilter = document.querySelector("#divisionFilter");

const svg = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]}</svg>`;
const divisionByName = new Map(divisions.map((division) => [division.name, division]));

function renderDivisions() {
  divisionGrid.innerHTML = divisions.map((division) => `
    <article class="division-card" style="--accent: ${division.accent}">
      <div class="division-top">
        <div>
          <h3>${division.name}</h3>
          <p>${division.summary}</p>
        </div>
        <span class="division-icon">${svg(division.icon)}</span>
      </div>
      <div class="lead-line">
        <span class="lead-mark">${svg("crown")}</span>
        <span>${division.lead}</span>
      </div>
    </article>
  `).join("");
}

function roleBadges(member) {
  const accent = divisionByName.get(member.division)?.accent || "#4fd3ff";
  return member.roles.map((role) => `<span class="badge" style="--badge-color: ${accent}">${role}</span>`).join("");
}

function renderTeam(filter = "All") {
  const visibleMembers = filter === "All" ? team : team.filter((member) => member.division === filter);
  teamGrid.innerHTML = visibleMembers.map((member) => `
    <article class="member-card ${member.lead ? "is-lead" : ""}">
      <div class="member-top">
        <span class="member-icon">${svg(member.lead ? "crown" : "user")}</span>
        <div>
          <p class="member-name">${member.name}</p>
          <p class="member-division">${member.division}</p>
        </div>
      </div>
      <div class="badges">${roleBadges(member)}</div>
    </article>
  `).join("");
}

function populateFilter() {
  divisions.forEach((division) => {
    const option = document.createElement("option");
    option.value = division.name;
    option.textContent = division.name;
    divisionFilter.appendChild(option);
  });
}

populateFilter();
renderDivisions();
renderTeam();

divisionFilter.addEventListener("change", (event) => {
  renderTeam(event.target.value);
});
