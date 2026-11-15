def calculate_score(snapshot: dict) -> dict:
    """
    Calculates a bounded CODEX Developer Score out of 1200.
    Enforces a perfectly balanced 500/500 split between DSA and Development,
    with a 200 point Consistency Bonus.
    """

    # ---------------------------------------------------------
    # 1. DSA SCORE (Max 500 Points)
    # ---------------------------------------------------------
    # Ratings (Max 250 pts)
    # Codeforces (Max 100 pts): Base 800, Target 2000
    cf_rating = snapshot.get("codeforces_max_rating") or snapshot.get("codeforces_rating") or 0
    cf_pts = min(100.0, (max(0, cf_rating - 800) / 1200.0) * 100.0)

    # LeetCode (Max 100 pts): Base 1400, Target 2200
    lc_rating = snapshot.get("leetcode_max_rating") or 0
    lc_pts = min(100.0, (max(0, lc_rating - 1400) / 800.0) * 100.0)

    # CodeChef (Max 50 pts): Base 1000, Target 2000
    cc_rating = snapshot.get("codechef_max_rating") or snapshot.get("codechef_rating") or 0
    cc_pts = min(50.0, (max(0, cc_rating - 1000) / 1000.0) * 50.0)

    rating_score = cf_pts + lc_pts + cc_pts

    # Volume (Max 150 pts)
    # LeetCode weighted (Max 75 pts) - Target: 1500 weighted points
    lc_weight = (
        (snapshot.get("leetcode_easy") or 0) * 1 +
        (snapshot.get("leetcode_medium") or 0) * 3 +
        (snapshot.get("leetcode_hard") or 0) * 6
    )
    lc_solved_pts = min(75.0, (lc_weight / 1500.0) * 75.0)

    # Codeforces (Max 50 pts) - Target: 250 problems
    cf_solved = snapshot.get("codeforces_solved") or 0
    cf_solved_pts = min(50.0, (cf_solved / 250.0) * 50.0)

    # GFG/CodeChef/HackerRank (Max 25 pts) - Target: 300 combined
    # Weighted by difficulty: School (0.15) < Basic (0.5) < Easy (1.0) < Medium (3.0) < Hard (6.0)
    gfg_breakdown_sum = (
        (snapshot.get("gfg_school") or 0) +
        (snapshot.get("gfg_basic") or 0) +
        (snapshot.get("gfg_easy") or 0) +
        (snapshot.get("gfg_medium") or 0) +
        (snapshot.get("gfg_hard") or 0)
    )
    if gfg_breakdown_sum == 0 and (snapshot.get("gfg_solved") or 0) > 0:
        # Fallback when difficulty breakdown is unavailable from the scraper
        gfg_weight = (snapshot.get("gfg_solved") or 0) * 1.5
    else:
        gfg_weight = (
            (snapshot.get("gfg_school") or 0) * 0.15 +
            (snapshot.get("gfg_basic") or 0) * 0.5 +
            (snapshot.get("gfg_easy") or 0) * 1.0 +
            (snapshot.get("gfg_medium") or 0) * 3.0 +
            (snapshot.get("gfg_hard") or 0) * 6.0
        )

    cc_solved = (snapshot.get("codechef_solved") or 0) * 2.0
    hr_badges = snapshot.get("hackerrank_badges") or 0

    other_volume = gfg_weight + cc_solved + (hr_badges * 5.0)
    other_volume_pts = min(25.0, (other_volume / 300.0) * 25.0)

    solved_score = lc_solved_pts + cf_solved_pts + other_volume_pts

    # Contests (Max 100 pts) - Target: 50 contests
    contests = snapshot.get("contests_attended") or 0
    contest_pts = min(100.0, (contests / 50.0) * 100.0)

    dsa_score = min(500.0, rating_score + solved_score + contest_pts)


    # ---------------------------------------------------------
    # 2. DEV SCORE (Max 500 Points)
    # ---------------------------------------------------------
    # Commits (Max 100 pts) - Target: 1000 commits (0.1 pts/commit)
    gh_commits = snapshot.get("valid_github_commits") or 0
    commits_pts = min(100.0, (gh_commits / 1000.0) * 100.0)

    # Repos (Max 150 pts) - Target: 30 repos (5.0 pts/repo)
    gh_repos = snapshot.get("github_repos") or 0
    repos_pts = min(150.0, (gh_repos / 30.0) * 150.0)

    # PRs (Max 175 pts) - Target: 20 PRs
    gh_prs = snapshot.get("github_prs") or 0
    prs_pts = min(175.0, (gh_prs / 20.0) * 175.0)

    # Issues (Max 75 pts) - Target: 25 issues
    gh_issues = snapshot.get("github_issues") or 0
    issues_pts = min(75.0, (gh_issues / 25.0) * 75.0)

    dev_score = min(500.0, commits_pts + repos_pts + prs_pts + issues_pts)


    # ---------------------------------------------------------
    # 3. CONSISTENCY BONUS (Max 200 Points)
    # ---------------------------------------------------------
    active_days = snapshot.get("active_days") or 0        # Target: 150 active days
    max_streak = snapshot.get("max_streak") or 0          # Target: 30 day streak

    days_pts = min(100.0, (active_days / 150.0) * 100.0)
    streak_pts = min(100.0, (max_streak / 30.0) * 100.0)

    consistency_score = min(200.0, days_pts + streak_pts)

    # ---------------------------------------------------------
    # TOTAL SCORE AGGREGATION
    # ---------------------------------------------------------
    total = dsa_score + dev_score + consistency_score
    
    return {
        "dsa_score": round(float(dsa_score), 2),
        "dev_score": round(float(dev_score), 2),
        "total_score": round(float(total), 2)
    }
