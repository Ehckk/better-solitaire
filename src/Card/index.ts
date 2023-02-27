const assetDir = './assets'
const imgPath = `${assetDir}/images`
const iconPath = `${assetDir}/icons`

type Stack = 'Draw' | 'Discard' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'WinS' | 'WinH' | 'WinC' | 'WinD'
type StackType = 'Cycle' | 'Center' | 'Win'
type SuitName = 'Spades' | 'Hearts' | 'Clubs' | 'Diamonds'
type SuitColor = 'Black' | 'Red'
type RankName = 'Ace' | 'Two' | 'Three' | 'Four' | 'Five' | 'Six' | 'Seven' | 'Eight' | 'Nine' | 'Ten' | 'Jack' | 'Queen' | 'King'

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

const suits = [
	new Suit('Spades', 'Black', 0),
	new Suit('Hearts', 'Red', 1),
	new Suit('Clubs', 'Black', 2),
	new Suit('Diamonds', 'Red', 3)
]
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
    private suit: Suit
	private rank: Rank
	private stack: Stack
	private stackType: StackType = 'Cycle'
	private facedown: boolean
	private movable: boolean
	private facedownBelow: boolean
	private blankBelow: boolean
	private nothingAbove: boolean

	constructor(suit: Suit, rank: Rank, stack: Stack='Draw', facedown: boolean=true, movable: boolean=true,
				facedownBelow: boolean=false, blankBelow: boolean=false, nothingAbove: boolean=false) {
        this.suit = suit
        this.rank = rank
		this.stack = stack
		this.facedown = facedown
		this.movable = movable
		this.facedownBelow = facedownBelow
		this.blankBelow = blankBelow
		this.nothingAbove = nothingAbove
		this.setStackType(stack)
	}

	get getSuit() {
		return this.suit
	}
	get getRank() {
		return this.rank
	}
	get print() {
		return `${this.rank.getName} of ${this.suit.getName}`
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
	getId(ignoreFacedown: boolean=false) {
        const cardId = this.suit.getName[0] + this.rank.getStrValue
		return !ignoreFacedown && this.facedown ? `[${cardId}]` : cardId
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
	matches(otherCard: Card) {
		return this.rank.getValue === otherCard.getRank.getValue && this.suit.getIndex === otherCard.getSuit.getIndex
	}
	isWinTarget(target: Card) {
		if (this.rank.getValue === 1) return false
		return target.getRank.getValue === this.rank.getValue - 1 && target.getSuit.getIndex === this.suit.getIndex
	}
	isStackTarget(target: Card) {
		if (this.rank.getValue === 13) return false
		return target.getSuit.getColor !== this.suit.getColor && target.getRank.getValue - 1 === this.rank.getValue
	}
	isInSameStack(target: Card) {
		return target.getStack === this.stack
	}
	isInWinPile() {
		return this.stack === this.winStack

	}
}

export { Stack, StackType, Card, suits, ranks }
