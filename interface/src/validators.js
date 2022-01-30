import map from "./assets/map.json";

export function province(value) {
  if (!value && value != "") {
    return true;
  }
  return map.unitCoordinates[value] !== undefined;
}

export function power(value) {
  if (!value && value !== "") {
    return true;
  }
  return map.powers.includes(value);
}

export function unitType(value) {
  if (!value && value !== "") {
    return true;
  }
  return ["army", "fleet"].includes(value);
}

export function coords(value) {
  if (!Array.isArray(value)) {
    return false;
  }
  if (length(value) != 2) {
    return false;
  }
  for (const c of value) {
    if (!typeof c === "number") {
      return false;
    }
  }
  return true;
}
