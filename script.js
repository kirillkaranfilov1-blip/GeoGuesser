

gsap.registerPlugin(SplitText);

const gameContainer = document.querySelector("#gameContainer");
const startScreen = document.querySelector("#startScreen");
const resultScreen = document.querySelector("#resultScreen");

const startBtn = document.querySelector("#startBtn");
const restartBtn = document.querySelector("#restartBtn");
const nextBtn = document.querySelector("#nextBtn");

const locationImage = document.querySelector("#locationImage");
const questionElement = document.querySelector("#question");
const answersContainer = document.querySelector("#answers");

const roundElement = document.querySelector("#round");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#bestScore");

const timeElement = document.querySelector("#time");
const timerElement = document.querySelector("#timer");
const progressElement = document.querySelector("#progress");

const feedback = document.querySelector("#feedback");
const feedbackText = document.querySelector("#feedbackText");

const finalScore = document.querySelector("#finalScore");
const correctAnswersElement = document.querySelector("#correctAnswers");
const finalBestScore = document.querySelector("#finalBestScore");
const resultTitle = document.querySelector("#resultTitle");

const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

let gameQuestions = [];
let currentQuestion = 0;
let score = 0;
let correctAnswers = 0;
let timeLeft = 30;
let timerInterval = null;
let answered = false;
let questionSplit = null;
let animationContext = null;

let bestScore = Number(localStorage.getItem("geoBestScore")) || 0;

bestScoreElement.textContent = bestScore;

function shuffle(array) {
    return [...array].sort(() => Math.random() - 0.5);
}

function animateIn(elements, options = {}) {
    if (prefersReducedMotion) return;

    gsap.from(elements, {
        y: options.y ?? 22,
        opacity: 0,
        scale: options.scale ?? 1,
        duration: options.duration ?? 0.6,
        stagger: options.stagger ?? 0.08,
        ease: options.ease ?? "power3.out",
        clearProps: "opacity,transform"
    });
}

function animateQuestion() {
    if (questionSplit) {
        questionSplit.revert();
        questionSplit = null;
    }

    if (prefersReducedMotion) return;

    questionSplit = SplitText.create("#question", {
        type: "words",
        wordsClass: "split-word",
        mask: "words",
        onSplit(self) {
            return gsap.from(self.words, {
                yPercent: 110,
                opacity: 0,
                stagger: 0.055,
                duration: 0.6,
                ease: "power3.out"
            });
        }
    });
}

function animateLocation() {
    if (prefersReducedMotion) return;

    gsap.fromTo(
        locationImage,
        {
            opacity: 0,
            scale: 1.08
        },
        {
            opacity: 1,
            scale: 1,
            duration: 0.9,
            ease: "power2.out"
        }
    );
}

function animateGameStart() {
    if (prefersReducedMotion) return;

    gsap.from(".game-stats .stat-card", {
        y: 25,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: "power3.out"
    });

    gsap.from(gameContainer, {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out"
    });
}

function startGame() {
    clearInterval(timerInterval);

    gameQuestions = shuffle(questions).slice(0, 5);

    currentQuestion = 0;
    score = 0;
    correctAnswers = 0;

    scoreElement.textContent = score;

    startScreen.classList.remove("active");
    resultScreen.classList.remove("active");
    gameContainer.style.display = "block";

    animateGameStart();
    loadQuestion();
}

function loadQuestion() {
    clearInterval(timerInterval);

    answered = false;
    timeLeft = 30;

    const current = gameQuestions[currentQuestion];

    roundElement.innerHTML = `${currentQuestion + 1} <small>/ 5</small>`;
    timeElement.textContent = timeLeft;

    timerElement.classList.remove("warning");

    progressElement.style.width = `${(currentQuestion / 5) * 100}%`;

    locationImage.style.opacity = "0";
    locationImage.src = `images/${current.image}`;
    locationImage.alt = "Фотография локации";

    questionElement.textContent = current.question;

    answersContainer.innerHTML = "";

    feedback.className = "feedback";
    feedbackText.textContent = "";

    nextBtn.disabled = true;

    const options = shuffle(current.options);

    options.forEach((option, index) => {
        const button = document.createElement("button");

        button.className = "answer-btn";
        button.dataset.answer = option;

        button.innerHTML = `
            <span class="answer-letter">${String.fromCharCode(65 + index)}</span>
            <span class="answer-text">${option}</span>
            <span class="answer-icon"></span>
        `;

        button.addEventListener("click", () => checkAnswer(button, option));

        answersContainer.appendChild(button);
    });

    animateQuestion();
    animateAnswers();
    animateLocation();

    startTimer();
}

