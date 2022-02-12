<template>
  <div>
    <div
      class="w-full cursor-grab shadow-lg border-2 border-black rounded-xl"
      :class="{ 'cursor-grab': !panning, 'cursor-grabbing': panning }"
    >
      <panZoom
        selector="#map"
        :options="{
          smoothScroll: false,
          bounds: true,
          boundsPadding: 0,
          beforeWheel: panZoomBeforeWheel,
        }"
        @init="panZoomInit"
        @zoom="panZoomZoom"
        @mousedown="panZoomPanStart"
        @mouseup="panZoomPanEnd"
      >
        <div class="aspect-w-16 aspect-h-10 bg-black">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
            <g>
              <g id="map">
                <ellipse
                  :cx="map.backgroundEllipse[0]"
                  :cy="map.backgroundEllipse[1]"
                  :rx="map.backgroundEllipse[2]"
                  :ry="map.backgroundEllipse[3]"
                  stroke="black"
                  stroke-width="10"
                />
                <g>
                  <Province
                    v-for="(prov, key) in map.provinces"
                    :key="key"
                    :province="key"
                    :controllingPower="controlledProvinces[key]"
                    :scale="scale"
                  />
                </g>
                <g>
                  <Unit
                    v-for="unit in units"
                    :key="unit.location.province + unit.location.dislodged"
                    :unit="unit"
                    :scale="scale"
                  />
                </g>
                <g>
                  <Order
                    v-for="order in ordersFlat"
                    :key="order.power + order.rawOrder"
                    :order="order.parsedOrder"
                    :orderResults="order.results"
                    :scale="scale"
                  />
                </g>
              </g>
            </g>
          </svg>
        </div>
      </panZoom>
    </div>
    <p class="text-sm text-right mt-0 mr-1">zoom with ctrl + mouse wheel</p>
  </div>
</template>

<script>
import _ from "lodash";
import Province from "./svg/Province.vue";
import Unit from "./svg/Unit.vue";
import Order from "./svg/Order.vue";
import map from "../map.ts";
import { parseUnit } from "../parsers.ts";

// const ZOOM_SCALE_RANGE = [1.0, 500000.0];
const MIN_ZOOM_SCALE = 1.0;

export default {
  name: "Map",
  props: {
    state: {
      default: null,
    },
    orders: {
      defeault: {},
    },
  },

  components: {
    Province,
    Unit,
    Order,
  },

  data() {
    return {
      map: map,
      zoom: 1.0,
      panning: false,
    };
  },

  computed: {
    scale() {
      return (
        30 /
        // Math.min(Math.max(this.zoom, ZOOM_SCALE_RANGE[0]), ZOOM_SCALE_RANGE[1])
        Math.max(this.zoom, MIN_ZOOM_SCALE)
      );
    },

    controlledProvinces() {
      if (!this.state) {
        return {};
      }

      let provs = {};
      for (const [power, provinces] of Object.entries(this.state.influence)) {
        for (const prov of provinces) {
          provs[prov.toLowerCase()] = power.toLowerCase();
        }
      }
      return provs;
    },
    units() {
      if (!this.state) {
        return [];
      }

      let units = [];
      for (const [power, unitStrings] of Object.entries(this.state.units)) {
        for (const unitString of unitStrings) {
          units.push({
            power: power.toLowerCase(),
            ...parseUnit(unitString),
          });
        }
      }
      return units;
    },
    ordersFlat() {
      const flatOrders = [];

      // Retreat orders should act on dislodged units. Unfortunately, we don't know if an order is
      // a retreat order from the order alone, so we extract this information from the state if
      // it's available.
      let isRetreat = false;
      if (this.state) {
        isRetreat = this.state.name[this.state.name.length - 1] === "R";
      }

      for (const orders of Object.values(this.orders || {})) {
        for (const order of orders) {
          if (!order.accepted) {
            continue;
          }
          const orderWithDislodged = _.cloneDeep(order);
          orderWithDislodged.parsedOrder.unit.location.dislodged = isRetreat;
          flatOrders.push(orderWithDislodged);
        }
      }
      return flatOrders;
    },
  },

  methods: {
    panZoomInit(instance) {
      instance.setTransformOrigin(null); // zoom to cursor

      this.zoom = instance.getTransform().scale;

      // prevent zooming out further than the initial view (which covers the whole map)
      instance.setMinZoom(this.zoom);
    },
    panZoomBeforeWheel(e) {
      return !e.ctrlKey;
    },
    panZoomZoom(e) {
      const newZoom = e.getTransform().scale;
      // if (Math.abs(newScale / this.scale - 1) > 0.01) {
      this.zoom = newZoom;
      // }
    },
    panZoomPanStart() {
      this.panning = true;
    },
    panZoomPanEnd() {
      this.panning = false;
    },
  },
};
</script>
