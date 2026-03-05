// ============================================
// ADMIN DASHBOARD JAVASCRIPT
// Handles all admin operations - JS-driven UI
// ============================================

const API_BASE = "/api";
let currentAdmin = null;
let allStudents = [];
let allSubjects = [];
let allNotes = [];

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

    if (!response.ok) {
      throw new Error("Not authenticated");
    }

    const data = await response.json();

    // Strict role check: Only admins can access admin dashboard
    if (data.data.role !== "admin") {
      alert(
        "Access denied. This is an admin-only area. Student accounts cannot access this dashboard.",
      );
      removeToken();
      window.location.href = "/pages/login.html";
      return;
    }

    currentAdmin = data.data;
    renderApp();
  } catch (error) {
    console.error("Auth check failed:", error);
    localStorage.removeItem("token");
    window.location.href = "/pages/login.html";
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
  });
}

// Switch tabs
function switchTab(tabName) {
  try {
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
      console.log("Notes tab rendered, setting up listeners...");
      setTimeout(() => {
        setupNotesListeners();
        loadNotes();
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
            </div>
        </div>
    `;
}

async function loadDashboard() {
  try {
    const [studentsRes, subjectsRes, notesRes] = await Promise.all([
      fetch(`${API_BASE}/users`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/subjects`, { headers: getAuthHeaders() }),
      fetch(`${API_BASE}/notes`, { headers: getAuthHeaders() }),
    ]);

    const studentsData = await studentsRes.json();
    const subjectsData = await subjectsRes.json();
    const notesData = await notesRes.json();

    const students = studentsData.data || [];
    const subjects = subjectsData.data || [];
    const notes = notesData.data || [];

    const totalStudentsEl = document.getElementById("totalStudents");
    const pendingStudentsEl = document.getElementById("pendingStudents");
    const totalSubjectsEl = document.getElementById("totalSubjects");
    const totalNotesEl = document.getElementById("totalNotes");

    // These elements exist only on the dashboard tab; guard against null when called from other tabs
    if (totalStudentsEl) {
      totalStudentsEl.textContent = students.filter(
        (s) => s.role === "student",
      ).length;
    }

    if (pendingStudentsEl) {
      pendingStudentsEl.textContent = students.filter(
        (s) => s.role === "student" && !s.isConfirmed,
      ).length;
    }

    if (totalSubjectsEl) {
      // Subjects API currently returns all subjects without an isActive flag; just count them
      totalSubjectsEl.textContent = subjects.length;
    }

    if (totalNotesEl) {
      totalNotesEl.textContent = notes.length;
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
                <select id="subjectClassFilter">
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
                            <th>Name</th>
                            <th>Code</th>
                            <th>Level</th>
                            <th>Class</th>
                            <th>Compulsory</th>
                            <th>Stream</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="subjectsTableBody">
                        <tr><td colspan="7" class="loading">Loading subjects...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function setupSubjectsListeners() {
  const addSubjectBtn = document.getElementById("addSubjectBtn");
  const subjectLevelFilter = document.getElementById("subjectLevelFilter");
  const subjectClassFilter = document.getElementById("subjectClassFilter");

  if (addSubjectBtn) {
    addSubjectBtn.addEventListener("click", showAddSubjectModal);
  }
  if (subjectLevelFilter) {
    subjectLevelFilter.addEventListener("change", loadSubjects);
  }
  if (subjectClassFilter) {
    subjectClassFilter.addEventListener("change", loadSubjects);
  }

  // Event delegation is handled at document level
}

async function loadSubjects() {
  try {
    const level = document.getElementById("subjectLevelFilter").value;
    const classLevel = document.getElementById("subjectClassFilter").value;

    let url = `${API_BASE}/subjects`;
    const params = new URLSearchParams();
    if (level) params.append("level", level);
    if (classLevel) params.append("class", classLevel);
    if (params.toString()) url += "?" + params.toString();

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error("Failed to load subjects");

    const data = await response.json();
    allSubjects = data.data || [];
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
      '<tr><td colspan="7" class="no-data">No subjects found</td></tr>';
    return;
  }

  tbody.innerHTML = subjects
    .map(
      (subject) => `
        <tr>
            <td>${subject.name}</td>
            <td>${subject.code || "-"}</td>
            <td>${subject.level}</td>
            <td>${
              subject.class
                ? subject.class.toUpperCase()
                : subject.classes
                  ? subject.classes.join(", ").toUpperCase()
                  : "-"
            }</td>
            <td>${subject.isCompulsory ? "Yes" : "No"}</td>
            <td>${subject.stream || "-"}</td>
            <td>
                <button class="btn-sm btn-primary edit-subject-btn" data-subject-id="${subject.id}">Edit</button>
                <button class="btn-sm btn-danger delete-subject-btn" data-subject-id="${subject.id}">Delete</button>
            </td>
        </tr>
    `,
    )
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
            <div class="form-group">
                <label>Class *</label>
                <select id="subjectClass" required>
                    <option value="">Select Level First</option>
                </select>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="subjectCompulsory" ${subject && subject.isCompulsory ? "checked" : ""}> Compulsory Subject
                </label>
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
      subjectLevel.addEventListener("change", updateSubjectClassOptions);
      if (subject) {
        updateSubjectClassOptions();
        setTimeout(() => {
          document.getElementById("subjectClass").value = subject.class;
        }, 10);
      }
    }

    const form = document.getElementById("subjectForm");
    form.addEventListener("submit", saveSubject);

    document
      .getElementById("cancelSubjectBtn")
      .addEventListener("click", closeModal);
  });
}

function updateSubjectClassOptions() {
  const level = document.getElementById("subjectLevel").value;
  const classSelect = document.getElementById("subjectClass");

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

async function saveSubject(event) {
  event.preventDefault();

  const id = document.getElementById("subjectId").value;
  const subjectData = {
    name: document.getElementById("subjectName").value,
    code: document.getElementById("subjectCode").value,
    level: document.getElementById("subjectLevel").value,
    class: document.getElementById("subjectClass").value,
    isCompulsory: document.getElementById("subjectCompulsory").checked,
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
      body: JSON.stringify(subjectData),
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
                <input type="text" id="noteSubject" value="${note ? note.subject : ""}" required>
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
// UTILITY FUNCTIONS
// ============================================

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  };
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/pages/login.html";
}

function showSuccess(message) {
  alert(message);
}

function showError(message) {
  alert("Error: " + message);
}

// Modal management
function showModal(title, content, onOpen) {
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
