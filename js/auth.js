// SkillBridge Auth (localStorage-based demo auth — not cryptographically secure,
// good enough for a portfolio flow; a real backend would hash+verify server-side)

const ACCOUNTS_KEY = "skillbridge_accounts"; // { email: obscuredPassword }
const SESSION_KEY = "skillbridge_session";   // currently logged-in email

// Very light obfuscation so passwords aren't sitting in plain text.
// NOT real security — a real app hashes+salts on a server.
function obscure(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function getAccounts() {
  return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}");
}

function getSession() {
  return localStorage.getItem(SESSION_KEY);
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

// ---- Guard: call this at the top of every protected page ----
function requireAuth() {
  if (!getSession()) {
    window.location.href = "login.html";
  }
}

// ---- Only runs the form-handling logic if we're actually on login.html ----
if (document.getElementById("authForm")) {
  let mode = "login"; // or "signup"

  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");
  const submitBtn = document.getElementById("authSubmitBtn");
  const errorEl = document.getElementById("authError");
  const form = document.getElementById("authForm");

  // If already logged in, skip straight to the app
  if (getSession()) {
    window.location.href = "index.html";
  }

  loginTab.addEventListener("click", () => setMode("login"));
  signupTab.addEventListener("click", () => setMode("signup"));

  function setMode(newMode) {
    mode = newMode;
    loginTab.classList.toggle("active", mode === "login");
    signupTab.classList.toggle("active", mode === "signup");
    submitBtn.textContent = mode === "login" ? "Log in" : "Create account";
    errorEl.classList.remove("show");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("authEmail").value.trim().toLowerCase();
    const password = document.getElementById("authPassword").value;
    const accounts = getAccounts();

    if (mode === "signup") {
      if (accounts[email]) {
        showError("An account with this email already exists — try logging in instead.");
        return;
      }
      accounts[email] = obscure(password);
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      localStorage.setItem(SESSION_KEY, email);
      window.location.href = "index.html";
    } else {
      if (!accounts[email]) {
        showError("No account found with this email — try signing up instead.");
        return;
      }
      if (accounts[email] !== obscure(password)) {
        showError("Incorrect password. Try again.");
        return;
      }
      localStorage.setItem(SESSION_KEY, email);
      window.location.href = "index.html";
    }
  });

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add("show");
  }
}