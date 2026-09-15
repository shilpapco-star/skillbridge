// ---- Step 1: Load the saved profile ----
const savedProfile = localStorage.getItem("skillbridge_profile");
const noProfileDiv = document.getElementById("noProfile");
const assessmentContentDiv = document.getElementById("assessmentContent");

let requiredSkills = [];
let quizzes = {};
let quizResults = JSON.parse(localStorage.getItem("skillbridge_quiz_results") || "{}");
let results = []; // computed per-skill status, built once in init()
let activeFilter = "all";
let skillSearch = "";

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

  buildResults(profile);
  renderHero();
  renderCards("all");
  renderNextRecommendation();

  document.querySelectorAll(".assess-filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".assess-filter").forEach((b) => b.classList.toggle("active", b === btn));
      activeFilter = btn.dataset.filter;
      renderCards(activeFilter);
    });
  });

  const search = document.getElementById("assessSkillSearch");
  if (search) {
    search.addEventListener("input", () => {
      skillSearch = search.value.toLowerCase().trim();
      renderCards(activeFilter);
    });
  }
}

// ---- Step 3: Work out where each required skill stands ----
function buildResults(profile) {
  const mySkillsLower = profile.skills.map((s) => s.toLowerCase().trim());

  results = requiredSkills.map((skill) => {
    const selfReported = mySkillsLower.includes(skill.toLowerCase());
    const quizResult = quizResults[skill]; // { score, verified } or undefined
    const hasQuiz = !!quizzes[skill];

    let category; // "verified" | "improve" | "self" | "missing"
    if (quizResult) {
      category = quizResult.verified ? "verified" : "improve";
    } else if (selfReported) {
      category = "self";
    } else {
      category = "missing";
    }

    // Coarser bucket used by the filter tabs — self-reported and never-tested
    // both mean "hasn't been proven with a quiz yet", which is the real
    // distinction that matters on an assessment page.
    const filterBucket = category === "verified" ? "verified" : category === "improve" ? "improve" : "untested";

    return { skill, category, filterBucket, result: quizResult, hasQuiz, selfReported };
  });
}

// ---- Step 4: Hero ring + stat pills ----
function renderHero() {
  const verified = results.filter((r) => r.category === "verified").length;
  const improve = results.filter((r) => r.category === "improve").length;
  const untested = results.length - verified - improve;
  const percent = results.length ? Math.round((verified / results.length) * 100) : 0;

  document.getElementById("verifiedCount").textContent = verified;
  document.getElementById("improveCount").textContent = improve;
  document.getElementById("untestedCount").textContent = untested;
  document.getElementById("assessRingPercent").textContent = `${percent}%`;

  const circumference = 2 * Math.PI * 70;
  const ring = document.getElementById("assessRingFill");
  ring.style.strokeDasharray = `${circumference}`;
  ring.style.strokeDashoffset = `${circumference * (1 - percent / 100)}`;
}

// ---- Step 5: Render the filtered card grid ----
function renderCards(filter) {
  const container = document.getElementById("skillCards");
  const emptyState = document.getElementById("assessEmptyState");
  let visible = filter === "all" ? results : results.filter((r) => r.filterBucket === filter);
  if (skillSearch) visible = visible.filter((r) => r.skill.toLowerCase().includes(skillSearch));

  container.innerHTML = visible.map(buildCard).join("");
  [...container.children].forEach((card, index) => { card.style.animationDelay = `${Math.min(index * 45, 300)}ms`; });
  emptyState.textContent = skillSearch ? `No skills match “${skillSearch}”.` : "No skills in this category yet.";
  emptyState.classList.toggle("hidden", visible.length !== 0);
}

function buildCard(r) {
  const { skill, category, result, hasQuiz } = r;

  const indicator = buildIndicator(category, result);

  let metaText = "";
  if (category === "verified") metaText = `Verified · scored ${result.score}%`;
  else if (category === "improve") metaText = `Scored ${result.score}% · below the 70% bar`;
  else if (category === "self") metaText = "Self-reported, not tested yet";
  else metaText = "Not learned yet";

  const buttonLabel = result ? "Retake test" : "Start test";
  const actionHtml = hasQuiz
    ? `<a href="quiz.html?skill=${encodeURIComponent(skill)}" class="assess-action assess-action-${category}">${buttonLabel}</a>`
    : `<span class="no-quiz">No test available yet</span>`;

  return `
    <article class="skill-card skill-card-${category}">
      ${indicator}
      <div class="skill-card-info">
        <span class="skill-card-name">${skill}</span>
        <span class="skill-card-meta">${metaText}</span>
      </div>
      <div class="skill-card-actions">${actionHtml}</div>
    </article>
  `;
}

// Every card gets the same 44px circular slot: a real score ring when a quiz
// has been taken, or a plain status icon when there's nothing to score yet.
function buildIndicator(category, result) {
  if (result) {
    const color = category === "verified" ? "#168867" : "#c07d1f";
    return `
      <div class="mini-ring-wrap">
        <div class="mini-ring" style="--score:${result.score}; --ring-color:${color};"></div>
        <span class="mini-ring-label">${result.score}%</span>
      </div>
    `;
  }
  const icon = category === "self" ? "✎" : "○";
  return `<div class="status-icon status-icon-${category}">${icon}</div>`;
}

function renderNextRecommendation() {
  const target = results.find((r) => r.category === "improve") ||
    results.find((r) => r.category === "self") ||
    results.find((r) => r.category === "missing") ||
    results[0];

  const title = document.getElementById("nextSkillTitle");
  const text = document.getElementById("nextSkillText");
  const action = document.getElementById("nextSkillAction");
  if (!title || !text || !action) return;

  if (!target) {
    title.textContent = "No assessment skills yet";
    text.textContent = "Your target role does not have assessment skills configured yet.";
    action.style.display = "none";
    return;
  }

  title.textContent = target.skill;
  if (target.category === "improve") {
    text.textContent = `Your latest score is ${target.result.score}%. Retake the test to improve your verified score.`;
  } else if (target.category === "self") {
    text.textContent = "You listed this skill in your profile. Take a quiz to verify it.";
  } else if (target.category === "missing") {
    text.textContent = "This skill is part of your target role. Start the quiz when you are ready.";
  } else {
    text.textContent = "Keep your verified skills fresh by revisiting your assessment.";
  }

  if (target.hasQuiz) {
    action.href = `quiz.html?skill=${encodeURIComponent(target.skill)}`;
    action.style.display = "inline-flex";
    action.innerHTML = `${target.result ? "Retake test" : "Start test"} <span>→</span>`;
  } else {
    action.style.display = "none";
  }
}
