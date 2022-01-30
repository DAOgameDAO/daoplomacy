<template>
  <div class="flex flex-col h-screen justify-between overflow-y-scroll">
    <NavBar />
    <div class="flex-grow mx-4">
      <router-view></router-view>
    </div>

    <Footer />
  </div>
</template>

<script>
import NavBar from "./components/NavBar.vue";
import Footer from "./components/Footer.vue";

export default {
  name: "App",
  components: {
    NavBar,
    Footer,
  },
};
</script>
