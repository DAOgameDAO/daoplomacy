# DAOplomacy Frontend

This directory contains a frontend implementation for DAOplomacy based on Vue. The interface
displays a map with the current state of the game. It also allows inspecting the phases of the
game which are already over, including the set of orders each player submitted. Finally, the order
planner provides an easy tool to plan out a valid order and encrypt it, outputting the
corresponding calldata that the player would have to submit to schedule it.

## Operation

`npm run dev` in this directory runs a dev server.

## Configuration

The frontend is configured via a `.env` file. See `.env.example` for an example. The file needs to define the following environment variables:

- `VITE_ETHEREUM_RPC_URL`: URL to an Ethereum JSON RPC server
- `VITE_SHCRYPTO_WASM_URL`: URL to the `shcrypto.wasm` file
- `VITE_EON_KEY`: Hex encoded eon key that will be used to encrypt orders for all rounds
- `VITE_GAME_DATA_SERVER_URL`: URL of the server providing the game data
- `VITE_PHASES_URL_PATH`: Path on the game data server where the phases file is located
- `VITE_STATE_URL_PATH`: Path on the game data server where the state dumps directory is located
- `VITE_POSSIBLE_ORDERS_URL_PATH`: Path on the game data server where the possible order dumps
  directory is located
- `VITE_ORDERS_URL_PATH`: Path on the game data server where the order dumps directory is located

Contract addresses are read from the `src/assets/deployment` directory which should be created by
hardhat with the deploy plugin.
