import os
import json
import diplomacy
from web3.datastructures import AttributeDict

GAME_DIR = os.environ.get("GAME_DIR", "./game1/")
GAME_DUMPS_DIR = os.path.join(GAME_DIR, "game_dumps")
STATE_DUMPS_DIR = os.path.join(GAME_DIR, "state_dumps")
ORDER_DUMPS_DIR = os.path.join(GAME_DIR, "order_dumps")
POSSIBLE_ORDER_DUMPS_DIR = os.path.join(GAME_DIR, "possible_order_dumps")
PHASES_FILENAME = "phases"


def init_dirs():
    try:
        try:
            os.makedirs(GAME_DIR)
        except FileExistsError:
            print(f"error creating game directory at {GAME_DIR}")
            raise
        os.makedirs(GAME_DUMPS_DIR)
        os.makedirs(STATE_DUMPS_DIR)
        os.makedirs(POSSIBLE_ORDER_DUMPS_DIR)
        os.makedirs(ORDER_DUMPS_DIR)
        with open(os.path.join(GAME_DIR, PHASES_FILENAME), "x"):
            pass
    except OSError as e:
        print("error initializing game directory")
        raise


def load_num_phases():
    try:
        with open(os.path.join(GAME_DIR, PHASES_FILENAME), "r") as f:
            phases = f.readlines()
    except IOError as e:
        print("error loading phase file")
        raise
    if len(phases) == 0:
        raise ValueError("phase file is empty")
    return len(phases)


def load_game(phase):
    try:
        with open(os.path.join(GAME_DUMPS_DIR, f"{phase}.json")) as f:
            game_json = json.load(f)
    except IOError as e:
        print(f"error loading game {phase}")
        raise
    except json.JSONDecodeError as e:
        print(f"error decoding game {phase}")
        raise

    try:
        game = diplomacy.Game.from_dict(game_json)
    except diplomacy.utils.exceptions.DiplomacyException as e:
        print(f"error recreating game {phase}")
        raise

    return game


def phase_dict_from_name(index, long_name):
    if long_name == "COMPLETED":
        return {
            "index": index,
            "year": 0,
            "season": 0,
            "type": None,
            "completed": True,
        }
    phase_parts = long_name.split(" ")
    return {
        "index": index,
        "year": int(phase_parts[1]),
        "season": phase_parts[0],
        "type": phase_parts[2],
        "completed": False,
    }


def store_game(phase, game, orders=None):
    game_dict = game.to_dict()
    state_dict = game.get_state()
    possible_orders_dict = game.get_all_possible_orders()

    try:
        with open(os.path.join(GAME_DUMPS_DIR, f"{phase}.json"), "x") as f:
            json.dump(game_dict, f)
            f.write("\n")
    except IOError as e:
        print("error saving game dump")
        raise

    try:
        with open(os.path.join(STATE_DUMPS_DIR, f"{phase}.json"), "x") as f:
            json.dump(state_dict, f)
            f.write("\n")
    except IOError as e:
        print("error saving state dump")
        raise

    try:
        with open(os.path.join(POSSIBLE_ORDER_DUMPS_DIR, f"{phase}.json"), "x") as f:
            json.dump(possible_orders_dict, f)
            f.write("\n")
    except IOError as e:
        print("error saving possible orders")
        raise

    if phase == 0:
        assert orders is None
    else:
        assert orders is not None
        try:
            with open(os.path.join(ORDER_DUMPS_DIR, f"{phase - 1}.json"), "x") as f:
                json.dump(orders, f)
                f.write("\n")
        except IOError as e:
            print("error saving orders dump")
            raise

    phase_dict = phase_dict_from_name(phase, game.phase)
    try:
        with open(os.path.join(GAME_DIR, PHASES_FILENAME), "a") as f:
            f.write(f"{json.dumps(phase_dict)}\n")
    except IOError as e:
        print("failed to update phase file")
        raise


def load_deployments(deployment_path, w3):
    contracts = {}
    for path in deployment_path.iterdir():
        if not path.is_file():
            continue
        if not path.match("*.json"):
            continue

        with path.open() as f:
            deployment = json.load(f)
        contract = w3.eth.contract(abi=deployment["abi"], address=deployment["address"])

        name = path.stem
        contracts[name] = contract
    return AttributeDict(contracts)
