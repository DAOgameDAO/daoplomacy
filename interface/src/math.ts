import { Coords } from "./types";

export function length(x: Coords): number {
  return Math.sqrt(x[0] * x[0] + x[1] * x[1]);
}

export function angle(x: Coords) {
  return Math.atan2(x[1], x[0]);
}

export function negCoords(x: Coords): Coords {
  return [-x[0], -x[1]];
}

export function addCoords(x1: Coords, x2: Coords): Coords {
  return [x1[0] + x2[0], x1[1] + x2[1]];
}

export function subCoords(x1: Coords, x2: Coords): Coords {
  return addCoords(x1, negCoords(x2));
}

export function mulCoords(x: Coords, s: number): Coords {
  return [x[0] * s, x[1] * s];
}

export function divCoords(x: Coords, s: number): Coords {
  return mulCoords(x, 1 / s);
}

export function normCoords(x: Coords): Coords {
  return divCoords(x, length(x));
}

export function midCoords(x1: Coords, x2: Coords): Coords {
  return addCoords(x1, divCoords(subCoords(x2, x1), 2));
}

export function rotateCoords(x: Coords, angle: number): Coords {
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  return [c * x[0] - s * x[1], s * x[0] + c * x[1]];
}

export function triangleCenter(x1: Coords, x2: Coords, x3: Coords): Coords {
  return mulCoords(addCoords(addCoords(x1, x2), x3), 0.33333);
}

export function offset(x1: Coords, x2: Coords, o: number, maxFraction: number) {
  const d = subCoords(x2, x1);
  const l = length(d);
  return addCoords(x1, mulCoords(normCoords(d), Math.min(o, maxFraction * l)));
}
