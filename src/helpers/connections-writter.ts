import { ConnectionsRecord, UserConnections } from "../types";

const sortConnections = (a: UserConnections, b: UserConnections) => {
	if (a.won && !b.won) return -1
	if (!a.won && b.won) return 1

	if (a.score.correct > b.score.correct) return -1
	if (a.score.correct < b.score.correct) return 1

	if (a.score.incorrect < b.score.incorrect) return -1
	if (a.score.incorrect > b.score.incorrect) return 1

	return 0
}


export const writeConnectionsRecord = (record: ConnectionsRecord): string => {
	const title = `Connections results for Puzzle #${record.puzzleId}:\n\n`

	const summary = record.connections.sort(sortConnections).map((attempt, i) => {
		const { user, score, won } = attempt

		let result = ""

		if (won) {
			result = `won with ${score.incorrect} mistake${score.incorrect === 1 ? "" : "s"}`
		} else if (!score.correct) {
			result = `lost after finding no groups`
		} else {
			result = `lost after finding ${score.correct} group${score.correct === 1 ? "" : "s"}`
		}

		return `${i + 1}. (${score.correct}-${score.incorrect}) <@${user.id}> ${result}.`
	}).join("\n")

	const attempts = record.connections.map((attempt) => {
		return `@${attempt.user.name}\n${attempt.connections}`
	}).join("\n\n")

	return `${title}${summary}\n\nAttempts:\n\`\`\`\n${attempts}\n\`\`\`\n\n`
}
