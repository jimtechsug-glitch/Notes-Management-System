// ============================================
// ADMIN DASHBOARD JAVASCRIPT
// Handles all admin operations - JS-driven UI
// ============================================

// API_BASE is globally defined in utils.js
let currentAdmin = null;
let allStudents = [];
let allSubjects = [];
let allNotes = [];
let allQuizzes = [];
let allResources = [];
let allStreams = [];
let currentTab = "dashboard";

// Token management functions
function removeToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// Initialize admin dashboard
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
});

// Check authentication
async function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/pages/login.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/pages/login.html";
      return;
    }

    if (!response.ok) {
      throw new Error(`Auth failed with status: ${response.status}`);
    }

    const data = await response.json();

    // Strict role check: Only admins can access admin dashboard
    if (data.data.role !== "admin") {
      window.location.href = "/pages/student-dashboard.html";
      return;
    }

    currentAdmin = data.data;
    renderApp();
  } catch (error) {
    console.error("Auth check failed:", error);
    // Don't remove token on network errors
    // Optionally show a non-intrusive error message
  }
}

// Render entire app (JS-driven)
function renderApp() {
  const app = document.getElementById("app");
  app.innerHTML = `
        <!-- Navigation -->
        <nav class="admin-nav">
            <div class="nav-container">
                <h1 class="nav-logo">📚 Admin Dashboard</h1>
                <div class="nav-user">
                    <button class="btn-refresh" id="refreshBtn">🔄 Sync Data</button>
                    <span id="adminName">${currentAdmin.name}</span>
                    <button class="btn-logout" id="logoutBtn">Logout</button>
                </div>
            </div>
        </nav>

        <!-- Main Container -->
        <div class="admin-container">
            <!-- Sidebar -->
            <aside class="admin-sidebar">
                <ul class="sidebar-menu">
                    <li><a href="#" class="sidebar-link active" data-tab="dashboard">📊 Dashboard</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="students">👥 Students</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="subjects">📖 Subjects</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="notes">📝 Notes</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="quizzes">❓ Quizzes</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="resources">🔗 Resources</a></li>
                    <li><a href="#" class="sidebar-link" data-tab="streams">📁 Streams</a></li>
                </ul>
            </aside>

            <!-- Main Content -->
            <main class="admin-main" id="mainContent">
                <!-- Content will be rendered by JS -->
            </main>
        </div>
    `;

  setupEventListeners();
  switchTab("dashboard");
}

// Setup all event listeners
function setupEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  // Refresh button
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", refreshCurrentTab);
  }

  // Tab navigation
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tabName = link.getAttribute("data-tab");
      switchTab(tabName);
    });
  });

  // Global event delegation for dynamically generated buttons
  document.addEventListener("click", (e) => {
    // Student actions
    if (e.target.classList.contains("view-student-btn")) {
      viewStudent(e.target.getAttribute("data-student-id"));
    } else if (e.target.classList.contains("confirm-student-btn")) {
      confirmStudent(e.target.getAttribute("data-student-id"));
    } else if (e.target.classList.contains("deactivate-student-btn")) {
      deactivateStudent(e.target.getAttribute("data-student-id"));
    } else if (e.target.classList.contains("activate-student-btn")) {
      activateStudent(e.target.getAttribute("data-student-id"));
    } else if (e.target.classList.contains("delete-student-btn")) {
      deleteStudent(e.target.getAttribute("data-student-id"));
    }
    // Subject actions
    else if (e.target.classList.contains("edit-subject-btn")) {
      editSubject(e.target.getAttribute("data-subject-id"));
    } else if (e.target.classList.contains("delete-subject-btn")) {
      deleteSubject(e.target.getAttribute("data-subject-id"));
    }
    // Note actions
    else if (e.target.classList.contains("edit-note-btn")) {
      editNote(e.target.getAttribute("data-note-id"));
    } else if (e.target.classList.contains("delete-note-btn")) {
      deleteNote(e.target.getAttribute("data-note-id"));
    }
    // Quiz actions
    else if (e.target.classList.contains("edit-quiz-btn")) {
      editQuiz(e.target.getAttribute("data-quiz-id"));
    } else if (e.target.classList.contains("delete-quiz-btn")) {
      deleteQuiz(e.target.getAttribute("data-quiz-id"));
    }
    // Resource actions
    else if (e.target.classList.contains("edit-resource-btn")) {
      editResource(e.target.getAttribute("data-resource-id"));
    } else if (e.target.classList.contains("delete-resource-btn")) {
      deleteResource(e.target.getAttribute("data-resource-id"));
    }
    // Stream actions
    else if (e.target.classList.contains("edit-stream-btn")) {
      editStream(e.target.getAttribute("data-stream-id"));
    } else if (e.target.classList.contains("delete-stream-btn")) {
      deleteStream(e.target.getAttribute("data-stream-id"));
    }
  });
}

// Switch tabs
function switchTab(tabName) {
  try {
    currentTab = tabName;
    console.log("Switching to tab:", tabName);

    // Update active tab
    document.querySelectorAll(".sidebar-link").forEach((link) => {
      link.classList.remove("active");
    });
    const activeLink = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeLink) {
      activeLink.classList.add("active");
    } else {
      console.error("Active link not found for tab:", tabName);
    }

    // Render tab content
    const mainContent = document.getElementById("mainContent");
    if (!mainContent) {
      console.error("mainContent element not found");
      return;
    }

    let content = "";
    if (tabName === "dashboard") {
      content = renderDashboard();
      mainContent.innerHTML = content;
      loadDashboard();
    } else if (tabName === "students") {
      content = renderStudentsTab();
      mainContent.innerHTML = content;
      console.log("Students tab rendered, setting up listeners...");
      // Wait a bit for DOM to be ready
      setTimeout(() => {
        setupStudentsListeners();
        loadStudents();
      }, 10);
    } else if (tabName === "subjects") {
      content = renderSubjectsTab();
      mainContent.innerHTML = content;
      console.log("Subjects tab rendered, setting up listeners...");
      setTimeout(() => {
        setupSubjectsListeners();
        loadSubjects();
      }, 10);
    } else if (tabName === "notes") {
      content = renderNotesTab();
      mainContent.innerHTML = content;
      setTimeout(() => {
        setupNotesListeners();
        loadNotes();
      }, 10);
    } else if (tabName === "quizzes") {
      content = renderQuizzesTab();
      mainContent.innerHTML = content;
      setTimeout(() => {
        setupQuizzesListeners();
        loadQuizzes();
      }, 10);
    } else if (tabName === "resources") {
      content = renderResourcesTab();
      mainContent.innerHTML = content;
      setTimeout(() => {
        setupResourcesListeners();
        loadResources();
      }, 10);
    } else if (tabName === "streams") {
      content = renderStreamsTab();
      mainContent.innerHTML = content;
      setTimeout(() => {
        setupStreamsListeners();
        loadStreams();
      }, 10);
    } else {
      console.error("Unknown tab:", tabName);
      mainContent.innerHTML = `<div class="error-message">Unknown tab: ${tabName}</div>`;
    }

    console.log("Tab content rendered, length:", content.length);
  } catch (error) {
    console.error("Error switching tab:", error);
    console.error("Error stack:", error.stack);
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
      mainContent.innerHTML = `<div class="error-message" style="padding: 2rem; color: red;">Error loading ${tabName}: ${error.message}<br><pre>${error.stack}</pre></div>`;
    }
  }
}

