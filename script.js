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

const TOTAL_ROUNDS = 5;
const ROUND_TIME = 30;

const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

let gameQuestions = [];
let currentQuestion = 0;
let score = 0;
let correctAnswers = 0;
let timeLeft = ROUND_TIME;
let timerInterval = null;
let answered = false;
let questionSplit = null;
let imageRequestId = 0;

let bestScore = Number(localStorage.getItem("geoBestScore")) || 0;

bestScoreElement.textContent = bestScore;

function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

function animateIn(elements, options = {}) {
    if (prefersReducedMotion) return;

    gsap.killTweensOf(elements);

    gsap.fromTo(
        elements,
        {
            y: options.y ?? 22,
            opacity: 0,
            scale: options.scale ?? 1
        },
        {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: options.duration ?? 0.6,
            stagger: options.stagger ?? 0.08,
            ease: options.ease ?? "power3.out",
            clearProps: "opacity,transform"
        }
    );
}

function setQuestionText(text) {
    // SplitText.revert() restores the HTML captured at split time,
    // so it must run before the new text is written.
    if (questionSplit) {
        questionSplit.revert();
        questionSplit = null;
    }

    questionElement.textContent = text;

    if (prefersReducedMotion) return;

    questionSplit = SplitText.create(questionElement, {
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

function revealLocation() {
    if (prefersReducedMotion) {
        gsap.set(locationImage, { opacity: 1, scale: 1 });
        return;
    }

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

function showLocation(fileName) {
    const requestId = ++imageRequestId;
    const src = encodeURI(`images/${fileName}`);

    gsap.killTweensOf(locationImage);
    gsap.set(locationImage, { opacity: 0 });

    const onReady = () => {
        if (requestId === imageRequestId) revealLocation();
    };

    locationImage.onload = onReady;
    locationImage.onerror = onReady;
    locationImage.alt = "Фотография локации";

    if (locationImage.src === new URL(src, document.baseURI).href && locationImage.complete) {
        onReady();
    } else {
        locationImage.src = src;
    }
}

function setProgress(completedRounds) {
    const width = `${(completedRounds / TOTAL_ROUNDS) * 100}%`;

    if (prefersReducedMotion) {
        gsap.set(progressElement, { width });
        return;
    }

    gsap.to(progressElement, {
        width,
        duration: 0.5,
        ease: "power2.out",
        overwrite: true
    });
}

function resetContainer(element) {
    gsap.killTweensOf(element);
    gsap.set(element, { clearProps: "opacity,transform" });
}

function animateGameStart() {
    if (prefersReducedMotion) return;

    animateIn(".game-stats .stat-card", {
        y: 25,
        stagger: 0.1
    });

    animateIn(gameContainer, {
        y: 30,
        duration: 0.7
    });
}

function startGame() {
    clearInterval(timerInterval);

    gameQuestions = shuffle(questions).slice(0, TOTAL_ROUNDS);

    currentQuestion = 0;
    score = 0;
    correctAnswers = 0;

    scoreElement.textContent = score;

    resetContainer(gameContainer);
    resetContainer(resultScreen);
    resetContainer(startScreen);

    startScreen.classList.remove("active");
    resultScreen.classList.remove("active");
    gameContainer.style.display = "block";

    gsap.set(progressElement, { width: "0%" });

    animateGameStart();
    loadQuestion();
}

function loadQuestion() {
    clearInterval(timerInterval);

    answered = false;
    timeLeft = ROUND_TIME;

    const current = gameQuestions[currentQuestion];

    roundElement.innerHTML = `${currentQuestion + 1} <small>/ ${TOTAL_ROUNDS}</small>`;
    timeElement.textContent = timeLeft;

    timerElement.classList.remove("warning");
    gsap.killTweensOf(timerElement);
    gsap.set(timerElement, { clearProps: "transform" });

    setProgress(currentQuestion);
    showLocation(current.image);
    setQuestionText(current.question);

    answersContainer.innerHTML = "";

    gsap.killTweensOf(feedback);
    gsap.set(feedback, { clearProps: "opacity,transform" });
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

    animateAnswers();
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

function pulseTimer() {
    if (prefersReducedMotion) return;

    gsap.fromTo(
        timerElement,
        { scale: 1.08 },
        {
            scale: 1,
            duration: 0.35,
            ease: "power2.out",
            overwrite: true,
            clearProps: "transform"
        }
    );
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (answered) return;

        timeLeft--;
        timeElement.textContent = timeLeft;

        if (timeLeft <= 10) {
            timerElement.classList.add("warning");
            pulseTimer();
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

    const buttons = answersContainer.querySelectorAll(".answer-btn");

    buttons.forEach(btn => {
        btn.disabled = true;

        if (btn.dataset.answer === current.answer) {
            btn.classList.add("correct");
            btn.querySelector(".answer-icon").textContent = "✓";
        }
    });

    if (button && !isCorrect) {
        button.classList.add("wrong");
        button.querySelector(".answer-icon").textContent = "✕";
    }

    if (isCorrect) {
        const points = Math.round((timeLeft / ROUND_TIME) * 1000);

        score += points;
        correctAnswers++;

        feedback.className = "feedback show success";
        feedbackText.textContent = `✓ Правильно! +${points} очков`;
    } else {
        feedback.className = "feedback show error";
        feedbackText.textContent = selectedAnswer === null
            ? `◷ Время вышло! Правильный ответ: ${current.answer}`
            : `✕ Неправильно! Правильный ответ: ${current.answer}`;
    }

    scoreElement.textContent = score;

    setProgress(currentQuestion + 1);

    nextBtn.disabled = false;

    nextBtn.textContent = currentQuestion === TOTAL_ROUNDS - 1
        ? "Посмотреть результат →"
        : "Следующий раунд →";

    if (!prefersReducedMotion) {
        if (button) {
            gsap.fromTo(
                button,
                { scale: 0.96 },
                {
                    scale: 1,
                    duration: 0.4,
                    ease: "back.out(2)",
                    clearProps: "transform"
                }
            );
        }

        gsap.fromTo(
            feedback,
            { opacity: 0, y: -6 },
            {
                opacity: 1,
                y: 0,
                duration: 0.35,
                ease: "power2.out",
                clearProps: "opacity,transform"
            }
        );
    }
}

function fadeOutGame(onComplete) {
    if (prefersReducedMotion) {
        onComplete();
        return;
    }

    gsap.killTweensOf(gameContainer);

    gsap.to(gameContainer, {
        opacity: 0,
        y: 12,
        duration: 0.2,
        ease: "power1.in",
        onComplete
    });
}

function nextQuestion() {
    if (!answered || nextBtn.disabled) return;

    // Blocks repeated clicks while the fade-out is running.
    nextBtn.disabled = true;

    currentQuestion++;

    if (currentQuestion >= TOTAL_ROUNDS) {
        fadeOutGame(endGame);
        return;
    }

    fadeOutGame(() => {
        loadQuestion();

        if (prefersReducedMotion) return;

        gsap.fromTo(
            gameContainer,
            { opacity: 0, y: 12 },
            {
                opacity: 1,
                y: 0,
                duration: 0.45,
                ease: "power3.out",
                clearProps: "opacity,transform"
            }
        );
    });
}

function endGame() {
    clearInterval(timerInterval);

    resetContainer(gameContainer);
    gameContainer.style.display = "none";
    resultScreen.classList.add("active");

    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("geoBestScore", bestScore);
    }

    bestScoreElement.textContent = bestScore;
    finalBestScore.textContent = bestScore;

    finalScore.textContent = score;
    correctAnswersElement.textContent = `${correctAnswers} / ${TOTAL_ROUNDS}`;

    resultTitle.textContent = score >= 4000
        ? "Невероятный результат!"
        : score >= 2000
            ? "Отличная игра!"
            : "Попробуй ещё раз!";

    animateIn(resultScreen, {
        y: 35,
        duration: 0.8
    });

    if (!prefersReducedMotion) {
        gsap.killTweensOf(finalScore);
        gsap.from(finalScore, {
            textContent: 0,
            duration: 1,
            delay: 0.2,
            ease: "power2.out",
            snap: { textContent: 1 }
        });
    }
}

function animateIntro() {
    if (prefersReducedMotion) return;

    const title = document.querySelector(".hero h1");

    // Hide the title until the web font is ready so the split is measured
    // with the final glyphs and there is no flash of unanimated text.
    gsap.set(title, { autoAlpha: 0 });

    document.fonts.ready.then(() => {
        SplitText.create(title, {
            type: "words,chars",
            wordsClass: "split-word",
            charsClass: "split-char",
            mask: "words",
            onSplit(self) {
                gsap.set(title, { autoAlpha: 1 });

                return gsap.from(self.chars, {
                    yPercent: 110,
                    opacity: 0,
                    rotateX: -80,
                    transformPerspective: 600,
                    transformOrigin: "50% 100%",
                    stagger: 0.035,
                    duration: 0.9,
                    ease: "power4.out"
                });
            }
        });
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

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
nextBtn.addEventListener("click", nextQuestion);

gameContainer.style.display = "none";
startScreen.classList.add("active");

animateIntro();
