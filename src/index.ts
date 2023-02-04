import { Card, Stack, StackType, ranks, suits } from './Card'
import { Board, Turn } from './Turn'

class Game {
	name: string
	board: Board
	limit = 15
	count = 0

	constructor(name: string) {
		this.name = name
		this.board = this.newBoard()
	}

	newBoard() {
		return {
			'Draw': [], 'Discard': [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 'WinS': [], 'WinH': [], 'WinC': [], 'WinD': []
		} as Board
	}
	createCards(fixedBoard: [number, number][]) {
		if (fixedBoard.length > 0) {
			return fixedBoard.map(([suitIndex, rankIndex]) => new Card(suits[suitIndex], ranks[rankIndex]))
		}
		return suits.reduce(((cards: Card[], suit) => [...cards, ...ranks.map((rank) => new Card(suit, rank))]), [])
	}

	dealCards(fixedBoard: [number, number][]=[]) {
		const cards = this.createCards(fixedBoard)
		const randomCard = () => cards.splice(Math.floor(Math.random() * cards.length), 1)[0]
		const nextCard = () => fixedBoard.length === 0 ? randomCard() : cards.splice(0, 1)[0]
		for (let i = 1; i <= 7; i++) {
			for (let j = i; j > 0; j--) {
				const card = nextCard()
				card.setStack(i as Stack)
				i !== j ? card.setFacedownBelow(true) : card.setBlankBelow(true)
				if (j === 1) {
					card.flip()
					card.setNothingAbove(true)
				} else {
					card.setMovable(false)
				}
				this.board[i as Stack].push(card)
			}
		}
		while (cards.length > 0) {
			this.board['Draw'].push(nextCard())
		}
	}

	nextTurn(board: Board, limit: number=15, count: number=1) {
		const turn = new Turn(board, count)
		turn.getMoves()
		console.log(Array.from(turn.possibleMoves.entries()).filter(([card, moves]) => {
			return moves.size > 0
		}).map(([card, moves]) => {
			return `${card} => ${Array.from(moves.values()).map((move) => {
				return `${move.targetCard === null ? 'Blank' : move.targetCard.getId()} (${move.newStack})`
			}).join(', ')
		}`}).join('\n'))
		turn.getMoveChains()
		if (count === limit || !turn.hasPossibleMoves()) return false
		if (turn.boardIsWinnable) return true // repalce with boardIsWon later
	}
}

function printBoard(board: Board, log: boolean=true, stringify: boolean=false) {
	let result: string = ''
	if (stringify) {
		result = `${Object.values(board).reduce((prevCards: [number, number][], cards: Card[]) => {
			return [...prevCards, ...cards.map((card) => [card.getSuit.getIndex, card.getRank.getValue - 1] as [number, number])]
		}, [])}`
		// log ? console.log(result) : {}
		return result
	}
	for (const [stack, cards] of Object.entries(board)) {
		result += `${stack}: ${cards.map((card) => card.getId()).join(' ')}\n`
	}
	log ? console.log(result) : {}
	return result
}


const testBoard1: [number, number][] = [
	[ 3, 9 ],  [ 0, 0 ],  [ 0, 9 ],  [ 2, 1 ],
	[ 0, 8 ],  [ 1, 7 ],  [ 1, 1 ],  [ 1, 12 ],
	[ 3, 4 ],  [ 2, 4 ],  [ 0, 5 ],  [ 2, 9 ],
	[ 2, 5 ],  [ 1, 4 ],  [ 3, 0 ],  [ 0, 10 ],
	[ 1, 8 ],  [ 1, 2 ],  [ 0, 12 ], [ 0, 11 ],
	[ 0, 1 ],  [ 1, 11 ], [ 2, 10 ], [ 0, 4 ],
	[ 3, 8 ],  [ 2, 11 ], [ 1, 3 ],  [ 3, 11 ],
	[ 3, 6 ],  [ 1, 9 ],  [ 2, 6 ],  [ 2, 0 ],
	[ 1, 10 ], [ 0, 6 ],  [ 2, 2 ],  [ 3, 10 ],
	[ 0, 2 ],  [ 3, 12 ], [ 3, 1 ],  [ 2, 7 ],
	[ 1, 6 ],  [ 3, 7 ],  [ 3, 2 ],  [ 2, 3 ],
	[ 0, 3 ],  [ 3, 5 ],  [ 2, 12 ], [ 1, 5 ],
	[ 1, 0 ],  [ 3, 3 ],  [ 0, 7 ],  [ 2, 8 ]
]

const testBoard2: [number, number][] = [
	[ 3, 10 ], [ 2, 10 ], [ 3, 3 ],  [ 1, 6 ],
	[ 2, 6 ],  [ 1, 10 ], [ 3, 7 ],  [ 1, 3 ],
	[ 0, 7 ],  [ 0, 6 ],  [ 2, 12 ], [ 1, 12 ],
	[ 1, 5 ],  [ 0, 0 ],  [ 0, 8 ],  [ 2, 0 ],
	[ 3, 11 ], [ 1, 7 ],  [ 1, 1 ],  [ 1, 0 ],
	[ 3, 2 ],  [ 2, 4 ],  [ 0, 9 ],  [ 3, 0 ],
	[ 1, 11 ], [ 0, 1 ],  [ 2, 2 ],  [ 1, 4 ],
	[ 3, 5 ],  [ 2, 11 ], [ 1, 2 ],  [ 2, 8 ],
	[ 3, 4 ],  [ 3, 8 ],  [ 1, 8 ],  [ 2, 5 ],
	[ 0, 5 ],  [ 0, 2 ],  [ 2, 7 ],  [ 3, 6 ],
	[ 0, 11 ], [ 3, 9 ],  [ 0, 3 ],  [ 3, 12 ],
	[ 0, 10 ], [ 0, 4 ],  [ 2, 9 ],  [ 0, 12 ],
	[ 2, 3 ],  [ 3, 1 ],  [ 2, 1 ],  [ 1, 9 ]
]

const solitaire = new Game('Game')
solitaire.dealCards(testBoard1)
printBoard(solitaire.board, true, true)
printBoard(solitaire.board)
solitaire.nextTurn(solitaire.board)
