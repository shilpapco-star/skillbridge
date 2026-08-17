// ---- Step 1: Load the saved profile ----
const savedProfile = localStorage.getItem("skillbridge_profile");
const noProfileDiv = document.getElementById("noProfile");
const assessmentContentDiv = document.getElementById("assessmentContent");

let requiredSkills = [];
let quizzes = {};
let quizResults = JSON.parse(localStorage.getItem("skillbridge_quiz_results") || "{}");
// Converts special characters so they display as text instead of being parsed as HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
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

    if (hasQuiz) {
      const btn = card.querySelector(".take-quiz-btn");
      if (btn) {
        btn.addEventListener("click", () => renderQuiz(card, skill));
      }
    }
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

  const buttonLabel = result ? "Retake quiz" : "Take quiz";
  const buttonHtml = hasQuiz
    ? `<button type="button" class="take-quiz-btn">${buttonLabel}</button>`
    : `<span class="no-quiz">No quiz available yet</span>`;

  return `
    <div class="skill-card-header">
      <span class="skill-card-name">${skill}</span>
      ${badge}
    </div>
    <div class="skill-card-actions">${buttonHtml}</div>
  `;
}

// ---- Step 4: Render the quiz inline inside the card ----
function renderQuiz(card, skill) {
  const questions = quizzes[skill];

  let questionsHtml = questions
    .map((q, qIndex) => {
      const optionsHtml = q.options
  .map(
    (opt, oIndex) => `
    <label class="quiz-option">
      <input type="radio" name="q${qIndex}" value="${oIndex}" />
      ${escapeHtml(opt)}
    </label>`
  )
  .join("");

return `
  <div class="quiz-question">
    <p>${qIndex + 1}. ${escapeHtml(q.q)}</p>
    ${optionsHtml}
  </div>
`;
    })
    .join("");

  card.innerHTML = `
    <div class="skill-card-header">
      <span class="skill-card-name">${skill} — Quiz</span>
    </div>
    <form class="quiz-form">
      ${questionsHtml}
      <button type="submit" class="submit-quiz-btn">Submit answers</button>
    </form>
  `;

  const form = card.querySelector(".quiz-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    scoreQuiz(card, skill, questions, form);
  });
}

// ---- Step 5: Score the quiz and save the result ----
function scoreQuiz(card, skill, questions, form) {
  let correct = 0;

  questions.forEach((q, qIndex) => {
    const selected = form.querySelector(`input[name="q${qIndex}"]:checked`);
    if (selected && Number(selected.value) === q.answer) {
      correct++;
    }
  });

  const score = Math.round((correct / questions.length) * 100);
  const verified = score >= 70;

  quizResults[skill] = { score, verified };
  localStorage.setItem("skillbridge_quiz_results", JSON.stringify(quizResults));
if (verified) {
  SkillBridgeGamification.addXP(20, `${skill} verified`);
} else {
  SkillBridgeGamification.addXP(5, `${skill} quiz attempted`);
}
SkillBridgeGamification.unlockBadge("first_quiz");

const verifiedCount = Object.values(quizResults).filter((r) => r.verified).length;
if (verifiedCount >= 3) SkillBridgeGamification.unlockBadge("quiz_master");
  // Re-render this card with the updated badge/result
  const savedProfile = JSON.parse(localStorage.getItem("skillbridge_profile"));
  const mySkillsLower = savedProfile.skills.map((s) => s.toLowerCase().trim());
  const selfReported = mySkillsLower.includes(skill.toLowerCase());

  card.innerHTML = buildCardBody(skill, selfReported, quizResults[skill], true);
  const btn = card.querySelector(".take-quiz-btn");
  if (btn) btn.addEventListener("click", () => renderQuiz(card, skill));
}