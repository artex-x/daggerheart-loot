/*
  The one live wire to Telegram: a five-method port (send, incoming, byIds,
  press, close) around teleproto. No unit test - the only proof a message or
  a press actually reached @WebpageBot is Telegram itself (docs/tg-preview.md,
  "How the owner verifies a real refresh"). Imported lazily by run.mjs, only
  when there is something to send or press and it is not a dry run, so
  `npm run check` and a dry run both work without tools/tg-preview/node_modules
  present.

  Every TL field name below was read from the installed teleproto 1.229.0's
  generated types (tl/generated/api.d.ts, tl/custom/message.d.ts) - see
  plan.md section 5.5.

  Nothing here prints `apiId`, `apiHash` or `session`: the third is a full
  Telegram account (plan.md section 3.6), and a chatty client logger would
  leak connection details into CI output even without printing the secret
  directly.
*/

// Builds the plain `Msg` shape lib.mjs works with, so lib.mjs and its tests
// never see a TL class.
function plain(m) {
  const media = m.media;
  const webpage = media && media.className === 'MessageMediaWebPage' ? media.webpage : null;
  const url = (webpage && webpage.url) || null;
  const pending = !!(webpage && webpage.className === 'WebPagePending');
  const photo = webpage && webpage.photo && webpage.photo.className === 'Photo' ? webpage.photo : null;
  const photoId = photo ? String(photo.id) : null;

  const buttons = [];
  const rows = (m.replyMarkup && m.replyMarkup.rows) || [];
  for (const row of rows) {
    for (const b of row.buttons || []) {
      if (b.type && b.type.className === 'InlineButtonTypeCallback') {
        buttons.push({ text: b.text, data: b.type.data });
      }
    }
  }

  return {
    id: m.id,
    text: m.message || '',
    url,
    pending,
    photoId,
    buttons
  };
}

export async function createClient({ apiId, apiHash, session, log }) {
  const { TelegramClient, sessions, Logger, Api } = await import('teleproto');
  if (Logger && typeof Logger.setLevel === 'function') Logger.setLevel('error');

  const client = new TelegramClient(new sessions.StringSession(session), Number(apiId), apiHash, {
    connectionRetries: 5
  });

  await client.connect();

  // No "is this session authorized?" guard here on purpose: teleproto
  // implements that helper as `try { updates.getState() } catch { return
  // false }` (client/users.js), so it swallows the very class name decide()
  // classifies on and reports a transport blip as "not authorized" too. The
  // first RPC below throws the real error instead - a dead session, a banned
  // account - and runRefresh classifies it once (B6 review R2).
  const peer = await client.getEntity('WebpageBot');

  // Idempotent: only sends /start the first time this account talks to the
  // bot at all, proven by an empty message history rather than by state we
  // would otherwise have to keep ourselves.
  const history = await client.getMessages(peer, { limit: 1 });
  if (history.length === 0) {
    await client.sendMessage(peer, { message: '/start' });
    log('sent /start to @WebpageBot (first contact)');
  }

  return {
    async send(text) {
      const m = await client.sendMessage(peer, { message: text });
      return { id: m.id };
    },
    // `minId` excludes ids <= the value; `limit` caps the newest-first
    // result and is always passed explicitly (gramjs/teleproto's
    // getMessages changes its default when `limit` is the only key given).
    // Only incoming (`!m.out`) messages are ever returned, ascending by id.
    async incoming({ afterId, limit }) {
      const messages = await client.getMessages(peer, { minId: afterId || 0, limit });
      return messages
        .filter((m) => !m.out)
        .map(plain)
        .sort((a, b) => a.id - b.id);
    },
    // `getMessages(peer, { ids })` returns `undefined` in the place of a
    // deleted message - that is documented teleproto behaviour, not a
    // workaround, and is filtered out here rather than mapped.
    async byIds(ids) {
      const messages = await client.getMessages(peer, { ids });
      return messages
        .filter(Boolean)
        .map(plain)
        .sort((a, b) => a.id - b.id);
    },
    // `Message.click()` swallows BOT_RESPONSE_TIMEOUT into `null` (teleproto's
    // tl/custom/messageButton.js), and the loop needs to tell an answered
    // press from an unanswered one (plan.md section 3.4) - so this calls
    // `GetBotCallbackAnswer` directly and lets every error, including that
    // one, propagate to `decide()` in lib.mjs.
    async press(id, data) {
      const r = await client.invoke(
        new Api.messages.GetBotCallbackAnswer({ peer, msgId: id, data })
      );
      return { text: r.message || null };
    },
    async close() {
      await client.disconnect();
    }
  };
}
