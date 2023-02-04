type Stack = 'Draw' | 'Discard' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'WinS' | 'WinH' | 'WinC' | 'WinD'
type StackType = 'Cycle' | 'Center' | 'Win'
type Board = { [key in Stack]: GameCard[] }
type SuitName = 'Spades' | 'Hearts' | 'Clubs' | 'Diamonds'
type SuitColor = 'Black' | 'Red'
type RankName = 'Ace' | 'Two' | 'Three' | 'Four' | 'Five' | 'Six' | 'Seven' | 'Eight' | 'Nine' | 'Ten' | 'Jack' | 'Queen' | 'King'
type TargetType = 'Both' | 'Clear' | 'Center' | 'Win'
const assetDir = './assets'
const imgPath = `${assetDir}/images`
const iconPath = `${assetDir}/icons`

class Suit {
	private name: SuitName
	private color: SuitColor
	private index: number
	private icon: string

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
	private name: string
	private value: number
	private strValue: string

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
	get getCardId() {
		return this.suit.getName[0] + this.rank.getStrValue
	}
	get print() {
		return `${this.rank.getName} of ${this.suit.getName}`
	}

	matches(otherCard: Card) {
		return this.rank.getValue === otherCard.getRank.getValue && this.suit.getIndex === otherCard.getSuit.getIndex
	}
}

class GameCard extends Card {
	private stack: Stack
	private stackType: StackType = 'Cycle'
	private facedown: boolean
	private movable: boolean
	private facedownBelow: boolean
	private blankBelow: boolean
	private nothingAbove: boolean

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
	get winStack() {
		return `Win${this.suit.getName[0]}` as Stack
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

	getId(ignoreFacedown: boolean=false) {
		return !ignoreFacedown && this.facedown ? `[${super.getCardId}]` : super.getCardId
	}
	flip() {
		this.facedown = !this.facedown
	}
	isWinTarget(target: GameCard) {
		if (this.rank.getValue === 1) return false
		return target.getRank.getValue === this.rank.getValue - 1 && target.getSuit.getIndex === this.suit.getIndex
	}
	isStackTarget(target: GameCard) {
		if (this.rank.getValue === 13) return false
		return target.getSuit.getColor !== this.suit.getColor && target.getRank.getValue - 1 === this.rank.getValue
	}
	isInSameStack(target: GameCard) {
		return target.getStack === this.stack
	}
}

class Turn {
	board: Board
	cards: GameCard[]
	possibleMoves: Map<string, Set<Move[]>>
	visited: boolean[][]
	moveChains: Move[][]
	boardIsWinnable: boolean
	boardIsWon: boolean
	turnNumber: number

	constructor(board: Board, turnNumber: number) {
		this.board = board
		this.cards = Object.values(this.board).reduce((prev: GameCard[], cards) => [...prev, ...cards], [])
		this.possibleMoves = new Map<string, Set<Move[]>>()
		this.visited = new Array(4)
		this.moveChains = []
		this.boardIsWinnable = false
		this.boardIsWon = false
		this.turnNumber = turnNumber
		for (const suit of suits) {
			this.visited[suit.getIndex] = new Array(13).fill(false)
		}
	}

	checkBoard() {
		console.log(`Turn ${this.turnNumber}`)
		const criticalCards = this.cards.filter((card) => card.getStackType === 'Center' && (card.hasFacedownBelow || card.hasBlankBelow) && !card.isFacedown)
		console.log(criticalCards.map(card => card.getId()))
		for (const critCard of criticalCards) {
			this.getMoves(critCard, 'Both')
		}
		for (const card of criticalCards) {
			this.moveChains.push(...this.getMoveChainsForCard(card))
		}
		this.moveChains.sort((a, b) => b.length - a.length)
		// this.printMoveChains(this.moveChains)
	}

