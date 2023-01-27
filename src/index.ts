import { threadId } from "worker_threads"

type Stack = 'Draw' | 'Discard' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'WinS' | 'WinH' | 'WinC' | 'WinD'
type StackType = 'Cycle' | 'Center' | 'Win'
type Board = { [key in Stack]: GameCard[] }
type SuitName = 'Spades' | 'Hearts' | 'Clubs' | 'Diamonds'
type SuitColor = 'Black' | 'Red'
type RankName = 'Ace' | 'Two' | 'Three' | 'Four' | 'Five' | 'Six' | 'Seven' | 'Eight' | 'Nine' | 'Ten' | 'Jack' | 'Queen' | 'King'
type MoveFilter = 'None' | 'CenterOnly' | 'WinOnly'

const assetDir = './assets'
const imgPath = `${assetDir}/images`
const iconPath = `${assetDir}/icons`

class Suit {
	name: SuitName
	color: SuitColor
	index: number
	icon: string

	constructor(name: SuitName, color: SuitColor, index: number) {
		this.name = name
		this.color = color
		this.index = index
		this.icon = `${iconPath}/${name.toLowerCase()}.svg`
	}

	get getName() {
		return this.name
	}
	get getColor() {
		return this.color
	}
	get getIndex() {
		return this.index
	}
	get getIcon() {
		return this.icon
	}
}

class Rank {
	name: string
	value: number
	strValue: string

	constructor(name: RankName, value: number) {
		this.name = name
		this.value = value
		this.strValue = value === 1 || value > 10 ? name[0] : value.toString()
	}

	get getName() {
		return this.name
	}
	get getValue() {
		return this.value
	}
	get getStrValue() {
		return this.strValue
	}
}

class FaceRank extends Rank {
	img: string

	constructor(name: RankName, value: number) {
		super(name, value)
		this.img = `${imgPath}/${name.toLowerCase()}.svg`
	}

	get getImg() {
		return this.img
	}
}

const suits = [
	new Suit('Spades', 'Black', 0),
	new Suit('Hearts', 'Red', 1),
	new Suit('Clubs', 'Black', 2),
	new Suit('Diamonds', 'Red', 3)
]

const ranks = [
	new Rank('Ace', 1),
	new Rank('Two', 2),
	new Rank('Three', 3),
	new Rank('Four', 4),
	new Rank('Five', 5),
	new Rank('Six', 6),
	new Rank('Seven', 7),
	new Rank('Eight', 8),
	new Rank('Nine', 9),
	new Rank('Ten', 10),
	new FaceRank('Jack', 11),
	new FaceRank('Queen', 12),
	new FaceRank('King', 13)
]

class Card {
	suit: Suit
	rank: Rank

	constructor(suit: Suit, rank: Rank) {
		this.suit = suit
		this.rank = rank
	}

	get getSuit() {
		return this.suit
	}
	get getRank() {
		return this.rank
	}
	get getId() {
		return this.suit.getName[0] + this.rank.getStrValue
	}
	get print() {
		return `${this.rank.getName} of ${this.suit.getName}`
	}

	matches(otherCard: Card) {
		return this.rank.getValue === otherCard.rank.getValue && this.suit.getIndex === this.suit.getIndex
	}
}

class GameCard extends Card {
	stack: Stack
	stackType: StackType = 'Cycle'
	facedown: boolean
	movable: boolean
	facedownBelow: boolean
	blankBelow: boolean
	nothingAbove: boolean

	constructor(suit: Suit, rank: Rank, stack: Stack='Draw', facedown: boolean=true, movable: boolean=true,
				facedownBelow: boolean=false, blankBelow: boolean=false, nothingAbove: boolean=false) {
		super(suit, rank)
		this.stack = stack
		this.facedown = facedown
		this.movable = movable
		this.facedownBelow = facedownBelow
		this.blankBelow = blankBelow
		this.nothingAbove = nothingAbove
		this.setStackType(stack)
	}

