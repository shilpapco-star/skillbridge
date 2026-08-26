const params = new URLSearchParams(window.location.search);
const skill = params.get("skill");

let questions = [];
let currentIndex = 0;
let answers = []; // stores the selected option index per question, or null
let timerInterval = null;
let secondsRemaining = 0;
let startTime = null;

const quizArea = document.getElementById("quizArea");
const resultsArea = document.getElementById("resultsArea");

if (!skill) {
  document.getElementById("quizSkillName").textContent = "No skill specified";
} else {
  init();
}

async function init() {
  const res = await fetch("data/quizzes.json");
  const allQuizzes = await res.json();
  questions = allQuizzes[skill] || [];

  if (questions.length === 0) {
    document.getElementById("quizSkillName").textContent = `No test available yet for ${skill}`;
    document.getElementById("questionCard").innerHTML = "";
    document.querySelector(".quiz-nav").classList.add("hidden");
    return;
  }

  answers = new Array(questions.length).fill(null);
  document.getElementById("quizSkillName").textContent = `${skill} Test`;

  // Timer: 45 seconds per question, rounded to a clean total
  secondsRemaining = questions.length * 45;
  startTime = Date.now();
  startTimer();

  renderQuestion();

  document.getElementById("prevBtn").addEventListener("click", () => goTo(currentIndex - 1));
  document.getElementById("nextBtn").addEventListener("click", () => goTo(currentIndex + 1));
  document.getElementById("skipBtn").addEventListener("click", () => goTo(currentIndex + 1));
  document.getElementById("submitBtn").addEventListener("click", submitTest);
  document.getElementById("retakeBtn").addEventListener("click", () => window.location.reload());
}

function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    secondsRemaining--;
    updateTimerDisplay();
    if (secondsRemaining <= 0) {
      clearInterval(timerInterval);
      submitTest(); // auto-submit when time runs out
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(secondsRemaining / 60);
  const s = secondsRemaining % 60;
  const display = `${m}:${s.toString().padStart(2, "0")}`;
  const timerEl = document.getElementById("quizTimer");
  timerEl.textContent = display;
  timerEl.classList.toggle("low-time", secondsRemaining <= 60);
}

function renderQuestion() {
  const q = questions[currentIndex];
  document.getElementById("quizProgress").textContent =
    `Question ${currentIndex + 1} of ${questions.length}`;

  const optionsHtml = q.options
    .map(
      (opt, i) => `
      <label class="quiz-option ${answers[currentIndex] === i ? "selected" : ""}">
        <input type="radio" name="option" value="${i}" ${answers[currentIndex] === i ? "checked" : ""} />
        ${escapeHtml(opt)}
      </label>`
    )
    .join("");

  document.getElementById("questionCard").innerHTML = `
    <p class="question-text">${escapeHtml(q.q)}</p>
    ${optionsHtml}
  `;

  document.querySelectorAll('input[name="option"]').forEach((input) => {
    input.addEventListener("change", (e) => {
      answers[currentIndex] = Number(e.target.value);
      document.querySelectorAll(".quiz-option").forEach((label, i) => {
        label.classList.toggle("selected", i === Number(e.target.value));
      });
    });
  });

  document.getElementById("prevBtn").disabled = currentIndex === 0;

  const isLast = currentIndex === questions.length - 1;
  document.getElementById("nextBtn").classList.toggle("hidden", isLast);
  document.getElementById("submitBtn").classList.toggle("hidden", !isLast);
}

function goTo(index) {
  if (index < 0 || index >= questions.length) return;
  currentIndex = index;
  renderQuestion();
}

function submitTest() {
  clearInterval(timerInterval);

  let correct = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.answer) correct++;
  });

  const score = Math.round((correct / questions.length) * 100);
  const verified = score >= 70;
  const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);

  // Save result the same way the old assessment page did, so the roadmap still works
  const quizResults = JSON.parse(localStorage.getItem("skillbridge_quiz_results") || "{}");
  quizResults[skill] = { score, verified };
  localStorage.setItem("skillbridge_quiz_results", JSON.stringify(quizResults));

  if (window.SkillBridgeGamification) {
    if (verified) {
      window.SkillBridgeGamification.addXP(20, `${skill} verified`);
    } else {
      window.SkillBridgeGamification.addXP(5, `${skill} test attempted`);
    }
    window.SkillBridgeGamification.unlockBadge("first_quiz");

    const verifiedCount = Object.values(quizResults).filter((r) => r.verified).length;
    if (verifiedCount >= 3) window.SkillBridgeGamification.unlockBadge("quiz_master");
  }

  showResults(score, correct, elapsedSeconds, verified);
}

function showResults(score, correct, elapsedSeconds, verified) {
  quizArea.classList.add("hidden");
  resultsArea.classList.remove("hidden");

  document.getElementById("resultsHeading").textContent = `${skill} Test Complete`;
  document.getElementById("resultScore").textContent = score + "%";
  document.getElementById("resultCorrect").textContent = `${correct}/${questions.length}`;

  const m = Math.floor(elapsedSeconds / 60);
  const s = elapsedSeconds % 60;
  document.getElementById("resultTime").textContent = `${m}:${s.toString().padStart(2, "0")}`;

  const verdictEl = document.getElementById("resultVerdict");
  verdictEl.textContent = verified
    ? "✅ Verified! This skill now shows as verified on your roadmap."
    : "⚠️ Below the 70% verification threshold — this skill will show as 'needs improvement' on your roadmap.";
  verdictEl.className = "result-verdict " + (verified ? "pass" : "fail");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}