import { createApp } from 'vue'
import App from './App.vue'
import BootstrapVue3 from 'bootstrap-vue-3';
import VueAxios from "vue-axios";
import axios from "axios";
import Vue3Toasity from 'vue3-toastify';
import VueSidePanel from 'vue3-side-panel';

require('@/assets/styles/style.scss')

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css';

import 'vue-loading-overlay/dist/css/index.css';
import 'vue3-toastify/dist/index.css';
import 'vue3-side-panel/dist/vue3-side-panel.css'

const app = createApp(App)

app.use(BootstrapVue3)
app.use(VueAxios, axios)
app.use(Vue3Toasity)
app.use(VueSidePanel)

app.mount('#app')

export default app
