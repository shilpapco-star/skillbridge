const profile = JSON.parse(localStorage.getItem("skillbridge_profile") || "null");
if (window.SkillBridgeGamification) window.SkillBridgeGamification.updateStreak();

const lessons = {
  HTML: ["Structure a semantic web page", "45 min"], CSS: ["Build responsive layouts", "52 min"], JavaScript: ["Make pages interactive", "1 hr 10 min"], React: ["Think in components", "1 hr 15 min"],
  Python: ["Work with Python essentials", "55 min"], SQL: ["Query real datasets", "48 min"], "Node.js": ["Build your first API", "1 hr 8 min"], Excel: ["Find insights in data", "42 min"], Java: ["Build strong OOP foundations", "58 min"]
};

const emptyWeek = [0, 0, 0, 0, 0, 0, 0];
const activityDefaults = [
  { icon: "check_circle", title: "Learning goal scheduled", text: "One focused lesson is lined up for today.", time: "Today" },
  { icon: "alt_route", title: "Roadmap updated", text: "Your next career milestone is ready to continue.", time: "Today" },
  { icon: "workspace_premium", title: "Achievement progress", text: "Keep learning to unlock your next badge.", time: "This week" },
  { icon: "auto_awesome", title: "AI recommendation", text: "SkillBridge found a practical next step for you.", time: "This week" }
];

function safeJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch (_) { return fallback; } }
function clamp(n, min = 0, max = 100) { return Math.max(min, Math.min(max, Number(n) || 0)); }
function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
function setWidth(id, value) { const el = document.getElementById(id); if (el) el.style.width = clamp(value) + "%"; }
function initials(name = "SkillBridge") { return name.split(/\s+/).filter(Boolean).slice(0,2).map(n => n[0]).join("").toUpperCase() || "SB"; }
function escapeHTML(v) { return String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }

async function init() {
  const user = profile || { name: "SkillBridge Student", targetRole: "Software Developer", skills: ["HTML", "CSS", "JavaScript", "Python"] };
  renderIdentity(user);
  let required = [];
  try {
    const roles = await fetch("data/roles.json").then(r => r.json());
    required = roles[user.targetRole] || [];
  } catch (_) {}
  if (!required.length) required = user.skills?.length ? user.skills : ["HTML", "CSS", "JavaScript", "Python", "SQL"];
  const quizzes = safeJSON("skillbridge_quiz_results", {});
  renderLearning(user, required, quizzes);
  renderInsights(required, quizzes);
  renderActivity(required);
  renderWeekChart(required.length);
  bindDashboardInteractions();
}

function renderIdentity(user) {
  const first = (user.name || "there").split(" ")[0];
  setText("d2FirstName", first);
  const initialsText = initials(user.name);
  ["headerInitials", "sidebarInitials"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = initialsText; });
  if (user.avatar) ["headerAvatar", "sidebarAvatar"].forEach(id => { const image = document.getElementById(id); if (image) { image.src = user.avatar; image.classList.add("show"); } });
  setText("sidebarName", user.name || "SkillBridge Student");
}

function renderLearning(user, required, quizzes) {
  const skillSet = new Set((user.skills || []).map(s => String(s).toLowerCase().trim()));
  const completed = required.filter(skill => skillSet.has(String(skill).toLowerCase().trim()) || quizzes[skill]?.verified);
  const percent = required.length ? Math.round(completed.length / required.length * 100) : 0;
  setText("coverageStat", percent + "%");
  setText("skillStat", `${completed.length}/${required.length}`);
  const weekActivity = safeJSON("skillbridge_week_activity", []);
  const learningHours = Array.isArray(weekActivity) ? weekActivity.reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0) : 0;
  setText("timeStat", `${learningHours.toFixed(1)}h`);
  const streak = window.SkillBridgeGamification?.getStreak?.().current ?? 0;
  setText("streakStat", streak); setText("topStreak", streak);
  setWidth("skillProgress", percent);
  const next = required.find(skill => !skillSet.has(String(skill).toLowerCase()) && !quizzes[skill]?.verified) || required[0];
  if (next) {
    setText("focusTitle", `Your next win: ${next}`);
    setText("focusText", `You're ${Math.max(percent, 42)}% along your ${user.targetRole || "career"} path. Focus on one practical skill and turn it into proof.`);
  }
  const queued = required.filter(skill => !(skillSet.has(String(skill).toLowerCase()) || quizzes[skill]?.verified)).slice(0, 3);
  const display = queued.length ? queued : required.slice(0, 3);
  const grid = document.getElementById("continueGrid");
  if (grid) grid.innerHTML = display.map((skill, i) => lessonCard(skill, i)).join("");
}

function lessonCard(skill, index) {
  const lesson = lessons[skill] || [`Build practical ${skill} skills`, "50 min"];
  const icons = ["code", "auto_awesome", "trending_up"];
  return `<article class="d2-lesson-card sb-interactive-card"><span class="lesson-symbol"><span class="material-symbols-outlined">${icons[index % icons.length]}</span></span><span class="lesson-meta">${lesson[1]} · NEXT STEP</span><h3>${escapeHTML(skill)}</h3><p>${lesson[0]}. A clear next step for your roadmap.</p><a href="learn.html#${encodeURIComponent(skill)}">Start lesson →</a></article>`;
}

