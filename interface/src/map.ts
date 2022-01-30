import * as types from "./types";
import map from "./assets/map.json";
import { UnknownProvince } from "./error";

export function getUnitCoords(unitLocation: types.UnitLocation): types.Coords {
  const prov = map.provinces[unitLocation.province];
  if (!prov) {
    throw new UnknownProvince(unitLocation.province);
  }

  let unitCoords;
  if (!unitLocation.coast) {
    unitCoords = prov.unitCoords;
  } else {
    if (!prov.coasts) {
      throw new UnknownProvince(unitLocation.province, unitLocation.coast);
    }
    const coast = prov.coasts[getCoastKey(unitLocation.coast)];
    if (!coast) {
      throw new UnknownProvince(unitLocation.province, unitLocation.coast);
    }
    unitCoords = coast.unitCoords;
  }
  if (!unitLocation.dislodged) {
    return unitCoords.occupying;
  } else {
    return unitCoords.dislodged;
  }
}

function getCoastKey(coast: types.Coast): string {
  switch (coast) {
    case types.Coast.North:
      return "nc";
    case types.Coast.East:
      return "ec";
    case types.Coast.South:
      return "sc";
    case types.Coast.West:
      return "wc";
  }
}
