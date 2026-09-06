import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  applyActionCode,
  updateProfile,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

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
if (document.getElementById("loginForm")) {
  const loginTabBtn = document.getElementById("loginTabBtn");
  const signupTabBtn = document.getElementById("signupTabBtn");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const forgotForm = document.getElementById("forgotForm");
  const resetForm = document.getElementById("resetForm");
  const authTitle = document.getElementById("authTitle");
  const authCaption = document.getElementById("authCaption");
  const statusEl = document.getElementById("authStatus");
  const goToSignup = document.getElementById("goToSignup");
  const goToLogin = document.getElementById("goToLogin");
  const goToForgot = document.getElementById("goToForgot");
  const backToLoginFromForgot = document.getElementById("backToLoginFromForgot");

  let pendingUnverifiedUser = null;
  let resetOobCode = null; // set only when we're handling an incoming reset link

  // Only redirect into the app once the email is verified.
  onAuthStateChanged(auth, (user) => {
    if (user && user.emailVerified && !resetOobCode) {
      window.location.href = "index.html";
    }
  });

  function switchTab(mode) {
    // mode: "login" | "signup" | "forgot" | "reset"
    loginTabBtn.classList.toggle("active", mode === "login" || mode === "forgot" || mode === "reset");
    signupTabBtn.classList.toggle("active", mode === "signup");

    loginForm.style.display = mode === "login" ? "block" : "none";
    signupForm.style.display = mode === "signup" ? "block" : "none";
    forgotForm.style.display = mode === "forgot" ? "block" : "none";
    resetForm.style.display = mode === "reset" ? "block" : "none";

    if (mode === "login") {
      authTitle.textContent = "Welcome back";
      authCaption.textContent = "Log in with your email and password.";
    } else if (mode === "signup") {
      authTitle.textContent = "Create your account";
      authCaption.textContent = "We'll email you a verification link — verify, then log in below.";
    } else if (mode === "forgot") {
      authTitle.textContent = "Reset your password";
      authCaption.textContent = "Enter your email and we'll send you a reset link.";
    } else if (mode === "reset") {
      authTitle.textContent = "Choose a new password";
      authCaption.textContent = "You're almost done — set a new password to finish.";
    }
    hideStatus();
  }

  loginTabBtn.addEventListener("click", () => switchTab("login"));
  signupTabBtn.addEventListener("click", () => switchTab("signup"));
  goToSignup.addEventListener("click", () => switchTab("signup"));
  goToLogin.addEventListener("click", () => switchTab("login"));
  goToForgot.addEventListener("click", () => switchTab("forgot"));
  backToLoginFromForgot.addEventListener("click", () => switchTab("login"));

  // ---- Sign up: create account, email a verification link, sign out ----
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupConfirm").value;

    if (password !== confirm) {
      showStatus("Passwords don't match.", "error");
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }

      const actionCodeSettings = {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true,
      };
      await sendEmailVerification(cred.user, actionCodeSettings);
      await signOut(auth);

      showStatus(
        `✅ Verification link sent to ${email}. Open your inbox, click the link, then log in below.`,
        "success"
      );
      switchTab("login");
      document.getElementById("loginEmail").value = email;
    } catch (err) {
      console.error("Sign-up error:", err);
      showStatus(friendlyError(err.code), "error");
    }
  });

  // ---- Log in: email + password, blocked until verified ----
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      if (!cred.user.emailVerified) {
        pendingUnverifiedUser = cred.user;
        await signOut(auth);
        showStatusWithResend(
          `Please verify your email before logging in. Check your inbox for the link we sent to ${email}.`
        );
        return;
      }

      window.location.href = "index.html";
    } catch (err) {
      console.error("Login error:", err);
      showStatus(friendlyError(err.code), "error");
    }
  });

  // ---- Forgot password: send reset link ----
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("forgotEmail").value.trim();

    try {
      const actionCodeSettings = {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      showStatus(`✅ Reset link sent to ${email}. Check your inbox.`, "success");
    } catch (err) {
      console.error("Password reset request error:", err);
      showStatus(friendlyError(err.code), "error");
    }
  });

  // ---- Set new password: confirm the reset ----
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById("resetPassword").value;
    const confirm = document.getElementById("resetConfirm").value;

    if (newPassword !== confirm) {
      showStatus("Passwords don't match.", "error");
      return;
    }
    if (!resetOobCode) {
      showStatus("This reset link is no longer valid. Please request a new one.", "error");
      return;
    }

    try {
      await confirmPasswordReset(auth, resetOobCode, newPassword);
      resetOobCode = null;
      showStatus("✅ Password updated! You can now log in with your new password.", "success");
      switchTab("login");
    } catch (err) {
      console.error("Password reset confirm error:", err);
      showStatus(friendlyError(err.code), "error");
    }
  });

  // ---- Handle arriving back from an emailed link (verification OR password reset) ----
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");

  if (mode === "verifyEmail" && oobCode) {
    applyActionCode(auth, oobCode)
      .then(() => {
        showStatus("✅ Email verified! You can now log in below.", "success");
        switchTab("login");
      })
      .catch((err) => {
        console.error("Verification error:", err);
        showStatus(
          "This verification link is invalid or has expired. Please sign up again or request a new link.",
          "error"
        );
      })
      .finally(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      });
  } else if (mode === "resetPassword" && oobCode) {
    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        resetOobCode = oobCode;
        switchTab("reset");
      })
      .catch((err) => {
        console.error("Reset code verification error:", err);
        showStatus(
          "This reset link is invalid or has expired. Please request a new one.",
          "error"
        );
        switchTab("forgot");
      })
      .finally(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
      });
  }

  function friendlyError(code) {
    if (code === "auth/email-already-in-use")
      return "An account with this email already exists — try logging in instead.";
    if (code === "auth/invalid-credential" || code === "auth/wrong-password")
      return "Incorrect email or password.";
    if (code === "auth/user-not-found")
      return "No account found with this email.";
    if (code === "auth/weak-password")
      return "Password should be at least 6 characters.";
    if (code === "auth/invalid-email")
      return "Please enter a valid email address.";
    if (code === "auth/unauthorized-continue-uri")
      return "This domain isn't authorized yet in Firebase — check Authentication → Settings → Authorized domains.";
    if (code === "auth/invalid-action-code" || code === "auth/expired-action-code")
      return "This link is invalid or has already been used. Request a new one.";
    if (code === "auth/operation-not-allowed")
      return "This sign-in method is disabled in Firebase. Enable Email/Password in Firebase Console → Authentication → Sign-in method.";
    if (code === "auth/network-request-failed")
      return "Could not reach Firebase. Check your internet connection, then try again.";
    if (code === "auth/too-many-requests")
      return "Too many attempts from this device. Wait a few minutes, then try again.";
    if (code === "auth/invalid-api-key")
      return "The Firebase API key is invalid. Check js/firebase-config.js.";
    if (code === "auth/unauthorized-domain")
      return "This address is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.";
    return `Error: ${code || "unknown error"}. Open the browser console for details.`;
  }

  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = "auth-status show " + type;
  }

  function showStatusWithResend(msg) {
    statusEl.innerHTML = `${msg} <button type="button" class="link-btn" id="resendBtn">Resend link</button>`;
    statusEl.className = "auth-status show error";
    document.getElementById("resendBtn").addEventListener("click", async () => {
      if (!pendingUnverifiedUser) return;
      try {
        const actionCodeSettings = {
          url: window.location.origin + window.location.pathname,
          handleCodeInApp: true,
        };
        await sendEmailVerification(pendingUnverifiedUser, actionCodeSettings);
        showStatus("✅ Verification link resent — check your inbox.", "success");
      } catch (err) {
        console.error("Resend error:", err);
        showStatus(friendlyError(err.code), "error");
      }
    });
  }

  function hideStatus() {
    statusEl.className = "auth-status";
  }
}