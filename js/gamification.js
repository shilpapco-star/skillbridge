// SkillBridge Gamification Engine
// Shared across all pages. Include this script BEFORE each page's own script.
(function () {
  const XP_KEY = "skillbridge_xp";
  const BADGES_KEY = "skillbridge_badges";
  const STREAK_KEY = "skillbridge_streak";

  const BADGE_DEFINITIONS = {
    first_profile: { name: "Getting Started", desc: "Created your profile", icon: "🚀" },
    first_quiz: { name: "Quiz Taker", desc: "Took your first quiz", icon: "📝" },
    quiz_master: { name: "Quiz Master", desc: "Verified 3+ skills", icon: "🏆" },
    resume_pro: { name: "Resume Pro", desc: "Ran a resume analysis", icon: "📄" },
    streak_3: { name: "On a Roll", desc: "Reached a 3-day streak", icon: "🔥" },
    halfway: { name: "Halfway There", desc: "Reached 50% roadmap completion", icon: "⭐" },
  };

  function getXP() {
    return parseInt(localStorage.getItem(XP_KEY) || "0", 10);
  }
  function setXP(v) {
    localStorage.setItem(XP_KEY, String(v));
  }
  function getLevel(xp) {
    return Math.floor(xp / 100) + 1;
  }
  function getBadges() {
    return JSON.parse(localStorage.getItem(BADGES_KEY) || "[]");
  }
  function setBadges(b) {
    localStorage.setItem(BADGES_KEY, JSON.stringify(b));
  }

  function unlockBadge(id) {
    const badges = getBadges();
    if (!badges.includes(id) && BADGE_DEFINITIONS[id]) {
      badges.push(id);
      setBadges(badges);
      showToast(`🏅 Badge unlocked: ${BADGE_DEFINITIONS[id].name}`);
    }
  }

  function addXP(amount, reason) {
    const xp = getXP() + amount;
    setXP(xp);
    showToast(`+${amount} XP — ${reason}`);
    renderBar();
  }

  // Call once per page load. Increments streak if the student returns on a
  // new day, resets it if they missed a day, and unlocks the 3-day badge.
  function updateStreak() {
    const today = new Date().toDateString();
    const data =
      JSON.parse(localStorage.getItem(STREAK_KEY) || "null") || {
        lastActive: null,
        current: 0,
        longest: 0,
      };

    if (data.lastActive !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      data.current = data.lastActive === yesterday ? data.current + 1 : 1;
      data.lastActive = today;
      data.longest = Math.max(data.longest, data.current);
      localStorage.setItem(STREAK_KEY, JSON.stringify(data));

      if (data.current >= 3) unlockBadge("streak_3");
    }
    return data;
  }

  function getStreak() {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || "null") || { current: 0, longest: 0 };
  }

  // ---- Small toast notification in the corner ----
  function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "xp-toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // ---- Renders the small bar under the navbar, if present on the page ----
  function renderBar() {
    const bar = document.getElementById("gamificationBar");
    if (!bar) return;

    const xp = getXP();
    const level = getLevel(xp);
    const streak = getStreak();

    bar.innerHTML = `
      <span class="gami-item">⭐ Level ${level}</span>
      <span class="gami-item">${xp} XP</span>
      <span class="gami-item">🔥 ${streak.current}-day streak</span>
      <a href="badges.html" class="gami-item gami-link">🏅 ${getBadges().length}/${Object.keys(BADGE_DEFINITIONS).length} badges</a>
    `;
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateStreak();
    renderBar();
  });

  // Expose functions globally so other page scripts can call them
  window.SkillBridgeGamification = {
    addXP,
    unlockBadge,
    getXP,
    getLevel,
    getBadges,
    getStreak,
    BADGE_DEFINITIONS,
  };
})();