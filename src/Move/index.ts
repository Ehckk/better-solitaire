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

export { Move }
