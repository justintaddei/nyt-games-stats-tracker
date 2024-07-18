import { describe, expect, it } from 'vitest'
import type { StrandsRecord } from '../types'
import { writeStrandsRecord } from './strands-writer'

describe('writeConnectionsRecord', () => {
  it('should correctly format a Strands record', () => {
    const record: StrandsRecord = {
      puzzleId: '123',
      phrase: "“Give it the ol' college try”",
      strands: [
        {
          user: {
            name: 'user1',
            id: '1',
          },
          hints: 0,
          phrase: "“Give it the ol' college try”",
          puzzleId: '123',
          strands: 'strands1',
        },
        {
          user: {
            name: 'user2',
            id: '2',
          },
          hints: 1,
          phrase: "“Give it the ol' college try”",
          puzzleId: '123',
          strands: 'strands2',
        },
        {
          user: {
            name: 'user3',
            id: '3',
          },
          hints: 2,
          phrase: "“Give it the ol' college try”",
          puzzleId: '123',
          strands: 'strands3',
        },
      ],
    }

    const result = writeStrandsRecord(record)

    expect(result).toBe(
      `Strands results for #123:\n“Give it the ol' college try”\n\n1. <@1> used no hints.\n2. <@2> used 1 hint.\n3. <@3> used 2 hints.\n\nScores:\n\`\`\`\n@user1\nstrands1\n\n@user2\nstrands2\n\n@user3\nstrands3\n\`\`\`\n\n`
    )
  })
})
