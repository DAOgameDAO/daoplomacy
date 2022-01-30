import os
import sys
import json
import pathlib
import collections
import itertools
import random
import subprocess

from diplomacy import Game
import dotenv
import web3

from files import load_game, load_num_phases, store_game, load_deployments

dotenv.load_dotenv()

POWERS = [
    "AUSTRIA",
    "ENGLAND",
    "FRANCE",
    "GERMANY",
    "ITALY",
    "RUSSIA",
    "TURKEY",
]

ETHEREUM_RPC_URL = os.getenv("ETHEREUM_RPC_URL")
DEPLOYMENT_PATH = pathlib.Path(os.getenv("DEPLOYMENT_PATH"))
PAGE_SIZE = int(os.getenv("PAGE_SIZE"))
EON_KEY = os.getenv("EON_KEY")
PLAYER_ADDRESSES = os.getenv("PLAYER_ADDRESSES").split(",")

w3 = web3.Web3(web3.Web3.WebsocketProvider(ETHEREUM_RPC_URL))
contracts = load_deployments(DEPLOYMENT_PATH, w3)


def main():
    current_phase = load_num_phases() - 1
    next_phase = current_phase + 1

    game = load_game(current_phase)
    if game.status == "completed":
        print("game is already completed")
        return
    if not check_phase_complete(next_phase):
        return

    order_events = fetch_order_events(next_phase)
    decryption_key = fetch_decryption_key(next_phase)
    if decryption_key is None:
        print(f"no valid decryption key is available yet")
        return
    print(f"decrypting with key {decryption_key.hex()}")
    decrypted_orders = decrypt_order_events(order_events, decryption_key)

    apply_orders(game, decrypted_orders)
    accepted_orders = game.get_orders()

    game.process()
    order_results = game.result_history.last_value()

    annotated_orders = annotate_orders(decrypted_orders, accepted_orders, order_results)

    store_game(next_phase, game, annotated_orders)
    print(f"successfully advanced to phase {game.phase}")


def phase_to_batch(phase):
    return phase - 1  # phase 1 is the first phase for which orders are submitted


def check_phase_complete(phase):
    batch = phase_to_batch(phase)
    current_block = w3.eth.block_number
    batch_end_block = (
        contracts.BatchCounter.functions.batchStartBlock(batch + 1).call() - 1
    )
    if current_block >= batch_end_block:
        return True

    print(
        f"phase {phase} not finished yet (end block {batch_end_block}, current block "
        f"{current_block}, remaining blocks {batch_end_block - current_block})"
    )
    return False


def convert_logs_to_events(logs, event_types):
    events = []
    for log in logs:
        for event_type in event_types:
            try:
                event = event_type().processLog(log)
            except web3.exceptions.MismatchedABI:
                continue
            else:
                events.append(event)
                break
        else:
            raise ValueError("Unknown event")
    return events


def fetch_order_events(phase):
    print(f"fetching orders for phase {phase}...")

    batch = phase_to_batch(phase)
    batch_start_block = contracts.BatchCounter.functions.batchStartBlock(batch).call()
    batch_end_block = contracts.BatchCounter.functions.batchStartBlock(batch + 1).call()

    received_order_events = []
    for from_block in range(batch_start_block, batch_end_block, PAGE_SIZE):
        filter_ = {
            "fromBlock": from_block,
            "toBlock": min(from_block + PAGE_SIZE - 1, batch_end_block - 1),
            "address": contracts.OrderCollector.address,
        }
        logs = w3.eth.get_logs(filter_)
        events_from_logs = convert_logs_to_events(logs, contracts.OrderCollector.events)

        for event in events_from_logs:
            assert event.args.batchIndex == batch
            received_order_events.append(event)

    print(f"received {len(received_order_events)} encrypted orders")
    return received_order_events


