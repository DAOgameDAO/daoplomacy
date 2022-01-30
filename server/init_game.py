import sys
import diplomacy
from files import init_dirs, store_game


def main():
    init_dirs()
    game = diplomacy.Game()
    store_game(0, game, None)


if __name__ == "__main__":
    main()