	getMoves(card: GameCard, targetType: TargetType='Both'): Move[][] {
		if (this.hasCardBeenVisited(card)) {
			return this.getMoveChainsForCard(card, targetType)
		}
		if (!card.isMovable && card.getStack !== card.winStack) return []
		const moveChains: Move[][] = []
		if (card.getRank.getValue === 1) {
			if (card.getStack !== card.winStack) {
				moveChains.push([new Move(card, null, card.winStack)])
			}
			this.possibleMoves.set(card.getId(true), new Set(moveChains))
			return moveChains
		}
		if (card.getRank.getValue === 13 && !this.boardIsWinnable) {
			const [emptyPiles, zeroFacedownCenterPiles] = this.getCenterPilesForKingMove(card)
			for (const stack of emptyPiles) {
				moveChains.push([new Move(card, null, stack)])
			}
			for (const stack of zeroFacedownCenterPiles) {
				const results = this.getMoves(this.board[stack][0], 'Both')
				if (results.length > 0) {
					moveChains.push(...results.map((result) => [...result, new Move(card, null, stack)]))
				}
			}
			this.possibleMoves.set(card.getId(true), new Set(moveChains))
			return moveChains
		}
		let cardCanBeCleared = false
		const movesToClear: Move[][] = []
		if (!card.hasNothingAbove && card.getStackType !== 'Cycle') {
			const cardIndex = this.board[card.getStack].indexOf(card)
			const results = this.getMoves(this.board[card.getStack][cardIndex + 1], 'Both') // recurse with card above it
			if (results.length > 0) {
				movesToClear.push(...results.map((result) => [...result]))
				cardCanBeCleared = true
			}
		}
		const cardCanBePlacedOn = cardCanBeCleared || card.hasNothingAbove
		for (const [target, type] of this.getTargets(card, targetType)) {
			// ((type === 'Win' && target.getStack === target.winStack) || type === 'Center')
			if (target.hasNothingAbove && (type !== 'Win' || target.getStack === target.winStack)) {
				const newMove =  new Move(card, target, target.getStack, true)
				if (movesToClear.length > 0) {
					moveChains.push(...movesToClear.map((result) => [...result, newMove]))
				} else {
					moveChains.push([newMove])
				}
				continue
			}
			if (target.getStackType !== 'Cycle' && !target.hasNothingAbove) continue
			this.getMoves(target)
			const results = this.getMoveChainsForCard(target, type, true)
			if (results.length === 0) continue
			for (const result of results) {
				let newMove = new Move(card, target, result[result.length - 1].newStack, cardCanBePlacedOn)
				if (movesToClear.length > 0) {
					moveChains.push(...movesToClear.map((clearMoves) => [...clearMoves, ...result, newMove]))
				} else {
					moveChains.push([...result, newMove])
				}
			}
		}
		this.possibleMoves.set(card.getId(true), new Set(moveChains))
		return cardCanBePlacedOn ? moveChains : []
	}

	hasCardBeenVisited(card: GameCard) {
		const suitIndex = card.getSuit.getIndex
		const rankIndex = card.getRank.getValue - 1
		const hasCardBeenVisited = this.visited[suitIndex][rankIndex]
		if (!hasCardBeenVisited) {
			this.visited[suitIndex][rankIndex] = true
		}
		return hasCardBeenVisited
	}

	getMoveChainsForCard(card: GameCard, targetType: TargetType='Both', onlyEmptyCardMoves: boolean=false): Move[][] {
		const moveSet = this.possibleMoves.get(card.getId(true)) ?? [] as Move[][]
		const moveArray = Array.from(moveSet.values())
		if (targetType === 'Both') return moveArray
		const filteredMoves = moveArray.filter(moves => moves[moves.length - 1].moveType === targetType)
		if (!onlyEmptyCardMoves) return filteredMoves
		return filteredMoves.filter(moves => moves[moves.length - 1].isClearOrDrawMove || moves[moves.length - 1].card.hasNothingAbove)
	}

	getCenterPilesForKingMove(card: GameCard): [Stack[], Stack[]] {
		const piles = (Object.keys(this.board) as Stack[])
		const validCenterPiles = piles.filter((stack) => stack !== card.getStack && getStackType(stack) === 'Center')
		const emptyCenterPiles: Stack[] = []
		const zeroFacedownCenterPiles: Stack[] = []
		for (const stack of validCenterPiles) {
			const cards = this.board[stack]
			if (cards.length === 0) {
				emptyCenterPiles.push(stack)
			} else if (this.getFacedownCount(cards)) {
				zeroFacedownCenterPiles.push(stack)
			}
		}
		return [emptyCenterPiles, zeroFacedownCenterPiles] as [Stack[], Stack[]]
	}

	getTargets(card: GameCard, targetType: TargetType): [GameCard, TargetType][] {
		const targets: [GameCard, TargetType][] = []
		for (const target of this.cards) {
			if (card.getStackType !== 'Cycle' && (card.getStack === target.getStack)) continue
			if (targetType !== 'Center' && card.isWinTarget(target)) {
				targets.push([target, 'Win'])
			}
			if (targetType !== 'Win' && card.isStackTarget(target)) {
				targets.push([target, 'Center'])
			}
		}
		return targets
	}

	getFacedownCount(cards: GameCard[]) {
		return cards.reduce((count, card) => card.isFacedown ? count + 1 : count, 0)
	}

	printMoves() {
		const criticalCards = this.cards.filter((card) => card.getStackType === 'Center' && card.hasFacedownBelow && !card.isFacedown)
		let fmt = 'Possible Moves:'
		for (const card of criticalCards) {
			fmt += `\n ${card.getId(true)} [\n`
			const moveChains = Array.from(this.possibleMoves.get(card.getId(true)) ?? [])
			fmt += `${moveChains.length > 0 ? this.printMoveChains(moveChains, false) : '\tNo possible moves detected this turn'}`
			fmt += `\n]`
		}
		console.log(fmt)
	}

