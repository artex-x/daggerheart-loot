/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** True only in `vite build --mode test` (vite.config.mts). */
  readonly VITE_CLOUD_FAKE: boolean;
  /** The Supabase project and its publishable key; both empty in a build
   *  with no sign-in configured (vite.config.mts). */
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
}
