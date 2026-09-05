const profile = JSON.parse(localStorage.getItem("skillbridge_profile") || "null");
const lessons = {
  HTML: ["Structure a semantic web page", "45 min"], CSS: ["Build responsive layouts", "52 min"], JavaScript: ["Make pages interactive", "1 hr 10 min"], React: ["Think in components", "1 hr 15 min"],
  Python: ["Work with Python essentials", "55 min"], SQL: ["Query real datasets", "48 min"], "Node.js": ["Build your first API", "1 hr 8 min"], Excel: ["Find insights in data", "42 min"]
};
const hackathons = [
  { title: "Devpost hackathons", detail: "Explore upcoming online and in-person hackathons from global communities.", badge: "DISCOVER EVENTS", url: "https://devpost.com/hackathons" },
  { title: "MLH hackathons", detail: "Find student-friendly hackathons, Localhost events, and beginner resources.", badge: "STUDENT FRIENDLY", url: "https://mlh.io/seasons/2026/events" },
  { title: "Unstop challenges", detail: "Browse India-focused hackathons, innovation challenges, and competitions.", badge: "INDIA + GLOBAL", url: "https://unstop.com/hackathons" }
];

async function init() {
  renderHackathons();
  if (!profile) { renderEmpty(); return; }
  renderIdentity(profile);
  try {
    const roles = await fetch("data/roles.json").then(r => r.json());
    renderLearning(profile, roles[profile.targetRole] || []);
  } catch { renderLearning(profile, profile.skills || []); }
}

function renderEmpty() {
  document.getElementById("continueGrid").innerHTML = emptyCard("Set up your learning profile", "Choose a target role and add the skills you already have.", "index.html", "Open settings →");
}
function renderIdentity(user) {
  const first = (user.name || "there").split(" ")[0];
  document.getElementById("d2FirstName").textContent = first;
  document.getElementById("headerInitials").textContent = initials(user.name);
  if (user.avatar) { const image = document.getElementById("headerAvatar"); image.src = user.avatar; image.classList.add("show"); }
}
function renderLearning(user, required) {
  const skillSet = new Set((user.skills || []).map(s => s.toLowerCase().trim()));
  const quizzes = JSON.parse(localStorage.getItem("skillbridge_quiz_results") || "{}");
  const completed = required.filter(skill => skillSet.has(skill.toLowerCase()) || quizzes[skill]?.verified);
  const percent = required.length ? Math.round(completed.length / required.length * 100) : 0;
  document.getElementById("coverageStat").textContent = percent + "%";
  document.getElementById("skillStat").textContent = `${completed.length}/${required.length}`;
  document.getElementById("timeStat").textContent = `${Math.max(0, completed.length * 2)}h`;
  document.getElementById("streakStat").textContent = localStorage.getItem("skillbridge_streak") || "1";
  const next = required.find(skill => !skillSet.has(skill.toLowerCase()) && !quizzes[skill]?.verified) || required[0];
  if (next) {
    document.getElementById("focusTitle").textContent = `Your next win: ${next}`;
    document.getElementById("focusText").textContent = `You’re ${percent}% along your ${user.targetRole} path. Pick up a focused lesson and keep the streak alive.`;
    document.getElementById("focusCta").href = "learn.html";
    document.getElementById("focusCta").innerHTML = "Start learning <span>→</span>";
  }
  const queued = required.filter(skill => skill !== undefined && !(skillSet.has(skill.toLowerCase()) || quizzes[skill]?.verified)).slice(0, 3);
  const display = queued.length ? queued : required.slice(0, 3);
  document.getElementById("continueGrid").innerHTML = display.map((skill, i) => lessonCard(skill, i)).join("") || emptyCard("Your path is ready", "Add a target role in Settings to receive tailored lessons.", "index.html", "Set my target →");
}
function lessonCard(skill, index) {
  const lesson = lessons[skill] || [`Build practical ${skill} skills`, "50 min"];
  const colors = [["#eeeaff", "#6658d7", "⌘"], ["#e1f8f2", "#259b79", "◌"], ["#fff0e7", "#d26e43", "↗"]][index % 3];
  return `<article class="d2-lesson-card" style="--lesson-bg:${colors[0]};--lesson-color:${colors[1]}"><span class="lesson-symbol">${colors[2]}</span><span class="lesson-meta">${lesson[1]} · FOUNDATION</span><h3>${skill}</h3><p>${lesson[0]}. A clear next step for your roadmap.</p><a href="learn.html#${encodeURIComponent(skill)}">Start lesson →</a></article>`;
}
function emptyCard(title, copy, href, label) { return `<article class="d2-lesson-card"><span class="lesson-meta">GET STARTED</span><h3>${title}</h3><p>${copy}</p><a href="${href}">${label}</a></article>`; }
function renderHackathons() { document.getElementById("hackathonGrid").innerHTML = hackathons.map(h => `<article class="d2-hack-card"><span class="hack-badge">${h.badge}</span><h3>${h.title}</h3><p>${h.detail}</p><a href="${h.url}" target="_blank" rel="noopener">Explore events ↗</a></article>`).join(""); }
function initials(name = "SkillBridge") { return name.split(" ").filter(Boolean).slice(0,2).map(n => n[0]).join("").toUpperCase(); }
init();
