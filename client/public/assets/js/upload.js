// ============================================
// ADMIN NOTE UPLOAD PAGE
// Reuses the same API as admin dashboard, but in a dedicated form page
// ============================================

const UPLOAD_API_BASE = "/api";

document.addEventListener("DOMContentLoaded", async () => {
  // Ensure only admins can access this page
  if (typeof getCurrentUser === "function") {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      logout();
      return;
    }
    const adminNameEl = document.getElementById("adminName");
    if (adminNameEl) adminNameEl.textContent = user.name;
  }

  const levelSelect = document.getElementById("level");
  const classSelect = document.getElementById("class");
  const uploadForm = document.getElementById("uploadForm");
  const backBtn = document.getElementById("backBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn && typeof logout === "function") {
    logoutBtn.addEventListener("click", () => logout());
  }

  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "/pages/admin-dashboard.html";
    });
  }

  if (levelSelect && classSelect) {
    levelSelect.addEventListener("change", () => {
      const level = levelSelect.value;
      classSelect.innerHTML = '<option value="">Select class</option>';
      if (level === "o-level") {
        classSelect.innerHTML += `
          <option value="s1">S1</option>
          <option value="s2">S2</option>
          <option value="s3">S3</option>
          <option value="s4">S4</option>
        `;
      } else if (level === "a-level") {
        classSelect.innerHTML += `
          <option value="s5">S5</option>
          <option value="s6">S6</option>
        `;
      }
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener("submit", handleUploadSubmit);
  }
});

async function handleUploadSubmit(e) {
  e.preventDefault();

  const messageEl = document.getElementById("uploadMessage");
  if (messageEl) messageEl.innerHTML = "";

  const form = e.target;
  const formData = new FormData(form);

  if (!formData.get("file")) {
    if (messageEl) {
      messageEl.innerHTML =
        '<div class="error-message">Please select a file to upload.</div>';
    }
    return;
  }

  try {
    const res = await fetch(`${UPLOAD_API_BASE}/notes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "Failed to upload note");
    }

    if (messageEl) {
      messageEl.innerHTML =
        '<div class="success-message">Note uploaded successfully.</div>';
    }
    form.reset();
  } catch (err) {
    console.error("Upload failed", err);
    if (messageEl) {
      messageEl.innerHTML = `<div class="error-message">${
        err.message || "Failed to upload note"
      }</div>`;
    }
  }
}
