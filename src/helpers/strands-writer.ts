import type { StrandsRecord, UserStrands } from '../types'

const sortStrands = (a: UserStrands, b: UserStrands) => a.hints - b.hints

export const writeStrandsRecord = (record: StrandsRecord): string => {
  const title = `Strands results for #${record.puzzleId}:\n${record.phrase}\n\n`

  const summary = record.strands
    .sort(sortStrands)
    .map((guess, i) => {
      const { user } = guess

      let result = ''

      if (guess.hints === 0) {
        result = 'used no hints'
      } else {
        result = `used ${guess.hints} hint${guess.hints === 1 ? '' : 's'}`
      }

      return `${i + 1}. <@${user.id}> ${result}.`
    })
    .join('\n')

  const score = record.strands
    .map((guess) => {
      return `@${guess.user.name}\n${guess.strands}`
    })
    .join('\n\n')

  return `${title}${summary}\n\nScores:\n\`\`\`\n${score}\n\`\`\`\n\n`
}