function animateAnswers() {
    animateIn("#answers .answer-btn", {
        y: 20,
        scale: 0.97,
        stagger: 0.07,
        duration: 0.5
    });
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (answered) return;

        timeLeft--;
        timeElement.textContent = timeLeft;

        if (timeLeft <= 10) {
            timerElement.classList.add("warning");
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            checkAnswer(null, null);
        }
    }, 1000);
}

function checkAnswer(button, selectedAnswer) {
    if (answered) return;

    answered = true;
    clearInterval(timerInterval);

    const current = gameQuestions[currentQuestion];
    const isCorrect = selectedAnswer === current.answer;

    const buttons = document.querySelectorAll(".answer-btn");

    buttons.forEach(btn => {
        btn.disabled = true;

        const option = btn.dataset.answer;

        if (option === current.answer) {
            btn.classList.add("correct");
            btn.querySelector(".answer-icon").textContent = "✓";
        }
    });

    if (button && !isCorrect) {
        button.classList.add("wrong");
        button.querySelector(".answer-icon").textContent = "✕";
    }

    if (isCorrect) {
        const points = Math.round((timeLeft / 30) * 1000);

        score += points;
        correctAnswers++;

        feedback.className = "feedback show success";
        feedbackText.textContent = `✓ Правильно! +${points} очков`;
    } else {
        feedback.className = "feedback show error";
        feedbackText.textContent = `✕ Неправильно! Правильный ответ: ${current.answer}`;
    }

    scoreElement.textContent = score;

    nextBtn.disabled = false;

    nextBtn.textContent = currentQuestion === 4
        ? "Посмотреть результат →"
        : "Следующий раунд →";

    if (!prefersReducedMotion) {
        gsap.fromTo(
            button || ".feedback",
            { scale: 0.96 },
            {
                scale: 1,
                duration: 0.4,
                ease: "back.out(2)"
            }
        );
    }
}

function nextQuestion() {
    if (!answered) return;

    currentQuestion++;

    if (currentQuestion >= 5) {
        endGame();
        return;
    }

    if (!prefersReducedMotion) {
        gsap.to(gameContainer, {
            opacity: 0,
            y: 12,
            duration: 0.2,
            onComplete: () => {
                loadQuestion();

                gsap.fromTo(
                    gameContainer,
                    { opacity: 0, y: 12 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.45,
                        ease: "power3.out"
                    }
                );
            }
        });
    } else {
        loadQuestion();
    }
}

function endGame() {
    clearInterval(timerInterval);

    gameContainer.style.display = "none";
    resultScreen.classList.add("active");

    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("geoBestScore", bestScore);
    }

    bestScoreElement.textContent = bestScore;
    finalBestScore.textContent = bestScore;

    finalScore.textContent = score;
    correctAnswersElement.textContent = `${correctAnswers} / 5`;

    resultTitle.textContent = score >= 4000
        ? "Невероятный результат!"
        : score >= 2000
            ? "Отличная игра!"
            : "Попробуй ещё раз!";

    animateIn(resultScreen, {
        y: 35,
        duration: 0.8
    });
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
nextBtn.addEventListener("click", nextQuestion);

gameContainer.style.display = "none";
startScreen.classList.add("active");

if (!prefersReducedMotion) {
    const introSplit = SplitText.create(".hero h1", {
        type: "chars",
        charsClass: "split-char",
        onSplit(self) {
            return gsap.from(self.chars, {
                yPercent: 110,
                opacity: 0,
                rotateX: -80,
                stagger: 0.035,
                duration: 0.9,
                ease: "power4.out"
            });
        }
    });

    animateIn(".hero-badge", {
        y: 15,
        duration: 0.7
    });

    animateIn(".hero p", {
        y: 15,
        duration: 0.7
    });

    animateIn(".start-screen", {
        y: 25,
        duration: 0.8
    });
}