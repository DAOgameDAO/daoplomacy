<template>
  <select
    v-model="selectedValue"
    class="select"
    :disabled="powers.length === 0"
  >
    <option :value="null" disabled hidden>...</option>
    <option v-for="power in powers" :key="power" :value="power">
      {{ power }}
    </option>
  </select>
</template>

<script>
export default {
  name: "PowerSelector",
  props: ["modelValue", "powers"],

  computed: {
    selectedValue: {
      get() {
        return this.modelValue;
      },
      set(v) {
        this.$emit("update:modelValue", v);
      },
    },
  },
};
</script>
