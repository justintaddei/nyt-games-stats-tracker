import { Client, Message } from "discord.js"
import { UserWordle, WordleRecord } from "../types"

export const isWordle = (text: string = '') => /^Wordle \d+/.test(text)
export const isWordleRecord = (text: string = '') => /^Wordle results for \d+/.test(text)

export const extractWordleId = (text: string) => {
    // Match either "Wordle 123" or "Wordle results for 123"
    const match = text.match(/Wordle(?: results for)? (\d+)/)
    if (!match?.[1]) throw new Error(`No wordle id found in ${text}`)
    return match[1]
}

function extractWordleScore(scoreLine: string) {
    const match = scoreLine.match(/^Wordle \d+ (\d|X)\//)
    if (!match?.[1]) throw new Error(`No wordle score found in "${scoreLine}"`)
    return match[1]
}

function extractHardMode(scoreLine: string) {
    return scoreLine.includes("*")
}

export const parseWordle = (msg: Message): UserWordle => {
    /* 
        `msg.content` is a string that looks like this:

        
        "Wordle 914 4/6*

        🟨⬜⬜⬜⬜
        🟨🟨⬜⬜⬜
        ⬜🟨🟩⬜🟨
        🟩🟩🟩🟩🟩"

        From that string, we want to return an object that looks like this:

        {
            puzzleId: 914,
            score: 4
            hardMode: true,
            guesses: `🟨⬜⬜⬜⬜
            🟨🟨⬜⬜⬜
            ⬜🟨🟩⬜🟨
            🟩🟩🟩🟩🟩`,
        }

        The rules for the first line are as follows:

        - The first word is always "Wordle"
        - The second word is the puzzle id
        - The third symbol has the follow pattern /[0-6X]\/[0-6]*?/
            - The first char is the score
            - If there is an asterisk, then it is hard mode

    */

    const lines = msg.content.split("\n").filter(Boolean).map((line) => line.trim())

    if (!isWordle(lines[0])) throw new Error("Invalid wordle puzzle")

    const scoreLine = lines[0]!
    const puzzleId = extractWordleId(scoreLine)
    const score = extractWordleScore(scoreLine)
    const hardMode = extractHardMode(scoreLine)
    const guesses = lines.slice(1).join("\n").replaceAll('⬛', '⬜')

    // msg.guild?.members.cache.get(msg.author.id)?.displayName || 
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

export const parseWordleRecord = (msg: Message, client: Client): WordleRecord => {
    /*
    `msg.content` is a string that looks like this:
        
    "Wordle results for 914:

    1. 5/6* by @user1 (hard mode)
    2. 4/6 by @user2

    Guesses:
    \`\`\`
    @user1 (hard mode)
    🟨⬜⬜⬜⬜
    🟨🟨⬜⬜⬜
    ⬜🟨🟩⬜🟨
    🟩🟩🟩🟩🟩

    @user2
    🟩🟨🟨⬜⬜
    ⬜⬜⬜⬜⬜
    🟩🟩⬜🟨⬜
    🟨🟨⬜⬜⬜
    🟩🟩🟩🟩🟩
    \`\`\`"
    */

    const lines = msg.content.split("\n").map((line) => line.trim()).filter(Boolean)

    if (!isWordleRecord(lines[0])) throw new Error("Invalid wordle record")

    const puzzleId = extractWordleId(lines[0]!)

    const guessesStart = lines.indexOf("Guesses:")

    let currentUser = ""
    const mappedGuesses = lines.slice(guessesStart).reduce((_guesses, line) => {
        if (line.startsWith("@")) {
            currentUser = line.split(" ")[0]!.slice(1)
            _guesses.push({ username: currentUser, guesses: "" })
            return _guesses
        } else if (/^[🟨🟩⬜]+/.test(line)) {
            const puzzle = _guesses.find(guess => guess.username === currentUser)!
            puzzle.guesses = `${puzzle.guesses}\n${line}`.trim()
        }

        return _guesses
    }, [] as { username: string, guesses: string }[])

    const wordles = lines.slice(1, guessesStart).map((line) => {
        // 1. 4/6 by <@470130474119856139> (hard mode)
        // 2. 5/6 by <@470130474119856139>
        const match = line.match(/^\d+\. (\d|X)\/6 by <@(\d+)>/)

        if (!match?.[1]) throw new Error(`No wordle score found in "${line}"`)
        if (!match?.[2]) throw new Error(`No user id found in "${line}"`)

        const score = match[1]
        const userId = match[2]
        const username = client.users.cache.get(userId)?.username
        const guesses = mappedGuesses.find(guess => guess.username === username)?.guesses

        if (!username) throw new Error(`No username found for user id ${userId}`)
        if (!guesses) throw new Error(`No guesses found for user ${username}`)

        return {
            user: {
                name: username,
                id: userId,
            },
            puzzleId,
            score,
            hardMode: line.includes("hard mode"),
            guesses
        }
    })

    return {
        puzzleId,
        wordles,
    }
}
