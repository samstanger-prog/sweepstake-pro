/** URL-safe slug from display name (e.g. "Bob Smith" → "bob-smith") */
export function nameToSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "player";
}

export function profilePath(inviteCode: string, slug: string): string {
  return `/c/${inviteCode.toUpperCase()}/${slug}`;
}
