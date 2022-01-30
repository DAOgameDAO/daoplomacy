<template>
  <div class="w-full mb-8">
    <!-- <h1 class="mt-8 text-6xl font-bold text-center">Order Planner</h1>

    <div class="flex justify-center mt-6 mb-6">
      <p class="max-w-3xl text-center">
        Plan out an order using the form below. The result is a calldata string
        containing the order in encrypted form. This string is what the DAO
        controlling the unit has to send to the blockchain in order to execute
        the order.
      </p>
    </div> -->

    <div class="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 justify-center">
      <div>
        <div class="grid grid-cols-1 gap-y-2">
          <div>
            <label class="label col-start-1">Phase</label>
            <div class="col-span-1">
              <PhaseSelector :phases="phases || []" v-model="selectedPhase" />
            </div>
          </div>

          <Loading v-if="loading"> Loading phase...</Loading>

          <template v-else-if="!gameFinished">
            <div>
              <label class="label">Type</label>
              <div class="col-span-1">
                <select v-model="selectedType" class="select">
                  <option value="order">Order</option>
                  <option value="draw">Draw vote</option>
                </select>
              </div>
            </div>

            <template v-if="selectedType === 'order'">
              <div>
                <label class="label">Power</label>
                <div class="col-span-1">
                  <PowerSelector v-model="selectedPower" :powers="powers" />
                </div>
              </div>

              <div>
                <label class="label">Order</label>
                <div
                  v-if="!selectedPower || ordersForPower.length > 0"
                  class="col-span-1"
                >
                  <OrderSelector
                    :orders="ordersForPower"
                    v-model="selectedOrder"
                  />
                </div>
                <div v-else-if="selectedPower">
                  <p>
                    The selected power cannot submit any orders in this phase.
                  </p>
                </div>
              </div>
            </template>

            <div>
              <label class="label">Passphrase</label>
              <div class="col-span-1 w-full flex flex-row">
                <input v-model="passphrase" class="input flex-grow" />
                <button @click="onRandomPassphrase" class="button">
                  Random
                </button>
              </div>
            </div>

            <div>
              <label class="label">Order Collector Address</label>
              <div class="col-span-1 w-full flex flex-row">
                <input
                  :value="orderCollectorAddress"
                  :disabled="true"
                  class="input flex-grow"
                />
                <button @click="onCopyOrderCollectorAddress" class="button">
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label class="label self-start mt-4">Calldata</label>
              <div class="col-span-1 w-full">
                <textarea
                  :value="calldata"
                  class="input w-full h-44"
                  disabled
                />
                <div class="flex justify-end">
                  <button class="button" @click="onCopyCalldata">Copy</button>
                </div>
              </div>
            </div>
          </template>
        </div>
        <div v-if="!loading && !gameFinished" class="mt-5 flex justify-center">
          <button class="button" @click="onCopyOrderLink">
            Copy Order Link
          </button>
        </div>

        <div v-if="!loading && gameFinished" class="mt-4">
          The game is finished. No more orders can be submitted.
        </div>
      </div>

      <div>
        <Map :state="gameState" :orders="ordersForMap" />
      </div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import { mapState } from "vuex";
import { PhaseType } from "../types";
import { formatPhase, formatOrder } from "../formatters";
import { parseUnit, parseOrder } from "../parsers";
import { randomPassphrase, encrypt } from "../crypto";
import { orderCollector, encodeOrderSubmissionCalldata } from "../contracts";
import OrderSelector from "./OrderSelector.vue";
import PhaseSelector from "./PhaseSelector.vue";
import PowerSelector from "./PowerSelector.vue";
import Map from "./Map.vue";
import Loading from "./Loading.vue";

