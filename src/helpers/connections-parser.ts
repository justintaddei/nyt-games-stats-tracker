import type { Client } from 'discord.js'
import type { ConnectionsRecord, ConnectionsScore, UserConnections } from '../types'

type ConnectionsMessage = {
  // TODO: move this to types.ts and use for both wordle and connections
  content: string
  author: {
    username: string
    id: string
  }
}

export const isConnections = (text = ''): boolean => /^Connections\s+Puzzle\s+#\d+$/m.test(text)
export const isConnectionsRecord = (text = ''): boolean => /^Connections results for Puzzle #\d+:$/m.test(text)

export const extractConnectionsId = (text: string): string => {
  const match = text.match(/Connections(?: results for)?\s+Puzzle #(\d+)/)
  if (!match?.[1]) throw new Error('Invalid connections string')
  return match[1]
}

const splitEmoji = (str: string) => [...new Intl.Segmenter().segment(str)].map((x) => x.segment)

export const computeConnectionsScore = (lines: string[]): ConnectionsScore => {
  const puzzleSize = lines.length

  const isCorrect = (line: string) =>
    splitEmoji(line).every((char, _, l) => {
      return char === l[0]
    })

  const correct = lines.filter(isCorrect).length
  const incorrect = puzzleSize - correct

  return { correct, incorrect }
}

export const parseConnections = (msg: ConnectionsMessage): UserConnections => {
  const lines = msg.content
    .split('\n')
    .filter(Boolean)
    .map((line) => line.trim())

  const puzzleId = extractConnectionsId(lines.slice(0, 2).join('\n'))

  const tries = lines.slice(2)
  const score = computeConnectionsScore(tries)

  return {
    user: {
      name: msg.author.username,
      id: msg.author.id,
    },
    puzzleId,
    won: score.correct === 4,
    score,
    connections: tries.join('\n'),
  }
}

export const parseConnectionsRecord = (msg: ConnectionsMessage, client: Client): ConnectionsRecord => {
  const lines = msg.content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (!isConnectionsRecord(lines[0])) throw new Error('Invalid connections record')

  const puzzleId = extractConnectionsId(lines[0]!)

  const attemptsStart = lines.indexOf('Attempts:')

  let currentUser = ''

  const mappedAttempts = lines.slice(attemptsStart).reduce(
    (_attempts, line) => {
      if (line.startsWith('@')) {
        currentUser = line.split(' ')[0]!.slice(1)
        _attempts.push({ username: currentUser, connections: '' })
        return _attempts
      }

      if (/^[🟨🟩🟪🟦]+/u.test(line)) {
        const puzzle = _attempts.find((attempt) => attempt.username === currentUser)!
        puzzle.connections = `${puzzle.connections}\n${line}`.trim()
      }

      return _attempts
    },
    [] as { username: string; connections: string }[]
  )

  const connections = lines.slice(1, attemptsStart).map((line) => {
    const match = line.match(/<@(\d+)>/)
    if (!match?.[1]) throw new Error(`No user id found in ${line}`)
    const userId = match[1]

    const username = client.users.cache.get(userId)?.username
    if (!username) throw new Error(`No username found for user id ${userId}`)

    const attempts = mappedAttempts.find((attempt) => attempt.username === username)?.connections
    if (!attempts) throw new Error(`No attempts found for user ${username}`)

    const score = computeConnectionsScore(attempts.split('\n'))

    return {
      user: {
        name: username,
        id: userId,
      },
      puzzleId,
      won: score.correct === 4,
      score,
      connections: attempts,
    }
  })

  return {
    puzzleId,
    connections,
  }
}
