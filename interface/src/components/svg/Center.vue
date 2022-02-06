<template>
  <rect
    :x="coords[0] - size / 2"
    :y="coords[1] - size / 2"
    :width="size"
    :height="size"
    stroke-width="0"
    stroke="black"
    :fill="fillColor"
    stroke-linecap="round"
    stroke-linejoin="bevel"
  />
</template>
