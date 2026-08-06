"""
GitHub Trending scraper – fetches top trending repositories for a given language.
Used by the Opportunity Neglect Agent to detect trending skills.
"""
import requests
from bs4 import BeautifulSoup


def fetch_trending(language: str = "", since: str = "daily") -> list[dict]:
    """
    Scrape GitHub Trending page and return a list of repositories.
    Each item: { name, description, language, stars_today }
    """
    url = "https://github.com/trending"
    if language:
        url += f"/{language.lower().replace(' ', '-')}"
    url += f"?since={since}"

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; TriGrowthAI/1.0)"
    }

    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
    except requests.RequestException:
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    repos = []

    for article in soup.select("article.Box-row")[:15]:
        # Name
        h2 = article.select_one("h2 a")
        name = h2.get_text(strip=True).replace("\n", "").replace(" ", "") if h2 else "?"

        # Description
        p = article.select_one("p")
        description = p.get_text(strip=True) if p else ""

        # Language
        lang_span = article.select_one("[itemprop='programmingLanguage']")
        lang = lang_span.get_text(strip=True) if lang_span else ""

        # Stars today
        stars_el = article.select_one("span.d-inline-block.float-sm-right")
        stars_today = stars_el.get_text(strip=True) if stars_el else "0"

        repos.append({
            "name": name,
            "description": description,
            "language": lang,
            "stars_today": stars_today,
        })

    return repos


def get_trending_languages() -> list[str]:
    """Return top 10 languages trending on GitHub today."""
    repos = fetch_trending()
    langs = [r["language"] for r in repos if r["language"]]
    # deduplicate preserving order
    seen = set()
    unique = []
    for l in langs:
        if l not in seen:
            seen.add(l)
            unique.append(l)
    return unique[:10]
