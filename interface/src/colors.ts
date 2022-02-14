import chroma from "chroma-js";

export const powerBaseColors = {
  ALPHA: chroma("#B5BF90"),
  BETA: chroma("#EDD096"),
  GAMMA: chroma("#CE8D74"),
  DELTA: chroma("#A1BBBF"),
  EPSILON: chroma("#F8CACA"),
  ZETA: chroma("#C9C7DD"),
  ETA: chroma("#CE8DBB"),
};

export const landColor = chroma("#CCCCCC");
export const waterColor = chroma("#437082");
export const impassableColor = chroma("#4D4D4D");

export const successfulOrderColor = chroma("#000000");
export const failedOrderColor = chroma("#FF0000");
export const convoyOrderColor = waterColor.brighten(1).saturate(2);
