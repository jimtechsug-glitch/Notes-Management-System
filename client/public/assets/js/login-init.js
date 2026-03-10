// ============================================
// LOGIN PAGE INITIALIZATION
// Handles login page specific initialization
// ============================================

// Prevent browser extension errors from breaking the page
window.addEventListener("error", function (e) {
  // Ignore extension-related errors
  if (e.message && e.message.includes("Receiving end does not exist")) {
    e.preventDefault();
    console.warn("Browser extension error (safe to ignore):", e.message);
    return false;
  }
});

// Update login page title based on role (student vs admin)
document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  const role = params.get("role");
  const titleEl = document.getElementById("loginTitle");
  const subtitleEl = document.getElementById("loginSubtitle");
  if (role === "admin" && titleEl && subtitleEl) {
    titleEl.textContent = "Nsoma DigLibs - Admin";
    subtitleEl.textContent = "Access your admin account";
    const registerLink = document.getElementById("registerLink");
    if (registerLink) registerLink.style.display = "none";
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");
    if (forgotPasswordLink && forgotPasswordLink.parentElement) {
      forgotPasswordLink.parentElement.style.display = "none";
    }
  } else if (role === "student" && titleEl && subtitleEl) {
    titleEl.textContent = "Nsoma DigLibs - Student";
    subtitleEl.textContent = "Access your student account";
  }

  const form = document.getElementById("loginForm");
  if (form) {
    // Remove inline onsubmit handler and use addEventListener instead
    form.onsubmit = null;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      e.stopPropagation();
      // Ensure our handler runs
      if (typeof handleLogin === "function") {
        handleLogin(e);
      } else {
        console.error("handleLogin function not found");
      }
    });
  }

  // --- Server Settings for Mobile/LAN ---
  const settingsToggle = document.getElementById("settingsToggle");
  const serverSettings = document.getElementById("serverSettings");
  const saveIpBtn = document.getElementById("saveIpBtn");
  const testConnBtn = document.getElementById("testConnBtn");
  const serverIpInput = document.getElementById("serverIp");
  const currentApiBaseEl = document.getElementById("currentApiBase");

  if (settingsToggle && serverSettings) {
    settingsToggle.addEventListener("click", () => {
      serverSettings.classList.toggle("show");
    });
  }

  if (currentApiBaseEl) {
    currentApiBaseEl.textContent = window.API_BASE || "/api";
  }

  if (saveIpBtn && serverIpInput) {
    // Pre-fill with existing IP if any
    const savedIp = localStorage.getItem("serverIp");
    if (savedIp) serverIpInput.value = savedIp;

    saveIpBtn.addEventListener("click", () => {
      const newIp = serverIpInput.value.trim();
      if (!newIp) {
        localStorage.removeItem("serverIp");
        alert("Reset to default (localhost)");
      } else {
        // Simple validation
        if (!newIp.includes(".")) {
          alert("Please enter a valid IP address or hostname");
          return;
        }
        localStorage.setItem("serverIp", newIp);
        alert("Settings saved! Reloading...");
      }
      window.location.reload();
    });
  }

  if (testConnBtn && serverIpInput) {
    testConnBtn.addEventListener("click", async () => {
      const ip = serverIpInput.value.trim() || window.location.host;
      const testUrl = `http://${ip}/api/test`;

      testConnBtn.disabled = true;
      testConnBtn.textContent = "Testing...";

      try {
        const res = await fetch(testUrl).catch(() => ({ ok: false }));
        if (res.ok) {
          alert("✅ Success! Connection established.");
        } else {
          alert(
            "❌ Failed. Ensure the server is running and you are on the same network.",
          );
        }
      } catch (err) {
        alert("❌ Error: " + err.message);
      } finally {
        testConnBtn.disabled = false;
        testConnBtn.textContent = "Test";
      }
    });
  }

  // --- Forgot Password Modal ---
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");
  const forgotPasswordModal = document.getElementById("forgotPasswordModal");
  const closeModal = document.getElementById("closeModal");
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");

  if (forgotPasswordLink && forgotPasswordModal) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      forgotPasswordModal.style.display = "block";
    });
  }

  if (closeModal && forgotPasswordModal) {
    closeModal.addEventListener("click", () => {
      forgotPasswordModal.style.display = "none";
    });
  }

  if (forgotPasswordModal) {
    window.addEventListener("click", (e) => {
      if (e.target === forgotPasswordModal) {
        forgotPasswordModal.style.display = "none";
      }
    });
  }

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", handleResetRequest);
  }
});
