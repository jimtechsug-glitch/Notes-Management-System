const API_URL = window.location.hostname === "localhost" ? "http://localhost:5000/api" : `http://${window.location.hostname}:5000/api`;

const state = {
  user: null,
  students: [],
  pendingStudents: [],
  stats: {},
  currentView: "students",
};

class AdminStudents {
  constructor() {
    this.init();
  }

  async init() {
    if (!this.checkAuth()) return;
    await this.loadData();
    this.render();
  }

  checkAuth() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token || user.role !== "admin") {
      window.location.href = "/pages/login.html";
      return false;
    }

    state.user = user;
    return true;
  }

  async loadData() {
    await Promise.all([
      this.loadAllStudents(),
      this.loadPendingStudents(),
      this.loadStats(),
    ]);
  }

  async apiCall(endpoint, options = {}) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    return await res.json();
  }

  async loadAllStudents() {
    try {
      const res = await this.apiCall("/users?role=student");
      if (res.success) {
        state.students = res.data;
      }
    } catch (err) {
      console.error("Load students error:", err);
    }
  }

  async loadPendingStudents() {
    try {
      const res = await this.apiCall("/users/pending");
      if (res.success) {
        state.pendingStudents = res.data;
      }
    } catch (err) {
      console.error("Load pending error:", err);
    }
  }

  async loadStats() {
    try {
      const res = await this.apiCall("/users/stats");
      if (res.success) {
        state.stats = res.data;
      }
    } catch (err) {
      console.error("Load stats error:", err);
    }
  }

  render() {
    const container = document.getElementById("app");
    if (!container) {
      console.error("App container not found");
      return;
    }

    container.innerHTML = `
            <div class="container-fluid">
                ${this.getNavbar()}
                <div class="row">
                    <div class="col-md-3">
                        ${this.getSidebar()}
                    </div>
                    <div class="col-md-9">
                        ${this.getMainContent()}
                    </div>
                </div>
            </div>
        `;

    this.attachEventListeners();
  }

  getNavbar() {
    return `
            <nav class="navbar navbar-dark bg-dark mb-4">
                <div class="container-fluid">
                    <span class="navbar-brand">Admin Dashboard - Students</span>
                    <div class="d-flex align-items-center">
                        <span class="text-white me-3">${state.user.name}</span>
                        <button class="btn btn-outline-light btn-sm" onclick="adminStudents.logout()">Logout</button>
                    </div>
                </div>
            </nav>
        `;
  }

  getSidebar() {
    return `
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">Quick Stats</h6>
                    <div class="stat-item mb-3">
                        <div class="text-muted small">Total Students</div>
                        <div class="h4">${state.stats.students || 0}</div>
                    </div>
                    <div class="stat-item mb-3">
                        <div class="text-muted small">Pending Approval</div>
                        <div class="h4 text-warning">${state.stats.pending || 0}</div>
                    </div>
                    <div class="stat-item mb-3">
                        <div class="text-muted small">Confirmed</div>
                        <div class="h4 text-success">${state.stats.confirmed || 0}</div>
                    </div>
                    <hr>
                    <button class="btn btn-primary w-100 mb-2" onclick="adminStudents.switchView('students')">
                        All Students
                    </button>
                    <button class="btn btn-warning w-100" onclick="adminStudents.switchView('pending')">
                        Pending (${state.stats.pending || 0})
                    </button>
                </div>
            </div>
        `;
  }

  getMainContent() {
    if (state.currentView === "pending") {
      return this.getPendingView();
    }
    return this.getStudentsView();
  }

  getStudentsView() {
    return `
            <div class="card">
                <div class="card-header bg-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">All Students</h5>
                        <input type="text" class="form-control w-25" id="searchStudents" placeholder="Search...">
                    </div>
                </div>
                <div class="card-body">
                    ${this.getStudentsTable()}
                </div>
            </div>
        `;
  }

  getStudentsTable() {
    if (state.students.length === 0) {
      return '<div class="text-center py-5 text-muted">No students yet</div>';
    }

    return `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Level</th>
                            <th>Class</th>
                            <th>Combination</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.students
                          .map(
                            (student) => `
                            <tr>
                                <td>${student.name}</td>
                                <td>${student.email}</td>
                                <td><span class="badge bg-info">${student.level || "-"}</span></td>
                                <td><span class="badge bg-secondary">${student.class?.toUpperCase() || "-"}</span></td>
                                <td>${student.combination || "-"}</td>
                                <td>
                                    ${
                                      student.isConfirmed
                                        ? '<span class="badge bg-success">Confirmed</span>'
                                        : '<span class="badge bg-warning">Pending</span>'
                                    }
                                    ${
                                      student.isActive
                                        ? '<span class="badge bg-success">Active</span>'
                                        : '<span class="badge bg-danger">Inactive</span>'
                                    }
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="adminStudents.viewStudent('${student.id}')">
                                        View
                                    </button>
                                    ${
                                      !student.isActive
                                        ? `<button class="btn btn-sm btn-success" onclick="adminStudents.activateStudent('${student.id}')">Activate</button>`
                                        : `<button class="btn btn-sm btn-warning" onclick="adminStudents.deactivateStudent('${student.id}')">Deactivate</button>`
                                    }
                                    <button class="btn btn-sm btn-danger" onclick="adminStudents.deleteStudent('${student.id}')">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `;
  }

  getPendingView() {
    return `
            <div class="card">
                <div class="card-header bg-warning text-dark">
                    <h5 class="mb-0">Pending Approval (${state.pendingStudents.length})</h5>
                </div>
                <div class="card-body">
                    ${this.getPendingTable()}
                </div>
            </div>
        `;
  }

  getPendingTable() {
    if (state.pendingStudents.length === 0) {
      return '<div class="text-center py-5 text-muted">No pending approvals</div>';
    }

    return `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Level</th>
                            <th>Class</th>
                            <th>Combination</th>
                            <th>Registered</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.pendingStudents
                          .map(
                            (student) => `
                            <tr>
                                <td>${student.name}</td>
                                <td>${student.email}</td>
                                <td><span class="badge bg-info">${student.level || "-"}</span></td>
                                <td><span class="badge bg-secondary">${student.class?.toUpperCase() || "-"}</span></td>
                                <td>${student.combination || "-"}</td>
                                <td>${new Date(student.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button class="btn btn-sm btn-success" onclick="adminStudents.approveStudent('${student.id}')">
                                        Approve
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="adminStudents.rejectStudent('${student.id}')">
                                        Reject
                                    </button>
                                </td>
                            </tr>
                        `,
                          )
                          .join("")}
                    </tbody>
                </table>
            </div>
        `;
  }

  switchView(view) {
    state.currentView = view;
    this.updateMainContent();
  }

  updateMainContent() {
    const mainContent = document.querySelector(".col-md-9");
    if (mainContent) {
      mainContent.innerHTML = this.getMainContent();
    }
  }

  async approveStudent(id) {
    if (!confirm("Approve this student?")) return;

    try {
      const res = await this.apiCall(`/users/${id}/approve`, {
        method: "PUT",
      });

      if (res.success) {
        alert("Student approved successfully");
        await this.loadData();
        this.updateMainContent();
        this.updateSidebar();
      } else {
        alert(res.message || "Failed to approve student");
      }
    } catch (err) {
      console.error("Approve error:", err);
      alert("Error approving student");
    }
  }

  async rejectStudent(id) {
    if (!confirm("Reject and delete this student account?")) return;

    try {
      const res = await this.apiCall(`/users/${id}/reject`, {
        method: "PUT",
      });

      if (res.success) {
        alert("Student rejected and deleted");
        await this.loadData();
        this.updateMainContent();
        this.updateSidebar();
      } else {
        alert(res.message || "Failed to reject student");
      }
    } catch (err) {
      console.error("Reject error:", err);
      alert("Error rejecting student");
    }
  }

  async deleteStudent(id) {
    if (!confirm("Permanently delete this student?")) return;

    try {
      const res = await this.apiCall(`/users/${id}`, {
        method: "DELETE",
      });

      if (res.success) {
        alert("Student deleted successfully");
        await this.loadData();
        this.updateMainContent();
        this.updateSidebar();
      } else {
        alert(res.message || "Failed to delete student");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting student");
    }
  }

  async activateStudent(id) {
    try {
      const res = await this.apiCall(`/users/${id}/activate`, {
        method: "PUT",
      });

      if (res.success) {
        alert("Student activated");
        await this.loadData();
        this.updateMainContent();
      } else {
        alert(res.message || "Failed to activate");
      }
    } catch (err) {
      console.error("Activate error:", err);
      alert("Error activating student");
    }
  }

  async deactivateStudent(id) {
    if (!confirm("Deactivate this student?")) return;

    try {
      const res = await this.apiCall(`/users/${id}/deactivate`, {
        method: "PUT",
      });

      if (res.success) {
        alert("Student deactivated");
        await this.loadData();
        this.updateMainContent();
      } else {
        alert(res.message || "Failed to deactivate");
      }
    } catch (err) {
      console.error("Deactivate error:", err);
      alert("Error deactivating student");
    }
  }

  viewStudent(id) {
    const student = state.students.find((s) => s.id === id);
    if (!student) return;

    alert(`
Student Details:
Name: ${student.name}
Email: ${student.email}
Level: ${student.level}
Class: ${student.class}
Combination: ${student.combination || "N/A"}
Status: ${student.isConfirmed ? "Confirmed" : "Pending"}
Active: ${student.isActive ? "Yes" : "No"}
        `);
  }

  updateSidebar() {
    const sidebar = document.querySelector(".col-md-3");
    if (sidebar) {
      sidebar.innerHTML = this.getSidebar();
    }
  }

  attachEventListeners() {
    const searchInput = document.getElementById("searchStudents");
    if (searchInput) {
      searchInput.addEventListener("input", (e) =>
        this.searchStudents(e.target.value),
      );
    }
  }

  searchStudents(term) {
    const rows = document.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(term.toLowerCase()) ? "" : "none";
    });
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/pages/login.html";
  }
}

let adminStudents;
window.addEventListener("DOMContentLoaded", () => {
  adminStudents = new AdminStudents();
});
