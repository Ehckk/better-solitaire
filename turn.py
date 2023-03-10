from card import Card, card_is_center_target, card_is_win_target, cards_match
from move import Move, MoveType
from pile import Pile, PileType
from enum import Enum

class TargetType(str, Enum):
	CENTER = 'Center'
	WIN = 'Win'
	BOTH = 'Both'

class Turn:
	def __init__(self, board: dict[str, dict[str, list[Pile]]], cards: list[Card]):
		self.__board: dict[str, dict[str, list[Pile]]] = board
		self.__cards: list[Card] = cards
		self.__visited = [[False for i in range(0, 13)] for i in range(0, 52)]
		self.__cards_to_check: list[Card] = []
		self.__possible_moves: dict[str, list[Move]] = {}

	@property
	def board(self):
		return self.__board

	@property
	def cards(self):
		return self.__cards

	@property
	def visited(self):
		return self.__visited

	@property
	def cards_to_check(self):
		return self.__cards_to_check

	@property
	def possible_moves(self):
		return self.__possible_moves

	def get_critical_cards(self):
		def is_critical_card(card: Card):
			if not card.pile.type == PileType.CENTER: return False
			if card.facedown: return False
			return card.facedown_below or card.nothing_below
		return list(filter(is_critical_card, self.cards))

	def get_moves(self):
		critical_cards = self.get_critical_cards()
		for critical_card in critical_cards:
			self.get_moves_for_card(critical_card)
		print(self.possible_moves)
		# return self.get_move_chains(critical_cards)

	def get_moves_for_card(self, card: Card, target_type=TargetType.BOTH):
		moves: list[Move] = []
		pile_type = card.pile.type
		if self.is_being_checked(card): return moves
		if self.has_been_visited(card):
			return self.get_possible_moves(card, target_type)
		self.visit(card)
		self.possible_moves[card.id(False)] = []
		if pile_type == PileType.CENTER and card.facedown: return moves

		is_free = True
		if not pile_type == PileType.CYCLE and not card.nothing_above:
			card_index = card.pile.get_index(card)
			card_above = card.pile.at_index(card_index + 1)
			result = self.get_moves_for_card(card_above)
			is_free = len(result) > 0

		if is_free:
			result = self.get_win_move(card)
			if result is not None:
				moves.append(result)
		result = self.get_center_moves(card)
		if len(result) > 0:
			moves.append(result)
		self.possible_moves[card.id(False)] = moves
		return self.get_possible_moves(card, target_type)

	def is_being_checked(self, card: Card):
		check = lambda check_card: cards_match(card, check_card)
		return any(check(check_card) for check_card in self.cards_to_check)

	def visit(self, card: Card):
		self.visited[card.suit.index][card.rank.value - 1] = True

	def has_been_visited(self, card: Card):
		return self.visited[card.suit.index][card.rank.value - 1]

	def get_center_moves(self, card: Card):
		moves: list[Move] = []
		if card.rank.value == 13: return self.get_king_center_moves(card)

		center_targets = self.get_target(card, TargetType.CENTER)
		for target in center_targets:
			move = Move(card, target, card.pile, target.pile, move_type=TargetType.CENTER)
			if target.nothing_above and target.pile.type == PileType.CENTER:
				moves.append(move)
				continue
			self.cards_to_check.append(card)
			result = self.get_moves_for_card(target, target_type=TargetType.CENTER)
			self.cards_to_check.pop()
			if len(result) > 0: moves.append(move)
		return moves

	def get_king_center_moves(self, card: Card):
		moves: list[Move] = []
		center_piles = get_piles(self.board, cycle=False, center=True, win=False)
		for center_pile in center_piles:
			if center_pile.name == card.pile.name: continue
			move = Move(card, None, card.pile, center_pile, MoveType.CENTER)
			if center_pile.is_empty():
				moves.append(move)
				continue
			self.cards_to_check.append(card)
			result = self.get_moves_for_card(center_pile.at_index(0))
			self.cards_to_check.pop()
			if len(result) > 0: moves.append(move)
		return moves

	def get_win_move(self, card: Card):
		if card.rank.value == 1: return Move(card, None, card.win_pile, MoveType.WIN)
		win_target = self.get_target(card, TargetType.WIN)[0]
		print(card.id(), win_target.id())
		move = Move(card, win_target, card.pile, card.win_pile, MoveType.WIN)
		if win_target.pile.name == card.win_pile: return move
		self.cards_to_check.append(card)
		result = self.get_moves_for_card(win_target, MoveType.WIN)
		self.cards_to_check.pop()
		if len(result) > 0: return move
		return None

	def get_target(self, card: Card, target_type: TargetType):
		if target_type == TargetType.CENTER:
			target_check = lambda target: card_is_center_target(card, target)
			return list(filter(target_check, self.cards))
		if target_type == TargetType.WIN:
			target_check = lambda target: card_is_win_target(card, target)
			return list(filter(target_check, self.cards))

	def get_possible_moves(self, card: Card, target_type: TargetType):
		moves = self.possible_moves[card.id(False)]
		if target_type == TargetType.BOTH: return moves
		return list(filter(lambda move: move.move_type == target_type, moves))

	# def get_move_chains(self, critical_cards):
	# 	return

def get_piles(board: dict[str, dict[str, list[Pile]]],
	      	cycle=True, center=True, win=True) -> list[Pile]:
	piles = []
	if cycle:
		piles += list(board['cycle'].values())
	if center:
		piles += list(board['center'].values())
	if win:
		piles += list(board['win'].values())
	return piles

