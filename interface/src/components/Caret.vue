<template>
  <!-- Created with Inkscape (http://www.inkscape.org/) -->

  <svg
    width="100%"
    height="100%"
    viewBox="0 0 100 100"
    version="1.1"
    xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:svg="http://www.w3.org/2000/svg"
    class="transition-transform"
    :class="open ? 'rotate-90' : ''"
  >
    <g transform="translate(-74.034935,-696.44271)">
      <path
        d="m 111.53493,796.44271 q 2.53907,0 4.39454,-1.85547 l 43.75,-43.75 q 1.85547,-1.85547 1.85547,-4.39453 0,-2.53907 -1.85547,-4.39454 l -43.75,-43.74999 q -1.85547,-1.85547 -4.39454,-1.85547 -2.53906,0 -4.39452,1.85547 -1.85547,1.85547 -1.85547,4.39453 v 87.5 q 0,2.53906 1.85547,4.39453 1.85546,1.85547 4.39452,1.85547 z"
      />
    </g>
  </svg>
</template>

<script>
export default {
  name: "Caret",
  props: ["open"],
};
</script>
