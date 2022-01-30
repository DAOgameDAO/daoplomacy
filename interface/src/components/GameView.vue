<template>
  <div class="w-full mt-4 mx-4">
    <div class="w-full xl:w-4/5 xl:mx-auto">
      <Map :state="gameState" :orders="orders" />
    </div>
    <div class="flex justify-center my-4">
      <PhaseSelector v-model="selectedPhase" :phases="phases || []" />
    </div>
    <div
      v-if="selectedPhase !== null"
      class="container max-w-screen-lg mx-auto px-4"
    >
      <div v-if="!selectedPhaseInProgress">
        <Loading v-if="loading"> Loading orders... </Loading>
        <OrderTable v-else :orders="orders" />
      </div>
      <PhaseStatusView v-else-if="!gameCompleted" :phase="selectedPhase" />
      <p v-else class="text-center mb-4">
        The game is finished. Congratulations to the winners!
      </p>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import Map from "./Map.vue";
import PhaseSelector from "./PhaseSelector.vue";
import OrderTable from "./OrderTable.vue";
import PhaseStatusView from "./PhaseStatusView.vue";
import Loading from "./Loading.vue";

export default {
  name: "MapView",
  components: {
    Map,
    PhaseSelector,
    OrderTable,
    PhaseStatusView,
    Loading,
  },

  data() {
    return {
      selectedPhase: null,
      gameStateLoading: {},
    };
  },
  computed: {
    ...mapState(["phases"]),

    gameState() {
      if (!this.selectedPhase) {
        return null;
      }
      return this.$store.getters.getGameState(this.selectedPhase.index);
    },
    orders() {
      if (!this.selectedPhase) {
        return null;
      }
      return this.$store.getters.getOrders(this.selectedPhase.index);
    },

    loading() {
      if (!this.selectedPhase) {
        return false;
      }
      return this.$store.getters.getLoading(this.selectedPhase.index);
    },

    selectedPhaseInProgress() {
      if (!this.selectedPhase) {
        return null;
      }
      return this.selectedPhase.index === this.phases.length - 1;
    },

    gameCompleted() {
      if (!this.selectedPhase) {
        return null;
      }
      return this.selectedPhase.completed;
    },
  },

  created() {
    if (!this.phases) {
      this.$store.dispatch("loadPhases");
    }
  },

  watch: {
    selectedPhase() {
      if (!this.selectedPhase) {
        return;
      }
      const phaseIndex = this.selectedPhase.index;

      this.gameStateLoading[phaseIndex] = true;
      this.$store.dispatch("loadGameState", phaseIndex).finally(() => {
        this.gameStateLoading[phaseIndex] = false;
      });

      if (phaseIndex < this.phases[this.phases.length - 1].index) {
        this.$store.dispatch("loadOrders", phaseIndex);
      }
    },
  },
};
</script>
