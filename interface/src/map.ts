import _ from "lodash";
import * as types from "./types";
import { parseCoast } from "./parsers";
import { UnknownProvince } from "./error";
import mapSVG from "./assets/map.svg.xml";

const powers: types.Power[] = [
  "austria",
  "england",
  "france",
  "germany",
  "italy",
  "russia",
  "turkey",
];
const dislodgeOffset: Number[] = [25, -25];
const map = parseMap(mapSVG);

function parseMap(svg: types.Map): any {
  const viewbox = parseViewBox(svg);
  const backgroundEllipse = parseBackgroundEllipse(svg);
  const provinces = parseProvinces(svg);

  return {
    viewbox: viewbox,
    backgroundEllipse: backgroundEllipse,
    powers: powers,
    provinces: provinces,
  };
}

function parseViewBox(svg: any): Number[] {
  const s = svg.svg.$.viewBox;
  const parts = _.split(s, " ");
  return _.map(parts, Number);
}

function parseBackgroundEllipse(svg: any): Number[] {
  const ellipse = svg.svg.g[0].ellipse[0];
  return _.map(
    [ellipse.$.cx, ellipse.$.cy, ellipse.$.rx, ellipse.$.ry],
    Number
  );
}

function parseProvinces(svg: any): {
  [key: types.Province]: types.ProvinceData;
} {
  const provinces: { [key: types.Province]: types.ProvinceData } = {};
  for (const provinceGroup of svg.svg.g[0].g[0].g) {
    const name: string = provinceGroup.$.id;
    provinces[name] = parseProvince(provinceGroup);
  }
  return provinces;
}

function parseProvince(province: any): types.ProvinceData {
  if (province.path.length === 0) {
    throw new Error(
      "unexpected map format: missing path in province " + province.$.id
    );
  }
  const path = province.path[0].$.d;
  const type = getProvinceType(province);
  const impassable = elementHasClasses(province, ["impassable"]);
  const labelCoords = parseLabelCoords(province);

  let passableAttributes;
  if (impassable) {
    passableAttributes = {};
  } else {
    passableAttributes = {
      centerCoords: parseCenterCoords(province),
      unitCoords: parseUnitCoords(province),
      coastUnitCoords: parseCoastUnitCoords(province),
    };
  }

  return {
    path: path,
    type: type,
    impassable: impassable,
    labelCoords: labelCoords,
    ...passableAttributes,
  };
}

function getProvinceType(province: any): types.ProvinceType {
  const land = elementHasClasses(province, ["land"]);
  const water = elementHasClasses(province, ["water"]);
  if (!land && !water) {
    throw new Error(
      "unexpected map format: type not specified for province " + province.$.id
    );
  }
  if (land && water) {
    throw new Error(
      "unexpected map format: multiple types specified for province " +
        province.$.id
    );
  }
  if (land) {
    return types.ProvinceType.Land;
  } else {
    return types.ProvinceType.Water;
  }
}

function parseLabelCoords(province: any): Number[] | null {
  const labelMarkers = findChildren(province, "ellipse", ["label-marker"]);
  if (labelMarkers.length === 0) {
    return null;
  } else if (labelMarkers.length === 1) {
    const marker = labelMarkers[0];
    return [Number(marker.$.cx), Number(marker.$.cy)];
  } else {
    throw new Error(
      "unexpected map format: multiple label markers in province " +
        province.$.id
    );
  }
}

function parseCenterCoords(province: any): Number[] | null {
  const centerMarkers = findChildren(province, "circle", ["center-marker"]);
  if (centerMarkers.length === 0) {
    return null;
  } else if (centerMarkers.length === 1) {
    const marker = centerMarkers[0];
    return [Number(marker.$.cx), Number(marker.$.cy)];
  } else {
    throw new Error(
      "unexpected map format: multiple center markers in province " +
        province.$.id
    );
  }
}

function parseUnitCoords(province: any): Number[] {
  const unitMarkers = findChildren(province, "circle", ["unit-marker"]);
  if (unitMarkers.length === 0) {
    throw new Error(
      "unexpected map format: missing unit marker in province " + province.$.id
    );
  }
  let defaultUnitMarker = null;
  for (const unitMarker of unitMarkers) {
    if (elementHasClasses(unitMarker, ["unit-coast"])) {
      continue;
    }
    if (defaultUnitMarker) {
      throw new Error(
        "unexpected map format: multiple default unit markers in province " +
          province.$.id
      );
    }
    defaultUnitMarker = unitMarker;
  }
  return [Number(defaultUnitMarker.$.cx), Number(defaultUnitMarker.$.cy)];
}

function parseCoastUnitCoords(province: any): {
  [coast in types.Coast]?: Number[];
} {
  const unitMarkers = findChildren(province, "circle", ["unit-marker"]);
  const possibleCoasts = ["nc", "ec", "sc", "wc"];

  const coasts: { [_ in types.Coast]?: Number[] } = {};
  for (const unitMarker of unitMarkers) {
    if (!elementHasClasses(unitMarker, ["unit-coast"])) {
      continue;
    }
    const presentCoasts = _.intersection(
      possibleCoasts,
      _.split(unitMarker.$.class, " ")
    );
    if (presentCoasts.length !== 1) {
      throw new Error(
        "unexpected map format: not exactly one coast defined on coast marker"
      );
    }
    const coast = parseCoast(presentCoasts[0]);
    if (!coast) {
      throw new Error("unexpected map format: invalid coast identifier");
    }
    coasts[coast] = [Number(unitMarker.$.cx), Number(unitMarker.$.cy)];
  }
  return coasts;
}

function findChildren(
  parent: any,
  type: string,
  requiredClasses: string[]
): any[] {
  const found = [];
  for (const child of parent[type] || []) {
    if (elementHasClasses(child, requiredClasses)) {
      found.push(child);
    }
  }
  return found;
}

function elementHasClasses(element: any, classes: string[]): boolean {
  const presentClasses = _.split(element.$.class, " ");
  const missingClasses = _.difference(classes, presentClasses);
  return missingClasses.length === 0;
}

export function getUnitCoords(unitLocation: types.UnitLocation): types.Coords {
  const prov = map.provinces[unitLocation.province];
  if (!prov) {
    throw new UnknownProvince(unitLocation.province);
  }

  let unitCoords;
  if (!unitLocation.coast) {
    unitCoords = prov.unitCoords;
  } else {
    if (!prov.coastUnitCoords) {
      throw new UnknownProvince(unitLocation.province, unitLocation.coast);
    }
    unitCoords = prov.coastUnitCoords[unitLocation.coast];
    if (!unitCoords) {
      throw new UnknownProvince(unitLocation.province, unitLocation.coast);
    }
  }

  if (!unitLocation.dislodged) {
    return unitCoords;
  } else {
    return [
      unitCoords[0] + dislodgeOffset[0],
      unitCoords[1] + dislodgeOffset[1],
    ];
  }
}

export default map;
