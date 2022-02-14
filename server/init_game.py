import sys
import diplomacy
from files import init_dirs, store_game


def main():
    game = diplomacy.Game(map_name="../map/daoplomacy.map")
    print(game.map)
    init_dirs()
    store_game(0, game, None)


if __name__ == "__main__":
    main()
