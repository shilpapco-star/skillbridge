// ---- Step 1: Load the saved profile ----
const savedProfile = localStorage.getItem("skillbridge_profile");
const noProfileDiv = document.getElementById("noProfile");
const assistantContentDiv = document.getElementById("assistantContent");

let profile = null;
let roadmapResults = []; // [{ step, skill, status, project }]
let roleName = "";

if (!savedProfile) {
  noProfileDiv.classList.remove("hidden");
} else {
  assistantContentDiv.classList.remove("hidden");
  profile = JSON.parse(savedProfile);
  init(profile);
}

// ---- Step 2: Load role + project + quiz data, build the same status logic as the roadmap ----
async function init(profile) {
  const [rolesRes, projectsRes] = await Promise.all([
    fetch("data/roles.json"),
    fetch("data/projects.json"),
  ]);
  const roles = await rolesRes.json();
  const projects = await projectsRes.json();
  const quizResults = JSON.parse(localStorage.getItem("skillbridge_quiz_results") || "{}");

  roleName = profile.targetRole;
  const requiredSkills = roles[roleName] || [];
  const mySkillsLower = profile.skills.map((s) => s.toLowerCase().trim());

  roadmapResults = requiredSkills.map((skill, index) => {
    const selfReported = mySkillsLower.includes(skill.toLowerCase());
    const quizResult = quizResults[skill];

    let status;
    if (quizResult) {
      status = quizResult.verified ? "have" : "improve";
    } else if (selfReported) {
      status = "have";
    } else {
      status = "missing";
    }

    return { step: index + 1, skill, status, project: projects[skill] || null };
  });

  greet();
  renderSuggestedQuestions();

  document.getElementById("sendBtn").addEventListener("click", handleSend);
  document.getElementById("chatInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });
}

// ---- Step 3: Greeting + suggested question chips ----
function greet() {
  addMessage(
    "assistant",
    `Hi ${profile.name}! I can see your roadmap for ${roleName}. Ask me things like "what should I learn next?" or "what am I missing?"`
  );
}

function renderSuggestedQuestions() {
  const suggestions = [
    "What should I learn next?",
    "What skills am I missing?",
    "Which projects should I build?",
    "How can I prepare for placements?",
  ];

  const container = document.getElementById("suggestedQuestions");
  container.innerHTML = "";
  suggestions.forEach((q) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "suggestion-chip";
    chip.textContent = q;
    chip.addEventListener("click", () => {
      document.getElementById("chatInput").value = q;
      handleSend();
    });
    container.appendChild(chip);
  });
}

// ---- Step 4: Handle sending a message ----
function handleSend() {
  const input = document.getElementById("chatInput");
  const question = input.value.trim();
  if (!question) return;

  addMessage("user", question);
  input.value = "";

  // small delay makes it feel like it's "thinking", not required
  setTimeout(() => {
    const answer = answerQuestion(question.toLowerCase());
    addMessage("assistant", answer);
  }, 300);
}

// ---- Step 5: The "brain" — pattern match the question against real data ----
function answerQuestion(q) {
  const missing = roadmapResults.filter((r) => r.status === "missing");
  const improve = roadmapResults.filter((r) => r.status === "improve");
  const have = roadmapResults.filter((r) => r.status === "have");
  const nextUp = roadmapResults.find((r) => r.status === "missing" || r.status === "improve");

  // ---- "what should I learn next" ----
  if (q.includes("next") || q.includes("what should i learn")) {
    if (!nextUp) {
      return `You've covered every skill for ${roleName}! Consider deepening your strongest skills with a bigger project, or exploring a related role.`;
    }
    const verb = nextUp.status === "improve" ? "revisit and strengthen" : "learn";
    let msg = `Based on your roadmap, you should ${verb} "${nextUp.skill}" next (step ${nextUp.step} of ${roadmapResults.length}).`;
    if (nextUp.project) {
      msg += ` Try this project: ${nextUp.project.project} (${nextUp.project.level}).`;
    }
    return msg;
  }

  // ---- "what am I missing" ----
  if (q.includes("missing") || q.includes("gap") || q.includes("lack")) {
    if (missing.length === 0 && improve.length === 0) {
      return `Great news — you're not missing anything for ${roleName} right now!`;
    }
    let msg = "";
    if (missing.length > 0) {
      msg += `You haven't started: ${missing.map((r) => r.skill).join(", ")}. `;
    }
    if (improve.length > 0) {
      msg += `You've been quizzed but should strengthen: ${improve.map((r) => r.skill).join(", ")}.`;
    }
    return msg;
  }

  // ---- "which projects should I build" ----
  if (q.includes("project")) {
    const needProjects = [...missing, ...improve].filter((r) => r.project);
    if (needProjects.length === 0) {
      return "You don't have any pending project recommendations right now — you're covering your target role well!";
    }
    const list = needProjects
      .slice(0, 3)
      .map((r) => `${r.skill} → ${r.project.project} (${r.project.level})`)
      .join(" | ");
    return `Here are projects to focus on next: ${list}`;
  }

  // ---- "how am I doing" / progress ----
  if (q.includes("how am i doing") || q.includes("progress") || q.includes("percent")) {
    const percent = Math.round((have.length / roadmapResults.length) * 100);
    return `You're at ${percent}% for ${roleName} — ${have.length} of ${roadmapResults.length} skills verified or self-reported. Keep going!`;
  }

  // ---- "placements" / interview prep ----
  if (q.includes("placement") || q.includes("interview") || q.includes("prepare")) {
    let msg = `For placements as a ${roleName}, prioritize your weakest verified skills first`;
    if (improve.length > 0) {
      msg += ` — right now that's ${improve.map((r) => r.skill).join(", ")}.`;
    } else {
      msg += ".";
    }
    msg += " Also make sure you have 2-3 solid projects on GitHub with clear READMEs, and can explain your technical decisions out loud.";
    return msg;
  }

  // ---- strengths / what do I know ----
  if (q.includes("strength") || q.includes("good at") || q.includes("know already")) {
    if (have.length === 0) {
      return "You haven't verified any skills yet — head to the Assessment page to take a few quizzes!";
    }
    return `Your current strengths for ${roleName}: ${have.map((r) => r.skill).join(", ")}.`;
  }

  // ---- fallback ----
  return `I can help with questions about your roadmap, missing skills, project ideas, or interview prep for ${roleName}. Try one of the suggestions below the chat box!`;
}

// ---- Step 6: Render a chat bubble ----
function addMessage(sender, text) {
  const chatWindow = document.getElementById("chatWindow");
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble " + sender;
  bubble.textContent = text;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}