<template>
  <div>
    <div v-for="group in data.groups" :key="group.name">
      <h1 class="text-4xl mt-8 mb-4">{{ group.name }}</h1>
      <div class="grid grid-cols-1 gap-y-5">
        <div v-for="faq in group.faq" :key="faq.question">
          <div>
            <div class="flex items-center mb-2" @click="open = !open">
              <div class="w-5 mr-2">
                <Caret :open="open" />
              </div>
              <h2 class="text-2xl">
                {{ faq.question }}
              </h2>
            </div>
            <p>{{ faq.answer }}</p>
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
    return {
      open: false,
    };
  },
  computed: {
    data() {
      return faqData;
    },
  },
});
</script>