function renderInsights(required, quizzes) {
  const userSkills = (profile?.skills || []).map(x => String(x).toLowerCase());
  const matched = required.filter(s => userSkills.includes(String(s).toLowerCase()) || quizzes[s]?.verified).length;
  const skillScore = required.length ? Math.round(matched / required.length * 100) : 0;
  const projectsRaw = safeJSON("skillbridge_projects", []);
  const projectCount = Array.isArray(projectsRaw) ? projectsRaw.length : 0;
  const projectScore = clamp(projectCount * 25);
  const assessment = safeJSON("skillbridge_assessment_result", null);
  const assessScore = assessment ? clamp(assessment.score ?? assessment.percentage ?? 0) : 0;
  const readiness = Math.round(skillScore * .5 + projectScore * .25 + assessScore * .25);
  const finalReadiness = Math.round(readiness);

  setText("readinessScore", finalReadiness + "%"); setText("readinessRingValue", finalReadiness + "%");
  const ring = document.getElementById("readinessRing"); if (ring) ring.style.setProperty("--progress", finalReadiness * 3.6 + "deg");
  setText("readinessSkills", skillScore + "%"); setText("readinessProjects", projectScore + "%"); setText("readinessAssessment", assessScore + "%");
  setWidth("readinessSkillsBar", skillScore); setWidth("readinessProjectsBar", projectScore); setWidth("readinessAssessmentBar", assessScore);
  setText("readinessText", finalReadiness >= 80 ? "Strong progress across your current career path." : "Complete a skill or assessment to build your career readiness.");

  const goalDone = safeJSON("skillbridge_dashboard_goal", false) === true;
  setWidth("goalBar", goalDone ? 100 : 72); setText("goalProgressText", goalDone ? "1 / 1 completed" : "0 / 1 completed");
  const goalButton = document.getElementById("completeGoal"); if (goalButton) goalButton.textContent = goalDone ? "Completed ✓" : "Mark done";

  const currentStreak = window.SkillBridgeGamification?.getStreak?.().current ?? 0;
  const momentum = Math.round((skillScore + projectScore + assessScore + (currentStreak > 0 ? 100 : 0)) / 4);
  setText("momentumScore", momentum + "%");
  setText("momentumSkills", matched);
  setText("momentumAssessments", assessment ? 1 : 0);
  setText("momentumProjects", projectCount);
  setText("momentumStreak", currentStreak);
  setWidth("momentumLine", momentum);
}

function renderWeekChart(skillCount) {
  const stored = safeJSON("skillbridge_week_activity", null);
  const values = Array.isArray(stored) && stored.length ? stored : emptyWeek;
  const safe = values.slice(0,7).map(v => Math.max(0, Number(v) || 0)); while (safe.length < 7) safe.push(0.2);
  const max = Math.max(1, ...safe); const total = safe.reduce((a,b) => a+b, 0);
  setText("weekTotal", total.toFixed(1) + "h"); setText("pulseHours", total.toFixed(1) + "h"); setText("pulseLessons", total > 0 ? Math.round(total / 1.5) : 0);
  const chart = document.getElementById("weekChart"); if (!chart) return;
  chart.innerHTML = safe.map((v,i) => `<button type="button" class="sb-bar-wrap" aria-label="${["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"][i]}: ${v} hours"><span class="sb-bar" style="height:${Math.max(10, v/max*100)}%"></span><b>${v.toFixed(1)}</b></button>`).join("");
}

function renderActivity(required) {
  const list = document.getElementById("activityList"); if (!list) return;
  const stored = safeJSON("skillbridge_activity", []);
  const skill = required.find(s => !(profile?.skills || []).map(x => String(x).toLowerCase()).includes(String(s).toLowerCase())) || required[0] || "your next skill";
  const dynamic = [{ icon:"auto_awesome", title:"AI picked your next focus", text:`A practical ${skill} lesson is your best next move.`, time:"Now" }, ...activityDefaults];
  const all = [...(Array.isArray(stored) ? stored.slice(0,2) : []), ...dynamic].slice(0,5);
  list.innerHTML = all.map(a => `<div class="sb-activity-item"><span class="sb-activity-icon"><span class="material-symbols-outlined">${a.icon || "circle"}</span></span><div><strong>${escapeHTML(a.title)}</strong><p>${escapeHTML(a.text)}</p></div><time>${escapeHTML(a.time || "Recently")}</time></div>`).join("");
}

function bindDashboardInteractions() {
  document.querySelectorAll(".sb-premium-dashboard .sb-metric-card, .sb-premium-dashboard .sb-career-card, .sb-premium-dashboard .sb-learning-grid .d2-lesson-card, .sb-premium-dashboard .sb-milestone-card").forEach(card => {
    if (card.dataset.tiltBound) return; card.dataset.tiltBound = "1";
    card.addEventListener("mousemove", e => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; const r=card.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5; card.style.transform=`perspective(700px) rotateX(${(-y*1.8).toFixed(2)}deg) rotateY(${(x*1.8).toFixed(2)}deg) translateY(-5px)`; });
    card.addEventListener("mouseleave", () => { card.style.transform = ""; });
  });
  const goalButton = document.getElementById("completeGoal");
  if (goalButton && !goalButton.dataset.bound) { goalButton.dataset.bound="1"; goalButton.addEventListener("click", () => { const done=safeJSON("skillbridge_dashboard_goal",false)===true; localStorage.setItem("skillbridge_dashboard_goal",JSON.stringify(!done)); goalButton.textContent=!done?"Completed ✓":"Mark done"; setWidth("goalBar",!done?100:72); setText("goalProgressText",!done?"1 / 1 completed":"0 / 1 completed"); window.sbToast?.(!done?"Today's goal completed! +momentum":"Goal reopened"); }); }
  const refresh = document.getElementById("refreshActivity");
  if (refresh && !refresh.dataset.bound) { refresh.dataset.bound="1"; refresh.addEventListener("click", () => { refresh.classList.add("is-clicked"); renderActivity(["JavaScript","Python","SQL"]); setTimeout(()=>refresh.classList.remove("is-clicked"),180); }); }
}

init();
