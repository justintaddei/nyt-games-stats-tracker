import type { Client } from 'discord.js'
import { describe, expect, it } from 'vitest'
import { extractStrandsId, isStrands, isStrandsRecord, parseStrands, parseStrandsRecord } from './strands-parser'

describe('Strands Parser', () => {
  describe('isStrands', () => {
    it('should return true for valid Strands puzzle text', () => {
      const text = 'Strands #123'
      const result = isStrands(text)
      expect(result).toBe(true)
    })

    it('should return false for invalid Strands puzzle text', () => {
      const text = 'Invalid puzzle text'
      const result = isStrands(text)
      expect(result).toBe(false)
    })
  })

  describe('isStrandsRecord', () => {
    it('should return true for valid Strands record text', () => {
      const text = 'Strands results for #123:'
      const result = isStrandsRecord(text)
      expect(result).toBe(true)
    })

    it('should return false for invalid Strands record text', () => {
      const text = 'Invalid record text'
      const result = isStrandsRecord(text)
      expect(result).toBe(false)
    })
  })

  describe('extractStrandsId', () => {
    it('should extract the Strands puzzle ID from the text', () => {
      const text = 'Strands results for #123:'
      const result = extractStrandsId(text)
      expect(result).toBe('123')
    })

    it('should throw an error for invalid Strands string', () => {
      const text = 'Invalid strands string'
      expect(() => extractStrandsId(text)).toThrowError('Invalid strands string')
    })
  })

  describe('parseStrands', () => {
    it('should parse the Strands message and return the user strands', () => {
      const message = {
        content: "Strands #123\n“Give it the ol' college try”\n🔵🔵🔵💡\n🔵💡🔵💡\n🔵🟡",
        author: {
          username: 'JohnDoe',
          id: '123456789',
        },
      }
      const result = parseStrands(message)
      expect(result.user.name).toBe('JohnDoe')
      expect(result.user.id).toBe('123456789')
      expect(result.puzzleId).toBe('123')
      expect(result.phrase).toBe("“Give it the ol' college try”")
      expect(result.hints).toBe(3)
      expect(result.strands).toBe('🔵🔵🔵💡\n🔵💡🔵💡\n🔵🟡')
    })
  })

  describe('parseStrandsRecord', () => {
    it('should parse the Strands record message and return the strands record', () => {
      const message = {
        content:
          "Strands results for #200:\n\n“Give it the ol' college try”\n\n1. <@123> used no hints.\n2. <@456> used 1 hint.\n3. <@789> used 2 hints.\n\nScores:\n```\n@user123\n🔵🔵🔵🟡\n🔵🔵🔵\n\n@user456\n💡🔵🔵🟡\n🔵🔵🔵🔵\n🔵\n\n@user789\n💡🔵💡🔵\n🟡🔵🔵🔵\n🔵\n```",
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
      const result = parseStrandsRecord(message, client as Client)
      expect(result.puzzleId).toBe('200')
      expect(result.phrase).toBe("“Give it the ol' college try”")
      expect(result.strands.length).toBe(3)

      // Strand 1
      expect(result.strands[0]?.user.name).toBe('user123')
      expect(result.strands[0]?.user.id).toBe('123')
      expect(result.strands[0]?.puzzleId).toBe('200')
      expect(result.strands[0]?.phrase).toBe("“Give it the ol' college try”")
      expect(result.strands[0]?.hints).toBe(0)
      expect(result.strands[0]?.strands).toBe('🔵🔵🔵🟡\n🔵🔵🔵')

      // Strand 2
      expect(result.strands[1]?.user.name).toBe('user456')
      expect(result.strands[1]?.user.id).toBe('456')
      expect(result.strands[1]?.puzzleId).toBe('200')
      expect(result.strands[1]?.phrase).toBe("“Give it the ol' college try”")
      expect(result.strands[1]?.hints).toBe(1)
      expect(result.strands[1]?.strands).toBe('💡🔵🔵🟡\n🔵🔵🔵🔵\n🔵')

      // Strand 3
      expect(result.strands[2]?.user.name).toBe('user789')
      expect(result.strands[2]?.user.id).toBe('789')
      expect(result.strands[2]?.puzzleId).toBe('200')
      expect(result.strands[1]?.phrase).toBe("“Give it the ol' college try”")
      expect(result.strands[2]?.hints).toBe(2)
      expect(result.strands[2]?.strands).toBe('💡🔵💡🔵\n🟡🔵🔵🔵\n🔵')
    })
  })
})
