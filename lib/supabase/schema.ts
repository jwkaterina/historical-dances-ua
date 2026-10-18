/**
 * Where this site's data lives inside the Supabase project.
 *
 * The UA site shares the taenze project with the German site: its tables are
 * in the `ua` schema and its files in `ua-*` buckets. Leave
 * NEXT_PUBLIC_SUPABASE_SCHEMA unset for a project of its own (`public`
 * schema, unprefixed buckets).
 */
export const DB_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || "public"

const BUCKET_PREFIX = DB_SCHEMA === "public" ? "" : `${DB_SCHEMA}-`

export function bucketFor(kind: "audio" | "videos" | "images" | "documents") {
  return `${BUCKET_PREFIX}${kind}`
}
