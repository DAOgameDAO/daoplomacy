import {
  Unit,
  UnitType,
  UnitLocation,
  Coast,
  Order,
  HoldOrder,
  MoveOrder,
  ConvoyOrder,
  SupportOrder,
  BuildOrder,
  DisbandOrder,
  RetreatOrder,
  OrderType,
} from "./types";

export function parseUnit(s: string): Unit | null {
  const parts = s.toLowerCase().split(" ");
  if (parts.length !== 2) {
    return null;
  }
  const dislodgedAndTypePart = parts[0];
  const locationPart = parts[1];

  const dislodged = dislodgedAndTypePart[0] === "*";
  let typePart;
  if (dislodged) {
    typePart = dislodgedAndTypePart.slice(1);
  } else {
    typePart = dislodgedAndTypePart;
  }

  const unitType = parseUnitType(typePart);
  const unitLocation = parseUnitLocation(locationPart, dislodged);
  if (!unitType || !unitLocation) {
    return null;
  }

  return {
    type: unitType,
    location: unitLocation,
  };
}

export function parseUnitType(s: string): UnitType | null {
  s = s.toLowerCase();
  switch (s) {
    case "a":
      return UnitType.Army;
    case "f":
      return UnitType.Fleet;
    default:
      return null;
  }
}

export function parseUnitLocation(
  s: string,
  dislodged: boolean = false
): UnitLocation | null {
  const parts = s.toLowerCase().split("/");
  if (parts.length > 2) {
    return null;
  }
  const province = parts[0];
  if (province.length !== 3) {
    return null;
  }
  let coast;
  if (parts.length === 2) {
    coast = parseCoast(parts[1]);
    if (!coast) {
      return null;
    }
  } else {
    coast = null;
  }
  return {
    province: province,
    coast: coast,
    dislodged: dislodged,
  };
}

function parseCoast(s: string): Coast | null {
  switch (s.toLowerCase()) {
    case "nc":
      return Coast.North;
    case "ec":
      return Coast.East;
    case "sc":
      return Coast.South;
    case "wc":
      return Coast.West;
    default:
      return null;
  }
}

export function parseOrder(s: string): Order | null {
  const parts = s.toLowerCase().split(" ");
  if (parts.length < 3) {
    return null;
  }

  const unit = parseUnit(parts.slice(0, 2).join(" "));
  if (!unit) {
    return null;
  }
  const orderTypePart = parts[2];
  const remainingParts = parts.slice(3);

  switch (orderTypePart) {
    case "h":
      return parseHoldOrderParts(remainingParts, unit);
    case "-":
      return parseMoveOrderParts(remainingParts, unit);
    case "c":
      return parseConvoyOrderParts(remainingParts, unit);
    case "s":
      return parseSupportOrderParts(remainingParts, unit);
    case "b":
      return parseBuildOrderParts(remainingParts, unit);
    case "d":
      return parseDisbandOrderParts(remainingParts, unit);
    case "r":
      return parseRetreatOrderParts(remainingParts, unit);
    default:
      return null;
  }
}

function parseHoldOrderParts(
  remainingParts: string[],
  unit: Unit
): HoldOrder | null {
  if (remainingParts.length !== 0) {
    return null;
  }
  return {
    type: OrderType.Hold,
    unit: unit,
  };
}

function parseMoveOrderParts(
  remainingParts: string[],
  unit: Unit
): MoveOrder | null {
  if (remainingParts.length < 1 || remainingParts.length > 2) {
    return null;
  }
  const target = parseUnitLocation(remainingParts[0]);
  if (!target) {
    return null;
  }
  let convoyed = false;
  if (remainingParts.length === 2) {
    if (remainingParts[1] !== "via") {
      return null;
    }
    convoyed = true;
  }
  return {
    type: OrderType.Move,
    unit: unit,
    target: target,
    convoyed: convoyed,
  };
}

function parseConvoyOrderParts(
  remainingParts: string[],
  unit: Unit
): ConvoyOrder | null {
  if (remainingParts.length !== 4) {
    return null;
  }
  const receiver = parseUnit(remainingParts.slice(0, 2).join(" "));
  if (!receiver) {
    return null;
  }
  if (remainingParts[2] !== "-") {
    return null;
  }
  const target = parseUnitLocation(remainingParts[3]);
  if (!target) {
    return null;
  }
  return {
    type: OrderType.Convoy,
    unit: unit,
    receiver: receiver,
    target: target,
  };
}

function parseSupportOrderParts(
  remainingParts: string[],
  unit: Unit
): SupportOrder | null {
  if (remainingParts.length !== 2 && remainingParts.length !== 4) {
    return null;
  }
  const receiver = parseUnit(remainingParts.slice(0, 2).join(" "));
  if (!receiver) {
    return null;
  }

  if (remainingParts.length === 2) {
    return {
      type: OrderType.SupportHold,
      unit: unit,
      receiver: receiver,
    };
  }

  if (remainingParts[2] !== "-") {
    return null;
  }
  const target = parseUnitLocation(remainingParts[3]);
  if (!target) {
    return null;
  }
  return {
    type: OrderType.SupportMove,
    unit: unit,
    receiver: receiver,
    target: target,
  };
}

function parseBuildOrderParts(
  remainingParts: string[],
  unit: Unit
): BuildOrder | null {
  if (remainingParts.length !== 0) {
    return null;
  }
  return {
    type: OrderType.Build,
    unit: unit,
  };
}

function parseDisbandOrderParts(
  remainingParts: string[],
  unit: Unit
): DisbandOrder | null {
  if (remainingParts.length !== 0) {
    return null;
  }
  return {
    type: OrderType.Disband,
    unit: unit,
  };
}

function parseRetreatOrderParts(
  remainingParts: string[],
  unit: Unit
): RetreatOrder | null {
  if (remainingParts.length !== 1) {
    return null;
  }
  const target = parseUnitLocation(remainingParts[0]);
  if (!target) {
    return null;
  }
  return {
    type: OrderType.Retreat,
    unit: unit,
    target: target,
  };
}
