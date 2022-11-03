import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

function mount() {
  createApp(App).mount("#chat-feature-app");
}

if (import.meta.env.MODE !== "production") mount();
// @ts-ignore
else window.__mount_better_schoolbox_chat_feature = mount;
