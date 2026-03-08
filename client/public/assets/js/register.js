const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : `http://${window.location.hostname}:5000/api`;

const combinationsByStream = {}; // Now dynamically generated from subjects

class RegisterPage {
  constructor() {
    this.formData = {
      level: "",
      class: "",
      combination: "",
      classStream: "",
      stream: "",
      selectedSubjects: [],
    };
    this.render();
  }

  render() {
    const styles = `
            <style>
                body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px 0; }
                .register-card { max-width: 600px; margin: 0 auto; border-radius: 15px; border: none; }
                .subject-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
                .subject-item { border: 1px solid #ddd; padding: 10px; border-radius: 5px; cursor: pointer; transition: all 0.2s; }
                .subject-item:hover { border-color: #667eea; background: #f8faff; }
                .subject-item.selected { border-color: #667eea; background: #667eea; color: white; }
                .subject-item.disabled { opacity: 0.5; cursor: not-allowed; }
            </style>
        `;

    document.head.insertAdjacentHTML("beforeend", styles);
    document.getElementById("app").innerHTML = this.getLayout();
    this.attachEvents();
  }

  getLayout() {
    return `
            <div class="container">
                <div class="card register-card shadow-lg">
                    <div class="card-body p-5">
                        <div style="text-align: center; margin-bottom: 1.5rem">
                           <h2 style="color: #333;">Nsoma DigLibs</h2>
                           <p class="text-muted">Create your student account</p>
                        </div>
                        <div id="error" class="alert alert-danger d-none"></div>
                        <form id="registerForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Full Name</label>
                                    <input type="text" class="form-control" id="name" required placeholder="Enter full name">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" id="email" required placeholder="email@example.com">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" id="password" required minlength="6" placeholder="At least 6 characters">
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Level</label>
                                    <select class="form-select" id="level" required>
                                        <option value="">Select Level</option>
                                        <option value="o-level">O-Level</option>
                                        <option value="a-level">A-Level</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Class</label>
                                    <select class="form-select" id="class" required disabled>
                                        <option value="">Select Level First</option>
                                    </select>
                                </div>
                            </div>

                            <!-- O-Level: Class Stream -->
                            <div class="mb-3 d-none" id="classStreamGroup">
                                <label class="form-label">Class Stream / Section</label>
                                <select class="form-select" id="classStream">
                                    <option value="">Select Stream</option>
                                </select>
                                <small class="text-muted">e.g. S1 A, S1 B</small>
                            </div>

                            <!-- A-Level: Stream (Arts/Sciences) -->
                            <div class="mb-3 d-none" id="streamGroup">
                                <label class="form-label">Academic Stream</label>
                                <select class="form-select" id="stream">
                                    <option value="">Select Stream</option>
                                    <option value="science">Sciences</option>
                                    <option value="arts">Arts</option>
                                </select>
                            </div>

                            <!-- A-Level: Subject Selection -->
                            <div class="mb-4 d-none" id="subjectSelectionGroup">
                                <label class="form-label">Select 3 Principal Subjects</label>
                                <div id="subjectGrid" class="subject-grid">
                                    <!-- Subjects injected here -->
                                </div>
                                <div class="mt-2">
                                    <small id="selectionCount" class="text-primary font-weight-bold">Selected: 0/3</small>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary w-100 py-2" id="submitBtn">Create Account</button>
                        </form>
                        <div class="text-center mt-4">
                            <span class="text-muted">Already have an account?</span> <a href="/pages/login.html" style="text-decoration: none; font-weight: 600;">Login here</a>
                        </div>
                        <div class="text-center mt-3">
                            <a href="/pages/login.html" class="btn btn-outline-secondary btn-sm" style="border-radius: 20px; padding: 5px 20px;">← Back to Login</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  attachEvents() {
    document
      .getElementById("level")
      .addEventListener("change", (e) =>
        this.handleLevelChange(e.target.value),
      );
    document
      .getElementById("class")
      .addEventListener("change", (e) =>
        this.handleClassChange(e.target.value),
      );
    document
      .getElementById("stream")
      .addEventListener("change", (e) =>
        this.handleStreamChange(e.target.value),
      );
    document
      .getElementById("registerForm")
      .addEventListener("submit", (e) => this.handleSubmit(e));
  }

  handleLevelChange(level) {
    const classSelect = document.getElementById("class");
    classSelect.disabled = !level;
    classSelect.innerHTML = '<option value="">Select Class</option>';

    // Hide everything else
    document.getElementById("classStreamGroup").classList.add("d-none");
    document.getElementById("streamGroup").classList.add("d-none");
    document.getElementById("subjectSelectionGroup").classList.add("d-none");

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

  async handleClassChange(classVal) {
    const level = document.getElementById("level").value;
    if (level === "o-level" && classVal) {
      document.getElementById("classStreamGroup").classList.remove("d-none");
      await this.fetchClassStreams(classVal);
    } else if (level === "a-level" && classVal) {
      document.getElementById("streamGroup").classList.remove("d-none");
    }
  }

  async fetchClassStreams(classVal) {
    const streamSelect = document.getElementById("classStream");
    streamSelect.innerHTML = '<option value="">Loading...</option>';

    try {
      const res = await fetch(`${API_URL}/streams?class=${classVal}`);
      const data = await res.json();
      const streams = data.data || [];

      streamSelect.innerHTML = '<option value="">Select Stream</option>';
      if (streams.length === 0) {
        streamSelect.innerHTML +=
          '<option value="General">General Stream</option>';
      } else {
        streams.forEach((s) => {
          streamSelect.innerHTML += `<option value="${s.name}">${s.name}</option>`;
        });
      }
    } catch (err) {
      console.error("Failed to fetch streams", err);
      streamSelect.innerHTML =
        '<option value="">Error loading streams</option>';
    }
  }

  async handleStreamChange(stream) {
    if (!stream) {
      document.getElementById("subjectSelectionGroup").classList.add("d-none");
      return;
    }
    document.getElementById("subjectSelectionGroup").classList.remove("d-none");
    await this.fetchSubjectsForAlevel(stream);
  }

  async fetchSubjectsForAlevel(stream) {
    const grid = document.getElementById("subjectGrid");
    grid.innerHTML = '<div class="col-span-2 text-center">Loading...</div>';
    this.formData.selectedSubjects = [];
    this.updateSelectionUI();

    try {
      // Get A-Level subjects for this stream
      // User picks 3.
      const res = await fetch(
        `${API_URL}/subjects?level=a-level&stream=${stream}`,
      );
      const data = await res.json();
      const subjects = data.data || [];

      if (subjects.length === 0) {
        grid.innerHTML =
          '<div class="col-span-2 text-center text-muted">No subjects found for this stream.</div>';
        return;
      }

      grid.innerHTML = subjects
        .map(
          (s) => `
            <div class="subject-item" data-id="${s.id}">
                <strong>${s.code || s.name}</strong><br>
                <small>${s.code ? s.name : ""}</small>
            </div>
        `,
        )
        .join("");

      // Add click events to items
      grid.querySelectorAll(".subject-item").forEach((item) => {
        item.addEventListener("click", () => this.toggleSubject(item));
      });
    } catch (err) {
      grid.innerHTML =
        '<div class="text-danger">Failed to load subjects.</div>';
    }
  }

  toggleSubject(item) {
    const id = item.getAttribute("data-id");
    const index = this.formData.selectedSubjects.indexOf(id);

    if (index > -1) {
      // De-select
      this.formData.selectedSubjects.splice(index, 1);
      item.classList.remove("selected");
    } else {
      // Select if not at limit
      if (this.formData.selectedSubjects.length < 5) {
        this.formData.selectedSubjects.push(id);
        item.classList.add("selected");
      }
    }

    this.updateSelectionUI();
  }

  updateSelectionUI() {
    const count = this.formData.selectedSubjects.length;
    document.getElementById("selectionCount").textContent =
      `Selected: ${count}/5`;

    // Disable unselected items if at 3
    const gridItems = document.querySelectorAll(".subject-item");
    gridItems.forEach((item) => {
      const id = item.getAttribute("data-id");
      if (count >= 5 && !this.formData.selectedSubjects.includes(id)) {
        item.classList.add("disabled");
      } else {
        item.classList.remove("disabled");
      }
    });
  }

  async handleSubmit(e) {
    e.preventDefault();

    const level = document.getElementById("level").value;
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const classVal = document.getElementById("class").value;

    if (level === "a-level" && this.formData.selectedSubjects.length === 0) {
      return this.showError("Please select at least one subject.");
    }

    const payload = {
      name,
      email,
      password,
      level,
      class: classVal,
    };

    if (level === "o-level") {
      payload.classStream = document.getElementById("classStream").value;
    } else {
      payload.stream = document.getElementById("stream").value;
      payload.selectedSubjects = this.formData.selectedSubjects;
    }

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Registering...";

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        alert(
          "Registration successful! Your account is pending admin approval.",
        );
        window.location.href = "/pages/login.html";
      } else {
        this.showError(data.message || "Registration failed");
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Create Account";
      }
    } catch (err) {
      this.showError("Network error. Please try again.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Create Account";
    }
  }

  showError(message) {
    const errorDiv = document.getElementById("error");
    errorDiv.textContent = message;
    errorDiv.classList.remove("d-none");
    errorDiv.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => errorDiv.classList.add("d-none"), 5000);
  }
}

window.addEventListener("DOMContentLoaded", () => new RegisterPage());

window.addEventListener("DOMContentLoaded", () => new RegisterPage());
