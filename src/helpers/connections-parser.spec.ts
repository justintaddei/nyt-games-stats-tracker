import { Client } from "discord.js";
import { isConnections, isConnectionsRecord, extractConnectionsId, computeConnectionsScore, parseConnections, parseConnectionsRecord } from "./connections-parser";

describe("Connections Parser", () => {
    describe("isConnections", () => {
        it("should return true for valid Connections puzzle text", () => {
            const text = "Connections\nPuzzle #123";
            const result = isConnections(text);
            expect(result).toBe(true);
        });

        it("should return false for invalid Connections puzzle text", () => {
            const text = "Invalid puzzle text";
            const result = isConnections(text);
            expect(result).toBe(false);
        });
    });

    describe("isConnectionsRecord", () => {
        it("should return true for valid Connections record text", () => {
            const text = "Connections results for Puzzle #123:";
            const result = isConnectionsRecord(text);
            expect(result).toBe(true);
        });

        it("should return false for invalid Connections record text", () => {
            const text = "Invalid record text";
            const result = isConnectionsRecord(text);
            expect(result).toBe(false);
        });
    });

    describe("extractConnectionsId", () => {
        it("should extract the Connections puzzle ID from the text", () => {
            const text = "Connections results for Puzzle #123:";
            const result = extractConnectionsId(text);
            expect(result).toBe("123");
        });

        it("should throw an error for invalid Connections string", () => {
            const text = "Invalid connections string";
            expect(() => extractConnectionsId(text)).toThrowError("Invalid connections string");
        });
    });

    describe("computeConnectionsScore", () => {
        it("should compute the correct and incorrect scores for the Connections puzzle", () => {
            const lines = [
                "🟨🟨🟨🟨",
                "🟩🟩🟩🟩",
                "🟪🟪🟪🟪",
                "🟦🟦🟦🟦",
            ];
            const result = computeConnectionsScore(lines);
            expect(result.correct).toBe(4);
            expect(result.incorrect).toBe(0);
        });
    });

    describe("parseConnections", () => {
        it("should parse the Connections message and return the user connections", () => {
            const message = {
                content: "Connections\nPuzzle #123\n\n🟨🟨🟨🟨\n🟩🟩🟩🟩\n🟪🟪🟪🟪\n🟦🟦🟦🟦",
                author: {
                    username: "JohnDoe",
                    id: "123456789",
                },
            };
            const result = parseConnections(message);
            expect(result.user.name).toBe("JohnDoe");
            expect(result.user.id).toBe("123456789");
            expect(result.puzzleId).toBe("123");
            expect(result.score.correct).toBe(4);
            expect(result.score.incorrect).toBe(0);
            expect(result.won).toBe(true);
            expect(result.connections).toBe("🟨🟨🟨🟨\n🟩🟩🟩🟩\n🟪🟪🟪🟪\n🟦🟦🟦🟦");
        });
    });

    describe("parseConnectionsRecord", () => {
        it("should parse the Connections record message and return the connections record", () => {
            const message = {
                content: "Connections results for Puzzle #200:\n\n1. (4-2) <@123> won with 2 mistakes.\n2. (1-4) <@456> lost after finding 1 group.\n3. (2-4) <@789> lost after finding 2 groups.\n4. (4-1) <@101112> won with 1 mistake.\n\nAttempts:\n```\n@user123\n🟩🟩🟩🟩\n🟨🟩🟨🟨\n🟨🟨🟨🟨\n🟦🟦🟦🟦\n🟦🟦🟪🟦\n🟪🟪🟪🟪\n\n@user456\n🟩🟩🟩🟩\n🟨🟦🟨🟨\n🟦🟦🟪🟦\n🟦🟦🟪🟦\n🟨🟦🟨🟨\n\n@user789\n🟩🟩🟩🟩\n🟨🟦🟨🟨\n🟦🟦🟪🟦\n🟦🟦🟪🟦\n🟦🟦🟦🟦\n🟨🟪🟨🟨\n\n@user101112\n🟩🟩🟩🟩\n🟨🟦🟨🟨\n🟪🟪🟪\n🟨🟨🟨🟨\n🟦🟦🟦🟦\n```",
                author: {
                    username: "Admin",
                    id: "987654321",
                },
            };
            const client = {
                users: {
                    cache: {
                        get: (userId: string) => ({
                            username: `user${userId}`,
                        }),
                    },
                },
            };
            const result = parseConnectionsRecord(message, client as Client);
            expect(result.puzzleId).toBe("200");
            expect(result.connections.length).toBe(4);
            expect(result.connections[0]?.user.name).toBe("user123");
            expect(result.connections[0]?.user.id).toBe("123");
            expect(result.connections[0]?.puzzleId).toBe("200");
            expect(result.connections[0]?.won).toBe(true);
            expect(result.connections[0]?.score.correct).toBe(4);
            expect(result.connections[0]?.score.incorrect).toBe(2);
            expect(result.connections[0]?.connections).toBe("🟩🟩🟩🟩\n🟨🟩🟨🟨\n🟨🟨🟨🟨\n🟦🟦🟦🟦\n🟦🟦🟪🟦\n🟪🟪🟪🟪");
        });
    });
});