def fetch_decryption_key(phase):
    print(f"fetching decryption key for phase {phase}...")

    # decryption key is generated when batch is closed, so start looking when next batch starts
    batch = phase_to_batch(phase)
    next_batch = batch + 1
    batch_start_block = contracts.BatchCounter.functions.batchStartBlock(
        next_batch
    ).call()
    end_block = w3.eth.block_number

    for from_block in range(batch_start_block, end_block, PAGE_SIZE):
        filter_ = {
            "fromBlock": from_block,
            "toBlock": from_block + PAGE_SIZE - 1,
            "address": contracts.KeyBroadcast.address,
        }
        logs = w3.eth.get_logs(filter_)
        events_from_logs = convert_logs_to_events(logs, contracts.KeyBroadcast.events)

        for event in events_from_logs:
            if event.event != "DecryptionKey":
                continue
            epoch_id = int.from_bytes(event.args.epochID, "big")
            event_batch = epoch_id_to_batch(epoch_id)
            if event_batch != batch:
                continue

            decryption_key = event.args.key
            valid = verify_decryption_key(decryption_key, epoch_id)
            if not valid:
                print(f"ignoring invalid decryption key broadcast in {event}")
                continue
            return decryption_key

    return None


def epoch_id_to_batch(epoch_id):
    return epoch_id & 0xFFFFFFFF


def verify_decryption_key(key, epoch_id):
    cmd = [
        "rolling-shutter",
        "crypto",
        "verify-key",
        key.hex(),
        "--epoch-id",
        epoch_id.to_bytes(8, "big").hex(),
        "--eon-key",
        EON_KEY,
    ]
    res = subprocess.run(cmd, capture_output=True)
    return res.returncode == 0


def decrypt_order(encrypted_order, key):
    cmd = [
        "rolling-shutter",
        "crypto",
        "decrypt",
        encrypted_order.hex(),
        "--decryption-key",
        key.hex(),
    ]
    res = subprocess.run(cmd, capture_output=True)
    if res.returncode != 0:
        return ""  # invalid ciphertexts are ignored
    try:
        result_as_ascii = res.stdout.decode("ascii").strip()
    except UnicodeDecodeError:
        result_as_ascii = ""  # non-ascii plaintexts are ignored
    return sanitize_order(result_as_ascii)


def decrypt_order_events(events, decryption_key):
    orders = {}
    for event in events:
        encrypted_order = event.args.encryptedOrder
        player = event.args.sender
        power = player_to_power(player)

        if power not in orders:
            orders[power] = []
        decrypted_order = decrypt_order(encrypted_order, decryption_key)
        orders[power].append(decrypted_order)
    return orders


def filter_invalid_orders(game, orders_by_power):
    possible_orders = game.get_all_possible_orders()
    valid_orders = {}


def apply_orders(game, orders_by_power):
    powers_voting_draw = set()
    non_draw_orders = collections.defaultdict(list)
    for power, orders in orders_by_power.items():
        for order in orders:
            if is_draw_vote(order):
                powers_voting_draw.add(power)
            else:
                non_draw_orders[power].append(order)

    remaining_powers = set(power.name for power in game.powers.values() if power.units)
    if remaining_powers.issubset(powers_voting_draw):
        game.draw()
        return

    for power, orders in non_draw_orders.items():
        game.set_orders(power, orders, expand=False)


def power_to_player(power):
    return PLAYER_ADDRESSES[POWERS.index(power)]


def player_to_power(player):
    return POWERS[PLAYER_ADDRESSES.index(player)]


def sanitize_order(order):
    return " ".join(order.upper().split())


def is_draw_vote(sanitized_order):
    return sanitized_order == "DRAW"


def annotate_orders(decrypted_orders, accepted_orders, order_results):
    annotated_orders = {}
    for power, orders in decrypted_orders.items():
        annotated_orders[power] = []
        for order in orders:
            accepted = order in accepted_orders[power]
            result = get_order_result(order, order_results)
            draw_vote = is_draw_vote(order)
            annotated_orders[power].append(
                {
                    "order": order,
                    "accepted": accepted,
                    "draw_vote": draw_vote,
                    "result": [r.message for r in result],
                }
            )
    return annotated_orders


def get_order_result(order, order_results):
    sanitized_order = sanitize_order(order)
    parts = sanitized_order.split()
    if len(parts) < 2:
        return []
    unit = " ".join(parts[:2])
    result = order_results.get(unit, [])
    return result


if __name__ == "__main__":
    main()
