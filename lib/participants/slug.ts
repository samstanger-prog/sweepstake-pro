import type { SupabaseClient } from "@supabase/supabase-js";
import { nameToSlug } from "@/lib/utils/slug";

/** Pick a unique slug within a competition */
export async function uniqueParticipantSlug(
  supabase: SupabaseClient,
  competitionId: string,
  name: string
): Promise<string> {
  const base = nameToSlug(name);
  let slug = base;
  let suffix = 2;

  while (true) {
    const { data } = await supabase
      .from("participants")
      .select("id")
      .eq("competition_id", competitionId)
      .eq("slug", slug)
      .maybeSingle();

    if (!data) return slug;
    slug = `${base}-${suffix}`;
    suffix++;
  }
}
