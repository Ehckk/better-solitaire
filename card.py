from pile import Pile
from rank import Rank
from suit import Suit

class Card:
	def __init__(self, suit: Suit, rank: Rank, pile: Pile=None,
	      facedown: bool=False, facedown_below: bool=False,
		  nothing_above: bool=False, nothing_below: bool=False):
		self.__suit = suit
		self.__rank = rank
		self.__facedown = facedown
		self.__pile = pile
		self.__facedown_below = facedown_below
		self.__nothing_above = nothing_above
		self.__nothing_below = nothing_below

	@property
	def suit(self) -> Suit:
		return self.__suit

	@property
	def rank(self) -> Rank:
		return self.__rank

	@property
	def facedown(self) -> bool:
		return self.__facedown

	@property
	def pile(self) -> Pile:
		return self.__pile

	@property
	def facedown_below(self) -> bool:
		return self.__facedown_below

	@property
	def nothing_above(self) -> bool:
		return self.__nothing_above

	@property
	def nothing_below(self) -> bool:
		return self.__nothing_below

	@property
	def win_pile(self) -> str:
		return f'win{self.suit.name[0].upper()}'

	@property
	def in_win_pile(self) -> bool:
		return self.pile.name.startswith('win')

	def flip(self):
		self.__facedown = not self.__facedown

	def set_pile(self, new_pile):
		self.__pile = new_pile

	def set_facedown_below(self, facedown_below: bool):
		self.__facedown_below = facedown_below

	def set_nothing_above(self, nothing_above: bool):
		self.__nothing_above = nothing_above

	def set_nothing_below(self, nothing_below: bool):
		self.__nothing_below = nothing_below

	def id(self, show_facedown=True):
		if show_facedown and self.facedown:
			return f'[{self.suit.name[0]}{self.rank.value}]'
		return f'{self.suit.name[0]}{self.rank.value}'

	def qualified_name(self):
		return

def cards_match(card_1: Card, card_2: Card) -> bool:
	if not card_1.suit == card_2.suit: return False
	if not card_1.rank == card_2.rank: return False
	return True

def cards_in_same_pile(card_1: Card, card_2: Card) -> bool:
	return card_1.pile == card_2.pile

def card_is_center_target(card: Card, target: Card) -> bool:
	if card.rank.value == 13: return False
	if card.suit.color == target.suit.color: return False
	return card.rank.value == target.rank.value - 1

def card_is_win_target(card: Card, target: Card) -> bool:
	if card.rank.value == 1: return False
	if not card.suit.index == target.suit.index: return False
	return card.rank.value == target.rank.value + 1
