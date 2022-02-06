<template>
  <g>
    <path
      :d="path"
      stroke-width="0"
      :fill="fillColor"
      stroke-linecap="round"
      stroke-linejoin="bevel"
    />
    <rect
      v-if="hasCenter"
      :x="centerCoords[0] - centerSize / 2"
      :y="centerCoords[1] - centerSize / 2"
      :width="centerSize"
      :height="centerSize"
      stroke-width="0"
      :fill="centerFillColor"
    />
    <text
      v-if="hasLabel"
      :x="labelCoords[0]"
      :y="labelCoords[1]"
      :transform="'scale(' + scale / 30 + ')'"
      :transform-origin="
        labelCoords[0].toString() + ' ' + labelCoords[1].toString()
      "
      font-family="Space Grotesk"
      font-size="2em"
      text-anchor="middle"
      dominant-baseline="middle"
    >
      {{ province }}
    </text>
  </g>
</template>

<script>
import map from "../../map.ts";
import * as types from "../../types.ts";
import {
  powerBaseColors,
  impassableColor,
  waterColor,
  landColor,
} from "../../colors";

export default {
  name: "Province",
  props: {
    province: types.Province,
    controllingPower: types.Power,
    scale: {
      type: Number,
      required: true,
    },
  },

  computed: {
    provData() {
      return map.provinces[this.province];
    },
    path() {
      return this.provData.path;
    },
    fillColor() {
      if (this.provData.impassable) {
        return impassableColor;
      }
      if (this.provData.type === types.ProvinceType.Water) {
        return waterColor;
      }
      if (this.controllingPower) {
        return powerBaseColors[this.controllingPower.toUpperCase()];
      }
      return landColor;
    },

    hasCenter() {
      return !!this.provData.centerCoords;
    },
    centerCoords() {
      if (!this.hasCenter) {
        return null;
      }
      return this.provData.centerCoords;
    },
    centerSize() {
      return this.scale * 0.5;
    },
    centerFillColor() {
      return impassableColor;
    },

    hasLabel() {
      return !!this.provData.labelCoords;
    },
    labelCoords() {
      if (!this.hasLabel) {
        return null;
      }
      return this.provData.labelCoords;
    },
  },
};
</script>
