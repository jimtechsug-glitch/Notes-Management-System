// ============================================
// MAIN / HOME PAGE LOGIC
// - Checks server status (handled by status.js)
// - Optionally redirects already logged-in users to their dashboards
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
  // If auth utilities are available, we can redirect logged-in users
  if (typeof getCurrentUser === "function") {
    try {
      const user = await getCurrentUser();
      if (user && user.role === "admin") {
        window.location.href = "/pages/admin-dashboard.html";
        return;
      }
      if (user && user.role === "student") {
        window.location.href = "/pages/student-dashboard.html";
        return;
      }
    } catch (e) {
      // Ignore and stay on home page
      console.warn("Auto-redirect check failed:", e);
    }
  }
});
