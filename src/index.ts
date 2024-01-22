import { Client, IntentsBitField, Message, TextBasedChannel } from 'discord.js'
import {
  isConnections,
  isConnectionsRecord,
  parseConnections,
  parseConnectionsRecord,
} from './helpers/connections-parser'
import { writeConnectionsRecord } from './helpers/connections-writter'
import {
  isWordle,
  isWordleRecord,
  parseWordle,
  parseWordleRecord,
} from './helpers/wordle-parser'
import { writeWordleRecord } from './helpers/wordle-writter'
import { ConnectionsRecord, UserWordle, WordleRecord } from './types'
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

const isReady = new Promise<void>((r) => client.on('ready', () => r()))

const uniqueGames = (
  game: { user: UserWordle['user'] },
  i: number,
  games: { user: UserWordle['user'] }[]
) => games.findIndex((g) => g.user.id === game.user.id) === i
const puzzleNumber = ([a]: [string, unknown], [b]: [string, unknown]) =>
  parseInt(a) - parseInt(b)

function getChannel() {
  return new Promise<TextBasedChannel>((resolve) => {
    client.channels.fetch(CHANNEL_ID).then((channel) => {
      if (!channel?.isTextBased())
        throw new Error('Channel is not a text based')

      resolve(channel)
    })
  })
}

function forEachMessage(
  channel: TextBasedChannel,
  fn: (message: Message) => void
) {
  return new Promise<void>((resolve) => {
    channel.messages.fetch().then((messages) => {
      messages.reverse().forEach(fn)
      resolve()
    })
  })
}

const isDebugOn = (message: Message) => message.content.startsWith('!debug-on')
const isDebugOff = (message: Message) =>
  message.content.startsWith('!debug-off')

let debugMode = false

async function processMessages() {
  const wordleRecords = new Map<string, WordleRecord>()
  const connectionsRecords = new Map<string, ConnectionsRecord>()
  const existingWordleMessages = new Map<string, Message>()
  const existingConnectionsMessages = new Map<string, Message>()
  const deletionQueue = new Set<Message>()

  const channel = await getChannel()

  const startReadTime = Date.now()
  let reads = 0

  await forEachMessage(channel, (message) => {
    reads++

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

    if (isWordleRecord(message.content)) {
      // Game records will always be the first messages in the thread
      const record = parseWordleRecord(message, client)

      if (wordleRecords.has(record.puzzleId)) {
        wordleRecords.set(record.puzzleId, {
          puzzleId: record.puzzleId,
          modified: true,
          wordles: [
            ...record.wordles,
            ...wordleRecords.get(record.puzzleId)!.wordles,
          ],
        })
        deletionQueue.add(message)
      } else {
        wordleRecords.set(record.puzzleId, {
          puzzleId: record.puzzleId,
          wordles: record.wordles,
        })
      }

      existingWordleMessages.set(record.puzzleId, message)

      return
    }

    if (isConnectionsRecord(message.content)) {
      const record = parseConnectionsRecord(message, client)

      if (connectionsRecords.has(record.puzzleId)) {
        connectionsRecords.set(record.puzzleId, {
          puzzleId: record.puzzleId,
          modified: true,
          connections: [
            ...record.connections,
            ...connectionsRecords.get(record.puzzleId)!.connections,
          ],
        })
        deletionQueue.add(message)
      } else {
        connectionsRecords.set(record.puzzleId, {
          puzzleId: record.puzzleId,
          connections: record.connections,
        })
      }

      existingConnectionsMessages.set(record.puzzleId, message)

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

      record.connections = [connections, ...record.connections].filter(
        uniqueGames
      )
      record.modified = true

      connectionsRecords.set(connections.puzzleId, record)
      deletionQueue.add(message)

      return
    }

    deletionQueue.add(message)
  })

  const readTimeElapsed = Date.now() - startReadTime
  let writes = 0

  ;[...wordleRecords.entries()]
    .sort(puzzleNumber)
    .forEach(([puzzleId, record]) => {
      const message = existingWordleMessages.get(puzzleId) ?? null
      const content = writeWordleRecord(record)

      if (!record.modified) return

      writes++

      if (message) {
        message.edit(content)
      } else {
        channel.send(content)
      }
    })
  ;[...connectionsRecords.entries()]
    .sort(puzzleNumber)
    .forEach(([puzzleId, record]) => {
      const message = existingConnectionsMessages.get(puzzleId) ?? null
      const content = writeConnectionsRecord(record)

      if (!record.modified) return

      writes++

      if (message) {
        message.edit(content)
      } else {
        channel.send(content)
      }
    })

  if (debugMode) {
    channel.send(
      `!reply-debug\n\nRead time: ${readTimeElapsed}ms\nReads: ${reads}\nWrites: ${writes}`
    )
  }

  deletionQueue.forEach((message) => {
    message.delete()
  })
}

;(async () => {
  await isReady

  await processMessages()

  client.on('messageCreate', (message) => {
    if (message.channelId !== CHANNEL_ID) return
    if (message.author.bot) return

    processMessages()
  })
})()
