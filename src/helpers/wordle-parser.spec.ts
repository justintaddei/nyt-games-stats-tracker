import { extractHardMode, extractWordleId, extractWordleScore, isWordle, isWordleRecord, parseWordle, parseWordleRecord } from './wordle-parser';

describe('isWordle', () => {
    it('should return true for valid Wordle strings', () => {
        expect(isWordle('Wordle 123')).toBe(true);
        expect(isWordle('Wordle 456')).toBe(true);
    });

    it('should return false for invalid Wordle strings', () => {
        expect(isWordle('Word 123')).toBe(false);
        expect(isWordle('Wordle123')).toBe(false);
        expect(isWordle('')).toBe(false);
    });
});

describe('isWordleRecord', () => {
    it('should return true for valid Wordle record strings', () => {
        expect(isWordleRecord('Wordle results for 123')).toBe(true);
        expect(isWordleRecord('Wordle results for 456')).toBe(true);
    });

    it('should return false for invalid Wordle record strings', () => {
        expect(isWordleRecord('Wordle results for')).toBe(false);
        expect(isWordleRecord('Wordle results for abc')).toBe(false);
        expect(isWordleRecord('Wordle 123')).toBe(false);
        expect(isWordleRecord('Wordle123')).toBe(false);
        expect(isWordleRecord('')).toBe(false);
    });
});

describe('extractWordleId', () => {
    it('should extract the Wordle ID from a valid Wordle string', () => {
        expect(extractWordleId('Wordle 123')).toBe('123');
        expect(extractWordleId('Wordle results for 456')).toBe('456');
    });

    it('should throw an error for invalid Wordle strings', () => {
        expect(() => extractWordleId('Word 123')).toThrow('No wordle id found in Word 123');
        expect(() => extractWordleId('Wordle123')).toThrow('No wordle id found in Wordle123');
    });

    it('should throw an error for empty strings', () => {
        expect(() => extractWordleId('')).toThrow('No wordle id found in ');
    });

    it('should throw an error for strings without a number', () => {
        expect(() => extractWordleId('Wordle results for')).toThrow('No wordle id found in Wordle results for');
    });
});

describe('extractWordleScore', () => {
    it('should extract the Wordle score from a valid score line', () => {
        expect(extractWordleScore('Wordle 123 5/6')).toBe('5');
        expect(extractWordleScore('Wordle 456 X/6')).toBe('X');
    });

    it('should throw an error for invalid score lines', () => {
        expect(() => extractWordleScore('Wordle 123')).toThrow('No wordle score found in "Wordle 123"');
        expect(() => extractWordleScore('Wordle 456 7/6')).toThrow('No wordle score found in "Wordle 456 7/6"');
        expect(() => extractWordleScore('Wordle123 5/6')).toThrow('No wordle score found in "Wordle123 5/6"');
    });

    it('should throw an error for empty strings', () => {
        expect(() => extractWordleScore('')).toThrow('No wordle score found in ""');
    });
});

describe('extractHardMode', () => {
    it('should return true when the score line includes an asterisk', () => {
        expect(extractHardMode('Wordle 123 5/6*')).toBe(true);
        expect(extractHardMode('Wordle 456 X/6*')).toBe(true);
    });

    it('should return false when the score line does not include an asterisk', () => {
        expect(extractHardMode('Wordle 123 5/6')).toBe(false);
        expect(extractHardMode('Wordle 456 X/6')).toBe(false);
    });

    it('should return false for empty strings', () => {
        expect(extractHardMode('')).toBe(false);
    });
});

describe('parseWordle', () => {
    it('should parse a valid Wordle message', () => {
        const msg = {
            content: 'Wordle 914 4/6*\n\n🟨⬜⬜⬜⬜\n🟨🟨⬜⬜⬜\n⬜🟨🟩⬜🟨\n🟩🟩🟩🟩🟩',
            author: {
                username: 'testUser',
                id: '123',
            },
        };

        const result = parseWordle(msg);

        expect(result).toEqual({
            user: {
                name: 'testUser',
                id: '123',
            },
            puzzleId: '914',
            score: '4',
            hardMode: true,
            guesses: '🟨⬜⬜⬜⬜\n🟨🟨⬜⬜⬜\n⬜🟨🟩⬜🟨\n🟩🟩🟩🟩🟩',
        });
    });

    it('should throw an error for an invalid Wordle message', () => {
        const msg = {
            content: 'Invalid message',
            author: {
                username: 'testUser',
                id: '123',
            },
        };

        expect(() => parseWordle(msg)).toThrow('Invalid wordle puzzle');
    });

    it('should replace all black squares with white squares in the guesses', () => {
        const msg = {
            content: 'Wordle 914 4/6*\n\n🟨⬛⬛⬛⬛\n🟨🟨⬛⬛⬛\n⬛🟨🟩⬛🟨\n🟩🟩🟩🟩🟩',
            author: {
                username: 'testUser',
                id: '123',
            },
        };

        const result = parseWordle(msg);

        expect(result.guesses).toBe('🟨⬜⬜⬜⬜\n🟨🟨⬜⬜⬜\n⬜🟨🟩⬜🟨\n🟩🟩🟩🟩🟩');
    });
});

