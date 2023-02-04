import { Card, Stack, StackType, suits } from "../Card"
import { Move } from "../Move"

type Board = { [key in Stack]: Card[] }
type TargetType = 'Both' | 'Center' | 'Win'

function getStackType(stack: Stack): StackType {
	const stackName = stack as string
	if (!isNaN(parseInt(stackName))) return 'Center'
	if (stackName.startsWith('Win')) return 'Win'
	return 'Cycle'
}

class Turn {
	board: Board
	cards: Card[]
    criticalCards: Card[] = []
	possibleMoves: Map<string, Set<Move>> = new Map<string, Set<Move>>()
	visited: boolean[][]
	moveChains: Move[][] = []
    cardstoCheck: Card[] = []
    boardIsWinnable: boolean
	boardIsWon: boolean
	turnNumber: number

	constructor(board: Board, turnNumber: number) {
		this.board = board
		this.cards = Object.values(this.board).reduce((prev: Card[], cards) => [...prev, ...cards], [])
		this.visited = Array(4)
		this.boardIsWinnable = false
		this.boardIsWon = false
		this.turnNumber = turnNumber
		for (const suit of suits) {
			this.visited[suit.getIndex] = new Array(13).fill(false)
		}
	}

    getMoves() {
        this.criticalCards.push(...this.cards.filter((card) => {
            if (card.getStackType !== 'Center') return false 
            if (card.isFacedown) return false
            return (card.hasFacedownBelow || card.hasBlankBelow)
        }))
        for (const critCard of this.criticalCards) {
            this.getMovesForCard(critCard)
        }
    }

    getPossibleMoves(card: Card, type: TargetType): Move[] {
        const moves = Array.from(this.possibleMoves.get(card.getId(true))?.values() ?? [])
        if (type === 'Both') return moves
        return moves.filter((move) => move.type === type)
    }

    getMovesForCard(card: Card, type: TargetType='Both'): Move[] {
        if (this.cardstoCheck.some((cardToCheck) => card.matches(cardToCheck))) return []
		if (this.hasCardBeenVisited(card)) {
            return this.getPossibleMoves(card, type) // Card was already checked, return moves of specified type
        }
        this.visited[card.getSuit.getIndex][card.getRank.getValue - 1] = true // Mark card as checked
        if (card.getStackType === 'Center' && card.isFacedown) return [] // Cant be moved this turn, return nothing

        const moves: Move[] = []
        let cardIsFree = true
        if (card.getStackType !== 'Cycle' && !card.hasNothingAbove) { // Non-Cycle card has something blocking it
            const cardIndex = this.board[card.getStack].indexOf(card)
            const cardOnTop = this.board[card.getStack][cardIndex + 1]
            const result = this.getMovesForCard(cardOnTop)
            cardIsFree = result.length > 0 // if the card blocking it can be moved, consider the card movable
        }
        if (cardIsFree) {
            const result = this.getWinMove(card)
            if (result !== null) moves.push(result)
        }
        const result = this.getCenterMoves(card)
        if (result.length > 0) moves.push(...result)
        this.possibleMoves.set(card.getId(true), new Set<Move>(moves))
        return this.getPossibleMoves(card, type)
    }

    getWinMove(card: Card): Move | null {
        if (card.getRank.getValue === 1) {
            return new Move(card, null, card.winStack, 'Win') // Move ace to win
        }
        const winTarget = this.getWinTarget(card)
        const winMove = new Move(card, winTarget, card.winStack, 'Win') // Move ace to win
        if (winTarget.getStack === card.winStack) {
            return winMove
        }
        this.cardstoCheck.push(card)
        const result = this.getMovesForCard(winTarget, 'Win')
        this.cardstoCheck.pop()
        if (result.length > 0) {
            return winMove
        }
        return null
    }
    getWinTarget(card: Card): Card {
        return this.cards.filter(target => {
            if (target.getSuit !== card.getSuit) return false 
            if (target.getRank.getValue + 1 !== card.getRank.getValue) return false
            return true
        })[0]
    }

