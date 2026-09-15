const starterProjects=[
 {name:"SkillBridge Portfolio Tracker",level:"Beginner",skills:["HTML","CSS","JavaScript"],desc:"Build a small dashboard that tracks skills, projects and learning progress."},
 {name:"Student Expense Analyzer",level:"Beginner",skills:["Python","Pandas","Charts"],desc:"Import a CSV, clean the data and turn spending into useful visual insights."},
 {name:"Career API Dashboard",level:"Intermediate",skills:["Node.js","REST API","JavaScript"],desc:"Create a small API and dashboard for roles, skills and application status."},
 {name:"AI Study Planner",level:"Intermediate",skills:["Python","AI","Streamlit"],desc:"Turn a target role into a weekly study plan with progress tracking."},
 {name:"SQL Placement Tracker",level:"Intermediate",skills:["SQL","MySQL","Dashboard"],desc:"Track applications, rounds and outcomes using a structured relational database."},
 {name:"Real-time Team Board",level:"Advanced",skills:["Firebase","JavaScript","Auth"],desc:"Build a collaborative task board with authentication and live updates."}
];
function renderStarterProjects(){const host=document.querySelector(".projects-starter-host");if(!host)return;host.innerHTML=`<div class="sb-upgrade-card"><span class="page-kicker">STARTER LAB</span><h3>Need an idea before GitHub?</h3><p>Pick a project that matches a skill you want to demonstrate. These are starter blueprints, not fake completed projects.</p></div><div class="project-starter-grid">${starterProjects.map(x=>`<article class="project-starter"><span class="page-chip">${x.level}</span><h3>${x.name}</h3><p>${x.desc}</p><div class="project-tags">${x.skills.map(s=>`<span class="project-tag">${s}</span>`).join("")}</div><button type="button" data-project-query="${x.skills.join(" ")}">Search GitHub ↗</button></article>`).join("")}</div>`;host.querySelectorAll("button[data-project-query]").forEach(b=>b.onclick=()=>{searchInput.value=b.dataset.projectQuery;runSearch();window.scrollTo({top:0,behavior:"smooth"})})}
const searchInput = document.getElementById("ghSearchInput");
const searchBtn = document.getElementById("ghSearchBtn");
const statusEl = document.getElementById("ghStatus");
const resultsEl = document.getElementById("ghResults");

searchBtn.addEventListener("click", runSearch);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSearch();
});

// ---- If arriving from a roadmap link like projects.html?q=React, search immediately ----
const params = new URLSearchParams(window.location.search);
const prefill = params.get("q");
if (prefill) {
  searchInput.value = prefill;
  runSearch();
}

async function runSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  statusEl.textContent = "Searching GitHub...";
  resultsEl.innerHTML = "";

  try {
    // GitHub's public search API - no API key needed for basic use.
    // Sorted by stars so the most popular, battle-tested projects show first.
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
      query
    )}&sort=stars&order=desc&per_page=8`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}`);
    }

    const data = await res.json();
    renderResults(data.items || []);
  } catch (err) {
    console.error(err);
    statusEl.textContent =
      "Couldn't reach GitHub right now (it rate-limits unauthenticated requests to ~10/min). Wait a minute and try again.";
  }
}

function renderResults(repos) {
  if (repos.length === 0) {
    statusEl.textContent = "No projects found — try a different search term.";
    resultsEl.innerHTML = "";
    return;
  }

  statusEl.textContent = `Top ${repos.length} results, sorted by popularity:`;

  resultsEl.innerHTML = repos
    .map(
      (repo) => `
    <a href="${repo.html_url}" target="_blank" rel="noopener" class="gh-card">
      <div class="gh-card-top">
        <span class="gh-repo-name">${escapeHtml(repo.full_name)}</span>
        <span class="gh-stars">⭐ ${formatStars(repo.stargazers_count)}</span>
      </div>
      <p class="gh-desc">${escapeHtml(repo.description || "No description provided.")}</p>
      <div class="gh-card-bottom">
        ${repo.language ? `<span class="gh-lang">${escapeHtml(repo.language)}</span>` : ""}
        <span class="gh-updated">Updated ${new Date(repo.updated_at).toLocaleDateString()}</span>
      </div>
    </a>
  `
    )
    .join("");
}

function formatStars(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : n;
}

function escapeHtml(text) { const div=document.createElement("div"); div.textContent=text; return div.innerHTML; }
renderStarterProjects();
