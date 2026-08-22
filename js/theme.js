document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  updateIcon();

  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("skillbridge_theme", next);
    updateIcon();
  });

  function updateIcon() {
    const current = document.documentElement.getAttribute("data-theme");
    btn.textContent = current === "dark" ? "☀️" : "🌙";
  }
});