# CODEX Official Website

Welcome to the official website repository of **CODEX**. This project serves as the digital presence of the CODEX community and is actively maintained by the CODEX Development Team and Coordinators.

---

## ⚔️ Activity Tracker: Leaderboard & Arena Architecture

The CODEX platform features a real-time, automated competitive coding and open-source tracking engine:
- **The Leaderboard (The Code Colosseum):** Lifetime standings, 1,200 bounded developer score, contest ratings, and global consistency tracking.
- **The Arena:** Dynamic monthly combat league with daily growth deltas, division clashes (DSA vs DEV), anti-spam backfill detection, transparent per-platform breakdowns (LC, CF, CC, GFG), and real-time Threat Radar.

👉 **[Read the Comprehensive Leaderboard & Arena Architecture Manual (ARENA_AND_LEADERBOARD_README.md)](./ARENA_AND_LEADERBOARD_README.md)** for the complete breakdown of the tech stack, web scrapers, mathematical scoring formulas, Supabase schemas, and GitHub Actions CI/CD pipeline.

---

## Contributing to CODEX

We welcome contributions from community members. To maintain code quality and an organized workflow, all contributors must follow the contribution process outlined below.

## Contribution Workflow

### 1. Select an Issue

Before starting development:

* Navigate to the **Issues** section of the repository.
* Choose an open issue that you would like to work on.
* Ensure the issue has not already been assigned or claimed by another contributor.
* Contact the CODEX Coordinators if any clarification is required.

---

### 2. Sync Your Local Repository

Ensure your local repository is up to date before creating a new branch.

```bash
git checkout main
git pull codex main
```

### 3. Create a Feature Branch

Contributors must never work directly on the `main` branch.

Create a dedicated branch for your issue:

```bash
git checkout -b feature/issue-name
```

Examples:

```bash
git checkout -b feature/team-page
git checkout -b feature/event-registration
git checkout -b fix/navbar-bug
```

---

### 4. Implement Your Changes

Develop your assigned feature or bug fix while following the existing project structure, coding standards, and best practices.

---

### 5. Commit Your Changes

Use clear and meaningful commit messages.

```bash
git add .
git commit -m "feat: implement event registration page"
```

Examples:

```bash
git commit -m "feat: add team member cards"
git commit -m "fix: resolve mobile navbar overflow"
git commit -m "docs: update contribution guidelines"
```

---

### 6. Push to the CODEX Repository

Push your branch to the **CODEX repository remote (`codex`)**.

```bash
git push codex feature/issue-name
```

**Important**

❌ Do NOT push to `origin`

```bash
git push origin feature/issue-name
```

✅ Always push to `codex`

```bash
git push codex feature/issue-name
```

---

### 7. Create a Pull Request

After successfully pushing your branch:

1. Open the repository on GitHub.
2. Create a Pull Request.
3. Set:

```text
Base Branch: main
Compare Branch: your-feature-branch
```

4. Clearly describe:

   * The issue being addressed
   * The changes implemented
   * Any testing performed

---

## Pull Request Review Process

All Pull Requests are reviewed by the **CODEX Coordinators**.

The coordinators are responsible for:

* Reviewing code quality
* Verifying functionality
* Ensuring adherence to project standards
* Requesting modifications when necessary
* Approving and merging Pull Requests

Please note that submission of a Pull Request does not guarantee immediate acceptance.

---

## Branch Protection Rules

The following practices must be followed:

* No direct commits to `main`
* No direct pushes to `main`
* All changes must be submitted through Pull Requests
* Contributors must work on separate branches
* All Pull Requests are subject to coordinator review

---

## Development Best Practices

* Follow existing project architecture.
* Write clean and maintainable code.
* Keep Pull Requests focused on a single issue.
* Test changes before submission.
* Use descriptive commit messages.
* Maintain professional communication throughout the contribution process.

---

## Need Help?

If you encounter issues during development or require clarification regarding a task, please reach out to the CODEX Coordinators through the repository discussions, issues section, or official communication channels.

---

Thank you for contributing to the **CODEX Official Website** and helping us build a better platform for the community.
