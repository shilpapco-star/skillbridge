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

// ---- Step 2: Fetch roles.json AND projects.json, then compare ----
async function loadRoadmap(profile) {
  const [rolesRes, projectsRes] = await Promise.all([
    fetch("data/roles.json"),
    fetch("data/projects.json"),
  ]);
  const roles = await rolesRes.json();
  const projects = await projectsRes.json();

  const requiredSkills = roles[profile.targetRole];

  if (!requiredSkills) {
    document.getElementById("roleHeading").textContent = "Role not found";
    return;
  }

  const mySkillsLower = profile.skills.map((s) => s.toLowerCase().trim());

  // requiredSkills is already in learning order (as written in roles.json)
  const results = requiredSkills.map((skill, index) => {
    const has = mySkillsLower.includes(skill.toLowerCase());
    return {
      step: index + 1,
      skill,
      status: has ? "have" : "missing",
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

    const icon = r.status === "have" ? "✅" : "❌";

    let projectHtml = "";
    if (r.status === "missing" && r.project) {
      projectHtml = `
        <div class="project-suggestion">
          <span class="level-tag">${r.project.level}</span>
          ${r.project.project}
        </div>
      `;
    }

    li.innerHTML = `
      <div class="timeline-marker">${r.step}</div>
      <div class="timeline-body">
        <div class="timeline-title">${icon} ${r.skill}</div>
        ${projectHtml}
      </div>
    `;

    list.appendChild(li);
  });
}