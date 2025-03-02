const fs = require("fs");
const csv = require("csv-parser");

const questions = {};

// Read the CSV file and process it
fs.createReadStream("questions.csv") // Path to your CSV file
  .pipe(csv({ separator: "," })) // Change separator to comma
  .on("data", (row) => {
    const { Subject, Number, Question, A, B, C, D, Correct } = row;

    // Create an object with question data
    const questionData = {
      number: parseInt(Number),
      question: Question,
      answers: [A, B, C, D],
      correct: getCorrectAnswer(Correct, [A, B, C, D]), // Get the correct answer based on the Correct column
    };

    // Ensure the subject exists in the questions object
    if (!questions[Subject]) {
      questions[Subject] = [];
    }

    // Push the question into the appropriate subject array
    questions[Subject].push(questionData);
  })
  .on("end", () => {
    // After reading the CSV, write the grouped questions to a JS file
    fs.writeFileSync(
      "questions.js",
      `export const questions = ${JSON.stringify(questions, null, 2)};`
    );
  });

// Helper function to return the correct answer based on the letter
function getCorrectAnswer(correctLetter, answers) {
  const answerMap = {
    A: answers[0],
    B: answers[1],
    C: answers[2],
    D: answers[3],
  };

  return answerMap[correctLetter] || ""; // If the correct letter is not valid, return an empty string
}
