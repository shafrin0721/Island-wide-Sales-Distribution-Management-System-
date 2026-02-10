// js/auth.js
console.log("🔐 auth.js loaded");

(async function () {
  // Wait for Firebase to be ready
  const waitForFirebase = async () => {
    while (!window._FB_READY || !firebase || !firebase.auth) {
      await new Promise((r) => setTimeout(r, 100));
    }
  };

  await waitForFirebase();

  // DOM elements
  const loginForm = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const logoutBtn = document.getElementById("logout-btn");
  const currentUserSpan = document.getElementById("current-user");
  const pages = document.querySelectorAll(".page");
  const navbar = document.getElementById("navbar");

  // Demo users
  const demoUsers = {
    customer: { email: "customer@test.com", password: "123456" },
    rdc: { email: "rdc@test.com", password: "123456" },
    delivery: { email: "delivery@test.com", password: "123456" },
    admin: { email: "admin@test.com", password: "123456" },
  };

  // Utility functions
  const showPage = (pageId) => {
    pages.forEach((p) => p.classList.remove("active"));
    const page = document.getElementById(pageId);
    if (page) page.classList.add("active");
  };

  const showNavbar = (show) => {
    navbar.classList.toggle("display-none", !show);
  };

  const loadUserRole = async (uid) => {
    try {
      const snap = await firebase.database().ref(`users/${uid}`).once("value");
      if (!snap.exists()) {
        console.warn("⚠️ User profile missing, defaulting to customer");
        return "customer";
      }
      return snap.val().role || "customer";
    } catch (err) {
      console.error("❌ Error loading user role", err);
      return "customer";
    }
  };

  const redirectByRole = (role) => {
    showNavbar(true);

    document.querySelectorAll(".nav-link").forEach((b) => b.classList.add("display-none"));

    switch (role) {
      case "admin":
        document.getElementById("nav-admin")?.classList.remove("display-none");
        showPage("admin-page");
        break;
      case "rdc":
        document.getElementById("nav-rdc")?.classList.remove("display-none");
        showPage("rdc-page");
        break;
      case "delivery":
        document.getElementById("nav-delivery")?.classList.remove("display-none");
        showPage("delivery-page");
        break;
      default:
        document.getElementById("nav-products")?.classList.remove("display-none");
        document.getElementById("nav-orders")?.classList.remove("display-none");
        document.getElementById("nav-cart")?.classList.remove("display-none");
        showPage("products-page");
    }
  };

  const handleLogin = async (email, password) => {
    try {
      // Disable login button to prevent multiple clicks
      const submitBtn = loginForm.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = true;

      const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = cred.user;

      currentUserSpan.textContent = user.email;
      const role = await loadUserRole(user.uid);
      redirectByRole(role);
    } catch (err) {
      console.error("❌ Login failed:", err.code, err.message);

      alert(
        err.code === "auth/wrong-password"
          ? "Invalid password"
          : err.code === "auth/user-not-found"
          ? "User not found"
          : "Login failed"
      );
    } finally {
      const submitBtn = loginForm.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = false;
    }
  };

  // Firebase auth state listener
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      showNavbar(false);
      showPage("login-page");
      return;
    }

    currentUserSpan.textContent = user.email;
    const role = await loadUserRole(user.uid);
    redirectByRole(role);
  });

  // Form submission
  loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    handleLogin(emailInput.value.trim(), passwordInput.value);
  });

  // Demo login buttons
  Object.keys(demoUsers).forEach((key) => {
    const btn = document.getElementById(`demo-login-${key}`);
    btn?.addEventListener("click", () =>
      handleLogin(demoUsers[key].email, demoUsers[key].password)
    );
  });

  // Logout
  logoutBtn?.addEventListener("click", async () => {
    await firebase.auth().signOut();
    showNavbar(false);
    showPage("login-page");
  });
})();
