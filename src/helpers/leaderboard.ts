import type { ConnectionsRecord, LeaderboardItem, LeaderboardRecord, StrandsRecord, WordleRecord } from '../types'

const DEFAULT_SCORE = {
  wordles: 6,
  connections: 4,
  strands: 7,
}

export const normalizeScore = (scores: number[], length: number, defaultScore: number) => {
  const worstScore = Math.max(...scores)

  while (scores.length < length) {
    scores.push(worstScore < 1 ? defaultScore : worstScore)
  }

  return scores
}

export const getMinAverage = (
  playerScores: Map<
    string,
    {
      wordles: number[]
      connections: number[]
      strands: number[]
    }
  >,
  gameType: 'wordles' | 'connections' | 'strands',
  length: number
) => {
  const minUser: LeaderboardItem = {
    user: '',
    average: Number.MAX_VALUE,
    games: length,
  }

  playerScores.forEach((scoresByGame, userId) => {
    const _scores = scoresByGame[gameType]
    const normalizedScores = normalizeScore(_scores, length, DEFAULT_SCORE[gameType])

    const average = normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length

    if (average < minUser.average) {
      minUser.user = userId
      minUser.average = average
    }
  })

  return minUser
}

export const getLeaderboard = (
  wordles: WordleRecord[],
  connections: ConnectionsRecord[],
  strands: StrandsRecord[]
): LeaderboardRecord => {
  const players = new Map<
    string,
    {
      wordles: number[]
      connections: number[]
      strands: number[]
    }
  >()

  wordles.forEach((game) => {
    game.wordles.forEach((wordle) => {
      const { user } = wordle
      if (!players.has(user.id)) players.set(user.id, { wordles: [], connections: [], strands: [] })
      players.get(user.id)!.wordles.push(+wordle.score)
    })
  })

  connections.forEach((game) => {
    game.connections.forEach((connection) => {
      const { user } = connection
      if (!players.has(user.id)) players.set(user.id, { wordles: [], connections: [], strands: [] })
      players.get(user.id)!.connections.push(+connection.score.incorrect)
    })
  })

  strands.forEach((game) => {
    game.strands.forEach((strand) => {
      const { user } = strand
      if (!players.has(user.id)) players.set(user.id, { wordles: [], connections: [], strands: [] })
      players.get(user.id)!.strands.push(+strand.hints)
    })
  })

  console.log(players)

  return {
    wordles: getMinAverage(players, 'wordles', wordles.length),
    connections: getMinAverage(players, 'connections', connections.length),
    strands: getMinAverage(players, 'strands', strands.length),
  }
}

export const writeLeaderboard = (leaderboardRecord: LeaderboardRecord): string => {
  const leaderboard = '### Leaderboard:'

  const wordle = `🟩 Wordle (last ${leaderboardRecord.wordles.games} games)\n<@${leaderboardRecord.wordles.user}> has the best score, with an average of ${+leaderboardRecord.wordles.average.toFixed(2)}/6.`
  const connections = `🟪 Connections (last ${leaderboardRecord.connections.games} games)\n<@${leaderboardRecord.connections.user}> makes the fewest mistakes, averaging ${+leaderboardRecord.connections.average.toFixed(2)} per game.`
  const strands = `💡 Strands (last ${leaderboardRecord.strands.games} games)\n<@${leaderboardRecord.strands.user}> uses the fewest hints, with an average of ${+leaderboardRecord.strands.average.toFixed(2)} per game.`

  return `${leaderboard}\n\n${wordle}\n\n${connections}\n\n${strands}`
}
