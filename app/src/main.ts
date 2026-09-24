import { mount } from 'svelte';
import App from './App.svelte';
import { browserEnv } from './ports/index.js';
import './styles/tokens.css';

const target = document.getElementById('app');
if (!target) throw new Error('no #app element');

const env = browserEnv();
/* Registration and the storage request are boot concerns beside `mount`, not
   a component's. The registered worker keeps the site installable
   (docs/specs/META.md section 9). */
void env.pwa.register();
void env.pwa.persist();

export default mount(App, { target, props: { env } });
