// FILEPATH: /c:/dev/discord/nyt-games-stats/src/helpers/wordle-writter.spec.ts
import { writeWordleRecord } from './wordle-writter'

describe('writeWordleRecord', () => {
  it('should correctly format a Wordle record', () => {
    const record = {
      puzzleId: '123',
      wordles: [
        {
          user: {
            name: 'user1',
            id: '1',
          },
          score: '5',
          puzzleId: '123',
          hardMode: true,
          guesses: 'guesses1',
        },
        {
          user: {
            name: 'user2',
            id: '2',
          },
          score: '4',
          puzzleId: '123',
          hardMode: false,
          guesses: 'guesses2',
        },
      ],
    }

    const result = writeWordleRecord(record)

    expect(result).toBe(
      'Wordle results for 123:\n\n1. 4/6 by <@2>\n2. 5/6 by <@1> (hard mode)\n\nGuesses:\n```\n@user2\nguesses2\n\n@user1 (hard mode)\nguesses1\n```\n\n'
    )
  })

  it('should correctly handle a Wordle record with a single wordle', () => {
    const record = {
      puzzleId: '123',
      wordles: [
        {
          user: {
            name: 'user1',
            id: '1',
          },
          score: '5',
          puzzleId: '123',
          hardMode: true,
          guesses: 'guesses1',
        },
      ],
    }

    const result = writeWordleRecord(record)

    expect(result).toBe(
      'Wordle results for 123:\n\n1. 5/6 by <@1> (hard mode)\n\nGuesses:\n```\n@user1 (hard mode)\nguesses1\n```\n\n'
    )
  })
})
