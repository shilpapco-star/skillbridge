import { auth, db } from "./firebase-config.js";
import {
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

// ---- State ----
let currentSkills = [];

const skillInput = document.getElementById("skillInput");
const skillTagsContainer = document.getElementById("skillTags");
const form = document.getElementById("profileForm");
const savedMessage = document.getElementById("savedMessage");

// ---- Add a skill tag when the user presses Enter ----
skillInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const value = skillInput.value.trim();
    if (value && !currentSkills.includes(value)) {
      currentSkills.push(value);
      renderSkillTags();
    }
    skillInput.value = "";
  }
});

// ---- Fallback "Add" button (in case Enter is intercepted by autofill) ----
document.getElementById("addSkillBtn").addEventListener("click", () => {
  const value = skillInput.value.trim();
  if (value && !currentSkills.includes(value)) {
    currentSkills.push(value);
    renderSkillTags();
  }
  skillInput.value = "";
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

  document.querySelectorAll(".skill-tag button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const i = Number(e.target.dataset.index);
      currentSkills.splice(i, 1);
      renderSkillTags();
    });
  });
}

// ---- Fill the form from a profile object (used by both localStorage and Firestore loads) ----
function fillForm(profile) {
  document.getElementById("name").value = profile.name || "";
  document.getElementById("education").value = profile.education || "";
  document.getElementById("branch").value = profile.branch || "";
  document.getElementById("year").value = profile.year || "";
  document.getElementById("targetRole").value = profile.targetRole || "";
  currentSkills = profile.skills || [];
  renderSkillTags();
}

// ---- On load: try Firestore first (source of truth), fall back to localStorage cache ----
onAuthStateChanged(auth, async (user) => {
  if (!user) return; // requireAuth() (loaded separately) handles the redirect

  const docRef = doc(db, "profiles", user.uid);
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    const profile = snapshot.data();
    fillForm(profile);
    localStorage.setItem("skillbridge_profile", JSON.stringify(profile)); // keep cache in sync
  } else {
    // No cloud profile yet — fall back to any local cache (e.g. first-time migration)
    const cached = localStorage.getItem("skillbridge_profile");
    if (cached) fillForm(JSON.parse(cached));
  }
});

// ---- Save the profile: to Firestore (real database) AND localStorage (fast local cache) ----
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to save a profile.");
    return;
  }

  const profile = {
    name: document.getElementById("name").value,
    education: document.getElementById("education").value,
    branch: document.getElementById("branch").value,
    year: document.getElementById("year").value,
    targetRole: document.getElementById("targetRole").value,
    skills: currentSkills,
    email: user.email,
  };

  try {
    // Save to Firestore — this is the real, persistent database record
    await setDoc(doc(db, "profiles", user.uid), profile, { merge: true });

    // Keep localStorage in sync so the rest of the app (roadmap, dashboard, etc.)
    // keeps working exactly as before without needing changes today
    localStorage.setItem("skillbridge_profile", JSON.stringify(profile));

    savedMessage.classList.remove("hidden");
    console.log("Saved profile to Firestore:", profile);

    if (window.SkillBridgeGamification) {
      window.SkillBridgeGamification.addXP(10, "Profile saved");
      window.SkillBridgeGamification.unlockBadge("first_profile");
    }
  } catch (err) {
    console.error("Error saving profile:", err);
    alert("Something went wrong saving your profile. Check the console for details.");
  }
});