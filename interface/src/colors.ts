import chroma from "chroma-js";

export const powerBaseColors = {
  AUSTRIA: chroma("#B5BF90"),
  ENGLAND: chroma("#EDD096"),
  FRANCE: chroma("#CE8D74"),
  GERMANY: chroma("#A1BBBF"),
  ITALY: chroma("#F8CACA"),
  RUSSIA: chroma("#C9C7DD"),
  TURKEY: chroma("#CE8DBB"),
};

export const landColor = chroma("#CCCCCC");
export const waterColor = chroma("#437082");
export const impassableColor = chroma("#4D4D4D");

export const successfulOrderColor = chroma("#000000");
export const failedOrderColor = chroma("#FF0000");
export const convoyOrderColor = waterColor.brighten(1).saturate(2);
