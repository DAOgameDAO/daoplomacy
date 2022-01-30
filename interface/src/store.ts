import { createStore } from "vuex";
import {
  loadPhases,
  loadGameState,
  loadOrders,
  loadPossibleOrders,
} from "./loading";
import { Phase, GameState, Order, Power, AnnotatedOrder } from "./types";

interface State {
  phases: Phase[] | null;
  gameStates: Record<number, GameState>;
  orders: Record<number, Record<Power, AnnotatedOrder[]>>;
  possibleOrders: Record<number, Record<Power, Order[]>>;
  loadingGameStates: Record<number, boolean>;
  loadingOrders: Record<number, boolean>;
  loadingPossibleOrders: Record<number, boolean>;
}

enum DataSet {
  Orders,
  GameStates,
  PossibleOrders,
}

export const store = createStore({
  strict: process.env.NODE_ENV !== "production",

  state(): State {
    return {
      phases: null,

      gameStates: {},
      orders: {},
      possibleOrders: {},

      loadingGameStates: {},
      loadingOrders: {},
      loadingPossibleOrders: {},
    };
  },

  getters: {
    getGameState: (state: State) => (phaseIndex: number) => {
      return state.gameStates[phaseIndex] || null;
    },
    getOrders: (state: State) => (phaseIndex: number) => {
      return state.orders[phaseIndex] || null;
    },
    getPossibleOrders: (state: State) => (phaseIndex: number) => {
      return state.possibleOrders[phaseIndex] || null;
    },
    getLoading: (state: State) => (phaseIndex: number) => {
      return (
        state.loadingGameStates[phaseIndex] ||
        state.loadingOrders[phaseIndex] ||
        state.loadingPossibleOrders[phaseIndex]
      );
    },
  },

  mutations: {
    setPhases(state: State, phases: Phase[]) {
      state.phases = phases;
    },
    setGameState(
      state: State,
      { phaseIndex, gameState }: { phaseIndex: number; gameState: GameState }
    ) {
      state.gameStates[phaseIndex] = gameState;
    },
    setOrders(
      state: State,
      {
        phaseIndex,
        orders,
      }: { phaseIndex: number; orders: Record<Power, AnnotatedOrder[]> }
    ) {
      state.orders[phaseIndex] = orders;
    },
    setPossibleOrders(
      state: State,
      {
        phaseIndex,
        possibleOrders,
      }: { phaseIndex: number; possibleOrders: Record<Power, Order[]> }
    ) {
      state.possibleOrders[phaseIndex] = possibleOrders;
    },
    setLoading(
      state: State,
      {
        phaseIndex,
        dataSet,
        isLoading,
      }: { phaseIndex: number; dataSet: DataSet; isLoading: boolean }
    ) {
      switch (dataSet) {
        case DataSet.GameStates:
          state.loadingGameStates[phaseIndex] = isLoading;
          break;
        case DataSet.Orders:
          state.loadingOrders[phaseIndex] = isLoading;
          break;
        case DataSet.PossibleOrders:
          state.loadingOrders[phaseIndex] = isLoading;
          break;
      }
    },
  },

  actions: {
    async loadPhases({ state, commit }) {
      if (state.phases) {
        return;
      }
      const phases = await loadPhases();
      commit("setPhases", phases);
    },

    async loadGameState({ state, commit }, phaseIndex: number) {
      if (state.gameStates[phaseIndex]) {
        return;
      }
      commit("setLoading", {
        phaseIndex: phaseIndex,
        dataSet: DataSet.GameStates,
        isLoading: true,
      });
      const gameState = await loadGameState(phaseIndex);
      commit("setGameState", { phaseIndex: phaseIndex, gameState: gameState });
      commit("setLoading", {
        phaseIndex: phaseIndex,
        dataSet: DataSet.GameStates,
        isLoading: false,
      });
    },

    async loadOrders({ state, commit }, phaseIndex: number) {
      if (state.orders[phaseIndex]) {
        return;
      }
      commit("setLoading", {
        phaseIndex: phaseIndex,
        dataSet: DataSet.Orders,
        isLoading: true,
      });
      const orders = await loadOrders(phaseIndex);
      commit("setOrders", { phaseIndex: phaseIndex, orders: orders });
      commit("setLoading", {
        phaseIndex: phaseIndex,
        dataSet: DataSet.Orders,
        isLoading: false,
      });
    },

    async loadPossibleOrders({ state, commit }, phaseIndex: number) {
      if (state.possibleOrders[phaseIndex]) {
        return;
      }
      commit("setLoading", {
        phaseIndex: phaseIndex,
        dataSet: DataSet.PossibleOrders,
        isLoading: true,
      });
      const possibleOrders = await loadPossibleOrders(phaseIndex);
      commit("setPossibleOrders", {
        phaseIndex: phaseIndex,
        possibleOrders: possibleOrders,
      });
      commit("setLoading", {
        phaseIndex: phaseIndex,
        dataSet: DataSet.PossibleOrders,
        isLoading: false,
      });
    },
  },
});
