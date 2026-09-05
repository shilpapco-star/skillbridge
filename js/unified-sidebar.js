(() => {
  const sidebar = document.querySelector(".app-sidebar");
  if (!sidebar) return;
  if (!document.querySelector('link[href="css/dashboard2.css"]')) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "css/dashboard2.css";
    document.head.appendChild(stylesheet);
  }
  const page = location.pathname.split("/").pop() || "dashboard.html";
  const items = [["dashboard.html","▦","Overview"],["learn.html","▶","Learn"],["roadmap.html","⌁","My roadmap"],["projects.html","◈","Projects"],["assessment.html","✓","Assessments"],["dashboard.html#hackathons","⚡","Hackathons"],["assistant.html","◌","Career assistant"]];
  sidebar.className = "d2-sidebar shared-sidebar";
  sidebar.innerHTML = `<a class="d2-logo" href="dashboard.html"><span>✦</span> skillbridge</a><nav class="d2-nav">${items.map(([href,icon,label]) => `<a href="${href}" class="${href.split("#")[0] === page ? "active" : ""}"><span>${icon}</span> ${label}</a>`).join("")}</nav><div class="d2-sidebar-bottom"><a class="d2-settings-link" href="index.html">⚙ Settings</a><button id="themeToggle" class="theme-toggle" type="button" aria-label="Toggle theme">🌙</button><button class="d2-logout" onclick="logout()">↪ Log out</button></div>`;
})();
