import { questions } from "./questions.js";

let selectedQuestions = [];
let currentQuestionIndex = 0;
let totalQuestions = 50;
let correctAnswers = 0;
let startTime;
let timerInterval;
let saveCounter = 0;
let isFlipped = false;

document.querySelector(".flip-btn").addEventListener("click", function () {
  const startScreen = document.querySelector(".start-screen");
  const title = document.querySelector(".title");
  const welcomeMessage = document.querySelector(".welcome-message");
  const options = document.querySelector(".options");
  const subjectsContainer = document.querySelector(".subjects");

  if (isFlipped) {
    title.classList.remove("hidden");
    welcomeMessage.classList.remove("hidden");
    options.classList.remove("hidden");
    subjectsContainer.classList.add("hidden");
    startScreen.style.backgroundColor = "white";
  } else {
    title.classList.add("hidden");
    welcomeMessage.classList.add("hidden");
    options.classList.add("hidden");
    subjectsContainer.classList.remove("hidden");
    startScreen.style.backgroundColor = "lightgrey";
  }

  isFlipped = !isFlipped;
  this.classList.toggle("flipped");
});

document.addEventListener("DOMContentLoaded", function () {
  const subjectsContainer = document.querySelector(".subjects");

  const savedSubjects =
    JSON.parse(localStorage.getItem("selectedSubjects")) || [];

  if (subjectsContainer.children.length === 0) {
    const subjects = Object.keys(questions);
    subjectsContainer.innerHTML = "<h1>Choose your subjects:</h1>";
    const allLabel = document.createElement("label");
    allLabel.innerHTML = `<input type="checkbox" class="subject-checkbox" id="select-all"> ALL SUBJECTS`;
    subjectsContainer.appendChild(allLabel);

    subjects.forEach((subject) => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" class="subject-checkbox" value="${subject}"> ${subject}`;
      subjectsContainer.appendChild(label);
    });

    const selectAllCheckbox = document.querySelector("#select-all");
    const checkboxes = document.querySelectorAll(
      ".subject-checkbox:not(#select-all)"
    );

    selectAllCheckbox.addEventListener("change", function () {
      checkboxes.forEach((checkbox) => {
        checkbox.checked = selectAllCheckbox.checked;
      });
      updateSelectedSubjects();
    });

    checkboxes.forEach((checkbox) => {
      checkbox.checked = savedSubjects.includes(checkbox.value);

      checkbox.addEventListener("change", function () {
        const allChecked = Array.from(checkboxes).every(
          (checkbox) => checkbox.checked
        );
        selectAllCheckbox.checked = allChecked;

        updateSelectedSubjects();
      });
    });

    const allChecked = savedSubjects.length === subjects.length;
    selectAllCheckbox.checked = allChecked;

    function updateSelectedSubjects() {
      const selectedSubjects = Array.from(checkboxes)
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.value);
      localStorage.setItem(
        "selectedSubjects",
        JSON.stringify(selectedSubjects)
      );
    }
  }
});

document.querySelectorAll(".num-questions").forEach((button) => {
  button.addEventListener("click", function () {
    totalQuestions = parseInt(this.dataset.value);

    const selectedSubjects =
      JSON.parse(localStorage.getItem("selectedSubjects")) || [];

    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject!");
      return;
    }

    loadQuestions(selectedSubjects);
    document.querySelector(".start-screen").classList.add("hidden");
    document.querySelector(".quiz").classList.remove("hidden");
  });
});

