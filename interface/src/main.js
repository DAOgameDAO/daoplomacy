import { createApp } from "vue";
import App from "./App.vue";
import panZoom from "vue-panzoom";
import { router } from "./router.js";
import { store } from "./store";

import "./index.css";

const app = createApp(App);

app.use(router);
app.use(store);
app.use(panZoom);

app.mount("#app");