export default {
  name: "PlannerView",
  components: {
    OrderSelector,
    PhaseSelector,
    PowerSelector,
    Map,
    Loading,
  },

  data() {
    return {
      selectedPhase: null,
      selectedType: "order",
      selectedPower: null,
      selectedOrder: null,

      passphrase: this.$route.query.pass || "",

      calldata: "",
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
    possibleOrders() {
      if (!this.selectedPhase) {
        return null;
      }
      return this.$store.getters.getPossibleOrders(this.selectedPhase.index);
    },

    loading() {
      if (!this.selectedPhase) {
        return false;
      }
      return this.$store.getters.getLoading(this.selectedPhase.index);
    },

    gameFinished() {
      if (!this.selectedPhase) {
        return null;
      }
      return this.selectedPhase.completed;
    },

    powers() {
      if (!this.gameState) {
        return [];
      }
      if (this.selectedPhase.completed) {
        return [];
      }
      const powers = [];
      for (const [power, units] of Object.entries(this.gameState.units)) {
        if (units.length === 0) {
          continue;
        }
        powers.push(power);
      }
      return powers;
    },
    ordersForPower() {
      if (!this.selectedPower) {
        return [];
      }
      if (!this.possibleOrders || !this.gameState) {
        return [];
      }

      if (this.selectedPhase.type !== PhaseType.Adjustment) {
        // In movement or retreat phases, the player who can make an order is the player who owns
        // the unit.
        const unitStrings = this.gameState.units[this.selectedPower] || [];
        const units = unitStrings.map(parseUnit);
        const provinces = new Set(units.map((u) => u.location.province));
        const orders = this.possibleOrders.filter((o) =>
          provinces.has(o.unit.location.province)
        );
        return orders;
      } else {
        // In adjustment phases, the player who can make an order is the player who controls the
        // supply center.
        const centers = new Set(
          this.gameState.centers[this.selectedPower].map((p) =>
            p.toLowerCase()
          ) || []
        );
        return this.possibleOrders.filter((o) =>
          centers.has(o.unit.location.province)
        );
      }
    },

    ordersForMap() {
      if (!this.selectedPower) {
        return {};
      }
      if (!this.selectedOrder) {
        return {};
      }
      const orders = {};
      orders[this.selectedPower] = [
        {
          power: this.selectedPower,
          rawOrder: formatOrder(this.selectedOrder),
          parsedOrder: this.selectedOrder,
          accepted: true,
          results: {},
        },
      ];
      return orders;
    },

    orderCollectorAddress() {
      return orderCollector.address;
    },

    plaintextOrder() {
      if (!this.selectedType) {
        return "";
      }

      switch (this.selectedType) {
        case "order":
          if (!this.selectedOrder) {
            return "";
          }
          return formatOrder(this.selectedOrder);
        case "draw":
          return "DRAW";
        default:
          console.log("unknown order type", this.selectedType);
          return "";
      }
    },

    orderLink() {
      let query = {};
      if (this.selectedPhase) {
        query.phase = this.selectedPhase.index;
      }
      if (this.selectedType) {
        query.type = this.selectedType;
      }
      if (this.selectedType === "order") {
        if (this.selectedPower) {
          query.power = this.selectedPower;
        }
        if (this.selectedOrder) {
          query.order = formatOrder(this.selectedOrder);
        }
      }
      if (this.passphrase) {
        query.pass = this.passphrase;
      }
      const route = this.$router.resolve({
        name: "planner",
        query: query,
      });
      return "localhost:3000/" + route.href;
    },
  },

  watch: {
    "$route.query": {
      immediate: true,
      deep: true,
      async handler() {
        await this.setSelectionFromQuery();
      },
    },
    async selectedPhase() {
      this.selectedPower = null;
      this.selectedOrder = null;

      if (!this.selectedPhase) {
        return;
      }
      this.$store.dispatch("loadGameState", this.selectedPhase.index);
      this.$store.dispatch("loadPossibleOrders", this.selectedPhase.index);

      this.setCalldata();
    },
    async plaintextOrder() {
      await this.setCalldata();
    },
    async passphrase() {
      await this.setCalldata();
    },
  },

  methods: {
    formatPhase,

    onRandomPassphrase() {
      this.passphrase = randomPassphrase(12);
    },
    async onCopyOrderCollectorAddress() {
      await navigator.clipboard.writeText(orderCollector.address);
    },
    async onCopyCalldata() {
      await navigator.clipboard.writeText(this.calldata);
    },
    async onCopyOrderLink() {
      await navigator.clipboard.writeText(this.orderLink);
    },

    async setSelectionFromQuery() {
      if (this.$route.query.pass) {
        this.passphrase = this.$route.query.pass;
      }
      if (this.$route.query.type) {
        this.selectedType = this.$route.query.type;
      }

      await this.$store.dispatch("loadPhases");

      const n = Number(this.$route.query.phase);
      if (isNaN(n) || !this.phases || n >= this.phases.length) {
        return;
      }
      this.selectedPhase = this.phases[n];

      await Promise.all([
        this.$store.dispatch("loadGameState", this.selectedPhase.index),
        this.$store.dispatch("loadPossibleOrders", this.selectedPhase.index),
      ]);

      if (!_.includes(this.powers, this.$route.query.power)) {
        return;
      }
      this.selectedPower = this.$route.query.power;

      const order = parseOrder(this.$route.query.order || "");
      if (!order) {
        return;
      }
      this.selectedOrder = order;
    },

    async setCalldata() {
      this.calldata = "";
      if (!this.plaintextOrder) {
        return;
      }
      if (!this.selectedPhase) {
        return;
      }

      const encryptedOrder = await encrypt(
        this.plaintextOrder,
        this.selectedPhase.index,
        this.passphrase
      );
      this.calldata = encodeOrderSubmissionCalldata(
        this.selectedPhase.index,
        encryptedOrder
      );
    },
  },
};
</script>

<style>
.label {
  @apply w-full text-left font-bold self-center col-span-1 col-start-1;
}
</style>
