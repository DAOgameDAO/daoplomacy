import {
  OrderType,
  Unit,
  UnitType,
  Phase,
  Province,
  Order,
  Coast,
  UnitLocation,
} from "./types";

export function formatOrder(order: Order): string {
  let parts: string[] = [];

  parts.push(formatUnit(order.unit));
  parts.push(formatOrderType(order.type));
  if ("receiver" in order) {
    parts.push(formatUnit(order.receiver));
  }
  if (order.type === OrderType.SupportMove) {
    parts.push(formatOrderType(OrderType.Move));
  }
  if ("target" in order) {
    parts.push(formatLocation(order.target));
  }
  if ("convoyed" in order && order.convoyed) {
    parts.push("VIA");
  }

  return parts.join(" ");
}

export function formatUnit(unit: Unit): string {
  return formatUnitType(unit.type) + " " + formatLocation(unit.location);
}

export function formatUnitType(type: UnitType): string {
  switch (type) {
    case UnitType.Army:
      return "A";
    case UnitType.Fleet:
      return "F";
  }
}

export function formatLocation(location: UnitLocation): string {
  const prov = formatProvince(location.province);
  if (location.coast === null) {
    return prov;
  } else {
    return prov + "/" + formatCoast(location.coast);
  }
}

export function formatProvince(province: Province): string {
  return province.toUpperCase();
}

export function formatCoast(coast: Coast): string {
  switch (coast) {
    case Coast.North:
      return "NC";
    case Coast.East:
      return "EC";
    case Coast.South:
      return "SC";
    case Coast.West:
      return "WC";
  }
}

export function formatOrderType(orderType: OrderType): string {
  switch (orderType) {
    case OrderType.Hold:
      return "H";
    case OrderType.Move:
      return "-";
    case OrderType.SupportHold:
      return "S";
    case OrderType.SupportMove:
      return "S";
    case OrderType.Convoy:
      return "C";
    case OrderType.Build:
      return "B";
    case OrderType.Disband:
      return "D";
    case OrderType.Retreat:
      return "R";
  }
}

export function formatPhase(phase: Phase): string {
  if (phase.completed) {
    return "Finished";
  }

  const season =
    phase.season[0].toUpperCase() + phase.season.slice(1).toLowerCase();
  const year = (phase.year - 1901 + 1337).toString();
  const type = phase.type[0].toUpperCase() + phase.type.slice(1).toLowerCase();
  return [season, year, "AV", "(" + type + ")"].join(" ");
}
