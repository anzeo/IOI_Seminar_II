import { createApp } from 'vue'
import App from './App.vue'

require('./assets/style.scss')

const app = createApp(App)


app.mount('#app')

export default app
