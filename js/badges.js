document.addEventListener("DOMContentLoaded", () => {
  const g = window.SkillBridgeGamification;
  if (!g) return;
  g.updateStreak();
  const $ = (id) => document.getElementById(id);
  const defs = g.BADGE_DEFINITIONS;
  let activeFilter = "all";
  let currentBadge = null;

  function readJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
  function getRoadmapPercent() {
    try {
      const p = readJSON("skillbridge_profile", {});
      const roles = readJSON("skillbridge_roles_cache", {});
      const results = readJSON("skillbridge_quiz_results", {});
      const roleReq = roles[p.targetRole] || [];
      if (!roleReq.length) return 0;
      const have = new Set((p.skills || []).map(s => String(s).toLowerCase()));
      return Math.round(roleReq.filter(s => have.has(String(s).toLowerCase()) || results[s]?.verified).length / roleReq.length * 100);
    } catch { return 0; }
  }
  async function loadRoadmapPercent() {
    try {
      const p = readJSON("skillbridge_profile", {});
      const results = readJSON("skillbridge_quiz_results", {});
      const res = await fetch("data/roles.json");
      const roles = await res.json();
      const req = roles[p.targetRole] || [];
      const have = new Set((p.skills || []).map(s => String(s).toLowerCase()));
      const pct = req.length ? Math.round(req.filter(s => have.has(String(s).toLowerCase()) || results[s]?.verified).length / req.length * 100) : 0;
      $("roadmapPercent").textContent = pct + "%";
      return pct;
    } catch { $("roadmapPercent").textContent = getRoadmapPercent() + "%"; return getRoadmapPercent(); }
  }
  function stateFor(id, roadmapPct) {
    const quizzes = readJSON("skillbridge_quiz_results", {});
    const profile = readJSON("skillbridge_profile", {});
    const streak = g.getStreak();
    const verified = Object.values(quizzes).filter(r => r && r.verified).length;
    const checks = {
      first_profile: [Boolean(profile.name || profile.fullName || profile.email || Object.keys(profile).length), 100, "Create your SkillBridge profile"],
      first_quiz: [Object.keys(quizzes).length > 0, 100, "Complete your first skill quiz"],
      quiz_master: [verified >= 3, Math.min(100, Math.round(verified / 3 * 100)), `${verified}/3 verified skills`],
      resume_pro: [Boolean(localStorage.getItem("skillbridge_resume_analysis") || localStorage.getItem("skillbridge_resume_studio") || localStorage.getItem("skillbridge_resume_health")), 100, "Run a resume analysis"],
      streak_3: [streak.current >= 3, Math.min(100, Math.round(streak.current / 3 * 100)), `${streak.current}/3 consecutive days`],
      halfway: [roadmapPct >= 50, Math.min(100, roadmapPct * 2), `${roadmapPct}% roadmap progress`]
    };
    const [earned, progress, hint] = checks[id] || [false, 0, "Keep learning"];
    return { earned: earned || g.getBadges().includes(id), progress: Math.max(0, Math.min(100, progress)), hint };
  }
  function render() {
    const earnedIds = new Set(g.getBadges());
    const roadmapPct = parseInt($("roadmapPercent").textContent) || 0;
    const entries = Object.entries(defs).map(([id, b]) => ({ id, b, ...stateFor(id, roadmapPct) }));
    const filtered = entries.filter(x => activeFilter === "all" || (activeFilter === "earned" ? x.earned : !x.earned));
    $("collectionCount").textContent = `${entries.filter(x => x.earned).length}/${entries.length}`;
    $("badgeGrid").innerHTML = filtered.map(x => `
      <article class="badge-card-interactive ${x.earned ? "earned" : "locked"}" data-id="${x.id}" tabindex="0" role="button" aria-label="View ${x.b.name} achievement">
        <div class="badge-icon-interactive">${x.earned ? x.b.icon : "🔒"}</div>
        <h3>${escapeHtml(x.b.name)}</h3><p>${escapeHtml(x.b.desc)}</p>
        <div class="badge-card-bottom"><span class="badge-status">${x.earned ? "UNLOCKED" : "LOCKED"}</span><div class="badge-progress"><span style="width:${x.progress}%"></span></div><strong style="font-size:9px;color:var(--sb-muted)">${x.progress}%</strong></div>
      </article>`).join("");
    $("badgeGrid").querySelectorAll(".badge-card-interactive").forEach(card => {
      const open = () => openModal(entries.find(x => x.id === card.dataset.id));
      card.addEventListener("click", open); card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
    const next = entries.find(x => !x.earned);
    if (next) {
      $("nextBadgeName").textContent = next.b.name; $("nextBadgeHint").textContent = next.hint; $("nextBadgeIcon").textContent = next.b.icon;
      $("nextBadgeProgress").textContent = next.progress + "%"; $("nextBadgeBar").style.width = next.progress + "%";
      $("nextBadgeAction").href = next.id === "first_quiz" || next.id === "quiz_master" ? "assessment.html" : next.id === "resume_pro" ? "resume.html" : "roadmap.html";
    } else {
      $("nextBadgeName").textContent = "Legend status"; $("nextBadgeHint").textContent = "You unlocked every achievement!"; $("nextBadgeIcon").textContent = "👑"; $("nextBadgeProgress").textContent = "100%"; $("nextBadgeBar").style.width = "100%";
    }
  }
  function updateTop() {
    const xp = g.getXP(), level = g.getLevel(xp), within = xp % 100, streak = g.getStreak();
    $("levelNumber").textContent = level; $("levelTitle").textContent = level >= 5 ? "Career Accelerator" : level >= 3 ? "Momentum Builder" : "Career Builder";
    $("levelCopy").textContent = `${100 - within} XP until your next level. Keep building!`; $("xpValue").textContent = xp; $("streakValue").textContent = streak.current; $("longestStreak").textContent = streak.longest || 0; $("badgeValue").textContent = g.getBadges().length;
    $("xpBar").style.width = within + "%"; $("xpLabel").textContent = `${within} / 100 XP`; $("nextLevelText").textContent = `${100 - within} XP to Level ${level + 1}`;
    const deg = Math.max(4, within / 100 * 360); $("levelNumber").parentElement.parentElement.style.background = `conic-gradient(var(--sb-primary) ${deg}deg, rgba(195,192,255,.16) ${deg}deg)`;
    $("topStreak").textContent = streak.current;
    const dots = $("streakDots"); dots.innerHTML = Array.from({length:7}, (_,i) => `<span class="streak-dot ${i < Math.min(streak.current,7) ? "on" : ""}">${i < Math.min(streak.current,7) ? "✓" : i+1}</span>`).join("");
  }
  function openModal(item) {
    if (!item) return; currentBadge = item; const {b,earned,progress,hint} = item;
    $("modalIcon").textContent = earned ? b.icon : "🔒"; $("modalStatus").textContent = earned ? "ACHIEVEMENT UNLOCKED" : "ACHIEVEMENT IN PROGRESS"; $("modalTitle").textContent = b.name; $("modalDesc").textContent = b.desc + (earned ? " You earned this milestone — keep going!" : ` ${hint}.`); $("modalProgressText").textContent = progress + "%"; $("modalProgressBar").style.width = progress + "%"; $("modalReward").textContent = earned ? "+ XP earned" : "+ milestone XP"; $("modalAction").textContent = earned ? "Keep building" : "Work toward this";
    $("badgeModal").classList.add("show"); $("badgeModal").setAttribute("aria-hidden","false"); $("closeBadgeModal").focus();
  }
  function closeModal(){ $("badgeModal").classList.remove("show"); $("badgeModal").setAttribute("aria-hidden","true"); currentBadge=null; }
  function toast(msg){ const t=$("achievementToast"); t.textContent=msg; t.classList.add("show"); clearTimeout(window.__sbAchievementToast); window.__sbAchievementToast=setTimeout(()=>t.classList.remove("show"),2600); }
  function celebrate(){
    const unlocked=g.getBadges().length; toast(unlocked ? `🏆 You have ${unlocked} achievement${unlocked===1?"":"s"} unlocked!` : "🚀 Start your first milestone today!");
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for(let i=0;i<26;i++){ const c=document.createElement("span"); c.className="confetti"; c.style.left=(10+Math.random()*80)+"vw"; c.style.setProperty("--x",(-120+Math.random()*240)+"px"); c.style.animationDelay=(Math.random()*.25)+"s"; c.style.transform=`rotate(${Math.random()*360}deg)`; document.body.appendChild(c); setTimeout(()=>c.remove(),1500); }
  }
  function escapeHtml(s){ return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c])); }
  $("celebrateBtn").addEventListener("click", celebrate); $("closeBadgeModal").addEventListener("click", closeModal); $("badgeModal").addEventListener("click", e => { if(e.target.hasAttribute("data-close-modal")) closeModal(); }); document.addEventListener("keydown", e => { if(e.key === "Escape") closeModal(); });
  document.querySelectorAll(".filter-btn").forEach(btn => btn.addEventListener("click", () => { document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active")); btn.classList.add("active"); activeFilter=btn.dataset.filter; render(); }));
  updateTop(); loadRoadmapPercent().then(()=>render());
});
