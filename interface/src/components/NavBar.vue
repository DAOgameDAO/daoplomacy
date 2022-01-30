<template>
  <nav class="bg-yellow-100 text-lg shadow-sm">
    <div class="max-w-screen-lg mx-auto px-3">
      <div class="flex justify-between items-center space-x-3">
        <div class="py-3">
          <a href="#">DAOplomacy</a>
        </div>

        <div
          class="flex flex-col justify-between py-3 cursor-pointer md:hidden"
          @click="onBurgerClick()"
        >
          <Burger />
        </div>
        <div class="hidden md:block flex space-x-5">
          <router-link v-for="(item, i) in menuItems" :to="item.to" :key="i">
            {{ item.title }}
          </router-link>
        </div>
      </div>

      <div class="pt-1 pb-1 md:hidden" :class="burgerMenuClasses">
        <ul class="text-center list-none">
          <li v-for="(item, i) in menuItems" :key="i" class="my-3">
            <router-link :to="item.to">
              {{ item.title }}
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script>
import Burger from "./svg/Burger.vue";

export default {
  name: "NavBar",
  components: {
    Burger,
  },

  data() {
    return {
      menuItems: [
        {
          title: "Game",
          to: {
            name: "game",
          },
        },
        {
          title: "Order Planner",
          to: {
            name: "planner",
          },
        },
        {
          title: "FAQ",
          to: {
            name: "faq",
          },
        },
      ],
      burgerExpanded: false,
    };
  },

  computed: {
    burgerMenuClasses() {
      return {
        hidden: !this.burgerExpanded,
      };
    },
  },

  methods: {
    onBurgerClick() {
      this.burgerExpanded = !this.burgerExpanded;
    },
  },
};
</script>
