import type { AggregateScores, LeaderboardRecord } from '../types'

export const isLeaderboard = (text = '') => /^### Leaderboard:/.test(text)

export const getLeaderboard = (aggregateScores: Map<string, AggregateScores>): LeaderboardRecord => {
  const wordleAverages = new Map<string, number>()
  const connectionsAverages = new Map<string, number>()
  const strandsAverages = new Map<string, number>()
  ;[...aggregateScores.entries()].forEach(([userId, aggregateScore]) => {
    const { wordles, connections, strands } = aggregateScore

    wordleAverages.set(userId, wordles.reduce((a, b) => a + b, 0) / wordles.length)
    connectionsAverages.set(userId, connections.reduce((a, b) => a + b, 0) / connections.length)
    strandsAverages.set(userId, strands.reduce((a, b) => a + b, 0) / strands.length)
  })

  const getMinAverage = (averages: Map<string, number>) => {
    let minAverage = Number.MAX_VALUE
    let minUserId = ''
    averages.forEach((average, userId) => {
      if (average < minAverage) {
        minAverage = average
        minUserId = userId
      }
    })
    return {
      user: minUserId,
      average: minAverage,
    }
  }

  return {
    wordles: getMinAverage(wordleAverages),
    connections: getMinAverage(connectionsAverages),
    strands: getMinAverage(strandsAverages),
  }
}

export const writeLeaderboard = (leaderboardRecord: LeaderboardRecord): string => {
  const leaderboard = '### Leaderboard:'

  const wordle = `🟩 Wordle\n<@${leaderboardRecord.wordles.user}> has the best score, with an average of ${+leaderboardRecord.wordles.average.toFixed(2)}/6.`
  const connections = `🟪 Connections\n<@${leaderboardRecord.connections.user}> makes the fewest mistakes, averaging ${+leaderboardRecord.connections.average.toFixed(2)} mistakes per game.`
  const strands = `💡 Strands\n<@${leaderboardRecord.strands.user}> uses the fewest hints, with an average of ${+leaderboardRecord.strands.average.toFixed(2)} per game.`

  return `${leaderboard}\n\n${wordle}\n\n${connections}\n\n${strands}`
}
