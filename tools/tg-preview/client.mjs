/*
  The one live wire to Telegram: a three-method port (send, lastReply, close)
  around teleproto. No unit test - the only proof a message actually reached
  @WebpageBot is Telegram itself (docs/tg-preview.md, "How the owner verifies
  a real refresh"). Imported lazily by run.mjs, only when there is something
  to send and it is not a dry run, so `npm run check` and a dry run both work
  without tools/tg-preview/node_modules present.

  Nothing here prints `apiId`, `apiHash` or `session`: the third is a full
  Telegram account (plan.md section 3.6), and a chatty client logger would
  leak connection details into CI output even without printing the secret
  directly.
*/
export async function createClient({ apiId, apiHash, session, log }) {
  const { TelegramClient, sessions, Logger } = await import('teleproto');
  if (Logger && typeof Logger.setLevel === 'function') Logger.setLevel('error');

  const client = new TelegramClient(new sessions.StringSession(session), Number(apiId), apiHash, {
    connectionRetries: 5
  });

  await client.connect();
  if (!(await client.isUserAuthorized())) {
    throw new Error(
      'the Telegram session is not authorized - TG_SESSION may be dead; see docs/tg-preview.md, step J'
    );
  }

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
      await client.sendMessage(peer, { message: text });
    },
    // `sinceMs` is an epoch-ms timestamp; only a reply strictly newer than it
    // counts, so a stale message already in the last 3 is never mistaken for
    // this batch's answer.
    async lastReply(sinceMs) {
      const messages = await client.getMessages(peer, { limit: 3 });
      const reply = messages.find((m) => !m.out && m.date && m.date * 1000 > sinceMs);
      return reply ? reply.message : null;
    },
    async close() {
      await client.disconnect();
    }
  };
}
