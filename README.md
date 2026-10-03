# 🚀 Progress Tracker (PWA)

A comprehensive, production-grade **Habit & Fitness Tracking Web App** built with modern **Vanilla JavaScript, HTML5, CSS3**, featuring **Firebase Cloud Sync, Offline Guest Mode, PWA Installability, Real-Time GPS Running Tracking with Leaflet Maps**, and a dedicated **Winter Arc Challenge**.

Track your daily habits, build unbreakable streaks, map and record your runs, level up your avatar with XP, and conquer your goals 💪🔥

---

## 🌐 Live Demo & Repository

* **Live Web App:** [https://mohitshaw2406-pro.github.io/Progress-Tracker/](https://mohitshaw2406-pro.github.io/Progress-Tracker/)
* **Repository:** [https://github.com/mohitshaw2406-pro/Progress-Tracker](https://github.com/mohitshaw2406-pro/Progress-Tracker)

---

## 📱 Features

### 1. ✅ Habit Tracking & Management
* **Custom Habits:** Create, edit, and delete habits with custom names, sub-descriptions, emoji icons, and color palettes.
* **Quick Add:** Instant inline habit creation directly from the dashboard.
* **Daily Check-ins:** Interactive habit toggle cards with visual completion animations and daily completion percentages.
* **Sub-Tracker System (Advanced):** Attach sub-items (e.g. gym workout sets, reps, weights, or timed exercises) inside any habit with independent progress tracking.

### 2. 🔥 Streak System & Gamified XP
* **Dynamic Streaks:** Real-time current streak, best streak, and freeze/perfect day detection.
* **XP & Level Progression:** Earn XP for every habit and run completed, advancing through ranked titles from *Beginner Grinder* to *Unstoppable Legend*.
* **Unlockable Badges:** Earn milestone achievements including *First Step* 🎯, *Week Warrior* 🔥, *Consistency King* 👑, *Century Club* 💯, and *Beast Mode* 🦁.

### 3. 🏃 Real-Time GPS Running Tracker
* **Live GPS Tracking:** Accurate distance measurement using great-circle Haversine calculations and GPS accuracy filtering.
* **Real-Time Running Metrics:** Live elapsed time (wall-clock timestamp drift-free), distance (meters/km), average pace (min/km), and satellite status indicator (Active / Weak / Searching).
* **Interactive Route Maps:** Route recording rendered via Leaflet & OpenStreetMap with custom Start and Finish markers, interactive polyline route maps, and expandable fullscreen route modals.
* **Active Run Persistence & Background Recovery (Phase B1 & B2):**
  * Active run state saved to user-scoped local storage across page reloads.
  * Automatic foreground recovery: elapsed time updates immediately via wall-clock timestamps when returning to the app.
  * Baseline reset mechanism prevents artificial distance jumps or speed spikes after background browser suspension.
  * Automatic GPS watch suspension while in the background to save battery and eliminate orphaned processes.
* **Run History & Multi-Day Persistence:** Full history log with run route modal previews, individual run deletion, multi-day deduplicated ID merging, and offline save queueing.
* **Running Analytics & Personal Records (PRs):**
  * Total runs, total distance, overall average pace, fastest pace, longest run, and active running streak.
  * Personal Record trophy cards for Longest Run, Fastest Pace, Longest Duration, Most Active Day, Highest Week, and Most Active Month.

### 4. ❄️ Winter Arc Challenge (Oct 1 – Dec 31)
* **92-Day Seasonal Challenge:** Dedicated discipline tracking module for the Q4 Winter Arc grind.
* **Customizable Targets:** Set personal targets for Total Runs, Target Distance (km), Habit Completions, and Active Running Days.
* **Live Progress Rings:** Visual SVG progress rings, percentage completions, and days remaining countdown timer.
* **Daily Checklist:** Integrated daily habit check-off directly inside the Winter Arc tab.

### 5. 📊 Analytics & Insights Dashboard
* **GitHub-Style Consistency Heatmap:** Year-round activity heatmap with color-coded intensity reflecting daily completion rates.
* **Interactive Day Inspection:** Click any heatmap tile to inspect completed habits and historical performance for that day.
* **Weekly & Monthly Views:** Visual progress bars, day-by-day consistency breakdowns, and full monthly calendar grids.
* **Habit Insights:** Automatic identification of most active habit, overall consistency score, and habits needing attention.

### 6. ☁️ Dual Storage Architecture (Firebase & Guest Mode)
* **Firebase Cloud Sync:** Google Sign-in authentication with real-time Firestore database synchronization across mobile, desktop, and tablets.
* **Instant Guest Mode:** Full app functionality with isolated, persistent `localStorage` for privacy-conscious users without requiring sign-in.
* **Multi-User Isolation:** Strict separation of data, active runs, and settings between Guest sessions and individual Firebase user accounts.

### 7. 📲 Progressive Web App (PWA)
* **Installable:** Native-like experience with install prompt on Android, iOS, Windows, and macOS ("Add to Home Screen").
* **Service Worker Caching:** Fast asset caching and reliable performance.
* **Responsive Design:** Dark-themed UI optimized for mobile touch screens, tablets, and desktop viewports.

---

## 🛠️ Tech Stack

* **Frontend:** Vanilla JavaScript (ES6+ Modules), HTML5, CSS3 (Modern Flexbox & CSS Grid)
* **Maps & Mapping:** Leaflet.js, OpenStreetMap
* **Backend & Cloud:** Node.js, Express (Static Web Server)
* **Database & Auth:** Google Firebase (Firebase Authentication, Cloud Firestore)
* **PWA:** Web App Manifest (`manifest.json`), Service Worker (`sw.js`)

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/) (bundled with Node.js)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mohitshaw2406-pro/Progress-Tracker.git
   cd Progress-Tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local server:**
   ```bash
   npm start
   ```
   The app will run at `http://localhost:3000`.

4. **Run code checks / linting:**
   ```bash
   npm run lint
   ```

---

## 📂 Project Structure

```text
Progress-Tracker/
├── index.html                    # Single-page application markup & modals
├── script.js                     # Core application logic, GPS engine, sync & stats
├── style.css                     # Dark-mode styling, responsive layouts & animations
├── server.js                     # Express server for local development & deployment
├── sw.js                         # Service worker for offline asset caching
├── manifest.json                 # Web App Manifest for PWA installation
├── package.json                  # Project metadata, scripts, and dependencies
├── metadata.json                 # AI Studio configuration & permissions
├── .env.example                  # Environment configuration template
├── progress-tracker-icon-192.png # PWA app icon (192x192)
├── progress-tracker-icon-512.png # PWA app icon (512x512)
└── README.md                     # Project documentation
```

---

## ⚙️ How to Use

1. **Choose an Account Mode:**
   * Click **Sign in with Google** to sync data across all your devices via Firebase.
   * Or click **Continue as Guest** to start tracking immediately with local device storage.
2. **Set Up Habits:**
   * Navigate to the **Habits** tab to customize existing habits or add new ones.
   * Add workout sub-items (e.g. Bench Press, Squats, Running) to track specific sets and reps.
3. **Log Daily Progress:**
   * Check off habits on the **Today** screen to build streaks and earn XP.
4. **Track a Run:**
   * Switch to the **🏃 Run** tab, tap **Start Run**, and allow location permissions.
   * View live distance, pacing, duration, and your GPS track. Tap **Finish** and **Save** to add it to your Run History.
5. **Join the Winter Arc:**
   * Open the **❄️ Winter** tab to set custom Q4 targets and watch your progress rings fill up.

---

## 🗺️ Roadmap & Planned Features

The following features are planned for future releases:

* [ ] Push Notifications for daily habit reminders 🔔
* [ ] Data Export & Backup (CSV / JSON format) 📄
* [ ] Social Leaderboard & Friend Activity Feed 🏆
* [ ] Custom theme accents (Violet, Emerald, Amber, Crimson) 🎨
* [ ] GPX / Strava workout export 🚴

---

## 👨‍💻 Author

Built with dedication by **[Mohit Shaw](https://github.com/mohitshaw2406-pro)** 💪🔥

---

## ⭐ Support

If you find Progress Tracker helpful:
* Star ⭐ the [GitHub repository](https://github.com/mohitshaw2406-pro/Progress-Tracker)
* Share it with friends and fellow grinders
* Keep showing up every single day 🚀

