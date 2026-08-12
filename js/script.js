// ---- State ----
// currentSkills holds the skill tags the student has added so far
let currentSkills = [];

const skillInput = document.getElementById("skillInput");
const skillTagsContainer = document.getElementById("skillTags");
const form = document.getElementById("profileForm");
const savedMessage = document.getElementById("savedMessage");

// ---- Add a skill tag when the user presses Enter ----
skillInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // stop the form from submitting early
    const value = skillInput.value.trim();

    if (value && !currentSkills.includes(value)) {
      currentSkills.push(value);
      renderSkillTags();
    }
    skillInput.value = "";
  }
});

// ---- Render the skill tags below the input ----
function renderSkillTags() {
  skillTagsContainer.innerHTML = "";

  currentSkills.forEach((skill, index) => {
    const tag = document.createElement("div");
    tag.className = "skill-tag";
    tag.innerHTML = `${skill} <button type="button" data-index="${index}">&times;</button>`;
    skillTagsContainer.appendChild(tag);
  });

  // wire up the remove (x) buttons
  document.querySelectorAll(".skill-tag button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const i = Number(e.target.dataset.index);
      currentSkills.splice(i, 1);
      renderSkillTags();
    });
  });
}

// ---- Load any previously saved profile on page load ----
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("skillbridge_profile");
  if (!saved) return;

  const profile = JSON.parse(saved);
  document.getElementById("name").value = profile.name || "";
  document.getElementById("education").value = profile.education || "";
  document.getElementById("branch").value = profile.branch || "";
  document.getElementById("year").value = profile.year || "";
  document.getElementById("targetRole").value = profile.targetRole || "";
  currentSkills = profile.skills || [];
  renderSkillTags();
});

// ---- Save the profile to localStorage on submit ----
form.addEventListener("submit", (e) => {
  e.preventDefault(); // don't actually reload the page

  const profile = {
    name: document.getElementById("name").value,
    education: document.getElementById("education").value,
    branch: document.getElementById("branch").value,
    year: document.getElementById("year").value,
    targetRole: document.getElementById("targetRole").value,
    skills: currentSkills,
  };

  localStorage.setItem("skillbridge_profile", JSON.stringify(profile));

  savedMessage.classList.remove("hidden");
  console.log("Saved profile:", profile);
});
