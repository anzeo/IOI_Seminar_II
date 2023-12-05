import { createApp } from 'vue'
import App from './App.vue'
import BootstrapVue3 from 'bootstrap-vue-3';
import VueAxios from "vue-axios";
import axios from "axios";

require('@/assets/styles/style.scss')

import 'bootstrap/dist/css/bootstrap.css'
// import 'bootstrap-vue/dist/bootstrap-vue.css'


const app = createApp(App)

app.use(BootstrapVue3)
app.use(VueAxios, axios)

app.mount('#app')

export default app
