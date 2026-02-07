interface ParsedGitHubUrl {
  link_type: "pr" | "issue" | "commit" | "other";
  repo: string;
  ref: string;
}

export function parseGitHubUrl(url: string): ParsedGitHubUrl {
  const parsed = new URL(url);
  if (parsed.hostname !== "github.com") {
    return { link_type: "other", repo: "", ref: "" };
  }

  const parts = parsed.pathname.split("/").filter(Boolean);
  // parts: [owner, repo, type?, ref?]

  if (parts.length < 2) {
    return { link_type: "other", repo: "", ref: "" };
  }

  const repo = `${parts[0]}/${parts[1]}`;

  if (parts.length >= 4) {
    const type = parts[2];
    const ref = parts[3];

    if (type === "pull") return { link_type: "pr", repo, ref };
    if (type === "issues") return { link_type: "issue", repo, ref };
    if (type === "commit") return { link_type: "commit", repo, ref };
  }

  return { link_type: "other", repo, ref: "" };
}
