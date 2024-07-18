import { describe, it, expect } from 'vitest'
import { writeConnectionsRecord } from './connections-writer'

describe('writeConnectionsRecord', () => {
  it('should correctly format a Connections record with a winner', () => {
    const record = {
      puzzleId: '123',
      connections: [
        {
          user: {
            name: 'user1',
            id: '1',
          },
          score: {
            correct: 5,
            incorrect: 2,
          },
          won: true,
          puzzleId: '123',
          connections: 'connections1',
        },
        {
          user: {
            name: 'user2',
            id: '2',
          },
          score: {
            correct: 4,
            incorrect: 3,
          },
          won: false,
          puzzleId: '123',
          connections: 'connections2',
        },
      ],
    }

    const result = writeConnectionsRecord(record)

    expect(result).toBe(
      'Connections results for Puzzle #123:\n\n1. (5-2) <@1> won with 2 mistakes.\n2. (4-3) <@2> lost after finding 4 groups.\n\nAttempts:\n```\n@user1\nconnections1\n\n@user2\nconnections2\n```\n\n'
    )
  })

  it('should correctly format a Connections record with no winner', () => {
    const record = {
      puzzleId: '123',
      connections: [
        {
          user: {
            name: 'user1',
            id: '1',
          },
          score: {
            correct: 0,
            incorrect: 0,
          },
          won: false,
          puzzleId: '123',
          connections: 'connections1',
        },
        {
          user: {
            name: 'user2',
            id: '2',
          },
          score: {
            correct: 0,
            incorrect: 0,
          },
          won: false,
          puzzleId: '123',
          connections: 'connections2',
        },
      ],
    }

    const result = writeConnectionsRecord(record)

    expect(result).toBe(
      'Connections results for Puzzle #123:\n\n1. (0-0) <@1> lost after finding no groups.\n2. (0-0) <@2> lost after finding no groups.\n\nAttempts:\n```\n@user1\nconnections1\n\n@user2\nconnections2\n```\n\n'
    )
  })
})
