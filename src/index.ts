type Stack = 'Draw' | 'Discard' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'WinS' | 'WinH' | 'WinC' | 'WinD'
type StackType = 'Cycle' | 'Center' | 'Win'
type Board = { [key in Stack]: GameCard[] }
type SuitName = 'Spades' | 'Hearts' | 'Clubs' | 'Diamonds'
type SuitColor = 'Black' | 'Red'
type RankName = 'Ace' | 'Two' | 'Three' | 'Four' | 'Five' | 'Six' | 'Seven' | 'Eight' | 'Nine' | 'Ten' | 'Jack' | 'Queen' | 'King'
type TargetType = 'Both' | 'Center' | 'Win'
type MoveType = 'Center' | 'Win'

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

class MoveMap {
	private map: Map<string, Set<Move[]>>

	constructor() {
		this.map = new Map<string, Set<Move[]>>()
	}

	create(card: GameCard) {
		const key = card.getId(true)
		this.map.set(key, new Set())
		return this.map.get(key)
	}
	add(card: GameCard, moves: Move[]=[]) {
		const key = card.getId(true)
		this.map.get(key)?.add(moves)
	}
	get(card: GameCard) {
		const key = card.getId(true)
		const values = this.map.get(key) ?? null
		if (values === null) return null
		return Array.from(values.values()) ?? null
	}
	getTargetStacks(card: GameCard) {
		const values = this.get(card)
		if (values === null) return null
		return values.map((moves) => moves[moves.length - 1].newStack)
	}
	exists(card: GameCard) {
		const key = card.getId(true)
		return this.map.get(key) !== undefined
	}
	print() {
		let fmt = 'Possible Moves:\n'
		for (const [card, set] of this.map.entries()) {
			const fmtSet =
			fmt += `${card} => [\n${Array.from(set.values()).map((moves) => {
				return `\t${moves.map((move) => `${move.targetCard?.getId(true) ?? 'Blank'} (${move.newStack})`).join(' -> ')}\n`
			})}]\n`
		}
		console.log(fmt)
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

interface MoveSearchOptions {
	cards: GameCard[],
	filter: TargetType,
	canEmptyPile: boolean,
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

	printBoard(board: Board, log: boolean=true, stringify: boolean=false) {
		let result
		if (stringify) {
			result = Object.values(board).reduce((prevCards: [number, number][], cards: GameCard[]) => {
				return [...prevCards, ...cards.map((card) => [card.getSuit.getIndex, card.getRank.getValue - 1] as [number, number])]
			}, [])
			log ? console.log(result) : {}
			return result
		}
		result = `${this.name}\n`
		for (const [stack, cards] of Object.entries(board)) {
			result += `${stack}: ${cards.map((card) => card.getId()).join(' ')}\n`
		}
		log ? console.log(result) : {}
		return result
	}
	printMoves(moves: Move[][]) {
		moves.forEach((moves) => {
			console.log(moves.map(move => move.print()).join(' -> '))
		})
	}

	getStackType(card: GameCard): StackType {
		if ((card.getStack as string).startsWith('Win')) return 'Win'
		if (!isNaN(parseInt((card.getStack as string)))) return 'Center'
		return 'Cycle'
	}
	evaluateBoard(board: Board): boolean {
		const cards = Object.values(board).reduce((prev: GameCard[], cards) => [...prev, ...cards], [])
		const criticalCards = cards.filter((card) => card.getStackType === 'Center' && (card.hasFacedownBelow || card.hasBlankBelow) && !card.isFacedown)
		const validMoves: Move[][] = [] 
		console.log(criticalCards.map(card => card.getId()))
		for (const critCard of criticalCards) {
			this.getMoves(critCard, 'Both', cards, board)
		}
		validMoves.sort((a, b) => b.length - a.length)
		this.possibleMoves.print()
		let positionIsWon = false
		
		// while (possibleMoves.length > 0 && !positionIsWon && this.count < this.limit) {
		// 	const newBoard = this.makeMoves(board, possibleMoves.splice(0, 1)[0])
		// 	if (this.getFacedownCardCount(newBoard)) {
		// 		positionIsWon = true
		// 	}
		// 	this.count++
		// 	positionIsWon = this.evaluateBoard(newBoard)
		// }
		return positionIsWon // No more moves remaining, backtrack
	}

	getEmptyPiles(board: Board): Stack[] {
		const centerPiles = (Object.keys(board) as Stack[]).filter((stack) => getStackType(stack as Stack) === 'Center')
		return centerPiles.filter((stack) => board[stack].length === 0) // center piles with no cards
	}
	getZeroFacedownCenterPiles(board: Board): Stack[] {
		const centerPiles = (Object.keys(board) as Stack[]).filter((stack) => getStackType(stack as Stack) === 'Center')
		return centerPiles.filter((stack) => board[stack].length > 0 && board[stack].every(card => !card.isFacedown)) // center piles with cards, but no facedown cards
	}
	
	possibleMoves: MoveMap = new MoveMap()

	// move to Turn class
	getMoves(card: GameCard, targetType: TargetType='Both', cards: GameCard[], board: Board, ): Stack[] | null {
		this.possibleMoves.create(card)
		if (!card.isMovable) return null
		if (card.getRank.getValue === 1) {
			this.possibleMoves.add(card, [new Move(card, null, card.winStack)])
			return [card.winStack]
		}
		const stacks: Stack[] = []
		if (card.getRank.getValue === 13) {
			stacks.push(...this.getEmptyPiles(board))
			for (const emptyPile of this.getEmptyPiles(board)) {
				this.possibleMoves.add(card, [new Move(card, null, emptyPile)])
			}
			// zero-facedown center piles
		}
		console.log(card.getId())
		const isTargetable = (target: GameCard) => target.getStackType === 'Cycle' || !card.isInSameStack(target)
		const winTargets: GameCard[] = cards.filter((target) => isTargetable(target) && card.isWinTarget(target))
		const stackTargets: GameCard[] = cards.filter((target) => isTargetable(target) && card.isStackTarget(target))
		for (const target of [...stackTargets, ...winTargets]) {
			const moves: Move[][] = []
			if (target.hasNothingAbove) {
				moves.push([new Move(card, target, target.getStack)])
				stacks.push(target.getStack)
			}
			let results: Stack[] | null
			if (this.possibleMoves.exists(target)) {
				results = this.possibleMoves.getTargetStacks(target) ?? []
			} else {
				results = this.getMoves(target, targetType, cards, board)
			}
			if (results === null) continue
			if (results.length === 0) continue
			const targetMoves: Move[][] | null = this.possibleMoves.get(target)
			if (targetMoves === null) continue
			if (targetMoves.length === 0) continue
			for (const targetMoveChain of targetMoves) {
				console.log(target.getId(), targetMoveChain)
				const lastMoveInChain = targetMoveChain[targetMoveChain.length - 1]
				if (lastMoveInChain.moveType === targetType) {
					moves.push([...targetMoveChain, new Move(card, target, targetMoveChain[targetMoveChain.length - 1].newStack)])
					stacks.push(lastMoveInChain.newStack)
				}
			}
			this.possibleMoves.add(card, ...moves)
		}
		return stacks.length > 0 ? stacks : null
	} 

	// critCard: the card that needs to be moved
	// validTargets: the possible cards that can be moved to on this turn
	getMovesForCard(board: Board, critCard: GameCard, validTargets: GameCard[], options: MoveSearchOptions, searched: GameCard[]=[]):  { moves: Move[], targetStack: Stack | null }[] {
		let newStack: Stack | null = null
		if (critCard.getRank.getValue === 1) {
			newStack = `Win${critCard.getSuit.getName[0]}` as Stack
			return [{ moves: [new Move(critCard, null, newStack)], targetStack: newStack }]
		}
		const moves: { moves: Move[], targetStack: Stack | null }[] = []
		const { cards, filter, canEmptyPile } = options
		if (critCard.getRank.getValue === 13) { // if card is King
			const centerPiles = Object.keys(board).filter((stack) => getStackType(stack as Stack) === 'Center')
			const emptyPiles = centerPiles.filter((stack) => stack !== critCard.getStack && board[stack as Stack].length === 0) // find empty spaces
			if (emptyPiles.length > 0) return emptyPiles.map((stack) => {
				return { moves: [new Move(critCard, null, stack as Stack)], targetStack: stack as Stack }
			})
			const cleanPiles = centerPiles.filter((stack) => board[stack as Stack].every(card => !card.isFacedown)) // find center piles with no facedown cards
			if (!canEmptyPile || cleanPiles.length === 0) return moves 
			for (const stack of cleanPiles) {
				const newOptions = {...options}
				newOptions.canEmptyPile = false
				const results = this.getMovesForCard(board, board[stack as Stack][0], validTargets, newOptions, [...searched, critCard]) // recurse and attempt to clear piles
				moves.push(...results.map(({ moves }) => { return { moves: [...moves, new Move(critCard, null, stack as Stack)], targetStack: stack as Stack }}))
			}
			return moves
		}

		if (!critCard.isMovable) return [] // if card is not movable return invalid
		const newOptions = {...options}

		const requiredValidTargets = validTargets.filter((target) => {
			if (critCard.getStack === target.getStack) return false
			if (filter !== 'Center' && target.getStackType === 'Win') return critCard.isWinTarget(target)			
			if (filter !== 'Win' && target.getStackType === 'Center') return critCard.isStackTarget(target)			
			return false
		})
		if (requiredValidTargets.length > 0) { // if required card is valid target
			return requiredValidTargets.map((target) => {
				newStack = target.getStack
				return { moves: [new Move(critCard, target, newStack)], targetStack: newStack }
			})
		}

		const stackTargets = []
		const winTargets = []
		const isTargetable = (card: GameCard) => {
			const hasNotBeenSearched = (searched.find((otherCard) => card.matches(otherCard)) ?? null) === null
			const notInSameStack = (!critCard.isInSameStack(card) || card.getStackType === 'Cycle')
			return hasNotBeenSearched && card.isMovable && notInSameStack
		}
		if (filter !== 'Center') winTargets.push(...cards.filter((card) => isTargetable(card) && critCard.isWinTarget(card)))
		if (filter !== 'Win') stackTargets.push(...cards.filter((card) => isTargetable(card) && critCard.isStackTarget(card)))
		const newTargets: [TargetType, GameCard][] = []
		newTargets.push(...stackTargets.map((target) => ['CenterOnly' as TargetType, target] as [TargetType, GameCard]))
		newTargets.push(...winTargets.map((target) => ['WinOnly' as TargetType, target] as [TargetType, GameCard]))

		for (const [newFilter, newTarget] of newTargets) {
			const clearingMoves: Move[][] = []
			if (!newTarget.hasNothingAbove && newTarget.getStackType !== 'Cycle') {
				const cardAboveIndex = board[newTarget.getStack].indexOf(newTarget) + 1
				const cardAbove = board[newTarget.getStack][cardAboveIndex]
				newOptions.filter = cardAboveIndex === board[newTarget.getStack].length - 1 ? 'Both' : 'Center'
				const results = this.getMovesForCard(board, cardAbove, validTargets, newOptions, [...searched, critCard])
				if (results.length === 0) continue
				clearingMoves.push(...results.map(({ moves }) => moves))
			}
			newOptions.filter = newFilter
			let results = this.getMovesForCard(board, newTarget, validTargets, newOptions, [...searched, critCard]) // recurse and attempt to clear piles
			if (clearingMoves.length > 0) {
				let newResults: { moves: Move[], targetStack: Stack | null }[] = []
				for (const { moves: result, targetStack } of results) {
					for (const clearMoves of clearingMoves) {
						newResults.push({ moves: [...clearMoves, ...result], targetStack: targetStack })
					}
				}
				results = newResults
			} else {
				moves.push(...results.map(({ moves, targetStack }) => {
					return { moves: [...moves, new Move(critCard, newTarget, targetStack ?? newTarget.getStack as Stack)], targetStack: targetStack }
				}))
			}
		}
		return moves
	}
	
	makeMoves(oldBoard: Board, moves: Move[]): Board {
		const newBoard = {...oldBoard}
		this.printMoves([moves])
		for (const move of moves) {
			if (move.newStack !== null) {
				move.makeMove(newBoard)
				this.updateStack(newBoard, move.oldStack)
				this.updateStack(newBoard, move.newStack)
			}
		}
		this.printBoard(newBoard)
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

	getFacedownCardCount(board: Board): number {
		return Object.entries(board).reduce((count: number, [stack, cards]) => {
			if (stack === 'Draw' || stack === 'Discard' || stack.startsWith('Win')) return count
			return count + cards.filter((card) => card.isFacedown).length
		}, 0)
	}

}

function getStackType(stack: Stack): StackType {
	const stackName = stack as string
	if (!isNaN(parseInt(stackName))) return 'Center'
	if (stackName.startsWith('Win')) return 'Win'
	return 'Cycle'
}

class Move {
	card: GameCard
	targetCard: GameCard | null
	oldStack: Stack
	newStack: Stack
	moveType: MoveType

	constructor(card: GameCard, targetCard: GameCard | null, newStack: Stack) {
		this.card = card
		this.targetCard = targetCard
		this.oldStack = card.getStack
		this.newStack = newStack
		this.moveType = card.getSuit.getIndex === targetCard?.getSuit.getIndex ?? -1 ? 'Win' : 'Center' 
	}

	makeMove(board: Board) {
		if (this.newStack === null) return
		const targetStack = this.newStack
		const newBoard = { ...board }
		const size = newBoard[this.oldStack].length
		let cardIndex = size - 1
		while (!this.card.matches(newBoard[this.oldStack][cardIndex])) {
			cardIndex--
		}
		const cardsToMove = newBoard[this.oldStack].splice(cardIndex, this.card.getStackType === 'Cycle' ? 1 : size - cardIndex)
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
solitaire.printBoard(solitaire.board)
solitaire.evaluateBoard(solitaire.board)
