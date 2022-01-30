export type Order = MovementOrder | AdjustmentOrder | RetreatPhaseOrder;

export type MovementOrder = HoldOrder | MoveOrder | SupportOrder | ConvoyOrder;

export type AdjustmentOrder = BuildOrder | DisbandOrder;

export type RetreatPhaseOrder = RetreatOrder | DisbandOrder;

export type SupportOrder = SupportHoldOrder | SupportMoveOrder;

export type OrderWithReceiver = SupportOrder | ConvoyOrder;

export type OrderWithTarget =
  | MoveOrder
  | SupportMoveOrder
  | ConvoyOrder
  | RetreatOrder;

export interface HoldOrder {
  type: OrderType.Hold;
  unit: Unit;
}

export interface MoveOrder {
  type: OrderType.Move;
  unit: Unit;
  target: UnitLocation;
  convoyed: boolean;
}

export interface RetreatOrder {
  type: OrderType.Retreat;
  unit: Unit;
  target: UnitLocation;
}

export interface ConvoyOrder {
  type: OrderType.Convoy;
  unit: Unit;
  receiver: Unit;
  target: UnitLocation;
}

export interface SupportHoldOrder {
  type: OrderType.SupportHold;
  unit: Unit;
  receiver: Unit;
}

export interface SupportMoveOrder {
  type: OrderType.SupportMove;
  unit: Unit;
  receiver: Unit;
  target: UnitLocation;
}

export interface BuildOrder {
  type: OrderType.Build;
  unit: Unit;
}

export interface DisbandOrder {
  type: OrderType.Disband;
  unit: Unit;
}

export interface Unit {
  type: UnitType;
  location: UnitLocation;
}

export enum UnitType {
  Army = 1,
  Fleet,
}

export enum OrderType {
  Hold,
  Move,
  Convoy,
  SupportHold,
  SupportMove,
  Build,
  Disband,
  Retreat,
}

export interface UnitLocation {
  province: Province;
  coast: Coast | null;
  dislodged: boolean;
}

export type Province = string;

export enum Coast {
  North = 1,
  East,
  South,
  West,
}

export type Power = string;

export interface Owned {
  power: Power;
}

export type Coords = [number, number];

export interface Phase {
  index: number;
  year: Year;
  season: Season;
  type: PhaseType;
  completed: boolean;
}

export type Year = number;

export enum Season {
  Spring = "SPRING",
  Fall = "FALL",
  Winter = "WINTER",
}

export enum PhaseType {
  Movement = "MOVEMENT",
  Retreat = "RETREAT",
  Adjustment = "ADJUSTMENTS",
}

export function isSupportOrderType(type: OrderType): boolean {
  return type === OrderType.SupportHold || type === OrderType.SupportMove;
}

export function isOrderTypeWithReceiver(type: OrderType): boolean {
  return (
    type === OrderType.SupportHold ||
    type === OrderType.SupportMove ||
    type === OrderType.Convoy
  );
}

export function isOrderTypeWithTarget(type: OrderType): boolean {
  return (
    type === OrderType.Move ||
    type === OrderType.SupportMove ||
    type === OrderType.Convoy ||
    type === OrderType.Retreat
  );
}

export interface GameState {}

export interface AnnotatedOrder {
  power: Power;
  rawOrder: string;
  parsedOrder: Order | null;
  accepted: boolean;
  results: OrderResults;
}

export interface OrderResults {
  bounce: boolean;
  cut: boolean;
  dislodged: boolean;
  void: boolean;
}