// ============================================
// DASHBOARD
// ============================================

function renderDashboard() {
  return `
        <div id="dashboard" class="tab-content">
            <h2>Dashboard Overview</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Students</h3>
                    <p class="stat-number" id="totalStudents">0</p>
                </div>
                <div class="stat-card">
                    <h3>Pending Approvals</h3>
                    <p class="stat-number" id="pendingStudents">0</p>
                </div>
                <div class="stat-card">
                    <h3>Total Subjects</h3>
                    <p class="stat-number" id="totalSubjects">0</p>
                </div>
                <div class="stat-card">
                    <h3>Total Notes</h3>
                    <p class="stat-number" id="totalNotes">0</p>
                </div>
                <div class="stat-card">
                    <h3>Total Quizzes</h3>
                    <p class="stat-number" id="totalQuizzes">0</p>
                </div>
                <div class="stat-card">
                    <h3>Total Resources</h3>
                    <p class="stat-number" id="totalResources">0</p>
                </div>
                <div class="stat-card">
                    <h3>Class Streams</h3>
                    <p class="stat-number" id="totalStreams">0</p>
                </div>
            </div>
        </div>
    `;
}

async function loadDashboard() {
  try {
    const [
      studentsRes,
      subjectsRes,
      notesRes,
      quizzesRes,
      resourcesRes,
      streamsRes,
    ] = await Promise.all([
      fetch(`${API_BASE}/users`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/subjects`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/notes`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/quizzes`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/resources`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/streams`, { headers: getAuthHeaders() }),
    ]);

    const studentsData = await studentsRes.json();
    const subjectsData = await subjectsRes.json();
    const notesData = await notesRes.json();
    const quizzesData = await quizzesRes.json();
    const resourcesData = await resourcesRes.json();
    const streamsData = await streamsRes.json();

    allStudents = studentsData.data || [];
    allSubjects = subjectsData.data || [];
    allNotes = notesData.data || [];
    allQuizzes = quizzesData.data || [];
    allResources = resourcesData.data || [];
    allStreams = streamsData.data || [];

    const totalStudentsEl = document.getElementById("totalStudents");
    const pendingStudentsEl = document.getElementById("pendingStudents");
    const totalSubjectsEl = document.getElementById("totalSubjects");
    const totalNotesEl = document.getElementById("totalNotes");
    const totalQuizzesEl = document.getElementById("totalQuizzes");
    const totalResourcesEl = document.getElementById("totalResources");
    const totalStreamsEl = document.getElementById("totalStreams");

    // These elements exist only on the dashboard tab; guard against null when called from other tabs
    if (totalStudentsEl) {
      totalStudentsEl.textContent = allStudents.filter(
        (s) => s.role === "student",
      ).length;
    }

    if (pendingStudentsEl) {
      pendingStudentsEl.textContent = allStudents.filter(
        (s) => s.role === "student" && !s.isConfirmed,
      ).length;
    }

    if (totalSubjectsEl) {
      totalSubjectsEl.textContent = allSubjects.length;
    }

    if (totalNotesEl) {
      totalNotesEl.textContent = allNotes.length;
    }

    if (totalQuizzesEl) {
      totalQuizzesEl.textContent = allQuizzes.length;
    }

    if (totalResourcesEl) {
      totalResourcesEl.textContent = allResources.length;
    }

    if (totalStreamsEl) {
      totalStreamsEl.textContent = allStreams.length;
    }
  } catch (error) {
    console.error("Failed to load dashboard:", error);
    showError("Failed to load dashboard data");
  }
}

// ============================================
// STUDENTS MANAGEMENT
// ============================================

function renderStudentsTab() {
  return `
        <div id="students" class="tab-content">
            <div class="section-header">
                <h2>Student Management</h2>
                <div class="filters">
                    <select id="studentFilter">
                        <option value="all">All Students</option>
                        <option value="pending">Pending Approval</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Class</th>
                            <th>Level</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody">
                        <tr><td colspan="6" class="loading">Loading students...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function setupStudentsListeners() {
  const studentFilter = document.getElementById("studentFilter");
  if (studentFilter) {
    studentFilter.addEventListener("change", filterStudents);
  } else {
    console.error("studentFilter element not found");
  }

  // Event delegation for student actions (already set up globally, but ensure it works)
  // Note: Event delegation is handled at document level, so it should work
}

async function loadStudents() {
  try {
    const response = await fetch(`${API_BASE}/users`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to load students");

    const data = await response.json();
    allStudents = data.data || [];
    displayStudents(allStudents);
  } catch (error) {
    console.error("Failed to load students:", error);
    showError("Failed to load students");
  }
}

function filterStudents() {
  const filter = document.getElementById("studentFilter").value;
  let filtered = allStudents.filter((s) => s.role === "student");

  if (filter === "pending") {
    filtered = filtered.filter((s) => !s.isConfirmed);
  } else if (filter === "confirmed") {
    filtered = filtered.filter((s) => s.isConfirmed);
  } else if (filter === "inactive") {
    filtered = filtered.filter((s) => !s.isActive);
  }

  displayStudents(filtered);
}

function displayStudents(students) {
  const tbody = document.getElementById("studentsTableBody");

  if (students.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="no-data">No students found</td></tr>';
    return;
  }

  tbody.innerHTML = students
    .map(
      (student) => `
        <tr>
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td>${student.class || "-"}</td>
            <td>${student.level || "-"}</td>
            <td>
                <span class="badge ${student.isConfirmed ? "badge-success" : "badge-warning"}">
                    ${student.isConfirmed ? "Confirmed" : "Pending"}
                </span>
                ${!student.isActive ? '<span class="badge badge-danger">Inactive</span>' : ""}
            </td>
            <td>
                <button class="btn-sm btn-primary view-student-btn" data-student-id="${student.id}">View</button>
                ${!student.isConfirmed ? `<button class="btn-sm btn-success confirm-student-btn" data-student-id="${student.id}">Confirm</button>` : ""}
                ${student.isActive ? `<button class="btn-sm btn-danger deactivate-student-btn" data-student-id="${student.id}">Deactivate</button>` : `<button class="btn-sm btn-success activate-student-btn" data-student-id="${student.id}">Activate</button>`}
                <button class="btn-sm btn-danger delete-student-btn" data-student-id="${student.id}">Delete</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

async function confirmStudent(id) {
  if (!confirm("Confirm this student's account?")) return;

  try {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isConfirmed: true }),
    });

    if (!response.ok) throw new Error("Failed to confirm student");

    showSuccess("Student confirmed successfully");
    loadStudents();
    loadDashboard();
  } catch (error) {
    console.error("Failed to confirm student:", error);
    showError("Failed to confirm student");
  }
}

async function deactivateStudent(id) {
  if (!confirm("Deactivate this student's account?")) return;

  try {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isActive: false }),
    });

    if (!response.ok) throw new Error("Failed to deactivate student");

    showSuccess("Student deactivated successfully");
    loadStudents();
    loadDashboard();
  } catch (error) {
    console.error("Failed to deactivate student:", error);
    showError("Failed to deactivate student");
  }
}

async function activateStudent(id) {
  try {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isActive: true }),
    });

    if (!response.ok) throw new Error("Failed to activate student");

    showSuccess("Student activated successfully");
    loadStudents();
    loadDashboard();
  } catch (error) {
    console.error("Failed to activate student:", error);
    showError("Failed to activate student");
  }
}

async function deleteStudent(id) {
  if (
    !confirm(
      "Are you sure you want to delete this student? This action cannot be undone.",
    )
  )
    return;

  try {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to delete student");

    showSuccess("Student deleted successfully");
    loadStudents();
    loadDashboard();
  } catch (error) {
    console.error("Failed to delete student:", error);
    showError("Failed to delete student");
  }
}

async function viewStudent(id) {
  const student = allStudents.find((s) => s.id === id);
  if (!student) return;

  showModal(
    "Student Details",
    `
        <div class="student-details">
            <p><strong>Name:</strong> ${student.name}</p>
            <p><strong>Email:</strong> ${student.email}</p>
            <p><strong>Role:</strong> ${student.role}</p>
            <p><strong>Class:</strong> ${student.class || "-"}</p>
            <p><strong>Level:</strong> ${student.level || "-"}</p>
            ${student.stream ? `<p><strong>Stream:</strong> ${student.stream}</p>` : ""}
            ${student.combination ? `<p><strong>Combination:</strong> ${student.combination}</p>` : ""}
            <p><strong>Status:</strong> ${student.isConfirmed ? "Confirmed" : "Pending Approval"}</p>
            <p><strong>Active:</strong> ${student.isActive ? "Yes" : "No"}</p>
            <p><strong>Registered:</strong> ${new Date(student.createdAt).toLocaleDateString()}</p>
        </div>
    `,
  );
}

// ============================================
// SUBJECTS MANAGEMENT
// ============================================

function renderSubjectsTab() {
  return `
        <div id="subjects" class="tab-content">
            <div class="section-header">
                <h2>Subject Management</h2>
                <button class="btn-primary" id="addSubjectBtn">+ Add Subject</button>
            </div>
            <div class="filters">
                <select id="subjectLevelFilter">
                    <option value="">All Levels</option>
                    <option value="o-level">O-Level</option>
                    <option value="a-level">A-Level</option>
                </select>
                <select id="subjectClassFilter" style="display: none;">
                    <!-- Hidden but kept for any legacy code expecting it -->
                </select>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Code</th>
                            <th>Level</th>
                            <th>Type</th>
                            <th>Stream</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="subjectsTableBody">
                        <tr><td colspan="6" class="loading">Loading subjects...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function setupSubjectsListeners() {
  const addSubjectBtn = document.getElementById("addSubjectBtn");
  const subjectLevelFilter = document.getElementById("subjectLevelFilter");

  if (addSubjectBtn) {
    addSubjectBtn.addEventListener("click", showAddSubjectModal);
  }
  if (subjectLevelFilter) {
    subjectLevelFilter.addEventListener("change", loadSubjects);
  }

  // Event delegation is handled at document level
}

async function loadSubjects() {
  try {
    const level = document.getElementById("subjectLevelFilter").value;

    let url = `${API_BASE}/subjects`;
    const params = new URLSearchParams();
    if (level) params.append("level", level);
    if (params.toString()) url += "?" + params.toString();

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to load subjects");

    const data = await response.json();

    // Group subjects by name and level (since they are duplicated across classes)
    const uniqueSubjectsMap = new Map();
    data.data.forEach(sub => {
      const key = sub.name + "-" + sub.level;
      if (!uniqueSubjectsMap.has(key)) {
        uniqueSubjectsMap.set(key, sub);
      }
    });

    allSubjects = Array.from(uniqueSubjectsMap.values());
    displaySubjects(allSubjects);
  } catch (error) {
    console.error("Failed to load subjects:", error);
    showError("Failed to load subjects");
  }
}

function displaySubjects(subjects) {
  const tbody = document.getElementById("subjectsTableBody");

  if (subjects.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="no-data">No subjects found</td></tr>';
    return;
  }

  tbody.innerHTML = subjects
    .map(
      (subject) => {
        let typeLabel = "Optional";
        if (subject.isSubsidiary) typeLabel = "Subsidiary";
        else if (subject.isCompulsory) typeLabel = subject.level === "a-level" ? "Core (Main)" : "Compulsory";

        return `
        <tr>
            <td>${subject.name}</td>
            <td>${subject.code || "-"}</td>
            <td>${subject.level === "o-level" ? "O-Level" : "A-Level"}</td>
            <td>${typeLabel}</td>
            <td>${subject.stream ? subject.stream.charAt(0).toUpperCase() + subject.stream.slice(1) : "-"}</td>
            <td>
                <button class="btn-sm btn-primary edit-subject-btn" data-subject-id="${subject.id}">Edit</button>
                <button class="btn-sm btn-danger delete-subject-btn" data-subject-id="${subject.id}">Delete</button>
            </td>
        </tr>
    `})
    .join("");
}

function showAddSubjectModal() {
  showSubjectModal("Add Subject", null);
}

function editSubject(id) {
  const subject = allSubjects.find((s) => s.id === id);
  if (!subject) return;
  showSubjectModal("Edit Subject", subject);
}

function showSubjectModal(title, subject) {
  const modalContent = `
        <form id="subjectForm">
            <input type="hidden" id="subjectId" value="${subject ? subject.id : ""}">
            <div class="form-group">
                <label>Subject Name *</label>
                <input type="text" id="subjectName" value="${subject ? subject.name : ""}" required>
            </div>
            <div class="form-group">
                <label>Subject Code</label>
                <input type="text" id="subjectCode" value="${subject ? subject.code || "" : ""}">
            </div>
            <div class="form-group">
                <label>Level *</label>
                <select id="subjectLevel" required>
                    <option value="">Select Level</option>
                    <option value="o-level" ${subject && subject.level === "o-level" ? "selected" : ""}>O-Level</option>
                    <option value="a-level" ${subject && subject.level === "a-level" ? "selected" : ""}>A-Level</option>
                </select>
            </div>
            
            <div id="oLevelOptions" style="${subject && subject.level === "o-level" ? "display:block" : "display:none"}">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="isOLevelOptional" ${subject && !subject.isCompulsory ? "checked" : ""}> Optional Subject (Uncheck for Compulsory)
                    </label>
                </div>
            </div>

            <div id="aLevelOptions" style="${subject && subject.level === "a-level" ? "display:block" : "display:none"}">
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="isALevelSubsidiary" ${subject && subject.isSubsidiary ? "checked" : ""}> Subsidiary Subject (Uncheck for Core)
                    </label>
                </div>
            </div>

            <div class="form-group">
                <label>Stream</label>
                <select id="subjectStream">
                    <option value="">None</option>
                    <option value="arts" ${subject && subject.stream === "arts" ? "selected" : ""}>Arts</option>
                    <option value="science" ${subject && subject.stream === "science" ? "selected" : ""}>Science</option>
                    <option value="both" ${subject && subject.stream === "both" ? "selected" : ""}>Both</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" id="cancelSubjectBtn">Cancel</button>
                <button type="submit" class="btn-primary">Save Subject</button>
            </div>
        </form>
    `;

  showModal(title, modalContent, () => {
    const subjectLevel = document.getElementById("subjectLevel");
    if (subjectLevel) {
      subjectLevel.addEventListener("change", updateSubjectTypeOptions);
    }

    const form = document.getElementById("subjectForm");
    form.addEventListener("submit", saveSubject);

    document
      .getElementById("cancelSubjectBtn")
      .addEventListener("click", closeModal);
  });
}

function updateSubjectTypeOptions() {
  const level = document.getElementById("subjectLevel").value;
  const oLevelGroup = document.getElementById("oLevelOptions");
  const aLevelGroup = document.getElementById("aLevelOptions");

  if (level === "o-level") {
    oLevelGroup.style.display = "block";
    aLevelGroup.style.display = "none";
  } else if (level === "a-level") {
    oLevelGroup.style.display = "none";
    aLevelGroup.style.display = "block";
  } else {
    oLevelGroup.style.display = "none";
    aLevelGroup.style.display = "none";
  }
}

async function saveSubject(event) {
  event.preventDefault();

  const id = document.getElementById("subjectId").value;
  const name = document.getElementById("subjectName").value;
  const level = document.getElementById("subjectLevel").value;

  if (!name || !level) {
    showError("Please fill in all required fields");
    return;
  }

  let isCompulsory = true;
  let isSubsidiary = false;

  if (level === "o-level") {
    isCompulsory = !document.getElementById("isOLevelOptional").checked;
  } else if (level === "a-level") {
    isSubsidiary = document.getElementById("isALevelSubsidiary").checked;
    isCompulsory = !isSubsidiary; // If it's a subsidiary it's not core(compulsory), and vice versa
  }

  const payload = {
    name,
    code: document.getElementById("subjectCode").value,
    level,
    isCompulsory,
    isSubsidiary,
    stream: document.getElementById("subjectStream").value || null,
  };

  try {
    const url = id ? `${API_BASE}/subjects/${id}` : `${API_BASE}/subjects`;
    const method = id ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to save subject");
    }

    showSuccess(
      id ? "Subject updated successfully" : "Subject added successfully",
    );
    closeModal();
    loadSubjects();
    loadDashboard();
  } catch (error) {
    console.error("Failed to save subject:", error);
    showError(error.message || "Failed to save subject");
  }
}

async function deleteSubject(id) {
  if (!confirm("Are you sure you want to delete this subject?")) return;

  try {
    const response = await fetch(`${API_BASE}/subjects/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to delete subject");

    showSuccess("Subject deleted successfully");
    loadSubjects();
    loadDashboard();
  } catch (error) {
    console.error("Failed to delete subject:", error);
    showError("Failed to delete subject");
  }
}

// ============================================
// NOTES MANAGEMENT
// ============================================

function renderNotesTab() {
  return `
        <div id="notes" class="tab-content">
            <div class="section-header">
                <h2>Notes Management</h2>
                <button class="btn-primary" id="addNoteBtn">+ Upload Note</button>
            </div>
            <div class="filters">
                <select id="noteLevelFilter">
                    <option value="">All Levels</option>
                    <option value="o-level">O-Level</option>
                    <option value="a-level">A-Level</option>
                </select>
                <select id="noteClassFilter">
                    <option value="">All Classes</option>
                    <option value="s1">S1</option>
                    <option value="s2">S2</option>
                    <option value="s3">S3</option>
                    <option value="s4">S4</option>
                    <option value="s5">S5</option>
                    <option value="s6">S6</option>
                </select>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Subject</th>
                            <th>Level</th>
                            <th>Class</th>
                            <th>Upload Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="notesTableBody">
                        <tr><td colspan="6" class="loading">Loading notes...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function setupNotesListeners() {
  const addNoteBtn = document.getElementById("addNoteBtn");
  const noteLevelFilter = document.getElementById("noteLevelFilter");
  const noteClassFilter = document.getElementById("noteClassFilter");

  if (addNoteBtn) {
    addNoteBtn.addEventListener("click", showAddNoteModal);
  }
  if (noteLevelFilter) {
    noteLevelFilter.addEventListener("change", loadNotes);
  }
  if (noteClassFilter) {
    noteClassFilter.addEventListener("change", loadNotes);
  }

  // Event delegation is handled at document level
}

async function loadNotes() {
  try {
    const level = document.getElementById("noteLevelFilter").value;
    const classLevel = document.getElementById("noteClassFilter").value;

    let url = `${API_BASE}/notes`;
    const params = new URLSearchParams();
    if (level) params.append("level", level);
    if (classLevel) params.append("class", classLevel);
    if (params.toString()) url += "?" + params.toString();

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to load notes");

    const data = await response.json();
    allNotes = data.data || [];
    displayNotes(allNotes);
  } catch (error) {
    console.error("Failed to load notes:", error);
    showError("Failed to load notes");
  }
}

function displayNotes(notes) {
  const tbody = document.getElementById("notesTableBody");

  if (notes.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="no-data">No notes found</td></tr>';
    return;
  }

  tbody.innerHTML = notes
    .map(
      (note) => `
        <tr>
            <td>${note.title}</td>
            <td>${note.subject}</td>
            <td>${note.level}</td>
            <td>${note.class.toUpperCase()}</td>
            <td>${new Date(note.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn-sm btn-primary edit-note-btn" data-note-id="${note.id}">Edit</button>
                <button class="btn-sm btn-danger delete-note-btn" data-note-id="${note.id}">Delete</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

function showAddNoteModal() {
  showNoteModal("Upload Note", null);
}

function editNote(id) {
  const note = allNotes.find((n) => n.id === id);
  if (!note) return;
  showNoteModal("Edit Note", note);
}

function showNoteModal(title, note) {
  const modalContent = `
        <form id="noteForm" enctype="multipart/form-data">
            <input type="hidden" id="noteId" value="${note ? note.id : ""}">
            <div class="form-group">
                <label>Title *</label>
                <input type="text" id="noteTitle" value="${note ? note.title : ""}" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="noteDescription" rows="3">${note ? note.description || "" : ""}</textarea>
            </div>
            <div class="form-group">
                <label>Subject *</label>
                <select id="noteSubject" required>
                    ${getSubjectOptions(note ? note.subject : "")}
                </select>
            </div>
            <div class="form-group">
                <label>Level *</label>
                <select id="noteLevel" required>
                    <option value="">Select Level</option>
                    <option value="o-level" ${note && note.level === "o-level" ? "selected" : ""}>O-Level</option>
                    <option value="a-level" ${note && note.level === "a-level" ? "selected" : ""}>A-Level</option>
                </select>
            </div>
            <div class="form-group">
                <label>Class *</label>
                <select id="noteClass" required>
                    <option value="">Select Level First</option>
                </select>
            </div>
            <div class="form-group">
                <label>Combination (A-Level only)</label>
                <input type="text" id="noteCombination" value="${note ? note.combination || "" : ""}" placeholder="e.g., PCM, PCB">
            </div>
            <div class="form-group">
                <label>File ${note ? "" : "*"}</label>
                <input type="file" id="noteFile" accept=".pdf,.doc,.docx,.txt" ${note ? "" : "required"}>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" id="cancelNoteBtn">Cancel</button>
                <button type="submit" class="btn-primary">Upload Note</button>
            </div>
        </form>
    `;

  showModal(title, modalContent, () => {
    const noteLevel = document.getElementById("noteLevel");
    if (noteLevel) {
      noteLevel.addEventListener("change", updateNoteClassOptions);
      if (note) {
        updateNoteClassOptions();
        setTimeout(() => {
          document.getElementById("noteClass").value = note.class;
        }, 10);
      }
    }

    const form = document.getElementById("noteForm");
    form.addEventListener("submit", saveNote);

    document
      .getElementById("cancelNoteBtn")
      .addEventListener("click", closeModal);
  });
}

function updateNoteClassOptions() {
  const level = document.getElementById("noteLevel").value;
  const classSelect = document.getElementById("noteClass");

  classSelect.innerHTML = '<option value="">Select Class</option>';

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
}

async function saveNote(event) {
  event.preventDefault();

  const id = document.getElementById("noteId").value;
  const formData = new FormData();

  formData.append("title", document.getElementById("noteTitle").value);
  formData.append(
    "description",
    document.getElementById("noteDescription").value,
  );
  formData.append("subject", document.getElementById("noteSubject").value);
  formData.append("level", document.getElementById("noteLevel").value);
  formData.append("class", document.getElementById("noteClass").value);

  const combination = document.getElementById("noteCombination").value;
  if (combination) formData.append("combination", combination);

  const fileInput = document.getElementById("noteFile");
  if (fileInput.files.length > 0) {
    formData.append("file", fileInput.files[0]);
  }

  try {
    const url = id ? `${API_BASE}/notes/${id}` : `${API_BASE}/notes`;
    const method = id ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to save note");
    }

    showSuccess(
      id ? "Note updated successfully" : "Note uploaded successfully",
    );
    closeModal();
    loadNotes();
    loadDashboard();
  } catch (error) {
    console.error("Failed to save note:", error);
    showError(error.message || "Failed to save note");
  }
}

async function deleteNote(id) {
  if (!confirm("Are you sure you want to delete this note?")) return;

  try {
    const response = await fetch(`${API_BASE}/notes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to delete note");

    showSuccess("Note deleted successfully");
    loadNotes();
    loadDashboard();
  } catch (error) {
    console.error("Failed to delete note:", error);
    showError("Failed to delete note");
  }
}

// ============================================
// QUIZZES MANAGEMENT
// ============================================

function renderQuizzesTab() {
  return `
        <div id="quizzes" class="tab-content">
            <div class="section-header">
                <h2>Quiz Management</h2>
                <button class="btn-primary" id="addQuizBtn">+ Create Quiz</button>
            </div>
            <div class="filters">
                <select id="quizLevelFilter">
                    <option value="">All Levels</option>
                    <option value="o-level">O-Level</option>
                    <option value="a-level">A-Level</option>
                </select>
                <select id="quizClassFilter">
                    <option value="">All Classes</option>
                    <option value="s1">S1</option>
                    <option value="s2">S2</option>
                    <option value="s3">S3</option>
                    <option value="s4">S4</option>
                    <option value="s5">S5</option>
                    <option value="s6">S6</option>
                </select>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Subject</th>
                            <th>Topic</th>
                            <th>Type</th>
                            <th>Level</th>
                            <th>Class</th>
                            <th>Views</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="quizzesTableBody">
                        <tr><td colspan="7" class="loading">Loading quizzes...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function setupQuizzesListeners() {
  const addQuizBtn = document.getElementById("addQuizBtn");
  if (addQuizBtn) addQuizBtn.addEventListener("click", showAddQuizModal);

  const levelFilter = document.getElementById("quizLevelFilter");
  if (levelFilter) levelFilter.addEventListener("change", loadQuizzes);

  const classFilter = document.getElementById("quizClassFilter");
  if (classFilter) classFilter.addEventListener("change", loadQuizzes);
}

async function loadQuizzes() {
  try {
    const level = document.getElementById("quizLevelFilter").value;
    const classLevel = document.getElementById("quizClassFilter").value;

    let url = `${API_BASE}/quizzes`;
    const params = new URLSearchParams();
    if (level) params.append("level", level);
    if (classLevel) params.append("class", classLevel);
    if (params.toString()) url += "?" + params.toString();

    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to load quizzes");

    const data = await response.json();
    allQuizzes = data.data || [];
    displayQuizzes(allQuizzes);
  } catch (error) {
    console.error("Failed to load quizzes:", error);
    showError("Failed to load quizzes");
  }
}

function displayQuizzes(quizzes) {
  const tbody = document.getElementById("quizzesTableBody");
  if (quizzes.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="no-data">No quizzes found</td></tr>';
    return;
  }

  tbody.innerHTML = quizzes
    .map(
      (quiz) => `
        <tr>
            <td>${quiz.title}</td>
            <td>${quiz.subject}</td>
            <td>${quiz.topic || "-"}</td>
            <td>${quiz.type === "file" ? "📁 File" : "✍️ Text"}</td>
            <td>${quiz.level}</td>
            <td>${quiz.class.toUpperCase()}</td>
            <td>${quiz.views || 0}</td>
            <td>
                <button class="btn-sm btn-primary edit-quiz-btn" data-quiz-id="${quiz.id}">Edit</button>
                <button class="btn-sm btn-danger delete-quiz-btn" data-quiz-id="${quiz.id}">Delete</button>
            </td>
        </tr>
    `,
    )
    .join("");
}

function showAddQuizModal() {
  showQuizModal("Create Quiz", null);
}

function editQuiz(id) {
  const quiz = allQuizzes.find((q) => q.id === id);
  if (quiz) showQuizModal("Edit Quiz", quiz);
}

function showQuizModal(title, quiz) {
  const modalContent = `
        <form id="quizForm" enctype="multipart/form-data">
            <input type="hidden" id="quizId" value="${quiz ? quiz.id : ""}">
            <div class="form-group">
                <label>Title *</label>
                <input type="text" id="quizTitle" value="${quiz ? quiz.title : ""}" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea id="quizDescription">${quiz ? quiz.description || "" : ""}</textarea>
            </div>
            <div class="form-group">
                <label>Subject *</label>
                <select id="quizSubject" required>
                    ${getSubjectOptions(quiz ? quiz.subject : "")}
                </select>
            </div>
            <div class="form-group">
                <label>Topic (Optional)</label>
                <input type="text" id="quizTopic" value="${quiz ? quiz.topic || "" : ""}" placeholder="e.g. Algebra, Organic Chemistry">
            </div>
            <div class="form-group">
                <label>Type *</label>
                <select id="quizType" required>
                    <option value="file" ${quiz && quiz.type === "file" ? "selected" : ""}>File Upload (PDF/DOC)</option>
                    <option value="plain" ${quiz && quiz.type === "plain" ? "selected" : ""}>Plain Text / HTML Content</option>
                </select>
            </div>
            <div class="form-group" id="fileInputGroup" style="${quiz && quiz.type === "plain" ? "display:none" : "display:block"}">
                <label>Quiz File ${quiz && quiz.type === "file" ? "(Optional update)" : "*"}</label>
                <input type="file" id="quizFile" accept=".pdf,.doc,.docx,.txt">
            </div>
            <div class="form-group" id="contentInputGroup" style="${quiz && quiz.type === "plain" ? "display:block" : "display:none"}">
                <label>Type your Question/Content here *</label>
                <textarea id="quizContent" rows="10" placeholder="Type or paste your quiz questions/content here...">${quiz ? quiz.content || "" : ""}</textarea>
            </div>
            <div class="form-group">
                <label>Level *</label>
                <select id="quizLevel" required>
                    <option value="">Select Level</option>
                    <option value="o-level" ${quiz && quiz.level === "o-level" ? "selected" : ""}>O-Level</option>
                    <option value="a-level" ${quiz && quiz.level === "a-level" ? "selected" : ""}>A-Level</option>
                </select>
            </div>
            <div class="form-group">
                <label>Class *</label>
                <select id="quizClass" required>
                    <option value="">Select Level First</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn-primary">Save Quiz</button>
            </div>
        </form>
    `;

  showModal(title, modalContent, () => {
    const quizType = document.getElementById("quizType");
    quizType.addEventListener("change", () => {
      document.getElementById("fileInputGroup").style.display =
        quizType.value === "file" ? "block" : "none";
      document.getElementById("contentInputGroup").style.display =
        quizType.value === "plain" ? "block" : "none";
    });

    const quizLevel = document.getElementById("quizLevel");
    quizLevel.addEventListener("change", () =>
      updateClassSelect("quizLevel", "quizClass"),
    );
    if (quiz) {
      updateClassSelect("quizLevel", "quizClass");
      setTimeout(
        () => (document.getElementById("quizClass").value = quiz.class),
        10,
      );
    }

    document.getElementById("quizForm").addEventListener("submit", saveQuiz);
  });
}

async function saveQuiz(event) {
  event.preventDefault();
  const id = document.getElementById("quizId").value;
  const formData = new FormData();

  formData.append("title", document.getElementById("quizTitle").value);
  formData.append(
    "description",
    document.getElementById("quizDescription").value,
  );
  formData.append("subject", document.getElementById("quizSubject").value);
  formData.append("topic", document.getElementById("quizTopic").value);
  formData.append("type", document.getElementById("quizType").value);
  formData.append("level", document.getElementById("quizLevel").value);
  formData.append("class", document.getElementById("quizClass").value);

  if (document.getElementById("quizType").value === "plain") {
    formData.append("content", document.getElementById("quizContent").value);
  } else {
    const file = document.getElementById("quizFile").files[0];
    if (file) formData.append("file", file);
  }

  try {
    const url = id ? `${API_BASE}/quizzes/${id}` : `${API_BASE}/quizzes`;
    const response = await fetch(url, {
      method: id ? "PUT" : "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to save quiz");
    showSuccess("Quiz saved successfully");
    closeModal();
    loadQuizzes();
    loadDashboard();
  } catch (error) {
    showError(error.message);
  }
}

async function deleteQuiz(id) {
  if (!confirm("Delete this quiz?")) return;
  try {
    const response = await fetch(`${API_BASE}/quizzes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete quiz");
    showSuccess("Quiz deleted");
    loadQuizzes();
    loadDashboard();
  } catch (error) {
    showError(error.message);
  }
}

// ============================================
// RESOURCES MANAGEMENT
// ============================================

function renderResourcesTab() {
  return `
        <div id="resources" class="tab-content">
            <div class="section-header">
                <h2>Resource Management</h2>
                <button class="btn-primary" id="addResourceBtn">+ Add Resource</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Link/File</th>
                            <th>Subject</th>
                            <th>Level</th>
                            <th>Class</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="resourcesTableBody">
                        <tr><td colspan="7" class="loading">Loading resources...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function setupResourcesListeners() {
  const addResourceBtn = document.getElementById("addResourceBtn");
  if (addResourceBtn)
    addResourceBtn.addEventListener("click", showAddResourceModal);
}

async function loadResources() {
  try {
    const response = await fetch(`${API_BASE}/resources`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed");
    const data = await response.json();
    allResources = data.data || [];
    displayResources(allResources);
  } catch (error) {
    showError("Load failed");
  }
}

function displayResources(resources) {
  const tbody = document.getElementById("resourcesTableBody");
  tbody.innerHTML =
    resources
      .map(
        (res) => `
        <tr>
            <td>${res.title}</td>
            <td>${res.resourceType === "file" ? "📁 File/Video" : "🔗 URL"}</td>
            <td>
                ${res.resourceType === "file"
            ? `<a href="${API_BASE.replace("/api", "")}/${res.filePath}" target="_blank">View File</a>`
            : `<a href="${res.url}" target="_blank">View Link</a>`
          }
            </td>
            <td>${res.subject || "-"}</td>
            <td>${res.level}</td>
            <td>${res.class.toUpperCase()}</td>
            <td>
                <button class="btn-sm btn-primary edit-resource-btn" data-resource-id="${res.id}">Edit</button>
                <button class="btn-sm btn-danger delete-resource-btn" data-resource-id="${res.id}">Delete</button>
            </td>
        </tr>
    `,
      )
      .join("") || '<tr><td colspan="7" class="no-data">No resources</td></tr>';
}

function showAddResourceModal() {
  showResourceModal("Add Resource", null);
}
function editResource(id) {
  const res = allResources.find((r) => r.id === id);
  if (res) showResourceModal("Edit Resource", res);
}

function showResourceModal(title, resource) {
  const modalContent = `
        <form id="resourceForm" enctype="multipart/form-data">
            <input type="hidden" id="resourceId" value="${resource ? resource.id : ""}">
            <div class="form-group">
                <label>Title *</label>
                <input type="text" id="resourceTitle" value="${resource ? resource.title : ""}" required>
            </div>
            <div class="form-group">
                <label>Type *</label>
                <select id="resourceType" required>
                    <option value="url" ${resource && resource.resourceType === "url" ? "selected" : ""}>Web Link (URL)</option>
                    <option value="file" ${resource && resource.resourceType === "file" ? "selected" : ""}>File Upload (MP4, PDF, etc)</option>
                </select>
            </div>
            <div class="form-group" id="resourceUrlGroup" style="${resource && resource.resourceType === "file" ? "display:none" : "display:block"}">
                <label>URL (e.g. YouTube Link) *</label>
                <input type="text" id="resourceUrl" value="${resource && resource.url ? resource.url : ""}" ${resource && resource.resourceType === "file" ? "" : "required"}>
            </div>
            <div class="form-group" id="resourceFileGroup" style="${resource && resource.resourceType === "file" ? "display:block" : "display:none"}">
                <label>Resource File (MP4 Video, PDF, DOC) ${resource && resource.resourceType === "file" ? "(Optional update)" : "*"}</label>
                <input type="file" id="resourceFile" accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4" ${resource ? "" : (resource && resource.resourceType === "file" ? "" : "")}>
            </div>
            <div class="form-group">
                <label>Subject</label>
                <select id="resourceSubject">
                    ${getSubjectOptions(resource ? resource.subject : "")}
                </select>
            </div>
            <div class="form-group">
                <label>Level *</label>
                <select id="resourceLevel" required>
                    <option value="o-level" ${resource && resource.level === "o-level" ? "selected" : ""}>O-Level</option>
                    <option value="a-level" ${resource && resource.level === "a-level" ? "selected" : ""}>A-Level</option>
                </select>
            </div>
            <div class="form-group">
                <label>Class *</label>
                <select id="resourceClass" required>
                    <option value="s1" ${resource && resource.class === "s1" ? "selected" : ""}>S1</option>
                    <option value="s2" ${resource && resource.class === "s2" ? "selected" : ""}>S2</option>
                    <option value="s3" ${resource && resource.class === "s3" ? "selected" : ""}>S3</option>
                    <option value="s4" ${resource && resource.class === "s4" ? "selected" : ""}>S4</option>
                    <option value="s5" ${resource && resource.class === "s5" ? "selected" : ""}>S5</option>
                    <option value="s6" ${resource && resource.class === "s6" ? "selected" : ""}>S6</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn-primary">Save</button>
            </div>
        </form>
    `;
  showModal(title, modalContent, () => {
    const rType = document.getElementById("resourceType");
    const rUrl = document.getElementById("resourceUrlGroup");
    const rFile = document.getElementById("resourceFileGroup");
    const rUrlInput = document.getElementById("resourceUrl");

    rType.addEventListener("change", () => {
      if (rType.value === "url") {
        rUrl.style.display = "block";
        rFile.style.display = "none";
        rUrlInput.required = true;
      } else {
        rUrl.style.display = "none";
        rFile.style.display = "block";
        rUrlInput.required = false;
      }
    });

    document
      .getElementById("resourceForm")
      .addEventListener("submit", saveResource);
  });
}

async function saveResource(e) {
  e.preventDefault();
  const id = document.getElementById("resourceId").value;

  const formData = new FormData();
  formData.append("title", document.getElementById("resourceTitle").value);
  formData.append("resourceType", document.getElementById("resourceType").value);

  if (document.getElementById("resourceType").value === "url") {
    formData.append("url", document.getElementById("resourceUrl").value);
  } else {
    const fileItem = document.getElementById("resourceFile").files[0];
    if (fileItem) formData.append("file", fileItem);
  }

  formData.append("subject", document.getElementById("resourceSubject").value);
  formData.append("level", document.getElementById("resourceLevel").value);
  formData.append("class", document.getElementById("resourceClass").value);

  try {
    const url = id ? `${API_BASE}/resources/${id}` : `${API_BASE}/resources`;
    const res = await fetch(url, {
      method: id ? "PUT" : "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });

    // Parse response
    let resData;
    try {
      resData = await res.json();
    } catch (err) {
      resData = null;
    }

    if (!res.ok) throw new Error(resData ? resData.message : "Save resource failed");
    showSuccess("Resource saved successfully");
    closeModal();
    loadResources();
    loadDashboard();
  } catch (err) {
    showError(err.message);
  }
}

async function deleteResource(id) {
  if (!confirm("Delete?")) return;
  await fetch(`${API_BASE}/resources/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  loadResources();
  loadDashboard();
}

// ============================================
// STREAMS MANAGEMENT (Class Sections)
// ============================================

function renderStreamsTab() {
  return `
        <div id="streams" class="tab-content">
            <div class="section-header">
                <h2>Class Streams (Section Management)</h2>
                <button class="btn-primary" id="addStreamBtn">+ Add Stream</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Stream Name</th>
                            <th>Parent Class</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="streamsTableBody">
                        <tr><td colspan="4" class="loading">Loading streams...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function setupStreamsListeners() {
  const btn = document.getElementById("addStreamBtn");
  if (btn) btn.addEventListener("click", showAddStreamModal);
}

async function loadStreams() {
  try {
    const res = await fetch(`${API_BASE}/streams`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    allStreams = data.data || [];
    displayStreams(allStreams);
  } catch (e) {
    showError("Streams load failed");
  }
}

function displayStreams(streams) {
  const tbody = document.getElementById("streamsTableBody");
  tbody.innerHTML =
    streams
      .map(
        (s) => `
        <tr>
            <td>${s.name}</td>
            <td>${s.class.toUpperCase()}</td>
            <td>${s.description || "-"}</td>
            <td>
                <button class="btn-sm btn-primary edit-stream-btn" data-stream-id="${s.id}">Edit</button>
                <button class="btn-sm btn-danger delete-stream-btn" data-stream-id="${s.id}">Delete</button>
            </td>
        </tr>
    `,
      )
      .join("") || '<tr><td colspan="4" class="no-data">No streams</td></tr>';
}

function showAddStreamModal() {
  showStreamModal("Add Stream", null);
}
function editStream(id) {
  const s = allStreams.find((x) => x.id === id);
  if (s) showStreamModal("Edit Stream", s);
}

function showStreamModal(title, stream) {
  const content = `
        <form id="streamForm">
            <input type="hidden" id="streamId" value="${stream ? stream.id : ""}">
            <div class="form-group">
                <label>Stream Name (e.g. "S1 A", "North") *</label>
                <input type="text" id="streamName" value="${stream ? stream.name : ""}" required>
            </div>
            <div class="form-group">
                <label>Parent Class (O-Level Only) *</label>
                <select id="streamClass" required>
                    <option value="s1" ${stream && stream.class === "s1" ? "selected" : ""}>S1</option>
                    <option value="s2" ${stream && stream.class === "s2" ? "selected" : ""}>S2</option>
                    <option value="s3" ${stream && stream.class === "s3" ? "selected" : ""}>S3</option>
                    <option value="s4" ${stream && stream.class === "s4" ? "selected" : ""}>S4</option>
                </select>
            </div>
            <div class="form-group">
                <label>Description</label>
                <input type="text" id="streamDesc" value="${stream ? stream.description || "" : ""}">
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn-primary">Save</button>
            </div>
        </form>
    `;
  showModal(title, content, () => {
    document
      .getElementById("streamForm")
      .addEventListener("submit", saveStream);
  });
}

async function saveStream(e) {
  e.preventDefault();
  const id = document.getElementById("streamId").value;
  const data = {
    name: document.getElementById("streamName").value,
    class: document.getElementById("streamClass").value,
    description: document.getElementById("streamDesc").value,
  };
  const url = id ? `${API_BASE}/streams/${id}` : `${API_BASE}/streams`;
  await fetch(url, {
    method: id ? "PUT" : "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  closeModal();
  loadStreams();
  loadDashboard();
}

async function deleteStream(id) {
  if (!confirm("Delete stream?")) return;
  await fetch(`${API_BASE}/streams/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  loadStreams();
  loadDashboard();
}

// Helper to update class select based on level
function updateClassSelect(levelId, classId) {
  const level = document.getElementById(levelId).value;
  const classSelect = document.getElementById(classId);
  classSelect.innerHTML = '<option value="">Select Class</option>';
  if (level === "o-level") {
    ["s1", "s2", "s3", "s4"].forEach(
      (c) =>
        (classSelect.innerHTML += `<option value="${c}">${c.toUpperCase()}</option>`),
    );
  } else if (level === "a-level") {
    ["s5", "s6"].forEach(
      (c) =>
        (classSelect.innerHTML += `<option value="${c}">${c.toUpperCase()}</option>`),
    );
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  };
}

// Helper to get subject options for dropdowns
function getSubjectOptions(selectedSubject = "") {
  if (!allSubjects || allSubjects.length === 0) {
    return `<option value="">Please add subjects first</option>`;
  }

  return `
        <option value="">Select Subject</option>
        ${allSubjects
      .map(
        (s) => `
            <option value="${s.name}" ${s.name === selectedSubject ? "selected" : ""}>
                ${s.name} (${s.code})
            </option>
        `,
      )
      .join("")}
    `;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/pages/login.html";
}

function showSuccess(message) {
  showToast(message, "success");
}

function showError(message) {
  showToast(message, "error");
}

function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <div class="toast-content">
            ${type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"} ${message}
        </div>
    `;

  container.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.classList.add("toast-closing");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Refresh current tab data
async function refreshCurrentTab() {
  const btn = document.getElementById("refreshBtn");
  const originalText = btn.innerHTML;
  btn.innerHTML = "🔄 Syncing...";
  btn.disabled = true;

  try {
    if (currentTab === "dashboard") await loadDashboard();
    else if (currentTab === "students") await loadStudents();
    else if (currentTab === "subjects") await loadSubjects();
    else if (currentTab === "notes") await loadNotes();
    else if (currentTab === "quizzes") await loadQuizzes();
    else if (currentTab === "resources") await loadResources();
    else if (currentTab === "streams") await loadStreams();

    showToast("Data synchronized successfully", "success");
  } catch (error) {
    showError("Sync failed: " + error.message);
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

function showModal(title, content, onOpen) {
  // Cleanup any existing modal first
  closeModal();

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "dynamicModal";
  modal.innerHTML = `
        <div class="modal-content">
            <span class="close" id="closeModalBtn">&times;</span>
            <h2>${title}</h2>
            ${content}
        </div>
    `;
  document.body.appendChild(modal);
  modal.style.display = "block";

  document
    .getElementById("closeModalBtn")
    .addEventListener("click", closeModal);

  if (onOpen) onOpen();

  // Close on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

function closeModal() {
  const modal = document.getElementById("dynamicModal");
  if (modal) {
    modal.remove();
  }
}
