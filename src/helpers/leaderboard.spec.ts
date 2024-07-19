import type { LeaderboardRecord } from '../types'
import { isLeaderboard, writeLeaderboard } from './leaderboard'
import { describe, expect, it } from 'vitest'

describe('isLeaderboard', () => {
  it('should return true for valid Leaderboard text', () => {
    const text = '### Leaderboard:'
    const result = isLeaderboard(text)
    expect(result).toBe(true)
  })

  it('should return false for invalid Leaderboard text', () => {
    const text = 'Invalid leaderboard text'
    const result = isLeaderboard(text)
    expect(result).toBe(false)
  })
})

describe('writeLeaderboard', () => {
  it('should correctly format a Leaderboard record', () => {
    const record: LeaderboardRecord = {
      wordles: {
        user: '1',
        average: 5,
      },
      connections: {
        user: '2',
        average: 4.3,
      },
      strands: {
        user: '3',
        average: 2.265,
      },
    }

    const result = writeLeaderboard(record)

    expect(result).toBe(
      '### Leaderboard:\n\n🟩 Wordle\n<@1> has the best score, with an average of 5/6.\n\n🟪 Connections\n<@2> makes the fewest mistakes, averaging 4.3 mistakes per game.\n\n💡 Strands\n<@3> uses the fewest hints, with an average of 2.27 per game.'
    )
  })
})
