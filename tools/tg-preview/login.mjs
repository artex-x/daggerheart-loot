/*
  Interactive, run once per account (docs/tg-preview.md, step D.3): asks for
  the throwaway account's phone number, the code Telegram sends, and its 2FA
  password if any, then prints one line - TG_SESSION=<session> - and nothing
  else. That string *is* the account (plan.md section 3.6): this script never
  writes it to a file; the operator appends the printed line to .env
  themselves.

  --sms passes forceSMS: true to client.start, which issues auth.ResendCode
  instead of the normal auth.sendCode. On the owner's own throwaway number
  this returned SEND_CODE_UNAVAILABLE ("all available options for this type
  of number were already used") - see issues/tg-preview-refresh/context.md,
  "Telegram will not issue a login code yet". Treat --sms as a last resort,
  not a first move: reaching auth.ResendCode at all proves the first send
  already used a non-SMS channel, so asking for SMS on top of that is what
  exhausted the number's remaining options. Default stays off.
*/
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const forceSMS = process.argv.includes('--sms');

try {
  process.loadEnvFile('.env');
} catch {
  // no .env yet - fine, this script is what starts one
}

const apiId = process.env.TG_API_ID;
const apiHash = process.env.TG_API_HASH;
const missing = ['TG_API_ID', 'TG_API_HASH'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(
    'missing required env var(s): ' + missing.join(', ') + ' - see docs/tg-preview.md, step D.2'
  );
  process.exit(2);
}

const { TelegramClient, sessions } = await import('teleproto');
const rl = createInterface({ input: stdin, output: stdout });

const client = new TelegramClient(new sessions.StringSession(''), Number(apiId), apiHash, {
  connectionRetries: 5
});

try {
  await client.start({
    forceSMS,
    phoneNumber: () => rl.question('Phone number, international form (+7...): '),
    // teleproto passes whether Telegram delivered the code in-app or by SMS -
    // print where to look before asking, since the two channels are checked
    // in different places and the in-app one leaves no SMS to wait for.
    phoneCode: (isCodeViaApp) => {
      if (isCodeViaApp) {
        console.log(
          "Code delivered IN-APP - open the throwaway account's own Telegram " +
            'service chat (from 777000). No SMS will arrive while that session exists.'
        );
      } else {
        console.log(
          "Code delivered by SMS - check the phone's text messages, and also its " +
            'call log: Telegram sometimes places a missed call instead, whose calling ' +
            "number's last digits are the code."
        );
      }
      return rl.question('Code Telegram just sent to that account: ');
    },
    password: () => rl.question('2FA password (blank if none set): '),
    onError: (err) => console.error(err && err.message ? err.message : err)
  });

  console.log('TG_SESSION=' + client.session.save());
  console.warn(
    'That line is the account itself - append it to .env, never paste it anywhere else.'
  );
} finally {
  await client.disconnect();
  rl.close();
}
