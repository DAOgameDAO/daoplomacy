<template>
  <div class="bg-yellow-100 shadow-sm">
    <div class="max-w-screen-lg mx-auto px-3 py-3">
      <p class="text-center">DAOplomacy is a project by theDAOgameDAO</p>

      <div class="mt-4 flex justify-center gap-x-8">
        <a href="https://twitter.com">
          <img :src="twitterSrc" class="w-12" alt="Twitter" />
        </a>

        <a href="https://discord.com">
          <img :src="discordSrc" class="w-12" alt="Discord" />
        </a>

        <a href="https://github.com">
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
