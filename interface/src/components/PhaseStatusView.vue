<template>
  <div class="flex justify-center my-3">
    <div>
      <p v-if="phaseStarted && !phaseEnded" class="text-center">
        The selected phase is currently in progress. The order collector
        contract is accepting encrypted orders.
      </p>
      <p v-else-if="!phaseStarted" class="text-center">
        The selected phase is has not started yet. Orders for this phase cannot
        be submitted at this time.
      </p>
      <p v-else-if="phaseEnded" class="text-center">
        The selected phase has ended. Waiting for submitted orders to be
        decrypted...
      </p>

      <table class="table-fixed mx-auto mt-4 mb-4">
        <tbody>
          <tr>
            <th class="font-bold text-gray-400 text-right pr-4">Phase index</th>
            <td class="text-right">{{ phase ? phase.index : "" }}</td>
          </tr>
          <tr>
            <th class="font-bold text-gray-400 text-right pr-4">Start block</th>
            <td class="text-right">{{ startBlockNumber }}</td>
          </tr>
          <tr>
            <th class="font-bold text-gray-400 text-right pr-4">End block</th>
            <td class="text-right">{{ endBlockNumber }}</td>
          </tr>
          <tr>
            <th class="font-bold text-gray-400 text-right pr-4">
              Current block
            </th>
            <td class="text-right">{{ currentBlockNumber }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { provider, batchCounter } from "../contracts";

export default {
  name: "PhaseStatusView",
  props: ["phase"],

  data() {
    return {
      currentBlockNumber: null,
      startBlockNumber: null,
      endBlockNumber: null,
    };
  },

  computed: {
    phaseStarted() {
      if (this.currentBlockNumber === null || this.startBlockNumber === null) {
        return null;
      }
      return this.currentBlockNumber >= this.startBlockNumber;
    },
    phaseEnded() {
      if (this.currentBlockNumber === null || this.endBlockNumber === null) {
        return null;
      }
      return this.currentBlockNumber >= this.endBlockNumber;
    },
    remainingBlocks() {
      if (this.currentBlockNumber === null || this.endBlockNumber === null) {
        return null;
      }
      return this.endBlockNumber - this.currentBlockNumber;
    },
  },

  created() {
    provider.on("block", (b) => {
      this.currentBlockNumber = b;
    });
  },

  watch: {
    phase: {
      immediate: true,
      async handler() {
        this.startBlockNumber = null;
        this.endBlockNumber = null;

        if (!this.phase) {
          return;
        }

        const batch = this.phase.index;
        const [startBlockNumber, endBlockNumber] = await Promise.all([
          batchCounter.batchStartBlock(batch),
          batchCounter.batchStartBlock(batch + 1),
        ]);

        if (this.phase.index === batch) {
          this.startBlockNumber = startBlockNumber;
          this.endBlockNumber = endBlockNumber;
        }
      },
    },
  },
};
</script>
