import type { Client } from 'discord.js'
import type { UserWordle, WordleRecord } from '../types'
import { checkForAlias } from './aliases'

type WordleMessage = {
  content: string
  author: {
    username: string
    id: string
  }
}

export const isWordle = (text = '') => /^Wordle \d+/.test(text)
export const isWordleRecord = (text = '') => /^Wordle results for \d+/.test(text)

export const extractWordleId = (text: string) => {
  const match = text.replaceAll(',', '').match(/Wordle(?: results for)? (\d+)/)
  if (!match?.[1]) throw new Error(`No wordle id found in ${text}`)
  return match[1]
}

export function extractWordleScore(scoreLine: string) {
  const match = scoreLine.match(/([1-6]|X)\/6/)
  if (!match?.[1]) throw new Error(`No wordle score found in "${scoreLine}"`)
  return match[1]
}

export function extractHardMode(scoreLine: string) {
  return scoreLine.includes('*')
}

export const parseWordle = (msg: WordleMessage): UserWordle => {
  const lines = msg.content
    .split('\n')
    .filter(Boolean)
    .map((line) => line.trim())

  if (!isWordle(lines[0])) throw new Error('Invalid wordle puzzle')

  const scoreLine = lines[0]!
  const puzzleId = extractWordleId(scoreLine)
  const score = extractWordleScore(scoreLine)
  const hardMode = extractHardMode(scoreLine)
  const guesses = lines.slice(1).join('\n').replaceAll('⬛', '⬜')

  return {
    user: {
      name: msg.author.username,
      id: msg.author.id,
    },
    puzzleId,
    score,
    hardMode,
    guesses,
  }
}

export const parseWordleRecord = (msg: WordleMessage, client: Client): WordleRecord => {
  const lines = msg.content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (!isWordleRecord(lines[0])) throw new Error('Invalid wordle record')

  const puzzleId = extractWordleId(lines[0]!)

  const guessesStart = lines.indexOf('Guesses:')

  let currentUser = ''
  const mappedGuesses = lines.slice(guessesStart).reduce(
    (_guesses, line) => {
      if (line.startsWith('@')) {
        currentUser = checkForAlias(line.split(' ')[0]!.slice(1))
        _guesses.push({ username: currentUser, guesses: '' })
        return _guesses
      }

      if (/^[🟨🟩⬜]+/u.test(line)) {
        const puzzle = _guesses.find((guess) => guess.username === currentUser)!
        if (!puzzle) throw new Error(`No puzzle found for user ${currentUser}`)
        puzzle.guesses = `${puzzle.guesses}\n${line}`.trim()
      }

      return _guesses
    },
    [] as { username: string; guesses: string }[]
  )

  const wordles = lines.slice(1, guessesStart).map((line) => {
    const match = line.match(/^\d+\. (\d|X)\/6 by <@(\d+)>/)

    if (!match?.[1]) throw new Error(`No wordle score found in "${line}"`)
    if (!match?.[2]) throw new Error(`No user id found in "${line}"`)

    const score = match[1]
    const userId = match[2]
    const username = client.users.cache.get(userId)?.username
    const guesses = mappedGuesses.find((guess) => guess.username === username)?.guesses

    if (!username) throw new Error(`No username found for user id ${userId}`)
    if (!guesses) throw new Error(`No guesses found for user ${username}`)

    return {
      user: {
        name: username,
        id: userId,
      },
      puzzleId,
      score,
      hardMode: line.includes('hard mode'),
      guesses,
    }
  })

  return {
    puzzleId,
    wordles,
  }
}
