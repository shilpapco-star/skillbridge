// ---- Step 1: Load the saved profile ----
const savedProfile = localStorage.getItem("skillbridge_profile");
const noProfileDiv = document.getElementById("noProfile");
const dashboardContentDiv = document.getElementById("dashboardContent");

if (!savedProfile) {
  noProfileDiv.classList.remove("hidden");
} else {
  dashboardContentDiv.classList.remove("hidden");
  const profile = JSON.parse(savedProfile);
  loadDashboard(profile);
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
    let status;
    if (quizResult) status = quizResult.verified ? "have" : "improve";
    else if (selfReported) status = "have";
    else status = "missing";
    return { skill, status, project: projects[skill] || null };
  });

  const haveCount = results.filter((r) => r.status === "have").length;
  const percent = requiredSkills.length
    ? Math.round((haveCount / requiredSkills.length) * 100)
    : 0;

  renderHero(profile, percent, haveCount, requiredSkills.length);
  renderFocus(results);
}

// ---- Hero: greeting + animated ring ----
function renderHero(profile, percent, have, total) {
  document.getElementById("dbEyebrow").textContent = profile.targetRole.toUpperCase();
  document.getElementById("dbHeading").textContent = `Welcome back, ${profile.name.split(" ")[0]}`;
  document.getElementById("dbSub").textContent = `${have} of ${total} skills covered for ${profile.targetRole}.`;
  document.getElementById("ringPercent").textContent = percent + "%";

  const circumference = 552.9;
  const offset = circumference - (percent / 100) * circumference;
  const ring = document.getElementById("ringFill");
  setTimeout(() => { ring.style.strokeDashoffset = offset; }, 150);
}

// ---- Builds a safe YouTube search link (not a guessed video ID) ----
function youtubeSearchLink(skill) {
  const query = encodeURIComponent(`${skill} full course in one shot for beginners`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

// ---- The one thing this page asks you to do next ----
function renderFocus(results) {
  const next = results.find((r) => r.status === "missing" || r.status === "improve");
  const container = document.getElementById("dbFocus");

  if (!next) {
    container.innerHTML = `
      <p class="db-focus-eyebrow">YOU'RE ALL CAUGHT UP</p>
      <p class="db-focus-skill">Every required skill is covered 🎉</p>
      <p class="db-focus-project">Consider a bigger capstone project, or explore a related role.</p>
    `;
    return;
  }

  const verb = next.status === "improve" ? "Strengthen" : "Learn";
  const projectLine = next.project
    ? `Try building: ${next.project.project}`
    : "Check the roadmap for the full path.";
  const videoUrl = youtubeSearchLink(next.skill);

  container.innerHTML = `
    <p class="db-focus-eyebrow">UP NEXT</p>
    <p class="db-focus-skill">${verb} ${next.skill}</p>
    <p class="db-focus-project">${projectLine}</p>
    <div class="db-focus-actions">
      <a href="${videoUrl}" target="_blank" rel="noopener" class="db-btn db-btn-primary">🎥 Watch a one-shot tutorial</a>
      <a href="assessment.html" class="db-btn db-btn-secondary">Take the quiz</a>
    </div>
  `;
}