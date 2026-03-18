# Nsoma DigLibs — Notes Management System

A **serverless, offline-first Notes Management System** built for Ugandan schools following the **UNEB curriculum** (O-Level & A-Level). Runs as a native desktop app on **Windows** and a native mobile app on **Android** — no internet, no server setup required.

---

## ✨ Features

- 📚 **Notes & Resources** — Admins upload notes and resources (PDF, video, etc.) per subject and class level.
- 📝 **Quizzes** — Teachers create quizzes; students take them directly in the app.
- 👩‍🎓 **Student Accounts** — Students register, browse notes, and track their subjects.
- 🔐 **Admin Panel** — Teachers/Admins manage users, subjects, streams, and content.
- 📶 **LAN Access** — Run on a lab PC and let students connect via browser on the same network.
- 📲 **Android App** — Native Android build via Capacitor.
- 🖥️ **Windows App** — Native Windows executable via Electron.
- 🗄️ **Serverless SQLite** — No external database required. Everything is stored locally in a single SQLite file.

---

## 🛠️ Tech Stack

| Layer    | Technology                     |
| -------- | ------------------------------ |
| Frontend | HTML5, Vanilla CSS, JavaScript |
| Backend  | Node.js + Express              |
| Database | SQLite (via Sequelize ORM)     |
| Desktop  | Electron                       |
| Mobile   | Capacitor (Android)            |
| PWA      | Service Worker                 |

---

## 🚀 Getting Started (Development)

### Prerequisites

- **Node.js** v18 or higher
- **npm**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/D-J-Software-Engineers/Notes-Management-System.git
cd Notes-Management-System

# 2. Install dependencies
npm install

# 3. Seed the default admin account
npm run seed

# 4. Start the development server
npm run dev
```

The app will be available at **[http://localhost:5000](http://localhost:5000)**.

> **Default Admin Credentials**
>
> - **Email:** `admin@school.com`
> - **Password:** `Admin@123`

---

## 🌐 LAN Access (School ICT Lab)

To let students connect from other computers on the same network:

1. Find your server PC's IP address:
   ```bash
   hostname -I   # Linux/Mac
   ipconfig      # Windows
   ```
2. Students open a browser and navigate to `http://<SERVER_IP>:5000`.

---

## 🖥️ Windows Desktop App

Run the app as a standalone Windows executable (no browser needed):

```bash
# Run in Electron during development
npm run electron:start

# Build a Windows installer / portable executable
npm run electron:build
```

The built installer and portable `.exe` will be found in the `dist/` folder.

---

## 📱 Android App

The Android app is built with **Capacitor**:

```bash
# Sync web assets to the Android project
npx cap sync android

# Open in Android Studio to build & run
npx cap open android
```

---

## 📂 Project Structure

```
├── client/              # Frontend (HTML, CSS, JS, Service Worker)
│   ├── public/          # Static assets served by Express
│   └── pages/           # HTML page files
├── server/              # Express backend
│   ├── controllers/     # Route handlers
│   ├── models/          # Sequelize models (SQLite)
│   ├── routes/          # API route definitions
│   ├── middleware/      # Auth, error handling
│   ├── utils/           # DB seeder and helpers
│   └── server.js        # App entry point
├── android/             # Capacitor Android project
├── main.js              # Electron main process
├── database.sqlite      # Local SQLite database (auto-created)
└── uploads/             # Uploaded notes and resources
```

---

## 📜 Available Scripts

| Command                  | Description                              |
| ------------------------ | ---------------------------------------- |
| `npm run dev`            | Start development server with hot-reload |
| `npm start`              | Start production server                  |
| `npm run seed`           | Seed the database with the admin account |
| `npm run electron:start` | Launch the Electron desktop app          |
| `npm run electron:build` | Build the Windows installer/portable exe |

---

## 🔒 Security Notes

- Admin registration is **disabled** for public users. Only the seeded admin account can create other admins.
- File uploads are validated to prevent malicious files.
- JWT-based authentication is used for all API routes.
- CORS is restricted to `localhost` and local network (`192.168.x.x`) addresses.

---

## 📄 License

MIT © [D-J Software Engineers](https://github.com/D-J-Software-Engineers)