document.querySelector(".restart-btn").addEventListener("click", function () {
  localStorage.removeItem("quizProgress");

  correctAnswers = 0;
  currentQuestionIndex = 0;
  selectedQuestions = [];

  document.getElementById("progress-bar").value = 0;

  clearInterval(timerInterval);

  document.querySelector(".result-screen").classList.add("hidden");
  document.querySelector(".start-screen").classList.remove("hidden");
});

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function loadQuestions(selectedSubjects) {
  selectedQuestions = [];
  let totalSelectedSubjects = selectedSubjects.length;
  let questionsPerSubject = Math.floor(totalQuestions / totalSelectedSubjects);
  let extraQuestions = totalQuestions % totalSelectedSubjects;

  let usedQuestions = new Set();

  selectedSubjects.forEach((subject, index) => {
    if (questions[subject]) {
      let subjectQuestionCount = questionsPerSubject;

      if (index < extraQuestions) {
        subjectQuestionCount++;
      }

      let shuffledQuestions = [...questions[subject]];
      shuffleArray(shuffledQuestions);

      let subjectQuestions = shuffledQuestions.slice(0, subjectQuestionCount);

      subjectQuestions.forEach((question) => {
        selectedQuestions.push({ ...question, subject: subject });
        usedQuestions.add(question);
      });
    } else {
      console.error(`No questions found for subject: ${subject}`);
    }
  });

  let remainingQuestionsNeeded = totalQuestions - selectedQuestions.length;

  if (remainingQuestionsNeeded > 0) {
    selectedSubjects.forEach((subject) => {
      if (questions[subject] && remainingQuestionsNeeded > 0) {
        let additionalQuestions = questions[subject].filter(
          (q) => !usedQuestions.has(q)
        );

        shuffleArray(additionalQuestions);

        additionalQuestions.slice(0, remainingQuestionsNeeded).forEach((q) => {
          selectedQuestions.push({ ...q, subject: subject });
          usedQuestions.add(q);
          remainingQuestionsNeeded--;
        });

        if (remainingQuestionsNeeded <= 0) return;
      }
    });
  }

  selectedQuestions = selectedQuestions.slice(0, totalQuestions);

  startQuiz();
}

function startQuiz() {
  const savedProgress = localStorage.getItem("quizProgress");

  if (savedProgress) {
    const savedData = JSON.parse(savedProgress);

    const confirmResume = confirm(
      "Would you like to resume your previous quiz?"
    );
    if (confirmResume) {
      restoreProgress();
      return;
    } else {
      localStorage.removeItem("quizProgress");
    }
  }

  if (!selectedQuestions || selectedQuestions.length === 0) {
    console.error("Error: No questions available!");
    return;
  }

  currentQuestionIndex = 0;
  correctAnswers = 0;

  startTime = Date.now();
  timerInterval = setInterval(updateClock, 1000);
  loadQuestion();

  const nextBtn = document.querySelector(".next-btn");
  nextBtn.removeEventListener("click", nextQuestion);
  nextBtn.addEventListener("click", nextQuestion);
}

function loadQuestion() {
  const questionElement = document.getElementById("question");
  const subjectElement = document.getElementById("subject");
  const answerButtons = document.getElementById("answer-buttons");

  const currentQuestion = selectedQuestions[currentQuestionIndex];
  const currentQuestionText = document.getElementById("current-question");

  currentQuestionText.innerText = `${currentQuestionIndex + 1} of ${
    selectedQuestions.length
  }`;

  const progressBar = document.getElementById("progress-bar");
  const progressValue =
    ((currentQuestionIndex + 1) / selectedQuestions.length) * 100;
  progressBar.value = progressValue;

  subjectElement.innerText = currentQuestion.subject;
  questionElement.innerText = currentQuestion.question;

  answerButtons.innerHTML = "";

  currentQuestion.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.classList.add("btn");
    button.innerText = answer;

    if (currentQuestion.answered) {
      button.disabled = true;

      if (currentQuestion.selectedAnswer === answer) {
        button.classList.add(
          currentQuestion.selectedAnswer === currentQuestion.correct
            ? "correct"
            : "incorrect"
        );
      }

      if (
        answer === currentQuestion.correct &&
        currentQuestion.selectedAnswer !== currentQuestion.correct
      ) {
        button.classList.add("correct");
      }
    }

    button.addEventListener("click", function () {
      selectAnswer(button, answer);
    });

    answerButtons.appendChild(button);
  });

  document.querySelector(".next-btn").disabled =
    !currentQuestion.selectedAnswer;
}

