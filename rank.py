class Rank():
	def __init__(self, name, value, key=None):
		self.__name = name
		self.__value = value
		self.__key = key or f'{value}'

	@property
	def name(self):
		return self.__name

	@property
	def value(self):
		return self.__value

	@property
	def key(self):
		return self.__key

class FaceRank(Rank):
	def __init__(self, name, value, key, img):
		super().__init__(name, value, key)
		self.__img = img
		return

	@property
	def img(self):
		return self.__img

ranks = [
	Rank('Ace', 1, 'A'),
	Rank('Two', 2),
 	Rank('Three', 3),
	Rank('Four', 4),
	Rank('Five', 5),
	Rank('Six', 6),
	Rank('Seven', 7),
	Rank('Eight', 8),
	Rank('Nine', 9),
	Rank('Ten', 10),
	FaceRank('Jack', 11, 'J', './assets/jack.svg'),
	FaceRank('Queen', 12, 'Q', './assets/queen.svg'),
	FaceRank('King', 13, 'K', './assets/king.svg')
]
