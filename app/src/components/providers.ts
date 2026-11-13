/* The sign-in providers of the account page, the consent page and the session line. */
import type { Provider } from '../ports/index.js';

/** Brand names, never translated. */
export const PROVIDER_NAME: Record<Provider, string> = { google: 'Google', discord: 'Discord' };

/** The order of the sign-in buttons and the providers' rows. */
export const PROVIDERS: readonly Provider[] = ['google', 'discord'];
