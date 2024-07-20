export type User = {
  name: string
  id: string
}

export type UserWordle = {
  user: User
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
  user: User
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
  user: User
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

export type LeaderboardItem = {
  user: string
  average: number
  games: number
}

export type LeaderboardRecord = {
  wordles: LeaderboardItem
  connections: LeaderboardItem
  strands: LeaderboardItem
}
