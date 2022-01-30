<template>
  <path
    :d="path"
    stroke-width="1"
    stroke="black"
    :fill="fillColor"
    stroke-linecap="round"
    stroke-linejoin="bevel"
  />
</template>

<script>
import map from "../../assets/map.json";
import * as types from "../../types.ts";
import {
  powerBaseColors,
  neutralColor,
  waterColor,
  landColor,
} from "../../colors";

export default {
  name: "Province",
  props: {
    province: types.Province,
    controllingPower: types.Power,
  },

  computed: {
    provData() {
      return map.provinces[this.province];
    },
    path() {
      return this.provData.path;
    },
    fillColor() {
      if (this.provData["type"] === "water") {
        return waterColor;
      }
      if (this.provData["neutral"]) {
        return neutralColor;
      }
      if (this.controllingPower) {
        return powerBaseColors[this.controllingPower.toUpperCase()]
          .desaturate()
          .brighten();
      }
      return landColor;
    },
  },
};
</script>
