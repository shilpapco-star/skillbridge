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
      projectHtml = `
        <div class="project-suggestion">
          <span class="level-tag">${r.project.level}</span>
          <strong>${label}:</strong> ${r.project.project}
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