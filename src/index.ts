import type { Message, TextBasedChannel } from 'discord.js'
import { Client, IntentsBitField } from 'discord.js'
import {
  isConnections,
  isConnectionsRecord,
  parseConnections,
  parseConnectionsRecord,
} from './helpers/connections-parser'
import { writeConnectionsRecord } from './helpers/connections-writer'
import { getLeaderboard, writeLeaderboard } from './helpers/leaderboard'
import { isStrands, isStrandsRecord, parseStrands, parseStrandsRecord } from './helpers/strands-parser'
import { writeStrandsRecord } from './helpers/strands-writer'
import { isWordle, isWordleRecord, parseWordle, parseWordleRecord } from './helpers/wordle-parser'
import { writeWordleRecord } from './helpers/wordle-writer'
import type { ConnectionsRecord, LeaderboardRecord, StrandsRecord, User, WordleRecord } from './types'
import { addAlias } from './helpers/aliases'
require('dotenv').config()

const CHANNEL_ID = process.env.CHANNEL_ID!

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
})
client.login(process.env.TOKEN)

const isReady = new Promise<void>((r) => client.on('clientReady', () => r()))

const uniqueGames = (game: { user: User }, i: number, games: { user: User }[]) =>
  games.findIndex((g) => g.user.id === game.user.id) === i
const puzzleNumber = ([a]: [string, unknown], [b]: [string, unknown]) => Number.parseInt(a) - Number.parseInt(b)

function getChannel() {
  return new Promise<TextBasedChannel>((resolve) => {
    client.channels.fetch(CHANNEL_ID).then((channel) => {
      if (!channel?.isTextBased()) throw new Error('Channel is not text based')

      resolve(channel)
    })
  })
}

function forEachMessage(channel: TextBasedChannel, fn: (message: Message) => void) {
  return new Promise<void>((resolve, reject) => {
    channel.messages.fetch().then(async (messages) => {
      try {
        messages.reverse().forEach(fn)
      } catch (error) {
        reject(error)
      }
      resolve()
    })
  })
}

const isResume = (message: Message) => message.content.startsWith('!resume')
const isDebugOn = (message: Message) => message.content.startsWith('!debug-on')
const isDebugOff = (message: Message) => message.content.startsWith('!debug-off')

const isAlias = (message: Message) => message.content.startsWith('!alias') && message.content.split(' ').length === 3


let debugMode = false
let halt = false

