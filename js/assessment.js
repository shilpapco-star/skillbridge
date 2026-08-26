// ---- Step 1: Load the saved profile ----
const savedProfile = localStorage.getItem("skillbridge_profile");
const noProfileDiv = document.getElementById("noProfile");
const assessmentContentDiv = document.getElementById("assessmentContent");

let requiredSkills = [];
let quizzes = {};
let quizResults = JSON.parse(localStorage.getItem("skillbridge_quiz_results") || "{}");

if (!savedProfile) {
  noProfileDiv.classList.remove("hidden");
} else {
  assessmentContentDiv.classList.remove("hidden");
  const profile = JSON.parse(savedProfile);
  init(profile);
}

// ---- Step 2: Load role + quiz data ----
async function init(profile) {
  const [rolesRes, quizzesRes] = await Promise.all([
    fetch("data/roles.json"),
    fetch("data/quizzes.json"),
  ]);
  const roles = await rolesRes.json();
  quizzes = await quizzesRes.json();

  requiredSkills = roles[profile.targetRole] || [];

  document.getElementById("assessSubtitle").textContent =
    `Verify your skills for ${profile.targetRole}. A quiz score of 70%+ marks a skill as verified.`;

  renderCards(profile);
}

// ---- Step 3: Render a card per required skill ----
function renderCards(profile) {
  const mySkillsLower = profile.skills.map((s) => s.toLowerCase().trim());
  const container = document.getElementById("skillCards");
  container.innerHTML = "";

  requiredSkills.forEach((skill) => {
    const selfReported = mySkillsLower.includes(skill.toLowerCase());
    const result = quizResults[skill]; // { score, verified } or undefined
    const hasQuiz = !!quizzes[skill];

    const card = document.createElement("div");
    card.className = "skill-card";
    card.id = "card-" + skill.replace(/\s+/g, "-");

    card.innerHTML = buildCardBody(skill, selfReported, result, hasQuiz);
    container.appendChild(card);

    
    
  });
}

function buildCardBody(skill, selfReported, result, hasQuiz) {
  let badge = "";
  if (result) {
    badge = result.verified
      ? `<span class="badge badge-verified">✅ Verified (${result.score}%)</span>`
      : `<span class="badge badge-warning">⚠️ Needs improvement (${result.score}%)</span>`;
  } else if (selfReported) {
    badge = `<span class="badge badge-neutral">Self-reported, not tested</span>`;
  } else {
    badge = `<span class="badge badge-missing">Not learned yet</span>`;
  }

  const buttonLabel = result ? "Retake test" : "Start test";
  const buttonHtml = hasQuiz
    ? `<a href="quiz.html?skill=${encodeURIComponent(skill)}" class="take-quiz-btn">${buttonLabel}</a>`
    : `<span class="no-quiz">No test available yet</span>`;

  return `
    <div class="skill-card-header">
      <span class="skill-card-name">${skill}</span>
      ${badge}
    </div>
    <div class="skill-card-actions">${buttonHtml}</div>
  `;
}

