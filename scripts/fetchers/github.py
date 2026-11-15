import os
import logging
import asyncio
import aiohttp
from .utils import safe_fetch, _safe_int

log = logging.getLogger(__name__)

gh_search_semaphore = asyncio.Semaphore(1)

async def fetch_github(session: aiohttp.ClientSession, handle: str) -> dict:
    """
    Fetch GitHub contributions, public repo count, PRs, and Issues.
    """
    token = os.environ.get("GH_PAT") or os.environ.get("LEADERBOARD_GH_PAT") or ""
    headers = {"Content-Type": "application/json"}
    rest_headers = {"Accept": "application/vnd.github.v3+json"}
    
    if token:
        headers["Authorization"] = f"bearer {token}"
        rest_headers["Authorization"] = f"token {token}"

    query = """
    query($login: String!) {
      user(login: $login) {
        repositories(privacy: PUBLIC) { totalCount }
        contributionsCollection {
          contributionCalendar { totalContributions }
        }
      }
    }
    """
    
    import urllib.parse
    encoded_handle = urllib.parse.quote(handle)
    
    pr_url = f"https://api.github.com/search/issues?q=author:{encoded_handle}+type:pr"
    issue_url = f"https://api.github.com/search/issues?q=author:{encoded_handle}+type:issue"

    async def _fetch_graphql():
        return await safe_fetch(
            session,
            "https://api.github.com/graphql",
            method="POST",
            headers=headers,
            json_body={"query": query, "variables": {"login": handle}},
        )
    
    async def _fetch_rest(url):
        async with gh_search_semaphore:
            try:
                return await safe_fetch(session, url, method="GET", headers=rest_headers)
            finally:
                await asyncio.sleep(2.0)

    gql_data, pr_data, issue_data = await asyncio.gather(
        _fetch_graphql(),
        _fetch_rest(pr_url),
        _fetch_rest(issue_url),
        return_exceptions=True
    )
    
    gql_ok = bool(
        not isinstance(gql_data, Exception)
        and gql_data
        and gql_data.get("data", {}).get("user") is not None
    )
    prs_ok = bool(
        not isinstance(pr_data, Exception)
        and pr_data
        and "total_count" in pr_data
    )
    issues_ok = bool(
        not isinstance(issue_data, Exception)
        and issue_data
        and "total_count" in issue_data
    )

    result = {
        "github_contributions": 0,
        "github_repos": 0,
        "github_prs": 0,
        "github_issues": 0,
        "_gql_ok": gql_ok,
        "_prs_ok": prs_ok,
        "_issues_ok": issues_ok,
        "_fetch_ok": gql_ok,
    }

    if not isinstance(gql_data, Exception) and gql_data:
        user = gql_data.get("data", {}).get("user") or {}
        contributions = (
            user.get("contributionsCollection", {})
                .get("contributionCalendar", {})
                .get("totalContributions", 0)
        )
        repos = user.get("repositories", {}).get("totalCount", 0)
        result["github_contributions"] = _safe_int(contributions)
        result["github_repos"] = _safe_int(repos)
        
    if not isinstance(pr_data, Exception) and pr_data:
        result["github_prs"] = _safe_int(pr_data.get("total_count", 0))
        
    if not isinstance(issue_data, Exception) and issue_data:
        result["github_issues"] = _safe_int(issue_data.get("total_count", 0))

    log.info("    ✓ GitHub       -> %s", result)
    return result
