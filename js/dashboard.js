// ---- Step 1: Load the saved profile ----
const savedProfile = localStorage.getItem("skillbridge_profile");

const noProfileDiv = document.getElementById("noProfile");
const dashboardContentDiv = document.getElementById("dashboardContent");

if (!savedProfile) {
  noProfileDiv.classList.remove("hidden");
} else {
  dashboardContentDiv.classList.remove("hidden");
  const profile = JSON.parse(savedProfile);
  loadDashboard(profile);
}

// ---- Step 2: Fetch role data and compute stats ----
async function loadDashboard(profile) {
  const response = await fetch("data/roles.json");
  const roles = await response.json();
  const requiredSkills = roles[profile.targetRole];

  if (!requiredSkills) {
    document.getElementById("dashHeading").textContent = "Role not found";
    return;
  }

  const mySkillsLower = profile.skills.map((s) => s.toLowerCase().trim());
  const haveCount = requiredSkills.filter((skill) =>
    mySkillsLower.includes(skill.toLowerCase())
  ).length;
  const missingCount = requiredSkills.length - haveCount;
  const percent = Math.round((haveCount / requiredSkills.length) * 100);

  renderStats(profile, haveCount, missingCount, percent);
  renderChart(haveCount, missingCount);
}

// ---- Step 3: Fill in the summary cards ----
function renderStats(profile, haveCount, missingCount, percent) {
  document.getElementById("dashHeading").textContent = `Hi ${profile.name} 👋`;
  document.getElementById("dashSubtitle").textContent =
    `Your progress toward becoming a ${profile.targetRole}`;

  document.getElementById("statHave").textContent = haveCount;
  document.getElementById("statMissing").textContent = missingCount;
  document.getElementById("statPercent").textContent = percent + "%";
}

// ---- Step 4: Draw the doughnut chart with Chart.js ----
function renderChart(haveCount, missingCount) {
  const ctx = document.getElementById("coverageChart");

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Skills you have", "Skills to learn"],
      datasets: [
        {
          data: [haveCount, missingCount],
          backgroundColor: ["#2fa96b", "#e15c5c"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}