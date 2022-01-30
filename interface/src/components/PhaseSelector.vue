<template>
  <div v-if="phases.length > 0">
    <button
      @click="onSelectPrevious"
      :disabled="selectPreviousDisabled"
      class="button"
    >
      &lt;
    </button>
    <select v-model="selectedPhase" class="select">
      <option
        v-for="(phase, index) in phases"
        :key="phase"
        :value="phase"
        :selected="selectedPhase && index === selectedPhase.index"
      >
        {{ formatPhase(phase) }}
      </option>
    </select>
    <button @click="onSelectNext" :disabled="selectNextDisabled" class="button">
      &gt;
    </button>
  </div>
</template>

<script>
import { formatPhase } from "../formatters";
import _ from "lodash";

export default {
  name: "PhaseSelector",
  props: {
    phases: {
      default: [],
    },
    modelValue: {
      default: null,
    },
  },

  computed: {
    selectedPhase: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      },
    },

    selectPreviousDisabled() {
      if (this.selectedPhase === null) {
        return true;
      }
      return this.selectedPhase.index <= 0;
    },
    selectNextDisabled() {
      if (this.selectedPhase === null) {
        return true;
      }
      return this.selectedPhase.index >= this.phases.length - 1;
    },
  },

  watch: {
    phases: {
      immediate: true,
      handler() {
        if (this.phases.length > 0) {
          this.selectedPhase = this.phases[this.phases.length - 1];
        } else {
          this.selectedPhase = null;
        }
      },
    },
  },

  methods: {
    formatPhase,

    onSelectNext() {
      if (this.selectNextDisabled) {
        return;
      }
      const i = this.selectedPhase.index + 1;
      this.selectedPhase = this.phases[i];
    },
    onSelectPrevious() {
      if (this.selectPreviousDisabled) {
        return;
      }
      const i = this.selectedPhase.index - 1;
      this.selectedPhase = this.phases[i];
    },
  },
};
</script>
