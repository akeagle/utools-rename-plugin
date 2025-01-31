import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-Cn';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';


const app = createApp(App);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
	app.component(key, component);
}
app.use(ElementPlus, {
	"locale": zhCn,
});

app.mount('#app');