function saveProgress() {
  const currentTime = Date.now();
  const elapsedTime = currentTime - startTime;

  const progressData = {
    selectedQuestions,
    currentQuestionIndex,
    correctAnswers,
    pauseTime: currentTime,
    elapsedTime,
    answeredQuestions: selectedQuestions.map((question, index) => {
      return {
        answered: question.answered || false,
        userAnswer: question.userAnswer || null,
      };
    }),
  };

  localStorage.setItem("quizProgress", JSON.stringify(progressData));
}

function restoreProgress() {
  const savedProgress = JSON.parse(localStorage.getItem("quizProgress"));

  if (savedProgress) {
    selectedQuestions = savedProgress.selectedQuestions;
    currentQuestionIndex = savedProgress.currentQuestionIndex;
    correctAnswers = savedProgress.correctAnswers;

    if (currentQuestionIndex >= selectedQuestions.length) {
      currentQuestionIndex = selectedQuestions.length - 1;
    }

    savedProgress.answeredQuestions.forEach((answeredQuestion, index) => {
      if (answeredQuestion.answered) {
        selectedQuestions[index].answered = true;
        selectedQuestions[index].userAnswer = answeredQuestion.userAnswer;
      }
    });

    startTime = Date.now() - savedProgress.elapsedTime;
    loadQuestion();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateClock, 1000);

    const nextBtn = document.querySelector(".next-btn");
    nextBtn.removeEventListener("click", nextQuestion);
    nextBtn.addEventListener("click", nextQuestion);
  }
}

function selectAnswer(button, answer) {
  const currentQuestion = selectedQuestions[currentQuestionIndex];
  const answerButtons = document.querySelectorAll(".btn");

  answerButtons.forEach((btn) => {
    btn.disabled = true;
  });

  currentQuestion.selectedAnswer = answer;
  currentQuestion.answered = true;

  if (answer === currentQuestion.correct) {
    button.classList.add("correct");
    correctAnswers++;
  } else {
    button.classList.add("incorrect");
    answerButtons.forEach((btn) => {
      if (btn.innerText === currentQuestion.correct) {
        btn.classList.add("correct");
      }
    });
  }

  document.querySelector(".next-btn").disabled = false;

  saveProgress();
}

function nextQuestion() {
  currentQuestionIndex++;
  saveProgress();

  if (currentQuestionIndex < selectedQuestions.length) {
    loadQuestion();
  } else {
    showResults();
    clearInterval(timerInterval);
  }
}

function updateClock() {
  if (!startTime) return;

  saveCounter++;
  if (saveCounter % 5 === 0) {
    saveProgress();
  }

  const elapsedTime = Date.now() - startTime;
  const seconds = Math.floor(elapsedTime / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  document.getElementById("clock").textContent = `${minutes}:${
    remainingSeconds < 10 ? "0" : ""
  }${remainingSeconds}`;
}

function showResults() {
  clearInterval(timerInterval);

  localStorage.removeItem("quizProgress");

  const elapsedTime = Date.now() - startTime;
  const seconds = Math.floor(elapsedTime / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedTime = `${minutes}:${
    remainingSeconds < 10 ? "0" : ""
  }${remainingSeconds}`;
  const totalAnswered = selectedQuestions.length;
  const percentageCorrect = Math.round((correctAnswers / totalAnswered) * 100);
  document.querySelector(".quiz").classList.add("hidden");
  document.querySelector(".result-screen").classList.remove("hidden");
  document.getElementById(
    "percentage-correct"
  ).innerText = `${percentageCorrect}%`;
  document.getElementById("score").innerText = correctAnswers;
  document.getElementById("total-questions").innerText =
    selectedQuestions.length;
  document.getElementById("time-taken").innerText = formattedTime;
}
