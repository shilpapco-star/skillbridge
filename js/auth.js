import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const EMAIL_STORAGE_KEY = "skillbridge_pending_email";

// ---- Guard: call on every protected page ----
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

// ---- Everything below only runs on login.html ----
if (document.getElementById("linkForm")) {
  const linkTab = document.getElementById("linkTab");
  const passwordTab = document.getElementById("passwordTab");
  const linkForm = document.getElementById("linkForm");
  const authForm = document.getElementById("authForm");
  const authTitle = document.getElementById("authTitle");
  const authCaption = document.getElementById("authCaption");
  const statusEl = document.getElementById("authStatus");
  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");
  const authSubmitBtn = document.getElementById("authSubmitBtn");

  let passwordMode = "login";

  // Already logged in? Skip straight to the app.
  onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = "index.html";
  });

  // ---- Tab switching: Email Link vs Password ----
  linkTab.addEventListener("click", () => {
    linkTab.classList.add("active");
    passwordTab.classList.remove("active");
    linkForm.style.display = "block";
    authForm.style.display = "none";
    authTitle.textContent = "Welcome to SkillBridge";
    authCaption.textContent = "Sign in with a secure emailed link — no password needed.";
    hideStatus();
  });

  passwordTab.addEventListener("click", () => {
    passwordTab.classList.add("active");
    linkTab.classList.remove("active");
    linkForm.style.display = "none";
    authForm.style.display = "block";
    authTitle.textContent = "Welcome back";
    authCaption.textContent = "Log in or create an account with a password.";
    hideStatus();
  });

  // ---- Email Link flow: send the link ----
  linkForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("linkEmail").value.trim();

    const actionCodeSettings = {
      // Must point back to this exact login page for the return trip to work
      url: window.location.href.split("?")[0],
      handleCodeInApp: true,
    };

    sendSignInLinkToEmail(auth, email, actionCodeSettings)
      .then(() => {
        localStorage.setItem(EMAIL_STORAGE_KEY, email);
        showStatus(
          `✅ Sign-in link sent to ${email}. Open your inbox and click it to continue.`,
          "success"
        );
      })
      .catch((err) => {
        console.error("Email-link sign-in error:", err);
        showStatus(friendlyError(err.code), "error");
      });
  });

  // ---- Password flow: login/signup toggle ----
  loginTab.addEventListener("click", () => setPasswordMode("login"));
  signupTab.addEventListener("click", () => setPasswordMode("signup"));

  function setPasswordMode(mode) {
    passwordMode = mode;
    authSubmitBtn.textContent = mode === "login" ? "Log in" : "Create account";
    hideStatus();
  }

  authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    const action =
      passwordMode === "signup"
        ? createUserWithEmailAndPassword(auth, email, password)
        : signInWithEmailAndPassword(auth, email, password);

    action
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((err) => {
        console.error("Password sign-in error:", err);
        showStatus(friendlyError(err.code), "error");
      });
  });

  // ---- Handle arriving back from the emailed sign-in link ----
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = localStorage.getItem(EMAIL_STORAGE_KEY);

    if (!email) {
      // Happens if the link was opened on a different device/browser
      email = window.prompt("Please confirm your email to complete sign-in:");
    }

    showStatus("Signing you in...", "info");

    signInWithEmailLink(auth, email, window.location.href)
      .then(() => {
        localStorage.removeItem(EMAIL_STORAGE_KEY);
        window.location.href = "index.html";
      })
      .catch((err) => {
        showStatus(friendlyError(err.code), "error");
      });
  }

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
    if (code === "auth/unauthorized-continue-uri")
      return "This domain isn't authorized yet in Firebase — check Authentication → Settings → Authorized domains.";
    if (code === "auth/invalid-action-code")
      return "This sign-in link is invalid or has already been used. Request a new one.";
    if (code === "auth/operation-not-allowed")
      return "This sign-in method is disabled in Firebase. Enable Email/Password in Firebase Console → Authentication → Sign-in method.";
    if (code === "auth/network-request-failed")
      return "Could not reach Firebase. Check your internet connection, then try again.";
    if (code === "auth/too-many-requests")
      return "Too many attempts from this device. Wait a few minutes, then try again.";
    if (code === "auth/invalid-api-key")
      return "The Firebase API key is invalid. Check js/firebase-config.js.";
    if (code === "auth/unauthorized-domain")
      return "This Live Server address is not authorized. Add localhost or 127.0.0.1 in Firebase Console → Authentication → Settings → Authorized domains.";
    return `Sign-in error: ${code || "unknown error"}. Open the browser console for details.`;
  }

  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = "auth-status show " + type;
  }

  function hideStatus() {
    statusEl.className = "auth-status";
  }
}
