/*
  Interactive, run once per account (docs/tg-preview.md, step D.3): asks for
  the throwaway account's phone number, the code Telegram sends, and its 2FA
  password if any, then prints one line - TG_SESSION=<session> - and nothing
  else. That string *is* the account (plan.md section 3.6): this script never
  writes it to a file; the operator appends the printed line to .env
  themselves.
*/
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

try {
  process.loadEnvFile('.env');
} catch {
  // no .env yet - fine, this script is what starts one
}

const apiId = process.env.TG_API_ID;
const apiHash = process.env.TG_API_HASH;
const missing = ['TG_API_ID', 'TG_API_HASH'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error('missing required env var(s): ' + missing.join(', ') + ' - see docs/tg-preview.md, step D.2');
  process.exit(2);
}

const { TelegramClient, sessions } = await import('teleproto');
const rl = createInterface({ input: stdin, output: stdout });

const client = new TelegramClient(new sessions.StringSession(''), Number(apiId), apiHash, {
  connectionRetries: 5
});

try {
  await client.start({
    phoneNumber: () => rl.question('Phone number, international form (+7...): '),
    phoneCode: () => rl.question('Code Telegram just sent to that account: '),
    password: () => rl.question('2FA password (blank if none set): '),
    onError: (err) => console.error(err && err.message ? err.message : err)
  });

  console.log('TG_SESSION=' + client.session.save());
  console.warn('That line is the account itself - append it to .env, never paste it anywhere else.');
} finally {
  await client.disconnect();
  rl.close();
}
