import json
import os
import pathlib
from urllib.parse import urljoin
import web3
import requests
import dotenv
import time

dotenv.load_dotenv()

BROADCASTED_KEYS_PATH = "broadcasted_keys.json"
KEY_GENERATION_TIMEOUT = 120

ETHEREUM_RPC_URL = os.getenv("ETHEREUM_RPC_URL")
KEYPER_RPC_URL = os.getenv("KEYPER_RPC_URL")
DEPLOYMENT_PATH = pathlib.Path(os.getenv("DEPLOYMENT_PATH"))
KEYPER_PRIVATE_KEY = os.getenv("KEYPER_PRIVATE_KEY")
KEYPER_SET_N = int(os.getenv("KEYPER_SET_N"))
KEYPER_SET_I = int(os.getenv("KEYPER_SET_I"))
CHAIN_ID = int(os.getenv("CHAIN_ID"))
NUM_CONFIRMATIONS = int(os.getenv("NUM_CONFIRMATIONS"))

w3 = web3.Web3(web3.Web3.WebsocketProvider(ETHEREUM_RPC_URL))
KEYPER_ADDRESS = w3.eth.account.privateKeyToAccount(KEYPER_PRIVATE_KEY).address

KEY_BROADCAST_PATH = DEPLOYMENT_PATH.joinpath("KeyBroadcast.json")
BATCH_COUNTER_PATH = DEPLOYMENT_PATH.joinpath("BatchCounter.json")

KEY_BROADCAST_DEPLOYMENT = json.load(open(KEY_BROADCAST_PATH))
BATCH_COUNTER_DEPLOYMENT = json.load(open(BATCH_COUNTER_PATH))

key_broadcast = w3.eth.contract(
    abi=KEY_BROADCAST_DEPLOYMENT["abi"], address=KEY_BROADCAST_DEPLOYMENT["address"]
)
batch_counter = w3.eth.contract(
    abi=BATCH_COUNTER_DEPLOYMENT["abi"], address=BATCH_COUNTER_DEPLOYMENT["address"]
)


class KeyperControlException(Exception):
    pass


def main():
    broadcasted_keys = load_broadcasted_keys()
    eons = get_successful_eons()
    current_batch = get_current_batch()

    next_batch_to_decrypt = get_next_batch_to_decrypt(broadcasted_keys)
    epochs_to_decrypt = get_epochs_to_decrypt(
        eons, next_batch_to_decrypt, current_batch
    )
    generate_missing_decryption_keys(epochs_to_decrypt)

    eon_keys_to_broadcast = get_eon_keys_to_broadcast(eons, broadcasted_keys)
    decryption_keys_to_broadcast = get_decryption_keys_to_broadcast(epochs_to_decrypt)

    broadcast_eon_keys(eon_keys_to_broadcast)
    broadcast_decryption_keys(decryption_keys_to_broadcast)

    new_broadcasted_keys = update_broadcasted_keys(
        broadcasted_keys, eon_keys_to_broadcast, decryption_keys_to_broadcast
    )
    store_broadcasted_keys(new_broadcasted_keys)


def load_broadcasted_keys():
    try:
        with open(BROADCASTED_KEYS_PATH) as f:
            keys = json.load(f)
    except FileNotFoundError:
        keys = {"eon_keys": [], "decryption_keys": []}
    return keys


def store_broadcasted_keys(broadcasted_keys):
    tmp_path = BROADCASTED_KEYS_PATH + ".tmp"
    with open(BROADCASTED_KEYS_PATH, "w") as f:
        json.dump(broadcasted_keys, f, indent=4)
        f.write("\n")


def get_current_batch():
    if not batch_counter.functions.hasStarted().call():
        return None
    return batch_counter.functions.currentBatchIndex().call()


def get_successful_eons():
    res = requests.get(urljoin(KEYPER_RPC_URL, "/v1/eons"))
    eons = res.json()

    successful_eons = []
    for eon in eons:
        if not eon["finished"]:
            continue
        if not eon["successful"]:
            continue
        successful_eons.append(eon)
    return successful_eons


def get_eon_keys_to_broadcast(eons, broadcasted_keys):
    keys_to_broadcast = []
    for eon in eons:
        if eon in broadcasted_keys["eon_keys"]:
            continue
        keys_to_broadcast.append(eon)
    return keys_to_broadcast


def get_epochs_to_decrypt(eons, last_decrypted_batch, current_batch):
    if current_batch is None:
        return []  # epochs haven't started yet

    latest_eon_key = get_latest_eon_key(eons)
    epochs_to_decrypt = []
    for i in range(last_decrypted_batch, current_batch):
        epoch_id = get_epoch_id(latest_eon_key, i)
        epochs_to_decrypt.append({"batch": i, "epoch": epoch_id})
    return epochs_to_decrypt


def get_latest_eon_key(eons):
    if len(eons) == 0:
        raise KeyperControlException("no successful eon key available yet")
    return sorted(eons, key=lambda v: v["index"], reverse=True)[0]


