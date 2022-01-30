import chroma from "chroma-js";

export const powerBaseColors = {
  AUSTRIA: chroma("#DC143C"),
  ENGLAND: chroma("#6495ED"),
  FRANCE: chroma("#008B8B"),
  GERMANY: chroma("#2F4F4F"),
  ITALY: chroma("#006400"),
  RUSSIA: chroma("#8A2BE2"),
  TURKEY: chroma("#D2691E"),
};

export const landColor = chroma("#FAFAD2");
export const waterColor = chroma("#87CEFA");
export const neutralColor = chroma("#D3D3D3");

export const successfulOrderColor = chroma("#000000").brighten(1.4);
export const failedOrderColor = chroma("#FF0000").desaturate();
export const convoyOrderColor = waterColor.darken(2);
