// ---- Step 1: Load the saved profile ----
const savedProfile = localStorage.getItem("skillbridge_profile");

const noProfileDiv = document.getElementById("noProfile");
const roadmapContentDiv = document.getElementById("roadmapContent");

if (!savedProfile) {
  noProfileDiv.classList.remove("hidden");
} else {
  roadmapContentDiv.classList.remove("hidden");
  const profile = JSON.parse(savedProfile);
  loadRoadmap(profile);
}

// ---- Step 2: Fetch roles.json, projects.json, and read quiz results ----
async function loadRoadmap(profile) {
  const [rolesRes, projectsRes] = await Promise.all([
    fetch("data/roles.json"),
    fetch("data/projects.json"),
  ]);
  const roles = await rolesRes.json();
  const projects = await projectsRes.json();

  // Quiz results live in localStorage, saved by assessment.js
  // Shape: { "JavaScript": { score: 80, verified: true }, ... }
  const quizResults = JSON.parse(
    localStorage.getItem("skillbridge_quiz_results") || "{}"
  );

  const requiredSkills = roles[profile.targetRole];

  if (!requiredSkills) {
    document.getElementById("roleHeading").textContent = "Role not found";
    return;
  }

  const mySkillsLower = profile.skills.map((s) => s.toLowerCase().trim());

  const results = requiredSkills.map((skill, index) => {
    const selfReported = mySkillsLower.includes(skill.toLowerCase());
    const quizResult = quizResults[skill]; // undefined if not taken yet

    // ---- The actual status logic ----
    // Taken a quiz and passed (70%+)      -> "have"    ✅
    // Taken a quiz and failed             -> "improve" ⚠️
    // Never quizzed, but self-reported    -> "have"    ✅ (trusted, unverified)
    // Never quizzed, not self-reported    -> "missing" ❌
    let status;
    if (quizResult) {
      status = quizResult.verified ? "have" : "improve";
    } else if (selfReported) {
      status = "have";
    } else {
      status = "missing";
    }

    return {
      step: index + 1,
      skill,
      status,
      quizScore: quizResult ? quizResult.score : null,
      project: projects[skill] || null,
    };
  });

  renderRoadmap(profile, results);
}

// ---- Step 3: Render as an ordered timeline ----
function renderRoadmap(profile, results) {
  document.getElementById("roleHeading").textContent = `Roadmap: ${profile.targetRole}`;
  document.getElementById("roleSubtitle").textContent =
    `Hi ${profile.name}, here's your step-by-step path — in the order to learn it.`;

  const haveCount = results.filter((r) => r.status === "have").length;
  const percent = Math.round((haveCount / results.length) * 100);

  document.getElementById("progressFill").style.width = percent + "%";
document.getElementById("progressLabel").textContent =
  `${haveCount} / ${results.length} skills (${percent}%)`;

const next = results.find((r) => r.status === "missing" || r.status === "improve");
const bannerEl = document.getElementById("upNextBanner");
if (!next) {
  bannerEl.innerHTML = `<strong>You're all caught up 🎉</strong> — every required skill is covered.`;
} else {
  const verb = next.status === "improve" ? "Strengthen" : "Learn";
  bannerEl.innerHTML = `<strong>Up next:</strong> ${verb} <strong>${next.skill}</strong> (step ${next.step} of ${results.length})`;
renderSkillChart(results);
}

// ---- Interactive doughnut chart showing how your skills break down for this role ----
function renderSkillChart(results) {
  const canvas = document.getElementById("skillChart");
  if (!canvas || typeof Chart === "undefined") return;

  const have = results.filter((r) => r.status === "have").length;
  const improve = results.filter((r) => r.status === "improve").length;
  const missing = results.filter((r) => r.status === "missing").length;
  const total = results.length;
  const percent = total ? Math.round((have / total) * 100) : 0;

  new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Completed", "In Progress", "Not Started"],
      datasets: [
        {
          data: [have, improve, missing],
          backgroundColor: ["#4a47d1", "#e3a008", "#cbd1dc"],
          borderWidth: 3,
          borderColor: "#ffffff",
          hoverOffset: 12,
        },
      ],
    },
    options: {
      responsive: false,
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { usePointStyle: true, boxWidth: 8, padding: 16, font: { size: 12 } },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw;
              const pct = total ? Math.round((value / total) * 100) : 0;
              return `${context.label}: ${value} skill${value === 1 ? "" : "s"} (${pct}%)`;
            },
          },
        },
      },
      onClick: (evt, elements) => {
        if (elements.length === 0) return;
        const statusMap = ["have", "improve", "missing"];
        const status = statusMap[elements[0].index];
        const target = document.querySelector(`.timeline-item.${status}`);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
      },
    },
    plugins: [
      {
        id: "centerText",
        afterDraw(chart) {
          const { ctx, chartArea } = chart;
          const x = (chartArea.left + chartArea.right) / 2;
          const y = (chartArea.top + chartArea.bottom) / 2;
          ctx.save();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "700 22px sans-serif";
          ctx.fillStyle = "#1e1b4b";
          ctx.fillText(percent + "%", x, y - 8);
          ctx.font = "500 11px sans-serif";
          ctx.fillStyle = "#6b6785";
          ctx.fillText("complete", x, y + 14);
          ctx.restore();
        },
      },
    ],
  });
}
  const list = document.getElementById("skillList");
  list.innerHTML = "";
  list.className = "timeline";

  results.forEach((r) => {
    const li = document.createElement("li");
    li.className = "timeline-item " + r.status;

    let icon = "✅";
    if (r.status === "improve") icon = "⚠️";
    if (r.status === "missing") icon = "❌";

    let scoreNote = "";
    if (r.quizScore !== null) {
      scoreNote = ` <span class="quiz-score-note">(quiz: ${r.quizScore}%)</span>`;
    }

    let projectHtml = "";
    if ((r.status === "missing" || r.status === "improve") && r.project) {
      const label = r.status === "improve" ? "Improve with this project" : "Learn with this project";
      const daysNote = r.project.days ? ` · ~${r.project.days} days` : "";
      const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
        r.skill + " full course in one shot for beginners"
      )}`;
      const githubUrl = `projects.html?q=${encodeURIComponent(r.skill + " project")}`;
      projectHtml = `
        <div class="project-suggestion">
          <span class="level-tag">${r.project.level}${daysNote}</span>
          <strong>${label}:</strong> ${r.project.project}
          <br />
          <a href="${videoUrl}" target="_blank" rel="noopener" class="video-link">🎥 Watch a one-shot tutorial</a>
          &nbsp;·&nbsp;
          <a href="${githubUrl}" class="video-link">🔗 Find real examples on GitHub</a>
        </div>
      `;
    }

    li.innerHTML = `
      <div class="timeline-marker">${r.step}</div>
      <div class="timeline-body">
        <div class="timeline-title">${icon} ${r.skill}${scoreNote}</div>
        ${projectHtml}
      </div>
    `;

    list.appendChild(li);
  });
}