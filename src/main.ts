import { mount } from 'svelte';
import './styles.css';
import App from './App.svelte';
import { startCollage } from './nomie';

startCollage();
mount(App, { target: document.getElementById('app')! });
