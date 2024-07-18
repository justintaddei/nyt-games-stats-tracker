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
  /**
   * Indicates if the record needs to be rewritten to the channel
   */
  modified?: boolean
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
  /**
   * Indicates if the record needs to be rewritten to the channel
   */
  modified?: boolean
  connections: UserConnections[]
}

export type UserStrands = {
  user: {
    name: string
    id: string
  }
  puzzleId: string
  phrase: string
  hints: number
  strands: string
}

export type StrandsRecord = {
  puzzleId: string
  /**
   * Indicates if the record needs to be rewritten to the channel
   */
  modified?: boolean
  phrase: string
  strands: UserStrands[]
}
