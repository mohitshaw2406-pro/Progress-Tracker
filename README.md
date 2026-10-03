# 🚀 Progress Tracker

### Build Consistency. Track Progress. Become Better.

A personal productivity and habit-tracking Progressive Web App designed to help you build better routines, monitor daily performance, and turn small actions into long-term progress.

Progress Tracker combines habit management, streak tracking, gamified milestones, performance insights, and an evolving running experience in one application.

<p align="center">
  <a href="https://progress-tracker-flame-omega.vercel.app"><strong>🌐 Live Demo</strong></a> ·
  <a href="https://github.com/mohitshaw2406-pro/Progress-Tracker"><strong>📂 Source Code</strong></a>
</p>

---

## ✨ Overview

Building a habit is easy. Staying consistent is the challenge.

Progress Tracker provides a structured space to:

* Organize daily habits.
* Monitor completion and consistency.
* Visualize personal progress.
* Track streaks and achievements.
* Review performance over time.
* Build a more intentional daily routine.

The application follows a mobile-first approach and supports installation as a Progressive Web App.

---

## 🌟 Features

### 🎯 Habit Management

* Create, edit, and delete habits.
* Mark daily habits as complete.
* View completion status and recent activity.
* Organize habits with individual icons and colors.

### 🔥 Streaks & Gamification

* Track consecutive activity streaks.
* Earn XP through habit completion.
* Progress through levels and titles.
* Unlock milestone badges.
* Celebrate achievements with interactive feedback.

### 📊 Progress & Analytics

* Daily progress overview.
* Weekly and monthly activity visualization.
* GitHub-style activity heatmap.
* Habit performance insights.
* Personal records.
* Interactive heatmap details.

### 🧩 Sub-Tracker

Break larger habits into smaller actionable steps.

* Create sub-items inside habits.
* Track individual completion.
* Monitor sub-task progress.

### ⚡ Today Command Center

A centralized daily overview featuring:

* Today's completion percentage.
* Completed and remaining habits.
* Current streak.
* Dynamic progress visualization.
* Completion state and feedback.

### 🏃 Run Tracker

An evolving running feature with a session state machine:

* Idle
* Running
* Paused
* Finished

The current implementation focuses on session controls and run-state handling.

> GPS-based route tracking, distance measurement, and pace analytics are future development goals, not current advertised capabilities.

### 📱 Progressive Web App

* Installable on supported devices.
* Web app manifest.
* Service worker integration.
* Mobile-friendly experience.
* App-like access from the home screen.

---

## 🛠️ Technology Stack

| Technology              | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| HTML5                   | Application structure                     |
| CSS3                    | Styling and responsive interface          |
| Vanilla JavaScript      | Application logic and interactions        |
| Firebase Authentication | User authentication                       |
| Cloud Firestore         | Cloud data storage and synchronization    |
| Express.js              | Node.js application server                |
| PWA                     | Installability and service worker support |
| Vercel                  | Application deployment                    |

---

## 🏗️ Project Structure

```text
Progress-Tracker/
│
├── index.html
├── style.css
├── script.js
├── server.js
├── sw.js
├── manifest.json
├── metadata.json
├── package.json
├── .env.example
│
├── progress-tracker-icon-192.png
└── progress-tracker-icon-512.png
```

---

## ⚙️ Run Locally

### Prerequisites

* Node.js
* npm
* Git

### 1. Clone the repository

```bash
git clone https://github.com/mohitshaw2406-pro/Progress-Tracker.git
```

### 2. Navigate to the project

```bash
cd Progress-Tracker
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment

Create a `.env` file using `.env.example` as a reference.

```env
PORT=3000
FIREBASE_API_KEY=your_firebase_api_key
```

Configure the Firebase client settings required by the application. Never commit private credentials or service account secrets.

### 5. Start the application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 📦 Available Scripts

| Command         | Description                            |
| --------------- | -------------------------------------- |
| `npm run dev`   | Start the Express server               |
| `npm start`     | Start the application                  |
| `npm run build` | Static application readiness check     |
| `npm run lint`  | Run the configured server syntax check |

---

## 🔐 Data & Authentication

The application integrates Firebase Authentication and Cloud Firestore for user authentication and cloud-backed data functionality.

The application uses Firebase user identity to associate user data with the authenticated account.

Firebase configuration must be supplied through the appropriate environment configuration.

---

## 🚀 Deployment

The project has a Vercel deployment configuration through its Node.js/Express entry point.

Live application:

**[Progress Tracker — Open App](https://progress-tracker-flame-omega.vercel.app)**

---

## 🗺️ Future Roadmap

Planned areas of development include:

* [ ] GPS-based running sessions.
* [ ] Distance, duration, and pace analytics.
* [ ] Enhanced running history.
* [ ] Additional personal insights.
* [ ] Data export options.
* [ ] Further PWA improvements.

Roadmap items are planned enhancements and are not represented as completed functionality.

---

## 👨‍💻 Author

**Mohit Kumar Shaw**

B.Tech CSE (Data Science) Student | Developer

* GitHub: [@mohitshaw2406-pro](https://github.com/mohitshaw2406-pro)
* LinkedIn: [Mohit Shaw](https://www.linkedin.com/in/mohit-shaw-17007a345)

---

## 💡 Project Philosophy

Progress is not always about doing something extraordinary.

Sometimes, it is simply about showing up again tomorrow.

**Track the effort. Respect the process. Keep progressing.** 🚀

---

<p align="center">
  ⭐ If you find this project interesting, consider giving the repository a star!
</p>
