import { Card, Stack } from "../Card"
import { Board } from "../Turn"

type MoveType = 'Win' | 'Center'

class Move {
	card: Card
	targetCard: Card | null
	oldStack: Stack
	newStack: Stack
	type: MoveType

	constructor(card: Card, targetCard: Card | null, newStack: Stack, type: MoveType) {
		this.card = card
		this.targetCard = targetCard
		this.oldStack = card.getStack
		this.newStack = newStack
		this.type = type
	}

	makeMove(board: Board) {
		const cardsToMove: Card[] = []
		if (this.card.getStackType === 'Cycle') {
			cardsToMove.push(...this.makeCycleMove(board))
		} else {
			cardsToMove.push(...this.makePileMove(board))
		}
		const newPile = board[this.newStack]
		if (newPile.length > 0) {
			const oldTopCard = newPile[newPile.length - 1]
			oldTopCard.setNothingAbove(false)
		} else {
			cardsToMove[0].setBlankBelow(true)
		}
		for (const card of cardsToMove) {
			card.setStack(this.newStack)
		}
		newPile.push(...cardsToMove)
		newPile[newPile.length - 1].setNothingAbove(true)
		return board
	}

	makeCycleMove(board: Board) {
		const pile = board[this.oldStack]
		let cardIndex = pile.length - 1
		let foundCard = this.card.matches(pile[cardIndex])
		while (!foundCard) {
			cardIndex--
			foundCard = this.card.matches(pile[cardIndex])
		}
		const cardsToMove = pile.splice(cardIndex, 1)
		if (cardsToMove[0].isFacedown) {
			cardsToMove[0].flip()
		}
		return cardsToMove
	}

	makePileMove(board: Board) {
		const pile = board[this.oldStack]
		const topIndex = pile.length - 1
		let cardIndex = topIndex
		console.log(this.oldStack, pile[cardIndex])
		let foundCard = this.card.matches(pile[cardIndex])
		while (!foundCard) {
			cardIndex--
			foundCard = this.card.matches(pile[cardIndex])
		}
		const cardsToMove = pile.splice(cardIndex, (topIndex - cardIndex) + 1)
		cardsToMove[0].hasBlankBelow ? cardsToMove[0].setBlankBelow(false) : {}
		cardsToMove[0].hasFacedownBelow ? cardsToMove[0].setFacedownBelow(false) : {}

		const newTopCard = pile[pile.length - 1]
		newTopCard.isFacedown ? newTopCard.flip() : {}
		newTopCard.setNothingAbove(true)
		return cardsToMove
	}

	// makeMove(board: Board) {
	// 	if (this.newStack === null) return
	// 	const targetStack = this.newStack

	// 	while (!this.card.matches(board[this.oldStack][cardIndex])) {
	// 		cardIndex--
	// 	}
	// 	const cardsToMove = board[this.oldStack].splice(cardIndex,
	// 		this.card.getStackType === 'Cycle' ? 1 : board[this.oldStack].length - 1)
	// 	if (this.card.hasFacedownBelow) {
	// 		this.card.setFacedownBelow(false)
	// 		const newTopCard = board[this.oldStack][cardIndex - 1]
	// 		newTopCard.flip()
	// 	}
	// 	board[targetStack].push(...cardsToMove.map((card, i) => {
	// 		card.setStack(targetStack)
	// 		card.isFacedown ? card.flip() : {}
	// 		card.setNothingAbove(i === cardsToMove.length - 1)
	// 		return card
	// 	}))
	// 	if (this.card.getStackType === 'Cycle') {
	// 		// fix issue with nothingAbove and previous stack

	// 	}
	// }

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

export { Move }
