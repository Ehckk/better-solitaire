from enum import Enum

class PileType(str, Enum):
	CYCLE = 'Cycle',
	CENTER = 'Center',
	WIN = 'Win'

class Pile:
	def __init__(self, name: str, qualified_name: str, type: PileType, cards=[]):
		self.__name = name
		self.__qualified_name = qualified_name
		self.__type = type
		self.__cards: list = cards

	@property
	def name(self):
		return self.__name

	@property
	def qualified_name(self):
		return self.__qualified_name

	@property
	def type(self):
		return self.__type

	@property
	def cards(self):
		return self.__cards

	def top_card(self):
		return self.cards[-1]

	def get_index(self, card):
		return self.cards.index(card)

	def at_index(self, idx):
		return self.cards[idx]

	def add_card(self, card):
		card.set_pile(self)
		self.__cards.append(card)

	def remove_card(self, index: int=-1):
		return self.__cards.pop(index)

	def slice_cards(self, start: int, end: int):
		card_slice = self.__cards[start:end]
		self.__cards = self.__cards[0:start]
		return card_slice

	def has_facedown(self):
		facedown_count = 0
		for card in self.__cards:
			if card.facedown: facedown_count += 1
		return facedown_count > 0

	def is_center_pile(self):
		return self.__name.isdigit()

	def is_win_pile(self):
		return self.__name.startswith('win')

	def print_cards(self):
		cards = list(map(lambda card: card.id(), self.cards))
		return f'{self.name[0].upper() + self.name[1:]}: {" ".join(cards)}\n'

	def length(self):
		return len(self.cards)

	def is_empty(self):
		return len(self.cards) == 0
