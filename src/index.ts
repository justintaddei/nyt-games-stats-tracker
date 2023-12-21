import { Channel, Client, IntentsBitField, Message } from "discord.js"
import { isWordle, isWordleRecord, parseWordle, parseWordleRecord } from "./helpers/wordle-parser"
import { UserWordle, WordleRecord } from "./types"
import { writeWordleRecord } from "./helpers/wordle-writter"
require("dotenv").config()

const CHANNEL_ID = "1187251547512508496"

const unprocessedWordles = new Map<string, UserWordle[]>()

const recordedWordles = new Map<string, { message: Message, record: WordleRecord }>()

const recordWriteQueue = new Map<string, { message: Message | null, record: WordleRecord }>()


const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
})
client.login(process.env.TOKEN)

const isReady = new Promise<void>(r => client.on("ready", () => r()))

function markUnprocessedWordle(message: Message) {
  const wordle = parseWordle(message)

  const wordles = unprocessedWordles.get(wordle.puzzleId) ?? []
  wordles.push(wordle)

  unprocessedWordles.set(wordle.puzzleId, wordles)
}

function processWordleQueue(channel: Channel) {
  if (!channel.isTextBased()) throw new Error("Channel is not a text based")
  if (channel.id !== CHANNEL_ID) return

  unprocessedWordles.forEach((wordles, puzzleId) => {
    const games = recordedWordles.get(puzzleId) ?? { message: null, record: { puzzleId, wordles: [] } }
    games.record.wordles = [...wordles, ...games.record.wordles].filter((wordle, i, arr) => {
      return arr.findIndex((w) => w.user.id === wordle.user.id) === i
    })

    recordWriteQueue.set(puzzleId, games)
  })

  unprocessedWordles.clear()

  recordWriteQueue.forEach((game) => {
    const message = writeWordleRecord(game.record)

    if (game.message) {
      game.message.edit(message)
    } else {
      channel.send(message).then((msg) => {
        game.message = msg
        recordedWordles.set(game.record.puzzleId, game as any)
      })
    }

    recordWriteQueue.delete(game.record.puzzleId)
  })
}


client.on("messageCreate", (message) => {
  if (message.channelId !== CHANNEL_ID) return
  if (message.author.bot) return

  if (![isWordle].some(fn => fn(message.content))) {
    console.warn(`Deleting message from ${message.author.username} :>> `, message.content);
    message.delete()
    return;
  }

  if (isWordle(message.content)) {
    markUnprocessedWordle(message)
    processWordleQueue(message.channel)

    message.delete()
  }

})


  ; (async () => {
    await isReady

    client.channels.fetch(CHANNEL_ID).then((channel) => {
      if (!channel?.isTextBased()) throw new Error("Channel is not a text based")

      channel.messages.fetch().then((messages) => {
        messages.forEach((message) => {
          if (message.author.bot) {
            if (isWordleRecord(message.content)) {
              const record = parseWordleRecord(message, client)
              recordedWordles.set(record.puzzleId, { record, message })
            }
            return
          }

          if (![isWordle].some(fn => fn(message.content))) {
            console.warn(`Deleting message from ${message.author.username} :>> `, message.content);
            message.delete()
            return;
          }

          if (isWordle(message.content)) {
            markUnprocessedWordle(message)
            message.delete()
          }
        })
      }).then(() => processWordleQueue(channel))
    })
  })()


/* 

Wordle 914 4/6*

🟨⬜⬜⬜⬜
🟨🟨⬜⬜⬜
⬜🟨🟩⬜🟨
🟩🟩🟩🟩🟩

Wordle 914 5/6

🟩🟨🟨⬜⬜
⬜⬜⬜⬜⬜
🟩🟩⬜🟨⬜
🟨🟨⬜⬜⬜
🟩🟩🟩🟩🟩


Connections 
Puzzle #192
🟩🟩🟩🟩
🟨🟨🟨🟨
🟦🟦🟦🟦
🟪🟪🟪🟪

Connections 
Puzzle #192
🟨🟨🟨🟨
🟩🟩🟩🟩
🟪🟪🟦🟪
🟪🟦🟪🟪
🟦🟦🟦🟪
🟪🟦🟪🟦


*/
