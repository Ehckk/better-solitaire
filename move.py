from enum import Enum
from typing import Dict, Union
from card import Card
from pile import Pile

class MoveType(str, Enum):
	WIN = 'Win'
	CENTER = 'Center'

class Move:
	def __init__(self, card: Card, target: Union[Card, None],
	      		old_stack: Pile, new_stack: Pile, move_type: MoveType):
		self.__card: Card = card
		self.__target: Union[Card, None] = target
		self.__old_stack = old_stack
		self.__new_stack = new_stack
		self.__move_type = move_type

	@property
	def card(self):
		return self.__card

	@property
	def target(self):
		return self.__target

	@property
	def old_stack(self):
		return self.__old_stack

	@property
	def new_stack(self):
		return self.__new_stack

	@property
	def move_type(self):
		return self.__move_type

	def set_new_stack(self, new_stack):
		self.__new_stack = new_stack

	def make_move(self, board: dict[str, dict[str, Pile]]):
		return

	def make_cycle_move(self):
		return

	def make_pile_move(self):
		return

	def print_move(self):
		return

class MoveNode:
	def __init__(self, move: Move, next):
		self.__move = move
		self.__next = next

	@property
	def move(self):
		return self.__move

	@property
	def next(self):
		return self.__next

	def set_next(self, next):
		self.__next = next


class MoveChain:
	def __init__(self, head: Union[MoveNode, None]):
		self.__head = head

	@property
	def head(self):
		return self.__head

	def set_head(self, head: MoveNode):
		self.__head = head

	def add_node(self, move_node: MoveNode):
		if self.head is None:
			self.set_head(move_node)
			return move_node
		node = self.head
		while node.next != None:
			node = node.next
		node.set_next(move_node)

	def make_moves(self, board):
		node = self.head
		while node.next != None:
			move = node.move
			board = move.make_move(board)
			node = node.next
		return board
