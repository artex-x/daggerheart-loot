/* The hosted E2E's server-side hands: users, sessions and cleanup on the
 * test project, with its secret key. Every export refuses any other project
 * before a request (lib.mjs). Sessions are minted with the secret key, never
 * signed in with a password: docs/DECISIONS.md, "The hosted E2E reads its
 * credentials from the environment; no proxy credential". */

import { createClient } from '@supabase/supabase-js';
import { assertTestProject, isThrowaway, redactAddresses, throwawayEmail } from './lib.mjs';

const NODE_AUTH = { auth: { persistSession: false, autoRefreshToken: false } };
const PER_PAGE = 1000;
const RUN_ID = Date.now().toString(36);
let made = 0;

/* The URL each admin client was made for, so every export can guard it. */
const URLS = new WeakMap();

function guard(admin) {
  assertTestProject(URLS.get(admin) ?? '');
}

/* A server message may quote the address it was given; it is redacted by
   construction, whatever Auth says. */
function fail(what, error) {
  return new Error('e2e: ' + what + ' - ' + redactAddresses(error?.message ?? 'no answer'));
}

export function adminClient(env) {
  assertTestProject(env.E2E_SUPABASE_URL);
  const admin = createClient(env.E2E_SUPABASE_URL, env.E2E_SUPABASE_SECRET_KEY, NODE_AUTH);
  URLS.set(admin, env.E2E_SUPABASE_URL);
  return admin;
}

async function allUsers(admin) {
  guard(admin);
  const out = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw fail('listing users', error);
    out.push(...data.users);
    if (data.users.length < PER_PAGE) return out;
  }
}

async function create(admin, email) {
  guard(admin);
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error) throw fail('creating a user', error);
  return { id: data.user.id, email: data.user.email ?? email };
}

/** The member: found, or created confirmed. Never deleted. */
export async function ensureUser(admin, email) {
  const wanted = email.toLowerCase();
  const found = (await allUsers(admin)).find((u) => u.email?.toLowerCase() === wanted);
  return found ? { id: found.id, email: found.email ?? email } : create(admin, email);
}

/** A new throwaway user of this run. */
export function createThrowaway(admin, email) {
  return create(admin, throwawayEmail(email, RUN_ID, ++made));
}

/** A fresh session of `email`: a magic link's token, verified. */
export async function mint(env, admin, email) {
  assertTestProject(env.E2E_SUPABASE_URL);
  guard(admin);
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (link.error) throw fail('generating a sign-in link', link.error);
  const pub = createClient(env.E2E_SUPABASE_URL, env.E2E_SUPABASE_PUBLISHABLE_KEY, NODE_AUTH);
  const { data, error } = await pub.auth.verifyOtp({
    token_hash: link.data.properties.hashed_token,
    type: 'magiclink'
  });
  if (error || !data.session) throw fail('verifying a sign-in link', error);
  return data.session;
}

/** Whether the server refuses to refresh with this token (its session ended). */
export async function refreshRefused(env, refreshToken) {
  assertTestProject(env.E2E_SUPABASE_URL);
  const pub = createClient(env.E2E_SUPABASE_URL, env.E2E_SUPABASE_PUBLISHABLE_KEY, NODE_AUTH);
  const { error } = await pub.auth.refreshSession({ refresh_token: refreshToken });
  return !!error;
}

/** Whether the user no longer exists. */
export async function userGone(admin, id) {
  guard(admin);
  const { data, error } = await admin.auth.admin.getUserById(id);
  return !!error || !data.user;
}

/** Deletes every throwaway user of `email`, a killed run's included. */
export async function sweep(admin, email) {
  for (const u of await allUsers(admin)) {
    if (!isThrowaway(u.email, email)) continue;
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) throw fail('deleting a throwaway user', error);
  }
}

/** The user's preferences row, or null when there is none. */
export async function prefsOf(admin, userId) {
  guard(admin);
  const { data, error } = await admin
    .from('user_prefs')
    .select('prefs')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw fail('reading preferences', error);
  return data ? data.prefs : null;
}

/** Deletes the user's preferences row, so a run starts with none. */
export async function clearPrefs(admin, userId) {
  guard(admin);
  const { error } = await admin.from('user_prefs').delete().eq('user_id', userId);
  if (error) throw fail('clearing preferences', error);
}

/** Ends every session of the member, so none outlives the run. */
export async function revokeMember(env, admin, email) {
  const session = await mint(env, admin, email);
  const { error } = await admin.auth.admin.signOut(session.access_token, 'global');
  if (error) throw fail('signing the member out everywhere', error);
}

/** The user's account lists, each with its entries, read by the service role. */
export async function listsOf(admin, userId) {
  guard(admin);
  const { data, error } = await admin
    .from('lists')
    .select(
      'id,name,player_note,gm_note,legacy_fingerprint,list_entries(item_key,position,quantity,price_coins,gm_note,source,hb_item)'
    )
    .eq('owner_id', userId);
  if (error) throw fail('reading lists', error);
  return data ?? [];
}

/** The list's share links, stopped ones included, read by the service role. */
export async function sharesOf(admin, listId) {
  guard(admin);
  const { data, error } = await admin
    .from('list_shares')
    .select('id,audience,token,revoked_at')
    .eq('list_id', listId);
  if (error) throw fail('reading shares', error);
  return data ?? [];
}

/** Deletes the user's account lists; their entries and shares cascade. */
export async function deleteListsOf(admin, userId) {
  guard(admin);
  const { error } = await admin.from('lists').delete().eq('owner_id', userId);
  if (error) throw fail('deleting lists', error);
}

/** The user's homebrew sources, set and rule cards and items, read by the service role. */
export async function homebrewOf(admin, userId) {
  guard(admin);
  const [books, cards, items] = await Promise.all([
    admin.from('homebrew_books').select('id,key,content,revision').eq('owner_id', userId),
    admin
      .from('homebrew_cards')
      .select('id,key,kind,book_id,content,revision')
      .eq('owner_id', userId),
    admin
      .from('homebrew_items')
      .select('id,key,book_id,content,revision')
      .eq('owner_id', userId)
  ]);
  if (books.error) throw fail('reading homebrew sources', books.error);
  if (cards.error) throw fail('reading homebrew cards', cards.error);
  if (items.error) throw fail('reading homebrew items', items.error);
  return { books: books.data ?? [], cards: cards.data ?? [], items: items.data ?? [] };
}

/** Deletes the user's homebrew items, then the cards, then the sources. */
export async function deleteHomebrewOf(admin, userId) {
  guard(admin);
  const items = await admin.from('homebrew_items').delete().eq('owner_id', userId);
  if (items.error) throw fail('deleting homebrew items', items.error);
  const cards = await admin.from('homebrew_cards').delete().eq('owner_id', userId);
  if (cards.error) throw fail('deleting homebrew cards', cards.error);
  const books = await admin.from('homebrew_books').delete().eq('owner_id', userId);
  if (books.error) throw fail('deleting homebrew sources', books.error);
}