	get getStack() {
		return this.stack
	}
	get getStackType() {
		return this.stackType
	}
	get isFacedown() {
		return this.facedown
	}
	get isMovable() {
		return this.movable
	}
	get hasFacedownBelow() {
		return this.facedownBelow
	}
	get hasBlankBelow() {
		return this.blankBelow
	}
	get hasNothingAbove() {
		return this.nothingAbove
	}
	get getId() {
		return this.facedown ? `[${super.getId}]` : super.getId
	}
	get print() {
		return `${super.print} (${this.stack})`
	}

	setStack(stack: Stack) {
		this.setStackType(stack)
		this.stack = stack
	}
	setStackType(stack: Stack) {
		this.stackType = !isNaN(parseInt(stack as string)) ? 'Center' : (stack as string).startsWith('Win') ? 'Win' :  'Cycle'
	}
	setMovable(movable: boolean) {
		this.movable = movable
	}
	setFacedownBelow(facedownBelow: boolean) {
		this.facedownBelow = facedownBelow
	}
	setBlankBelow(blankBelow: boolean) {
		this.blankBelow = blankBelow
	}
	setNothingAbove(nothingAbove: boolean) {
		this.nothingAbove = nothingAbove
	}

	flip() {
		this.facedown = !this.facedown
	}
}

interface MoveSearchOptions {
	cards: GameCard[],
	filter: MoveFilter,
	empty: boolean,
}

class Game {
	name: string
	board: Board
	possibleMoves: Move[][]

	constructor(name: string) {
		this.name = name
		this.board = this.newBoard()
		this.possibleMoves = []
	}

	newBoard() {
		const board: Board = {
			'Draw': [], 'Discard': [],
			1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [],
			'WinS': [], 'WinH': [], 'WinC': [], 'WinD': []
		}
		return board
	}
	createCards(fixedBoard: [number, number][]) {
		if (fixedBoard.length > 0) {
			return fixedBoard.map(([suitIndex, rankIndex]) => new GameCard(suits[suitIndex], ranks[rankIndex]))
		}
		return suits.reduce(((cards: GameCard[], suit) => [...cards, ...ranks.map((rank) => new GameCard(suit, rank))]), [])
	}

