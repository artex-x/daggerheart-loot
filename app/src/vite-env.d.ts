/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** True only in `vite build --mode test` (vite.config.mts). */
  readonly VITE_CLOUD_FAKE: boolean;
}
