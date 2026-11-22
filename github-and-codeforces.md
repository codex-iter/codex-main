Developer API Reference: GitHub & Codeforces
This document outlines the core API endpoints required to fetch user data for building developer portfolio platforms.
1. GitHub API
Base URL: api . github . com
1.1. Get Basic User Profile
Endpoint: GET /users/{username}
Purpose: Retrieves core user details like avatar, follower counts, and bio.

Response Format (JSON):{

  "login": "octocat",

  "id": 1,

  "public_repos": 2,

  "followers": 20

}
1.2. Get User Repositories
Endpoint: GET /users/{username}/repos
Purpose: Fetches a list of the user's public repositories.

Response Format (JSON Array):[

  {

    "name": "Hello-World",

    "stargazers_count": 80,

    "language": "Ruby"

  }

]
2. Codeforces API
Base URL: codeforces . com
2.1. Get User Profile & Rating
Endpoint: GET /api/user.info?handles={username}
Purpose: Fetches current competitive programming rank and rating.

Response Format (JSON):{

  "status": "OK",

  "result": [

    {

      "handle": "tourist",

      "rating": 3979

    }

  ]

}
2.2. Get User Rating History
Endpoint: GET /api/user.rating?handle={username}
Purpose: Retrieves an array of rated contests the user participated in.

Response Format (JSON):{

  "status": "OK",

  "result": [

    {

      "contestName": "Beta Round 2",

      "newRating": 1602

    }

  ]

}
2.3. Get Solved Problems & Submissions
Endpoint: GET /api/user.status?handle={username}
Purpose: Retrieves a list of all submissions to calculate solved problems.

Response Format (JSON):{

  "status": "OK",

  "result": [

    {

      "problem": {

        "name": "Problem Name",

        "tags": ["math"]

      },

      "verdict": "OK"

    }

  ]

}

1.3. Get User Pull Requests
Endpoint: GET /search/issues?q=author:{username}+type:pr
Purpose: Fetches the total count and list of Pull Requests created by the user across all repositories. Highly useful for tracking open-source contributions.
Response Format (JSON):
{
  "total_count": 150,
  "items": [
    {
      "title": "Fix bug in authentication",
      "state": "closed",
      "pull_request": {
        "merged_at": "2026-09-01T12:00:00Z"
      }
    }
  ]
}
1.4. Get Total Commits (Search API)
Endpoint: GET /search/commits?q=author:{username}
Purpose: Retrieves the total number of commits made by the user across all public repositories. (Note: Requires Accept: application/vnd.github.cloak-preview+json header).
Response Format (JSON):
{
  "total_count": 1042,
  "items": [
    {
      "commit": {
        "message": "Initial commit",
        "author": { "date": "2026-08-01T10:00:00Z" }
      }
    }
  ]
}
1.5. Get Contribution Graph (GraphQL - Recommended for Codolio)
Endpoint: POST /graphql
Purpose: Best method to get exact daily commit counts, PRs, and issues (the "green squares" on GitHub).
Query Body: query { user(login: "username") { contributionsCollection { contributionCalendar { totalContributions } } } }

3. Codeforces API (Extended Details)
3.1. Get All Contests List
Endpoint: GET /api/contest.list?gym=false
Purpose: Fetch all past and upcoming Codeforces contests. Useful for showing the user what contests are coming next to keep them engaged on the platform.
Response Format (JSON):
{
  "status": "OK",
  "result": [
    {
      "id": 2000,
      "name": "Codeforces Round 999",
      "phase": "BEFORE",
      "startTimeSeconds": 1750000000
    }
  ]
}
3.2. Get User's Standing in a Specific Contest
Endpoint: GET /api/contest.standings?contestId={id}&handles={username}
Purpose: Fetch the user's specific rank, penalty, and solved problems for a single contest to display detailed contest analytics.
Response Format (JSON):
{
  "status": "OK",
  "result": {
    "rows": [
      {
        "rank": 45,
        "points": 3500,
        "penalty": 0,
        "successfulHackCount": 2
      }
    ]
  }
}

