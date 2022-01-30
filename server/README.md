# DAOplomacy Server

This directory provides the backend to which the DAOplomacy frontend connects to in order to fetch
game data. The server loads the submitted orders from the blockchain, decrypts them, and computes
the game state based on the history of all orders.

The server as a centralized entity is not required for the game to function, it is a purely
optional component for convenience. Everyone is encourage to run their own server instance to
double check the data displayed in the centrally hosted frontend.

## Usage

- Install the requirements with `pip install -r requirements.txt` in a virtualenv.
- Run `python init_game.py` once to initialize the game data.
- Run `python advance_game.py` for each passed phase to update the game data with the newly
  submitted orders. This command will do nothing if the next phase is still in progress, the
  decryption key is not available yet, or the game is finished.
- Run `caddy run` to serve the game data files.

## Configuration

Configure the scripts with a `.env` file (see also `.env.example`). The environment variables are
as follows:

- `ETHEREUM_RPC_URL`: URL to an Ethereum RPC server
- `DEPLOYMENT_PATH`: Path to the deployment directory (created by hardhat deploy) from which
  contract addresses etc. will be read
- `GAME_DIR`: Output directory in which the processed game states will be stored
- `PAGE_SIZE`: Page size for event fetching requests in number of blocks
- `EON_KEY`: The hex encoded eon key against which decryption keys will be checked
- `PLAYER_ADDRESSES`: Comma separated, ordered list of Ethereum addresses of all seven players.
