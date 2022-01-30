<template>
  <path
    :d="pathString"
    :stroke-width="strokeWidth"
    :stroke="stroke.toString()"
    fill="none"
  />
</template>

<script lang="ts">
import { PropType } from "vue";
import { BuildOrder, UnitType } from "../../../types";
import { getUnitCoords } from "../../../map";
import { addCoords, rotateCoords } from "../../../math";
import { successfulOrderColor } from "../../../colors";

export default {
  name: "DisbandOrder",
  props: {
    order: {
      type: Object as PropType<BuildOrder>,
      required: true,
    },
    scale: {
      type: Number,
      required: true,
    },
  },

  computed: {
    coords() {
      return getUnitCoords(this.order.unit.location);
    },
    size() {
      return 1.4 * this.scale;
    },
    strokeWidth() {
      return 0.15 * this.scale;
    },

    radius() {
      return 0.65 * this.scale;
    },
    left() {
      return addCoords(
        this.coords,
        rotateCoords([-this.radius, 0], Math.PI / 4)
      );
    },
    right() {
      return addCoords(
        this.coords,
        rotateCoords([this.radius, 0], Math.PI / 4)
      );
    },
    top() {
      return addCoords(
        this.coords,
        rotateCoords([0, -this.radius], Math.PI / 4)
      );
    },
    bottom() {
      return addCoords(
        this.coords,
        rotateCoords([0, this.radius], Math.PI / 4)
      );
    },
    pathString() {
      let s = "";
      s += "M" + this.top.join(" ");
      s += " L" + this.bottom.join(" ");
      s += " M" + this.left.join(" ");
      s += " L" + this.right.join(" ");
      return s;
    },

    fleetPoints() {
      const pointsRel = [
        [-0.5, -0.866 / 3],
        [0, 0.866 / 2],
        [+0.5, -0.866 / 3],
      ];

      const [c0, c1] = this.coords;
      const s = (this.size / 0.433 / 2) * (3.14 / 4);

      let points = "";
      for (const [d0, d1] of pointsRel) {
        points +=
          (c0 + d0 * s).toString() + "," + (c1 + d1 * s).toString() + " ";
      }
      return points;
    },

    stroke() {
      return successfulOrderColor;
    },
  },
};
</script>
