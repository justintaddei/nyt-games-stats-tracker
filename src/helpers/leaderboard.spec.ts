import { describe, expect, it } from 'vitest'
import type { LeaderboardRecord } from '../types'
import { getMinAverage, normalizeScore, writeLeaderboard } from './leaderboard'

describe('normalizeScore', () => {
  it('should return the original scores if they `length` scores', () => {
    const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = normalizeScore(scores, 10, 10)
    expect(result).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
  it('should pad the scores with the highest score if they are less than `length` scores', () => {
    const scores = [1, 2, 3, 4, 5]
    const result = normalizeScore(scores, 10, 5)
    expect(result).toEqual([1, 2, 3, 4, 5, 5, 5, 5, 5, 5])
  })
  it('should pad the scores with the default score if they are no scores', () => {
    const scores = []
    const result = normalizeScore(scores, 4, 5)
    expect(result).toEqual([5, 5, 5, 5])
  })
})

describe('getMinAverage', () => {
  it('should return the minimum average for a player', () => {
    const players = new Map<
      string,
      {
        wordles: number[]
        connections: number[]
        strands: number[]
      }
    >()

    players.set('1', { wordles: [1, 2, 3], connections: [4, 5, 6], strands: [7, 8, 9] })
    players.set('2', { wordles: [10, 11, 12], connections: [13, 14, 15], strands: [16, 17, 18] })

    const result = getMinAverage(players, 'wordles', 3)
    expect(result).toEqual({
      user: '1',
      average: 2,
      games: 3,
    })
  })
})

describe('writeLeaderboard', () => {
  it('should correctly format a Leaderboard record', () => {
    const record: LeaderboardRecord = {
      wordles: {
        user: '1',
        average: 3.5,
        games: 15,
      },
      connections: {
        user: '2',
        average: 4.3,
        games: 10,
      },
      strands: {
        user: '3',
        average: 2.265,
        games: 5,
      },
    }

    const result = writeLeaderboard(record)

    expect(result).toBe(
      '### Leaderboard:\n\n🟩 Wordle (last 15 games)\n<@1> has the best score, with an average of 3.5/6.\n\n🟪 Connections (last 10 games)\n<@2> makes the fewest mistakes, averaging 4.3 per game.\n\n💡 Strands (last 5 games)\n<@3> uses the fewest hints, with an average of 2.27 per game.'
    )
  })
})
