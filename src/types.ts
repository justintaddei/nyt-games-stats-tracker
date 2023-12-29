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

export type ConnectionsScore = {
    correct: number
    incorrect: number
}

export type UserConnections = {
    user: {
        name: string
        id: string
    }
    puzzleId: string
    won: boolean
    score: ConnectionsScore
    connections: string
}

export type ConnectionsRecord = {
    puzzleId: string
    connections: UserConnections[]
}
