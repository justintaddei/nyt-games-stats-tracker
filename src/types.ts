export type UserWordle = {
    user: {
        name: string
        id: string
    }
    puzzleId: string
    score: string
    hardMode: boolean
    guesses: string
}


export type WordleRecord = {
    puzzleId: string
    wordles: UserWordle[]
}
