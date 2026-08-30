import { mount } from 'svelte';
import App from './App.svelte';
import { browserEnv } from './ports/index.js';
import './styles/tokens.css';

const target = document.getElementById('app');
if (!target) throw new Error('no #app element');

export default mount(App, { target, props: { env: browserEnv() } });
