from enum import Enum

class SuitName(str, Enum):
	SPADES = 'Spades'
	HEARTS = 'Hearts'
	CLUBS = 'Clubs'
	DIAMONDS = 'Diamonds'

class SuitColor(int, Enum):
	BLACK = 0
	RED = 1

class Suit:
	def __init__(self, name: SuitName, color: SuitColor, icon: str, index: int):
		self.__name = name
		self.__color = color
		self.__icon = icon
		self.__index = index

	@property
	def name(self):
		return self.__name

	@property
	def color(self):
		return self.__color

	@property
	def index(self):
		return self.__index

	@property
	def icon(self):
		return self.__icon

suits = [
	Suit(SuitName.SPADES, SuitColor.BLACK, './assets/spades.svg', 0),
	Suit(SuitName.HEARTS, SuitColor.RED, './assets/hearts.svg', 1),
	Suit(SuitName.CLUBS, SuitColor.BLACK, './assets/clubs.svg', 2),
	Suit(SuitName.DIAMONDS, SuitColor.RED, './assets/diamonds.svg', 3),
]

