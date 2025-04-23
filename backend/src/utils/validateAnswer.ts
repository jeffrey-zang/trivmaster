import { type Answer } from "@/types.ts";

type AnswerData = {
  answers: Answer[];
};

function damerauLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;

  const lenA = a.length;
  const lenB = b.length;

  const matrix: number[][] = Array(lenA + 1)
    .fill(null)
    .map(() => Array(lenB + 1).fill(0));

  for (let i = 0; i <= lenA; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= lenB; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + cost);
      }
    }
  }

  return matrix[lenA][lenB];
}

function areSimilar(str1: string, str2: string, maxDistance?: number): boolean {
  const normalizedStr1 = str1.trim().toLowerCase().replace(/\s+/g, " ");
  const normalizedStr2 = str2.trim().toLowerCase().replace(/\s+/g, " ");

  if (normalizedStr1 === normalizedStr2) return true;

  const isNum1 = !isNaN(Number(normalizedStr1));
  const isNum2 = !isNaN(Number(normalizedStr2));

  if (isNum1 && isNum2) {
    return Number(normalizedStr1) === Number(normalizedStr2);
  }

  const distance = damerauLevenshteinDistance(normalizedStr1, normalizedStr2);

  if (maxDistance === undefined) {
    const longerLength = Math.max(normalizedStr1.length, normalizedStr2.length);

    maxDistance = Math.max(1, Math.floor(longerLength * 0.2));
  }

  return distance <= maxDistance;
}

function checkRequiredTerms(
  userAnswer: string,
  correctAnswer: Answer,
  maxDistance?: number
): boolean {
  const normalizedUserAnswer = userAnswer.trim().toLowerCase();

  return correctAnswer.required.every((requiredTerm) => {
    const normalizedRequiredTerm = requiredTerm.trim().toLowerCase();

    if (normalizedRequiredTerm.length > 3) {
      const userWords = normalizedUserAnswer.split(/\s+/);

      for (let i = 0; i < userWords.length; i++) {
        for (
          let wordCount = 1;
          wordCount <= 3 && i + wordCount <= userWords.length;
          wordCount++
        ) {
          const userPhrase = userWords.slice(i, i + wordCount).join(" ");
          if (areSimilar(userPhrase, normalizedRequiredTerm, maxDistance)) {
            return true;
          }
        }
      }

      return areSimilar(
        normalizedUserAnswer,
        normalizedRequiredTerm,
        maxDistance
      );
    } else {
      return normalizedUserAnswer.includes(normalizedRequiredTerm);
    }
  });
}

function isCorrectAnswer(
  userAnswer: string,
  possibleAnswers: Answer[]
): boolean {
  if (!userAnswer || !possibleAnswers || !possibleAnswers.length) {
    return false;
  }

  const normalizedUserAnswer = userAnswer.trim().toLowerCase();

  for (const answer of possibleAnswers) {
    const normalizedFullAnswer = answer.text.trim().toLowerCase();

    if (
      areSimilar(
        normalizedUserAnswer,
        normalizedFullAnswer,
        Math.max(1, Math.floor(normalizedFullAnswer.length * 0.2))
      )
    ) {
      return true;
    }
  }

  return possibleAnswers.some((answer) =>
    checkRequiredTerms(
      normalizedUserAnswer,
      answer,
      answer.required.length === 1 ? 1 : 2
    )
  );
}

function validateAnswer(userAnswer: string, answerData: AnswerData): boolean {
  return isCorrectAnswer(userAnswer, answerData.answers);
}

const testAnswers: AnswerData = {
  answers: [
    {
      text: "Christianity",
      required: ["Christianity"],
      optional: [],
    },
    {
      text: "Catholicism",
      required: ["Catholicism"],
      optional: [],
    },
  ],
};

console.log(validateAnswer("Christanity", testAnswers));
console.log(validateAnswer("catholisism", testAnswers));
console.log(validateAnswer("Buddhist", testAnswers));

export {
  validateAnswer,
  isCorrectAnswer,
  damerauLevenshteinDistance,
  areSimilar,
  checkRequiredTerms,
  AnswerData,
  Answer,
};
