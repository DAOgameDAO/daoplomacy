<template>
  <div>
    <div v-for="(group, i) in data.groups" :key="group.name">
      <h1 class="text-4xl mt-8 mb-4">{{ group.name }}</h1>
      <div class="grid grid-cols-1 gap-y-5">
        <div v-for="(faq, j) in group.faq" :key="faq.question">
          <div>
            <div
              class="flex items-center mb-2 cursor-pointer"
              @click="open[i][j] = !open[i][j]"
            >
              <div class="w-5 mr-2">
                <Caret :open="open[i][j]" />
              </div>
              <h2 class="text-2xl">
                {{ faq.question }}
              </h2>
            </div>
            <p v-show="open[i][j]" class="ml-4">{{ faq.answer }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as faqData from "../assets/faq.json";
import Caret from "./Caret.vue";

export default defineComponent({
  name: "FAQView",
  components: {
    Caret,
  },
  data() {
    const open = {};
    for (let i = 0; i < faqData.groups.length; i++) {
      open[i] = {};
      for (let j = 0; j < faqData.groups[i].length; j++) {
        open[i][j] = false;
      }
    }

    return {
      open: open,
    };
  },
  computed: {
    data() {
      return faqData;
    },
  },
});
</script>
