document.addEventListener("DOMContentLoaded", () => {
  const page = (location.pathname.split("/").pop() || "dashboard.html").toLowerCase();

  document.querySelectorAll(".sb-nav-item[data-page]").forEach((link) => {
    const target = (link.getAttribute("href") || "").split("#")[0].toLowerCase();
    link.classList.toggle("sb-active", target === page);
  });

  try {
    const p = JSON.parse(localStorage.getItem("skillbridge_profile") || "null");
    if (p) {
      const name = p.name || "SkillBridge Student";
      const initials = name.split(/\s+/).filter(Boolean).slice(0,2).map(x => x[0]).join("").toUpperCase() || "SB";
      ["sidebarName", "assessmentName"].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=name; });
      ["sidebarInitials", "headerInitials", "assessmentInitials"].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=initials; });
      if (p.avatar) ["sidebarAvatar", "headerAvatar", "assessmentAvatar"].forEach(id => { const el=document.getElementById(id); if(el){el.src=p.avatar; el.classList.add("show");} });
    }
  } catch (_) {}

  const search = document.querySelector(".sb-search input");
  if (search) {
    document.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); search.focus(); }
    });
    search.addEventListener("keydown", e => {
      if (e.key === "Enter" && search.value.trim()) {
        window.location.href = "assistant.html?q=" + encodeURIComponent(search.value.trim());
      }
    });
  }
  if (document.querySelector(".sb-topbar")) setTimeout(() => {
    const st = window.SkillBridgeGamification?.getStreak?.();
    const el = document.getElementById("topStreak");
    if (el && st) el.textContent = st.current || 0;
  }, 0);
  document.body.classList.add("page-ready");
});

window.sbToast = (message) => {
  let t=document.querySelector(".toast-new");
  if(!t){t=document.createElement("div");t.className="toast-new";document.body.appendChild(t);}
  t.textContent=message; t.classList.add("show"); clearTimeout(window.__sbToast);
  window.__sbToast=setTimeout(()=>t.classList.remove("show"),2200);
};
