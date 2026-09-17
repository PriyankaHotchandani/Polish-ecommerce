import { PUBLIC_ENV_WINDOW_KEY, getPublicEnv } from '@/utils/publicEnv'

// Serializes the public Supabase config into the document so the browser bundle
// no longer depends on those values having been present at *build* time.
//
// Without this, a Cloudflare deployment whose variables are configured only on
// the Worker (and not in Workers Builds) ships a browser bundle pointing at the
// placeholder project baked in by `next build`, and every client-side query —
// login, signup, admin forms — fails.
//
// Both values are public: the anon key is meant to reach browsers and is
// constrained by row level security, exactly as when Next inlines it.
export default function PublicEnvScript() {
    const publicEnv = getPublicEnv()

    if (!publicEnv) {
        return null
    }

    // `<` is escaped so a value can never close the surrounding <script> tag.
    const serialized = JSON.stringify(publicEnv).replace(/</g, '\\u003c')

    return (
        <script
            // Must run before any client component mounts, hence not deferred.
            dangerouslySetInnerHTML={{
                __html: `window.${PUBLIC_ENV_WINDOW_KEY}=${serialized};`,
            }}
        />
    )
}
