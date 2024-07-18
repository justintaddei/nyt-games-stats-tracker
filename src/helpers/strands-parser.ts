import type { Client } from 'discord.js'
import type { StrandsRecord, UserStrands } from '../types'

type StrandsMessage = {
  // TODO: move this to types.ts and use for both wordle and strands
  content: string
  author: {
    username: string
    id: string
  }
}

export const isStrands = (text = ''): boolean => /^Strands\s+#\d+$/m.test(text)
export const isStrandsRecord = (text = ''): boolean => /^Strands results for #\d+:$/m.test(text)

export const extractStrandsId = (text: string): string => {
  const match = text.match(/Strands(?: results for)?\s+#(\d+)/)
  if (!match?.[1]) throw new Error('Invalid strands string')
  return match[1]
}

export const parseStrands = (msg: StrandsMessage): UserStrands => {
  const lines = msg.content
    .split('\n')
    .filter(Boolean)
    .map((line) => line.trim())

  return {
    user: {
      name: msg.author.username,
      id: msg.author.id,
    },
    puzzleId: extractStrandsId(lines[0]!),
    phrase: lines[1]!,
    hints: lines.slice(2).join().split('💡').length - 1,
    strands: lines.slice(2).join('\n'),
  }
}

export const parseStrandsRecord = (msg: StrandsMessage, client: Client): StrandsRecord => {
  const lines = msg.content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (!isStrandsRecord(lines[0])) throw new Error('Invalid strands record')

  const puzzleId = extractStrandsId(lines[0]!)
  const phrase = lines[1]!

  const scoreStart = lines.indexOf('Scores:')

  let currentUser = ''

  const mappedScores = lines.slice(scoreStart).reduce(
    (_scores, line) => {
      if (line.startsWith('@')) {
        currentUser = line.split(' ')[0]!.slice(1)
        _scores.push({ username: currentUser, strands: '' })
        return _scores
      }

      if (/^[🔵🟡💡]+/u.test(line)) {
        const puzzle = _scores.find((score) => score.username === currentUser)!
        puzzle.strands = `${puzzle.strands}\n${line}`.trim()
      }

      return _scores
    },
    [] as { username: string; strands: string }[]
  )

  const strands = lines.slice(2, scoreStart).map((line) => {
    const match = line.match(/<@(\d+)>/)
    if (!match?.[1]) throw new Error(`No user id found in ${line}`)
    const userId = match[1]

    const username = client.users.cache.get(userId)?.username
    if (!username) throw new Error(`No username found for user id ${userId}`)

    const score = mappedScores.find((score) => score.username === username)?.strands
    if (!score) throw new Error(`No score found for user ${username}`)

    const hints = score.split('💡').length - 1

    return {
      user: {
        name: username,
        id: userId,
      },
      puzzleId,
      hints,
      phrase,
      strands: score,
    }
  })

  return {
    puzzleId,
    phrase,
    strands,
  }
}