def get_next_batch_to_decrypt(broadcasted_keys):
    decryption_keys = broadcasted_keys["decryption_keys"]
    if not decryption_keys:
        return 0
    decrypted_batches = [k["batch"] for k in decryption_keys]
    return max(decrypted_batches) + 1


def get_epoch_id(eon_key, i):
    return (eon_key["activation_block_number"] << (4 * 8)) + i


def generate_missing_decryption_keys(epochs):
    batches = list(e["batch"] for e in epochs)
    if not batches:
        return
    print(f"generating decryption keys for batches {batches}...")

    for epoch in epochs:
        res = requests.post(
            urljoin(KEYPER_RPC_URL, f"/v1/decryptionTrigger"),
            json=f"0x{epoch['epoch']:016x}",
        )
        if res.status_code != requests.codes.ok:
            print("error response:", res.text)
        res.raise_for_status()

    start_time = time.time()
    while True:
        all_exist = True
        for epoch in epochs:
            exists = check_decryption_key_exists(epoch)
            if not exists:
                all_exist = False
                break

        if not all_exist:
            elapsed_time = time.time() - start_time
            if elapsed_time > KEY_GENERATION_TIMEOUT:
                raise KeyperControlException(
                    "Decryption keys for batches {batches} were not generated in time"
                )
            else:
                time.sleep(1)
                continue
        else:
            print(f"decryption key generation successful")
            break


def check_decryption_key_exists(epoch):
    res = requests.get(
        urljoin(KEYPER_RPC_URL, f"/v1/decryptionKey/0x{epoch['epoch']:016x}")
    )
    if res.status_code == requests.codes.not_found:
        return False
    res.raise_for_status()
    return True


def get_decryption_keys_to_broadcast(epochs):
    keys = []
    for epoch in epochs:
        res = requests.get(
            urljoin(KEYPER_RPC_URL, f"/v1/decryptionKey/0x{epoch['epoch']:016x}")
        )
        res.raise_for_status()

        decryption_key = res.json()

        keys.append(
            {
                "batch": epoch["batch"],
                "epoch": epoch["epoch"],
                "decryption_key": decryption_key,
            }
        )
    return keys


def broadcast_eon_keys(eon_keys_to_broadcast):
    if not eon_keys_to_broadcast:
        print("no new eon keys to broadcast")
        return

    nonce = w3.eth.get_transaction_count(KEYPER_ADDRESS)

    for key in eon_keys_to_broadcast:
        tx = key_broadcast.functions.broadcastEonKey(
            KEYPER_SET_N, KEYPER_SET_I, key["activation_block_number"], key["eon_key"]
        ).buildTransaction({"chainId": CHAIN_ID, "nonce": nonce})
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=KEYPER_PRIVATE_KEY)
        print(
            "\nbroadcasting eon key",
            json.dumps(key, indent=2),
            "with tx",
            json.dumps(tx, indent=2),
            signed_tx.hash.hex(),
            "...",
        )
        w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        wait_for_confirmations(signed_tx.hash)
        print("tx confirmed")

        nonce += 1


def broadcast_decryption_keys(decryption_keys_to_broadcast):
    if not decryption_keys_to_broadcast:
        print("no new decryption keys to broadcast")
        return

    nonce = w3.eth.get_transaction_count(KEYPER_ADDRESS)

    for key in decryption_keys_to_broadcast:
        tx = key_broadcast.functions.broadcastDecryptionKey(
            KEYPER_SET_N,
            KEYPER_SET_I,
            key["epoch"].to_bytes(8, "big"),
            key["decryption_key"],
        ).buildTransaction({"chainId": CHAIN_ID, "nonce": nonce})
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=KEYPER_PRIVATE_KEY)
        print(
            "\nbroadcasting decryption key",
            json.dumps(key, indent=2),
            "with tx",
            json.dumps(tx, indent=2),
            signed_tx.hash.hex(),
            "...",
        )
        w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        wait_for_confirmations(signed_tx.hash)
        print("tx confirmed")

        nonce += 1


def wait_for_confirmations(tx_hash):
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, poll_latency=1.0)
    inclusion_block = receipt.blockNumber
    while w3.eth.block_number < inclusion_block + NUM_CONFIRMATIONS:
        time.sleep(3)


def update_broadcasted_keys(
    broadcasted_keys, eon_keys_to_broadcast, decryption_keys_to_broadcast
):
    eon_keys = broadcasted_keys["eon_keys"][:]
    for key in eon_keys_to_broadcast:
        if key not in eon_keys:
            eon_keys.append(key)
    decryption_keys = broadcasted_keys["decryption_keys"][:]
    for key in decryption_keys_to_broadcast:
        if key not in decryption_keys:
            decryption_keys.append(key)
    return {
        **broadcasted_keys,
        "eon_keys": eon_keys,
        "decryption_keys": decryption_keys,
    }


if __name__ == "__main__":
    main()
