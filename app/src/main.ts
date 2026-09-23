import { mount } from 'svelte';
import App from './App.svelte';
import { browserEnv } from './ports/index.js';
import './styles/tokens.css';

const target = document.getElementById('app');
if (!target) throw new Error('no #app element');

const env = browserEnv();
/* A boot concern beside `mount`, not a component's; the port keeps it a
   no-op from a folder (docs/specs/META.md sections 4 and 9). */
void env.pwa.register();

export default mount(App, { target, props: { env } });