describe('parseWordleRecord', () => {
    ;

    it('should parse a valid Wordle record message', () => {
        const msg = {
            content: 'Wordle results for 914:\n\n1. 5/6 by <@123> (hard mode)\n2. 4/6 by <@456>\n\nGuesses:\n\n@user123 (hard mode)\n🟨⬜⬜⬜⬜\n🟨🟨⬜⬜⬜\n⬜🟨🟩⬜🟨\n🟩🟩🟩🟩🟩\n\n@user456\n🟩🟨🟨⬜⬜\n⬜⬜⬜⬜⬜\n🟩🟩⬜🟨⬜\n🟨🟨⬜⬜⬜\n🟩🟩🟩🟩🟩',
            author: {
                username: 'testUser',
                id: '123',
            },
        };

        const client = {
            users: {
                cache: {
                    get: (id: string) => ({ username: `user${id}` }),
                },
            },
        };

        const result = parseWordleRecord(msg, client as any);

        expect(result).toEqual({
            puzzleId: '914',
            wordles: [
                {
                    user: {
                        name: 'user123',
                        id: '123',
                    },
                    puzzleId: '914',
                    score: '5',
                    hardMode: true,
                    guesses: '🟨⬜⬜⬜⬜\n🟨🟨⬜⬜⬜\n⬜🟨🟩⬜🟨\n🟩🟩🟩🟩🟩',
                },
                {
                    user: {
                        name: 'user456',
                        id: '456',
                    },
                    puzzleId: '914',
                    score: '4',
                    hardMode: false,
                    guesses: '🟩🟨🟨⬜⬜\n⬜⬜⬜⬜⬜\n🟩🟩⬜🟨⬜\n🟨🟨⬜⬜⬜\n🟩🟩🟩🟩🟩',
                },
            ],
        });
    });

    it('should throw an error for an invalid Wordle record message', () => {
        const msg = {
            content: 'Invalid message',
            author: {
                username: 'testUser',
                id: '123',
            },
        };

        const client = {
            users: {
                cache: {
                    get: (id: string) => ({ username: `user${id}` }),
                },
            },
        };

        expect(() => parseWordleRecord(msg, client as any)).toThrow('Invalid wordle record');
    });

    it('should throw an error when no wordle score is found', () => {
        const msg = {
            content: 'Wordle results for 914:\n\n1. by <@123> (hard mode)\n2. 4/6 by <@456>\n\nGuesses:\n\n@user123 (hard mode)\n🟨⬜⬜⬜⬜\n🟨🟨⬜⬜⬜\n⬜🟨🟩⬜🟨\n🟩🟩🟩🟩🟩\n\n@user456\n🟩🟨🟨⬜⬜\n⬜⬜⬜⬜⬜\n🟩🟩⬜🟨⬜\n🟨🟨⬜⬜⬜\n🟩🟩🟩🟩🟩',
            author: {
                username: 'testUser',
                id: '123',
            },
        };

        const client = {
            users: {
                cache: {
                    get: (id: string) => ({ username: `user${id}` }),
                },
            },
        };

        expect(() => parseWordleRecord(msg, client as any)).toThrow('No wordle score found in "1. by <@123> (hard mode)"');
    });

    it('should throw an error when no username is found for a user id', () => {
        const msg = {
            content: 'Wordle results for 914:\n\n1. 5/6 by <@789> (hard mode)\n2. 4/6 by <@456>\n\nGuesses:\n\n@user789 (hard mode)\n🟨⬜⬜⬜⬜\n🟨🟨⬜⬜⬜\n⬜🟨🟩⬜🟨\n🟩🟩🟩🟩🟩',
            author: {
                username: 'testUser',
                id: '123',
            },
        };

        const client = {
            users: {
                cache: {
                    get: (id: string) => id === '789' ? null : { username: `user${id}` },
                },
            },
        };

        expect(() => parseWordleRecord(msg, client as any)).toThrow('No username found for user id 789');
    });

    it('should throw an error when no guesses are found for a user', () => {
        const msg = {
            content: 'Wordle results for 914:\n\n1. 5/6 by <@123> (hard mode)\n2. 4/6 by <@456>\n\nGuesses:\n\n@user123 (hard mode)\n🟨⬜⬜⬜⬜\n🟨🟨⬜⬜⬜\n⬜🟨🟩⬜🟨\n🟩🟩🟩🟩🟩',
            author: {
                username: 'testUser',
                id: '123',
            },
        };

        const client = {
            users: {
                cache: {
                    get: (id: string) => ({ username: `user${id}` }),
                },
            },
        };

        expect(() => parseWordleRecord(msg, client as any)).toThrow('No guesses found for user user456');
    });
});
