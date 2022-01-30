# DAOplomacy Keyper

This directory contains a script that instructs a Rolling Shutter keyper node to produce
decryption keys when needed and broadcasts them to the blockchain.

## Usage

Run `python control.py`. This will perform two tasks:

- trigger generation of decryption keys for completed phases
- broadcast outstanding eon or decryption keys to the key broadcast contract

## Configuration

The script is configured with a `.env` file (see also `.env.example`). The environment variables
are as follows:

- `ETHEREUM_RPC_URL`: URL to an Ethereum RPC server
- `DEPLOYMENT_PATH`: Path to the deployment directory (created by hardhat deploy) from which
  contract addresses etc. will be read
- `KEYPER_PRIVATE_KEY`: Private key of the keyper used to sign key broadcast transactions
- `KEYPER_RPC_URL`: URL to the rolling shutter keyper node to control
- `KEYPER_SET_N` and `KEYPER_SET_I`: Indices of the keyper in the keyper set
- `CHAIN_ID`: Chain ID of the chain on which the key broadcast contract is deployed
- `NUM_CONFIRMATIONS`: The number of block confirmations to wait before accepting a transaction to
  be included in the chain
