import type { WordleRecord } from '../types'

/**
 * Writes a Wordle record to a string.
 * @param record The Wordle record to write.
 * @returns The string representation of the Wordle record.
 */
export const writeWordleRecord = (record: WordleRecord): string => {
  const title = `Wordle results for ${record.puzzleId}:\n\n`

  const wordles = [...record.wordles].sort((a, b) => {
    if (a.score === 'X') return 1
    if (b.score === 'X') return -1

    if (a.score > b.score) return 1
    if (a.score < b.score) return -1

    if (a.hardMode && !b.hardMode) return -1
    if (!a.hardMode && b.hardMode) return 1

    return 0
  })

  const scores = wordles
    .map((wordle, i) => {
      return `${i + 1}. ${wordle.score}/6 by <@${wordle.user.id}>${wordle.hardMode ? ' (hard mode)' : ''}`
    })
    .join('\n')

  const guesses = wordles
    .map((wordle) => {
      return `@${wordle.user.name}${wordle.hardMode ? ' (hard mode)' : ''}\n${wordle.guesses}`
    })
    .join('\n\n')

  return `${title}${scores}\n\nGuesses:\n\`\`\`\n${guesses}\n\`\`\`\n\n`
}
