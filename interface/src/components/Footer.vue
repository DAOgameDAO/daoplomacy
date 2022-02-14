<template>
  <div class="bg-water shadow-sm">
    <div class="max-w-screen-lg mx-auto px-3 py-3">
      <p class="text-center text-land font-bold">
        DAOplomacy is a project by DAOgameDAO
      </p>

      <div class="mt-4 flex justify-center gap-x-8">
        <a href="https://twitter.com/DAOgameDAO">
          <img :src="twitterSrc" class="w-12" alt="Twitter" />
        </a>

        <a href="https://discord.gg/tUjKK3HeNs">
          <img :src="discordSrc" class="w-12" alt="Discord" />
        </a>

        <a href="https://github.com/daogamedao/daoplomacy">
          <img :src="githubSrc" class="w-12" alt="Github" />
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import twitterSrc from "../assets/icons/twitter.png";
import discordSrc from "../assets/icons/discord.png";
import githubSrc from "../assets/icons/github.png";

export default {
  name: "Footer",
  computed: {
    twitterSrc() {
      return twitterSrc;
    },
    discordSrc() {
      return discordSrc;
    },
    githubSrc() {
      return githubSrc;
    },
  },
};
</script>