async function processMessages() {
  const wordleRecords = new Map<string, WordleRecord>()
  const connectionsRecords = new Map<string, ConnectionsRecord>()
  const strandsRecords = new Map<string, StrandsRecord>()
  const existingWordleMessages = new Map<string, Message>()
  const existingConnectionsMessages = new Map<string, Message>()
  const existingStrandsMessages = new Map<string, Message>()
  const deletionQueue = new Set<Message>()

  const channel = await getChannel()

  const startReadTime = Date.now()
  let reads = 0
  let resume = false;

  await forEachMessage(channel, (message) => {
    reads++

    if (isResume(message)) {
      resume = true
      deletionQueue.add(message)
    }

    if (halt) {
      return
    }

    if (isDebugOn(message)) {
      debugMode = true
      deletionQueue.add(message)
      return
    }
    if (isDebugOff(message)) {
      debugMode = false
      deletionQueue.add(message)
      return
    }

    if (isAlias(message)) {
      const [, oldName, newName] = message.content.split(' ') as [string, string, string];

      addAlias(oldName, newName);

      deletionQueue.add(message)
      return
    }

    if (isWordleRecord(message.content)) {
      // Game records will always be the first messages in the thread
      const record = parseWordleRecord(message, client)

      wordleRecords.set(record.puzzleId, {
        puzzleId: record.puzzleId,
        wordles: record.wordles,
      })

      existingWordleMessages.set(record.puzzleId, message)

      return
    }

    if (isConnectionsRecord(message.content)) {
      const record = parseConnectionsRecord(message, client)

      connectionsRecords.set(record.puzzleId, {
        puzzleId: record.puzzleId,
        connections: record.connections,
      })

      existingConnectionsMessages.set(record.puzzleId, message)

      return
    }

    if (isStrandsRecord(message.content)) {
      const record = parseStrandsRecord(message, client)

      strandsRecords.set(record.puzzleId, {
        puzzleId: record.puzzleId,
        phrase: record.phrase,
        strands: record.strands,
      })

      existingStrandsMessages.set(record.puzzleId, message)

      return
    }

    if (isWordle(message.content)) {
      const wordle = parseWordle(message)
      const record = wordleRecords.get(wordle.puzzleId) ?? {
        puzzleId: wordle.puzzleId,
        wordles: [],
      }

      record.wordles = [wordle, ...record.wordles].filter(uniqueGames)
      record.modified = true

      wordleRecords.set(wordle.puzzleId, record)
      deletionQueue.add(message)

      return
    }

    if (isConnections(message.content)) {
      const connections = parseConnections(message)
      const record = connectionsRecords.get(connections.puzzleId) ?? {
        puzzleId: connections.puzzleId,
        connections: [],
      }

      record.connections = [connections, ...record.connections].filter(uniqueGames)
      record.modified = true

      connectionsRecords.set(connections.puzzleId, record)
      deletionQueue.add(message)

      return
    }

    if (isStrands(message.content)) {
      const strands = parseStrands(message)
      const record =
        strandsRecords.get(strands.puzzleId) ??
        ({
          puzzleId: strands.puzzleId,
          phrase: strands.phrase,
          strands: [],
        } satisfies StrandsRecord)

      record.strands = [strands, ...record.strands].filter(uniqueGames)
      record.modified = true

      strandsRecords.set(strands.puzzleId, record)
      deletionQueue.add(message)

      return
    }

    // Delete all other messages, including the leaderboard message
    deletionQueue.add(message)
  })

  if (halt) {
    if (resume) halt = false
    return
  }

  const readTimeElapsed = Date.now() - startReadTime
  let writes = 0
    ;[...wordleRecords.entries()].sort(puzzleNumber).forEach(([puzzleId, record]) => {
      const message = existingWordleMessages.get(puzzleId) ?? null
      const content = writeWordleRecord(record)

      if (!record.modified) return

      writes++

      if (message) {
        message.edit(content)
      } else {
        channel.isSendable() && channel.send(content)
      }
    })
    ;[...connectionsRecords.entries()].sort(puzzleNumber).forEach(([puzzleId, record]) => {
      const message = existingConnectionsMessages.get(puzzleId) ?? null
      const content = writeConnectionsRecord(record)

      if (!record.modified) return

      writes++

      if (message) {
        message.edit(content)
      } else {
        channel.isSendable() && channel.send(content)
      }
    })
    ;[...strandsRecords.entries()].sort(puzzleNumber).forEach(([puzzleId, record]) => {
      const message = existingStrandsMessages.get(puzzleId) ?? null
      const content = writeStrandsRecord(record)

      if (!record.modified) return

      writes++

      if (message) {
        message.edit(content)
      } else {
        channel.isSendable() && channel.send(content)
      }
    })

  if (debugMode) {
    channel.isSendable() && channel.send(`!reply-debug\n\nRead time: ${readTimeElapsed}ms\nReads: ${reads}\nWrites: ${writes}`)
  }

  const leaderboard: LeaderboardRecord = getLeaderboard(
    [...wordleRecords.values()],
    [...connectionsRecords.values()],
    [...strandsRecords.values()]
  )
  channel.isSendable() && channel.send(writeLeaderboard(leaderboard))

  deletionQueue.forEach((message) => {
    message.delete()
  })
}
; (async () => {
  await isReady

  try {
    await processMessages()
  } catch (error) {
    console.error('!halting because:', error)
    halt = true
    const channel = await getChannel()
    channel.isSendable() && channel.send(`!halting because: because: ${(error as Error).message}`)
  }

  client.on('messageCreate', async (message) => {
    if (message.channelId !== CHANNEL_ID) return
    if (message.author.bot) return

    try {
      await processMessages()

    } catch (error) {
      halt = true
      console.error('!halting because:', error)
      const channel = await getChannel()
      channel.isSendable() && channel.send(`!halting because: ${(error as Error).message}`)
    }
  })
})()
