import * as VueRouter from "vue-router";

import FAQPage from "./pages/FAQPage.vue";
import GamePage from "./pages/GamePage.vue";
import PlannerPage from "./pages/PlannerPage.vue";

const routes = [
  {
    path: "/",
    name: "game",
    component: GamePage,
  },
  {
    path: "/planner",
    name: "planner",
    component: PlannerPage,
  },
  {
    path: "/faq",
    name: "faq",
    component: FAQPage,
  },
];

export const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
});
