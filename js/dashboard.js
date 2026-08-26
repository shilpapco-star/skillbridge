const savedProfile = localStorage.getItem("skillbridge_profile");
const noProfileDiv = document.getElementById("noProfile");
const shellDiv = document.getElementById("dashboardShell");

if (!savedProfile) {
  noProfileDiv.classList.remove("hidden");
} else {
  shellDiv.classList.remove("hidden");
  loadDashboard(JSON.parse(savedProfile));
}

async function loadDashboard(profile) {
  const [rolesRes, projectsRes] = await Promise.all([
    fetch("data/roles.json"),
    fetch("data/projects.json"),
  ]);
  const roles = await rolesRes.json();
  const projects = await projectsRes.json();
  const quizResults = JSON.parse(localStorage.getItem("skillbridge_quiz_results") || "{}");

  const requiredSkills = roles[profile.targetRole] || [];
  const mySkillsLower = profile.skills.map((s) => s.toLowerCase().trim());

  const results = requiredSkills.map((skill) => {
    const selfReported = mySkillsLower.includes(skill.toLowerCase());
    const quizResult = quizResults[skill];
    let status, progress;
    if (quizResult) {
      status = quizResult.verified ? "have" : "improve";
      progress = quizResult.score;
    } else if (selfReported) {
      status = "have";
      progress = 100;
    } else {
      status = "missing";
      progress = 0;
    }
    return { skill, status, progress, project: projects[skill] || null };
  });

  renderProfileCard(profile);
  renderWelcome(profile);
  renderDonut(results);
  renderTable(results);
  renderBadges();
}

function renderWelcome(profile) {
  document.getElementById("d2Welcome").textContent = `Welcome back, ${profile.name.split(" ")[0]} 👋`;
}

function renderProfileCard(profile) {
  document.getElementById("profileName").textContent = profile.name;
  document.getElementById("profileRole").textContent = profile.targetRole;
}

function renderDonut(results) {
  const have = results.filter((r) => r.status === "have").length;
  const improve = results.filter((r) => r.status === "improve").length;
  const missing = results.filter((r) => r.status === "missing").length;
  const total = results.length;
  const percent = total ? Math.round((have / total) * 100) : 0;

  document.getElementById("haveCountStat").textContent = have;
  document.getElementById("totalCountStat").textContent = total;

  const canvas = document.getElementById("coverageDonut");
  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Completed", "In Progress", "Not Started"],
      datasets: [{
        data: [have, improve, missing],
        backgroundColor: ["#4a47d1", "#e3a008", "#e2e4ea"],
        borderWidth: 3,
        borderColor: "#ffffff",
        hoverOffset: 10,
      }],
    },
    options: {
      responsive: false,
      cutout: "72%",
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
    },
    plugins: [{
      id: "centerText",
      afterDraw(chart) {
        const { ctx, chartArea } = chart;
        const x = (chartArea.left + chartArea.right) / 2;
        const y = (chartArea.top + chartArea.bottom) / 2;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "700 26px sans-serif";
        ctx.fillStyle = "#1e1b4b";
        ctx.fillText(percent + "%", x, y - 6);
        ctx.font = "500 11px sans-serif";
        ctx.fillStyle = "#6b6785";
        ctx.fillText("coverage", x, y + 16);
        ctx.restore();
      },
    }],
  });
}

function renderTable(results) {
  document.getElementById("skillCountLabel").textContent = `(${results.length})`;
  const tbody = document.getElementById("skillsTableBody");
  tbody.innerHTML = "";

  results.forEach((r) => {
    const statusLabel = { have: "Completed", improve: "In Progress", missing: "Not Started" }[r.status];
    const statusClass = { have: "d2-tag-green", improve: "d2-tag-amber", missing: "d2-tag-gray" }[r.status];
    const days = r.project && r.project.days ? `${r.project.days} days` : "—";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${r.skill}</td>
      <td><span class="d2-tag ${statusClass}">${statusLabel}</span></td>
      <td>${days}</td>
      <td>
        <div class="d2-progress-bar">
          <div class="d2-progress-fill" style="width:${r.progress}%"></div>
        </div>
        <span class="d2-progress-pct">${r.progress}%</span>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function renderBadges() {
  const { getBadges, BADGE_DEFINITIONS } = window.SkillBridgeGamification;
  const earned = getBadges();
  const container = document.getElementById("badgeStatusList");

  const allIds = Object.keys(BADGE_DEFINITIONS);
  container.innerHTML = allIds
    .map((id) => {
      const badge = BADGE_DEFINITIONS[id];
      const isEarned = earned.includes(id);
      return `
        <div class="d2-status-item">
          <span class="d2-status-tag ${isEarned ? "earned" : "locked"}">${isEarned ? "Earned" : "Locked"}</span>
          <div class="d2-status-text">
            <strong>${badge.icon} ${badge.name}</strong>
            <span>${badge.desc}</span>
          </div>
        </div>
      `;
    })
    .join("");
}