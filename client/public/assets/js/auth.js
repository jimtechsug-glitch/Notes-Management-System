// ============================================
// AUTHENTICATION JAVASCRIPT
// Handles login, registration, and auth state
// ============================================

const API_BASE = "/api";

// Token management functions
function setToken(token) {
  localStorage.setItem("token", token);
}

function getToken() {
  return localStorage.getItem("token");
}

function removeToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();
  event.stopPropagation();

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("errorMessage");
  const submitButton = event.target.querySelector('button[type="submit"]');

  if (!emailInput || !passwordInput || !errorMessage) {
    console.error("Login form elements not found");
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Clear previous errors
  errorMessage.classList.remove("show");
  errorMessage.textContent = "";

  // Validate inputs
  if (!email || !password) {
    errorMessage.textContent = "Please enter both email and password";
    errorMessage.classList.add("show");
    return;
  }

  // Disable submit button
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Logging in...";
  }

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error("Invalid response from server");
    }

    if (!response.ok) {
      throw new Error(data.message || `Login failed: ${response.statusText}`);
    }

    // Validate response structure
    if (!data.data || !data.data.token || !data.data.user) {
      throw new Error("Invalid response format from server");
    }

    // Store token
    setToken(data.data.token);
    // Persist user info (used by some admin/student scripts)
    if (data.data.user) {
      localStorage.setItem("user", JSON.stringify(data.data.user));
    }

    // Redirect based on role and verify role matches
    const userRole = data.data.user.role;
    const currentPath = window.location.pathname;

    // Security: Verify user is accessing the correct dashboard
    if (userRole === "admin") {
      if (currentPath.includes("student-dashboard")) {
        alert("Access denied. Admin accounts cannot access student dashboard.");
        removeToken();
        window.location.href = "/pages/login.html";
        return;
      }
      window.location.href = "/pages/admin-dashboard.html";
    } else if (userRole === "student") {
      if (currentPath.includes("admin-dashboard")) {
        alert("Access denied. Student accounts cannot access admin dashboard.");
        removeToken();
        window.location.href = "/pages/login.html";
        return;
      }
      window.location.href = "/pages/student-dashboard.html";
    } else {
      // Unknown role
      removeToken();
      alert("Invalid user role. Please contact support.");
      window.location.href = "/pages/login.html";
    }
  } catch (error) {
    console.error("Login error:", error);

    // Re-enable submit button
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Login";
    }

    // Show user-friendly error message
    let errorMsg = "Login failed. Please try again.";
    if (error.message) {
      errorMsg = error.message;
    } else if (error.name === "TypeError" && error.message.includes("fetch")) {
      errorMsg =
        "Network error. Please check your connection and ensure the server is running.";
    }

    errorMessage.textContent = errorMsg;
    errorMessage.classList.add("show");
  }
}

// Handle registration form submission
async function handleRegister(event) {
  event.preventDefault();

  const formData = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
    role: document.getElementById("role")?.value || "student",
    class: document.getElementById("class")?.value,
    level: document.getElementById("level")?.value,
    stream: document.getElementById("stream")?.value,
    combination: document.getElementById("combination")?.value,
  };

  const errorMessage = document.getElementById("errorMessage");
  errorMessage.classList.remove("show");
  errorMessage.textContent = "";

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    // Show success message
    alert(
      "Registration successful! Your account is pending admin approval. You will be able to login once approved.",
    );

    // Redirect to login
    window.location.href = "/pages/login.html";
  } catch (error) {
    console.error("Registration error:", error);
    errorMessage.textContent =
      error.message || "Registration failed. Please try again.";
    errorMessage.classList.add("show");
  }
}

// Check if user is logged in and redirect if needed
function checkAuthAndRedirect() {
  const token = getToken();
  if (!token) {
    return false;
  }

  // Verify token is still valid
  fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((response) => {
      if (!response.ok) {
        removeToken();
        return false;
      }
      return response.json();
    })
    .then((data) => {
      if (data && data.data) {
        const role = data.data.role;
        const currentPath = window.location.pathname;

        // Redirect if on wrong dashboard
        if (role === "admin" && !currentPath.includes("admin-dashboard")) {
          window.location.href = "/pages/admin-dashboard.html";
        } else if (
          role === "student" &&
          !currentPath.includes("student-dashboard")
        ) {
          window.location.href = "/pages/student-dashboard.html";
        }
      }
    })
    .catch((error) => {
      console.error("Auth check failed:", error);
      removeToken();
    });

  return true;
}

// Logout function
function logout() {
  removeToken();
  window.location.href = "/pages/login.html";
}

// Get current user info
async function getCurrentUser() {
  const token = getToken();
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      removeToken();
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Failed to get user:", error);
    removeToken();
    return null;
  }
}