	dealCards(fixedBoard: [number, number][]=[]) {
		const cards = this.createCards(fixedBoard)
		const randomCard = () => cards.splice(Math.floor(Math.random() * cards.length), 1)[0]
		const nextCard = () => fixedBoard.length === 0 ? randomCard() : cards.splice(0, 1)[0]
		for (let i = 1; i <= 7; i++) {
			for (let j = i; j > 0; j--) {
				const card = nextCard()
				card.setStack(i as Stack)
				if (i !== j) {
					card.setFacedownBelow(true)
				} else {
					card.setBlankBelow(true)
				}
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

	printBoard(board: Board=this.board, log: boolean=true, stringify: boolean=false) {
		let result
		if (stringify) {
			result = Object.values(this.board).reduce((prevCards: [number, number][], cards: GameCard[]) => {
				return [...prevCards, ...cards.map((card) => [card.getSuit.getIndex, card.getRank.getValue - 1] as [number, number])]
			}, [])
			log ? console.log(result) : {}
			return result
		}
		result = `${this.name}\n`
		for (const [stack, cards] of Object.entries(this.board)) {
			result += `${stack}: ${cards.map((card) => card.getId).join(' ')}\n`
		}
		log ? console.log(result) : {}
		return result
	}

	getStackType(card: GameCard): StackType {
		if ((card.getStack as string).startsWith('Win')) return 'Win'
		if (!isNaN(parseInt((card.getStack as string)))) return 'Center'
		return 'Cycle'
	}

	evaluateBoard() {
		this.possibleMoves = []
		const cards = Object.values(this.board).reduce((prev: GameCard[], cards) => [...prev, ...cards], [])
		const criticalCards = cards.filter((card) => card.getStackType === 'Center' && card.facedownBelow && !card.facedown)
		const validTargets = cards.filter((card) => card.getStackType !== 'Cycle' && card.hasNothingAbove)
		for (const critCard of criticalCards) {
			const options: MoveSearchOptions = {
				cards: cards,
				filter: 'None',
				empty: true
			}
			this.possibleMoves.push(...this.getMovesForCard(critCard, validTargets, options).map(({ moves }) => moves))
		}
		this.possibleMoves.sort((a, b) => b.length - a.length)
		// console.log(this.possibleMoves.map((moves) => moves.map(move => move.print()).join(' -> ')))
		this.makeNextMove(this.possibleMoves[this.possibleMoves.length - 1])
	}
	makeNextMove(moves: Move[]): boolean {
		if (moves.length === 0) return false

		console.log(moves.map(move => move.print()).join(' -> '))
		const newBoard = moves[0].makeMove(this.board)
		this.updateStack(newBoard, moves[0].newStack!)
		this.updateStack(newBoard, moves[0].oldStack)
		this.printBoard(newBoard)
		return truefilter
	}
	getCriticalCardCount(board: Board) {
		return Object.entries(board).reduce((prev: GameCard[], [stack, cards]) => {
			if (stack as Stack === 'Discard' || stack as Stack === 'Draw') return [...prev]
			return [...prev, cards.filter((card) => card.isFacedown)]
		}, [] as GameCard[]).length
	}

	// critCard: the card that needs to be moved
	// validTargets: the possible cards that can be moved to on this turn
	getMovesForCard(critCard: GameCard, validTargets: GameCard[], options: MoveSearchOptions):  { moves: Move[], targetStack: Stack | null }[] {
		let newStack: Stack | null = null
		if (critCard.getRank.getValue === 1) {
			newStack = `Win${critCard.getSuit.getName[0]}` as Stack
			return [{ moves: [new Move(critCard, null, newStack)], targetStack: newStack }]
		}
		const moves: { moves: Move[], targetStack: Stack | null }[] = []
		const { cards, filter, empty } = options
		if (critCard.getRank.getValue === 13) { // if card is King
			const centerPiles = Object.keys(this.board).filter((stack) => critCard.getStack && !isNaN(parseInt(stack)))
			const emptyPiles = centerPiles.filter((stack) => stack != critCard.getStack && this.board[stack as Stack].length === 0) // find empty spaces
			if (emptyPiles.length > 0) return emptyPiles.map((stack) => {
				return { moves: [new Move(critCard, null, stack as Stack)], targetStack: stack as Stack }
			})
			if (empty) {
				const cleanPiles = centerPiles.filter((stack) => this.board[stack as Stack].every(card => !card.facedown)) // find center piles with no facedown cards
				if (cleanPiles.length > 0) {
					for (const stack of cleanPiles) {
						const newOptions = {...options}
						newOptions.empty = false
						const results = this.getMovesForCard(this.board[stack as Stack][0], validTargets, newOptions) // recurse and attempt to clear piles
						if (results.length > 0) moves.push(...results.map(({ moves, targetStack }) => {
							return { moves: [...moves, new Move(critCard, null, stack as Stack)], targetStack: targetStack }
						}))
					}
				}
			}
			return moves
		}
		if (!critCard.isMovable && critCard.stackType !== 'Win') return [] // if card is not movable or in win, return invalid
		const requiredValidTargets = this.evaluateTargets(critCard, validTargets)
		if (requiredValidTargets.length > 0) { // if required card is valid target
			return requiredValidTargets.map((target) => {
				newStack = target.stack
				return { moves: [new Move(critCard, target, newStack)], targetStack: newStack }
			})
		}
		if (filter !== 'CenterOnly') {
			const winTargets = cards.filter((card) => {
				return card.getRank.getValue === critCard.getRank.getValue - 1 && card.getSuit.getIndex === critCard.getSuit.getIndex
			})
			for (const target of winTargets) {
				if (target.isMovable) {
					const newOptions = {...options}
					newOptions.filter = 'WinOnly'
					const results = this.getMovesForCard(target, validTargets, newOptions) // recurse and attempt to clear piles
					if (results.length > 0) moves.push(...results.map(({ moves, targetStack }) => {
						return { moves: [...moves, new Move(critCard, target, targetStack ?? target.stack as Stack)], targetStack: targetStack }
					}))
				}
			}
		}
		if (filter !== 'WinOnly') {
			const stackTargets = cards.filter((card) => {
				return card.getRank.getValue - 1 === critCard.getRank.getValue && card.getSuit.getColor !== critCard.getSuit.getColor
			})
			for (const target of stackTargets) {
				if (target.isMovable) {
					const newOptions = {...options}
					newOptions.filter = 'CenterOnly'
					const results = this.getMovesForCard(target, validTargets, newOptions) // recurse and attempt to clear piles
					if (results.length > 0) moves.push(...results.map(({ moves, targetStack }) => {
						return { moves: [...moves, new Move(critCard, target, targetStack ?? target.stack as Stack)], targetStack: targetStack }
					}))
				}
			}
		}
		return moves
	}

	evaluateTargets(card: GameCard, validTargets: GameCard[]) {
		return validTargets.filter((target) => {
			if (card.getStack === target.getStack) return false
			if (target.stackType === 'Win') {
				return target.getSuit.getIndex === card.getSuit.getIndex && target.getRank.getValue === card.getRank.getValue - 1
			}
			return target.getSuit.getColor !== card.getSuit.getColor && target.getRank.getValue - 1 === card.getRank.getValue
		})
	}
	updateStack(board: Board, stack: Stack) {
		const cards = board[stack]
		if (stack === 'Discard' || stack === 'Draw') return
		for (const [i, card] of cards.entries()) {
			card.setNothingAbove(i === cards.length - 1)
		}
	}
}

class Move {
	card: GameCard
	targetCard: GameCard | null
	oldStack: Stack
	newStack: Stack | null

	constructor(card: GameCard, targetCard: GameCard | null, newStack: Stack | null = null) {
		this.card = card
		this.targetCard = targetCard
		this.oldStack = card.getStack
		this.newStack = newStack
	}

	makeMove(board: Board) {
		this.print(true)
		const newBoard = { ...board }
		const size = newBoard[this.oldStack].length - 1
		let cardIndex = size
		while (!this.card.matches(newBoard[this.oldStack][cardIndex])) {
			cardIndex--
		}
		const cardsToMove = [...newBoard[this.oldStack].splice(cardIndex, this.card.getStackType === 'Cycle' ? 1 : size - cardIndex)]
		for (const card of cardsToMove) {
			card.isFacedown ? card.flip() : {}
		}
		newBoard[this.newStack!].push(...cardsToMove)
		return newBoard
	}

	undoMove() {}

	print(log: boolean=false) {
		const result = `${this.card.getId} (${this.oldStack}) to ${this.targetCard === null ? 'Blank' : this.targetCard.getId} (${this.newStack})`
		log ? console.log(result) : {}
		return result
	}

	setNewStack(newStack: Stack) {
		this.newStack = newStack
	}
}

class MoveNode {
	card: GameCard
	newStack: Stack | null
	target: GameCard | null
	prev: MoveNode | null
	next: MoveNode | null

	constructor(card: GameCard, target: GameCard|null=null, newStack: Stack|null=null,
				prev: MoveNode|null=null, next: MoveNode|null=null) {
		this.card = card
		this.newStack = newStack ?? target?.getStack ?? null
		this.target = target
		this.prev = prev
		this.next = next
	}
	getPrev() {

	}
	getNext() {

	}
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
solitaire.dealCards(testBoard2)
solitaire.printBoard(solitaire.board, true, true)
solitaire.printBoard()
solitaire.evaluateBoard()
