import type { Client } from 'discord.js'
import { describe, expect, it } from 'vitest'
import { parseConnectionsRecord } from './connections-parser'
import { writeConnectionsRecord } from './connections-writer'
import { parseWordleRecord } from './wordle-parser'
import { writeWordleRecord } from './wordle-writer'
import { parseStrandsRecord } from './strands-parser'
import { writeStrandsRecord } from './strands-writer'

describe('continuity', () => {
  describe('connections', () => {
    it('writeConnectionsRecord should result in the same output after being parsed by parseConnectionsRecord', () => {
      const msg = {
        content:
          'Connections results for Puzzle #200:\n\n1. (4-1) <@101112> won with 1 mistake.\n2. (4-2) <@123> won with 2 mistakes.\n3. (2-4) <@789> lost after finding 2 groups.\n4. (1-4) <@456> lost after finding 1 group.\n\nAttempts:\n```\n@user101112\n🟩🟩🟩🟩\n🟨🟦🟨🟨\n🟪🟪🟪\n🟨🟨🟨🟨\n🟦🟦🟦🟦\n\n@user123\n🟩🟩🟩🟩\n🟨🟩🟨🟨\n🟨🟨🟨🟨\n🟦🟦🟦🟦\n🟦🟦🟪🟦\n🟪🟪🟪🟪\n\n@user789\n🟩🟩🟩🟩\n🟨🟦🟨🟨\n🟦🟦🟪🟦\n🟦🟦🟪🟦\n🟦🟦🟦🟦\n🟨🟪🟨🟨\n\n@user456\n🟩🟩🟩🟩\n🟨🟦🟨🟨\n🟦🟦🟪🟦\n🟦🟦🟪🟦\n🟨🟦🟨🟨\n```\n\n',
        author: {
          username: 'user1',
          id: '1',
        },
      }
      const client = {
        users: {
          cache: {
            get: (userId: string) => ({
              username: `user${userId}`,
            }),
          },
        },
      }

      const record = parseConnectionsRecord(msg, client as Client)

      const message = writeConnectionsRecord(record)
      expect(message).toEqual(msg.content)
    })
  })

  describe('wordle', () => {
    it('should result in the same output after being parsed by parseWordle', () => {
      const msg = {
        content:
          'Wordle results for 915:\n\n1. 4/6 by <@123> (hard mode)\n2. 4/6 by <@456>\n3. 4/6 by <@789>\n\nGuesses:\n```\n@user123 (hard mode)\n🟨⬜⬜⬜⬜\n⬜⬜🟨🟨⬜\n🟨⬜🟨🟨🟨\n🟩🟩🟩🟩🟩\n\n@user456\n⬜⬜🟩⬜🟨\n🟨⬜🟩🟨⬜\n🟨⬜🟩⬜⬜\n🟩🟩🟩🟩🟩\n\n@user789\n⬜🟨⬜⬜⬜\n⬜⬜🟩🟩⬜\n🟨⬜🟨⬜⬜\n🟩🟩🟩🟩🟩\n```\n\n',
        author: {
          username: 'user1',
          id: '1',
        },
      }

      const client = {
        users: {
          cache: {
            get: (userId: string) => ({
              username: `user${userId}`,
            }),
          },
        },
      }

      const record = parseWordleRecord(msg, client as Client)

      const message = writeWordleRecord(record)
      expect(message).toEqual(msg.content)
    })
  })

  describe('strands', () => {
    it('writeStrandsRecord should result in the same output after being parsed by parseStrandsRecord', () => {
      const msg = {
        content:
          "Strands results for #200:\n“Give it the ol' college try”\n\n1. <@123> used no hints.\n2. <@456> used 1 hint.\n3. <@789> used 2 hints.\n\nScores:\n```\n@user123\n🔵🔵🔵🟡\n🔵🔵🔵\n\n@user456\n💡🔵🔵🟡\n🔵🔵🔵🔵\n🔵\n\n@user789\n💡🔵💡🔵\n🟡🔵🔵🔵\n🔵\n```\n\n",
        author: {
          username: 'Admin',
          id: '987654321',
        },
      }

      const client = {
        users: {
          cache: {
            get: (userId: string) => ({
              username: `user${userId}`,
            }),
          },
        },
      }

      const record = parseStrandsRecord(msg, client as Client)

      const message = writeStrandsRecord(record)
      expect(message).toEqual(msg.content)
    })
  })
})