	printMoveChains(moveChains: Move[][], log: boolean=true) {
		let fmt = `${moveChains.map((moves) => `${log ? '' : '\t'}${moves.map((move) => {
			const { card, targetCard, oldStack, newStack } = move
			return `${card.getId(true)} (${oldStack}) => ${targetCard?.getId(true) ?? 'Blank'} (${newStack})`
		}).join(', ')}`).join('\n')}`
		log ? console.log(fmt) : {}
		return fmt
	}

	hasPossibleMoves() {
		return this.moveChains.length > 0
	}

	makeMoves() {
		const newBoard = { ...this.board }
		const nextMoveChain = this.moveChains.splice(0, 1)[0]
		this.printMoveChains([nextMoveChain])
		for (const move of nextMoveChain) {
			move.makeMove(newBoard)
			this.updateStack(newBoard, move.oldStack)
			this.updateStack(newBoard, move.newStack)
		}
		return newBoard
	}

	updateStack(board: Board, stack: Stack) {
		const stackType = getStackType(stack)
		if (stackType === 'Cycle' || board[stack].length === 0) return
		for (const [i, card] of board[stack].entries()) {
			const isInWin = stackType === 'Win'
			const isOnTop = i === board[stack].length - 1
			const isOnBottom = i === 0
			!isInWin && isOnTop && card.isFacedown ? card.flip() : {}
			card.setMovable((!isInWin && !card.isFacedown) || (isInWin && isOnTop))
			card.setNothingAbove(isOnTop)
			card.setBlankBelow(!isInWin && isOnBottom)
			card.setFacedownBelow(!isInWin && !isOnBottom ? board[stack][i - 1].isFacedown : false)
		}
	}
}

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

	nextTurn(board: Board, limit: number=15, count: number=1): boolean {
		const turn = new Turn(board, count)
		turn.checkBoard()
		console.log(turn.hasPossibleMoves())
		if (count === limit || !turn.hasPossibleMoves()) return false
		if (turn.boardIsWinnable) return true // repalce with boardIsWon later
		const newBoard: Board = turn.makeMoves()
		printBoard(newBoard)
		// if (!this.nextTurn(newBoard, limit, count + 1)) {
		// 	return turn.hasPossibleMoves() ? this.nextTurn(board, limit, count)
		// }
		return this.nextTurn(newBoard, limit, count + 1)
	}
}

function getStackType(stack: Stack): StackType {
	const stackName = stack as string
	if (!isNaN(parseInt(stackName))) return 'Center'
	if (stackName.startsWith('Win')) return 'Win'
	return 'Cycle'
}

function printBoard(board: Board, log: boolean=true, stringify: boolean=false) {
	let result: string = ''
	if (stringify) {
		result = `${Object.values(board).reduce((prevCards: [number, number][], cards: GameCard[]) => {
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

class Move {
	card: GameCard
	targetCard: GameCard | null
	oldStack: Stack
	newStack: Stack
	moveType: TargetType
	isClearOrDrawMove: boolean

	constructor(card: GameCard, targetCard: GameCard | null, newStack: Stack, isClearOrDrawMove: boolean=false) {
		this.card = card
		this.targetCard = targetCard
		this.oldStack = card.getStack
		this.newStack = newStack
		this.moveType = card.getSuit.getIndex === targetCard?.getSuit.getIndex ?? -1 ? 'Win' : 'Center'
		this.isClearOrDrawMove = isClearOrDrawMove
	}

	makeMove(board: Board) {
		if (this.newStack === null) return
		const targetStack = this.newStack
		const newBoard = { ...board }
		let cardIndex = newBoard[this.oldStack].length - 1

		while (!this.card.matches(newBoard[this.oldStack][cardIndex])) {
			cardIndex--
		}
		const cardsToMove = newBoard[this.oldStack].splice(cardIndex,
			this.card.getStackType === 'Cycle' ? 1 : newBoard[this.oldStack].length - 1)
		if (this.card.hasFacedownBelow) {
			this.card.setFacedownBelow(false)
			const newTopCard = newBoard[this.oldStack][cardIndex - 1]
			newTopCard.flip()
		}
		newBoard[targetStack].push(...cardsToMove.map((card, i) => {
			card.setStack(targetStack)
			card.isFacedown ? card.flip() : {}
			card.setNothingAbove(i === cardsToMove.length - 1)
			return card
		}))
	}

	// undoMove() {}

	print(log: boolean=false) {
		const result = `${this.card.getId} (${this.oldStack}) to ${this.targetCard === null ? 'Blank' : this.targetCard.getId} (${this.newStack})`
		log ? console.log(result) : {}
		return result
	}

	setNewStack(newStack: Stack) {
		this.newStack = newStack
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
printBoard(solitaire.board, true, true)
printBoard(solitaire.board)
solitaire.nextTurn(solitaire.board)