    getCenterMoves(card: Card): Move[] {
        const moves: Move[] = []
        if (card.getRank.getValue === 13) {
            return this.getKingCenterMoves(card)
        }
        const centerTargets = this.getCenterTargets(card)
        for (const target of centerTargets) {
            const move = new Move(card, target, target.getStack, 'Center') 
            if (target.hasNothingAbove && target.getStackType === 'Center') {
                moves.push(move)
            } else {
                this.cardstoCheck.push(card)
                const result = this.getMovesForCard(target, 'Center') // if center pile can be emptied
                this.cardstoCheck.pop()
                if (result.length > 0) moves.push(move)
            }
        }
        return moves
    }
    getCenterTargets(card: Card): Card[] {
        return this.cards.filter(target => {
            if (target.getSuit.getColor === card.getSuit.getColor) return false 
            if (target.getRank.getValue - 1 !== card.getRank.getValue) return false
            return true
        })
    }
    getKingCenterMoves(card: Card): Move[] {
        const piles = Object.keys(this.board) as Stack[]
        const centerPiles = piles.filter(stack => getStackType(stack) === 'Center' && stack !== card.getStack)
        const moves: Move[] = []
        for (const pile of centerPiles) {
            const move = new Move(card, null, pile, 'Center')
            if (this.board[pile].length === 0) {
                moves.push(move) // move King to empty pile
                continue
            }
            this.cardstoCheck.push(card)
            const result = this.getMovesForCard(this.board[pile][0]) // if center pile can be emptied
            this.cardstoCheck.pop()
            if (result.length > 0) moves.push(move) // move King to empty pile
        }
        return moves
    }
	hasCardBeenVisited(card: Card) {
		const suitIndex = card.getSuit.getIndex
		const rankIndex = card.getRank.getValue - 1
		return this.visited[suitIndex][rankIndex]
	}

    getMoveChains() {
        for (const critCard of this.criticalCards) {
            this.moveChains.push(...this.getMoveChainsForCard(critCard))
        }
        console.log('-------------------')
        console.log(this.moveChains.map((moveChain) => moveChain.map((move) => {
            const target = move.targetCard?.getId(true) ?? 'Blank'
            return `${move.card.getId(true)} (${move.oldStack}) => ${target} (${move.newStack})`
        }).join(', ')).join('\n'))
        console.log('-------------------')
    }

    getMoveChainsForCard(card: Card, type: TargetType='Both'): Move[][] {
        const newMoves: Move[][] = []
        const possibleMoves = this.getPossibleMoves(card, type)
        for (const possibleMove of possibleMoves) {
            if (possibleMove.targetCard === null || possibleMove.targetCard.hasNothingAbove) {
                newMoves.push([possibleMove])
                continue
            } 
            const requiredMoves = this.getMoveChainsForCard(possibleMove.targetCard, type=possibleMove.type)
            newMoves.push(...requiredMoves.map((moveChain) => {
                const lastMove = moveChain[moveChain.length - 1]
                const newMove = new Move(card, possibleMove.targetCard, lastMove.newStack, possibleMove.type)
                return [...moveChain, newMove]
            }))
        }
        return newMoves
    }

	getFacedownCount(cards: Card[]) {
		return cards.reduce((count, card) => card.isFacedown ? count + 1 : count, 0)
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

	// makeMoves() {
	// 	const newBoard = { ...this.board }
	// 	const nextMoveChain = this.moveChains.splice(0, 1)[0]
	// 	this.printMoveChains([nextMoveChain])
	// 	for (const move of nextMoveChain) {
	// 		move.makeMove(newBoard)
	// 		this.updateStack(newBoard, move.oldStack)
	// 		this.updateStack(newBoard, move.newStack)
	// 	}
	// 	return newBoard
	// }

	// updateStack(board: Board, stack: Stack) {
	// 	const stackType = getStackType(stack)
	// 	if (stackType === 'Cycle' || board[stack].length === 0) return
	// 	for (const [i, card] of board[stack].entries()) {
	// 		const isInWin = stackType === 'Win'
	// 		const isOnTop = i === board[stack].length - 1
	// 		const isOnBottom = i === 0
	// 		!isInWin && isOnTop && card.isFacedown ? card.flip() : {}
	// 		card.setMovable((!isInWin && !card.isFacedown) || (isInWin && isOnTop))
	// 		card.setNothingAbove(isOnTop)
	// 		card.setBlankBelow(!isInWin && isOnBottom)
	// 		card.setFacedownBelow(!isInWin && !isOnBottom ? board[stack][i - 1].isFacedown : false)
	// 	}
	// }
}

export { Board, Turn }