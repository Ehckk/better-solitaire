from random import randint
from pile import Pile, PileType
from suit import suits
from rank import ranks
from card import Card
from turn import Turn, get_piles

def new_board():
	return {
		'cycle': {
			'draw': Pile(name='draw', qualified_name='Draw',
						type=PileType.CYCLE, cards=[]),
			'discard': Pile(name='discard', qualified_name='Discard',
		   				type=PileType.CYCLE, cards=[])
		},
		'center': {
			'1': Pile(name='1', qualified_name='Pile 1',
	     			type=PileType.CENTER, cards=[]),
			'2': Pile(name='2', qualified_name='Pile 2',
	     			type=PileType.CENTER, cards=[]),
			'3': Pile(name='3', qualified_name='Pile 3',
	     			type=PileType.CENTER, cards=[]),
			'4': Pile(name='4', qualified_name='Pile 4',
	     			type=PileType.CENTER, cards=[]),
			'5': Pile(name='5', qualified_name='Pile 5',
	     			type=PileType.CENTER, cards=[]),
			'6': Pile(name='6', qualified_name='Pile 6',
	     			type=PileType.CENTER, cards=[]),
			'7': Pile(name='7', qualified_name='Pile 7',
	     			type=PileType.CENTER, cards=[]),
		},
		'win': {
			'winS': Pile(name='winS', qualified_name='Win (Spades)',
					type=PileType.WIN, cards=[]),
			'winH': Pile(name='winH', qualified_name='Win (Hearts)',
					type=PileType.WIN, cards=[]),
			'winC': Pile(name='winC', qualified_name='Win (Clubs)',
					type=PileType.WIN, cards=[]),
			'winD': Pile(name='winD', qualified_name='Win (Diamonds)',
					type=PileType.WIN, cards=[])
		}
	}

def shuffle_cards(cards: list[Card]):
	shuffled_cards = []
	for i in range(0, 52):
		index = randint(0, 51 - i)
		shuffled_cards.append(cards.pop(index))
	return shuffled_cards

def create_cards(fixed_cards: list[tuple[int, int]]=[]):
	if fixed_cards:
		return [Card(suit=suits[s], rank=ranks[r]) for (s, r) in fixed_cards]
	cards = [Card(suit, rank) for suit in suits for rank in ranks]
	return shuffle_cards(cards)

class Game:
	def __init__(self, name: str):
		self.__name = name
		self.__board = new_board()

	@property
	def name(self):
		return self.__name

	@property
	def board(self):
		return self.__board

	def deal_cards(self, fixed_cards: list[tuple[int, int]]=[]):
		cards = create_cards(fixed_cards)
		print(list(map(lambda card: card.id(), cards)))
		for i in range(1, 8):
			cards_to_deal = cards[0:i]
			cards = cards[i:]
			self.deal_cards_to_center_pile(cards_to_deal, f'{i}')
		while len(cards) > 0:
			card = cards.pop(0)
			card.flip()
			self.board['cycle']['draw'].add_card(card)
		return

	def deal_cards_to_center_pile(self, cards, name: str):
		count = len(cards)
		for (i, card) in enumerate(cards):
			if i == 0:
				card.set_nothing_below(nothing_below=True)
			else:
				card.set_facedown_below(True)
			if i != count - 1:
				card.flip()
			else:
				card.set_nothing_above(True)
			self.board['center'][name].add_card(card)

	def next_turn(self):
		turn = Turn(self.board, self.get_cards())
		turn.get_moves()
		# move_chains = turn.get_move_chains()
		print('-' * 50)
		# for move_chain in move_chains:
		# 	move_chain = print_move_chain()
		# print('-' * 50)

	def get_cards(self, cycle=True, center=True, win=True):
		cards = []
		for pile in get_piles(self.board, cycle, center, win):
			cards += pile.cards
		return cards

	def print_board(self):
		board_str = f'{self.name}\n'
		for pile in get_piles(self.board):
			board_str += pile.print_cards()
		print(board_str)

test_1 = [
	(3, 10), (2, 10), (3, 3), (1, 6),
	(2, 6), (1, 10), (3, 7), (1, 3),
	(0, 7), (0, 6), (2, 12), (1, 12),
	(1, 5), (0, 0), (0, 8), (2, 0),
	(3, 11), (1, 7), (1, 1), (1, 0),
	(3, 2), (2, 4), (0, 9), (3, 0),
	(1, 11), (0, 1), (2, 2), (1, 4),
	(3, 5), (2, 11), (1, 2), (2, 8),
	(3, 4), (3, 8), (1, 8), (2, 5),
	(0, 5), (0, 2), (2, 7), (3, 6),
	(0, 11), (3, 9), (0, 3), (3, 12),
	(0, 10), (0, 4), (2, 9), (0, 12),
	(2, 3), (3, 1), (2, 1), (1, 9)
]

solitare = Game('Game 1')
solitare.deal_cards(test_1)
solitare.print_board()
solitare.next_turn()
