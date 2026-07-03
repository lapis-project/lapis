import data from "@/assets/data/DWA_Pilot_Variablen.json";

const allQuestions = [...new Set(data.map((entry) => entry.Item))];

function getValuesForQuestion(question: string) {
	return data
		.filter((entry) => entry.Item === question)
		.flatMap((entry) => entry.Benennungsvariante.split(";"))
		.map((val) => val.trim());
}

function countAnswersForQuestion(question: string) {
	const allAnswers = getValuesForQuestion(question);
	const countAnswers = [...new Set(allAnswers)].map((answer) => {
		const filteredAnswers = allAnswers.filter((a) => a === answer);
		return {
			abs: filteredAnswers.length,
			rel: filteredAnswers.length / allAnswers.length,
			label: answer,
		};
	});
	return countAnswers;
}

export function useQuestions() {
	return { allQuestions, getValuesForQuestion, countAnswersForQuestion };
}
