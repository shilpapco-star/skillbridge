import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

// ---- Guard: call on every protected page ----
// Redirects to login.html if nobody is signed in.
export function requireAuth() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "login.html";
    }
  });
}

// ---- Logout, exposed globally so navbar's onclick="logout()" can reach it ----
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
};

// ---- Login page specific logic (only runs if the login form is on this page) ----
if (document.getElementById("authForm")) {
  let mode = "login";

  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");
  const submitBtn = document.getElementById("authSubmitBtn");
  const errorEl = document.getElementById("authError");
  const form = document.getElementById("authForm");

  // Already logged in? Skip straight to the app.
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = "index.html";
  });

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
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    const action =
      mode === "signup"
        ? createUserWithEmailAndPassword(auth, email, password)
        : signInWithEmailAndPassword(auth, email, password);

    action
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((err) => showError(friendlyError(err.code)));
  });

  function friendlyError(code) {
    if (code === "auth/email-already-in-use")
      return "An account with this email already exists — try logging in instead.";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password")
      return "Incorrect email or password.";
    if (code === "auth/user-not-found")
      return "No account found with this email — try signing up instead.";
    if (code === "auth/weak-password")
      return "Password should be at least 6 characters.";
    if (code === "auth/invalid-email")
      return "Please enter a valid email address.";
    return "Something went wrong. Please try again.";
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add("show");
  }
}