import { Phase, Order, GameState, Power, AnnotatedOrder } from "./types";
import { parseOrder } from "./parsers";

const env = import.meta.env;

export function getPhasesURL(): URL {
  return new URL(env.VITE_PHASES_URL_PATH, env.VITE_GAME_DATA_SERVER_URL);
}

export function getStateURL(phaseIndex: number): URL {
  return new URL(
    env.VITE_STATE_URL_PATH + phaseIndex.toString() + ".json",
    env.VITE_GAME_DATA_SERVER_URL
  );
}

export function getOrdersURL(phaseIndex: number): URL {
  return new URL(
    env.VITE_ORDERS_URL_PATH + phaseIndex.toString() + ".json",
    env.VITE_GAME_DATA_SERVER_URL
  );
}

export function getPossibleOrdersURL(phaseIndex: number): URL {
  return new URL(
    env.VITE_POSSIBLE_ORDERS_URL_PATH + phaseIndex.toString() + ".json",
    env.VITE_GAME_DATA_SERVER_URL
  );
}

export async function loadPhases(): Promise<Phase[]> {
  const response = await fetch(getPhasesURL().toString());
  const reponseString = await response.text();
  const phaseStrings = reponseString.trim().split("\n");
  const phases = [];
  for (const phaseString of phaseStrings) {
    const phase = JSON.parse(phaseString);
    phases.push(phase);
  }
  return phases;
}

export async function loadGameState(phaseIndex: number): Promise<GameState> {
  const response = await fetch(getStateURL(phaseIndex).toString());
  return await response.json();
}

export async function loadOrders(
  phaseIndex: number
): Promise<Record<Power, AnnotatedOrder[]>> {
  const response = await fetch(getOrdersURL(phaseIndex).toString());
  const json = await response.json();

  const orders: Record<Power, AnnotatedOrder[]> = {};
  for (const power of Object.keys(json)) {
    orders[power] = [];
    for (const rawOrder of json[power]) {
      const order: AnnotatedOrder = {
        power: power,
        rawOrder: rawOrder.order,
        parsedOrder: parseOrder(rawOrder.order),
        accepted: rawOrder.accepted,
        results: {
          bounce: rawOrder.result.includes("bounce"),
          cut: rawOrder.result.includes("cut"),
          void: rawOrder.result.includes("void"),
          dislodged: rawOrder.result.includes("dislodged"),
        },
      };
      orders[power].push(order);
    }
  }
  return orders;
}

export async function loadPossibleOrders(
  phaseIndex: number
): Promise<Order[] | null> {
  const response = await fetch(getPossibleOrdersURL(phaseIndex).toString());
  const ordersJSON = await response.json();
  const orders = [];
  for (const v of Object.values(ordersJSON)) {
    for (const orderString of v) {
      const order = parseOrder(orderString);
      if (!order) {
        continue; // ignore invalid orders
      }
      orders.push(order);
    }
  }
  return orders;
}
