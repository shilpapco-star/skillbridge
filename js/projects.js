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

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}