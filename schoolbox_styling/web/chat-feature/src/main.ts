import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

console.log("chat-feature: LOADED");

function mount() {
  createApp(App).mount("#chat-feature-app");
}

mount();
