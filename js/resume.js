// ---- Step 1: Load the saved profile ----
const savedProfile = localStorage.getItem("skillbridge_profile");
const noProfileDiv = document.getElementById("noProfile");
const resumeContentDiv = document.getElementById("resumeContent");

let profile = null;
let requiredSkills = [];

if (!savedProfile) {
  noProfileDiv.classList.remove("hidden");
} else {
  resumeContentDiv.classList.remove("hidden");
  profile = JSON.parse(savedProfile);
  init(profile);
}

// ---- Step 2: A master skill list with common aliases ----
// Key = the "official" skill name (matches roles.json), value = extra ways it might appear in a resume
const skillAliases = {
  "HTML": ["html", "html5"],
  "CSS": ["css", "css3"],
  "JavaScript": ["javascript", "js", "es6"],
  "TypeScript": ["typescript", "ts"],
  "React": ["react", "reactjs", "react.js"],
  "Node.js": ["node.js", "nodejs", "node"],
  "Git": ["git", "github", "version control"],
  "SQL": ["sql", "mysql", "postgresql", "postgres"],
  "Databases": ["database", "databases", "dbms"],
  "REST APIs": ["rest api", "rest apis", "restful api", "api integration"],
  "Python": ["python"],
  "Excel": ["excel", "microsoft excel", "ms excel"],
  "Statistics": ["statistics", "statistical analysis"],
  "Pandas": ["pandas"],
  "Data Visualization": ["data visualization", "tableau", "matplotlib", "seaborn"],
  "Power BI": ["power bi", "powerbi"],
  "Docker": ["docker", "containerization"],
  "Authentication": ["authentication", "jwt", "oauth"],
  "Deployment": ["deployment", "ci/cd", "vercel", "netlify", "render"],
  "Responsive Design": ["responsive design", "mobile-first"],
  "Programming Fundamentals": ["data structures", "algorithms", "programming fundamentals"],
  "Storytelling with Data": ["data storytelling", "storytelling with data"]
};

let requiredSkillsList = [];

async function init(profile) {
  const rolesRes = await fetch("data/roles.json");
  const roles = await rolesRes.json();
  requiredSkillsList = roles[profile.targetRole] || [];

  document.getElementById("analyzeBtn").addEventListener("click", analyzeResume);
}

// ---- Step 3: Extract skills from pasted text ----
function analyzeResume() {
  const text = document.getElementById("resumeText").value.toLowerCase();

  if (!text.trim()) {
    alert("Please paste some resume text first.");
    return;
  }

  const foundSkills = [];

  Object.keys(skillAliases).forEach((skill) => {
    const patterns = skillAliases[skill];
    const isFound = patterns.some((pattern) => {
      // Word-boundary-safe check so "js" doesn't match inside "objects"
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      return regex.test(text);
    });
    if (isFound) foundSkills.push(skill);
  });

  renderResults(foundSkills);
}

// ---- Step 4: Compare against target role and render ----
function renderResults(foundSkills) {
  document.getElementById("resultsSection").classList.remove("hidden");

  const foundContainer = document.getElementById("foundSkills");
  foundContainer.innerHTML = "";
  if (foundSkills.length === 0) {
    foundContainer.innerHTML = `<span class="no-quiz">No recognizable technical skills found. Try adding more detail.</span>`;
  } else {
    foundSkills.forEach((skill) => {
      const tag = document.createElement("div");
      tag.className = "skill-tag static-tag";
      tag.textContent = skill;
      foundContainer.appendChild(tag);
    });
  }

  const missing = requiredSkillsList.filter((s) => !foundSkills.includes(s));
  const missingContainer = document.getElementById("missingSkills");
  missingContainer.innerHTML = "";
  if (missing.length === 0) {
    missingContainer.innerHTML = `<span class="no-quiz">Your resume covers everything for this role 🎉</span>`;
  } else {
    missing.forEach((skill) => {
      const tag = document.createElement("div");
      tag.className = "skill-tag static-tag missing-tag";
      tag.textContent = skill;
      missingContainer.appendChild(tag);
    });
  }

  // Wire up the merge button fresh each time (with the latest foundSkills)
  const mergeBtn = document.getElementById("mergeBtn");
  mergeBtn.onclick = () => mergeIntoProfile(foundSkills);
}

// ---- Step 5: Merge found skills into the saved profile ----
function mergeIntoProfile(foundSkills) {
  const current = JSON.parse(localStorage.getItem("skillbridge_profile"));
  const existingLower = current.skills.map((s) => s.toLowerCase());

  foundSkills.forEach((skill) => {
    if (!existingLower.includes(skill.toLowerCase())) {
      current.skills.push(skill);
    }
  });

  localStorage.setItem("skillbridge_profile", JSON.stringify(current));
  document.getElementById("mergeMessage").classList.remove("hidden");
}