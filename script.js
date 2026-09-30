if (typeof gsap !== "undefined" && typeof SplitText !== "undefined") {
    gsap.registerPlugin(SplitText);
}

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
const ROUND_TIMES = {
    easy: 30,
    medium: 15,
    hard: 5
};
let roundTime = ROUND_TIME;

function isReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const prefersReducedMotion = isReducedMotion();

document.querySelectorAll(".answer-btn").forEach(button => {
    button.classList.remove("computer-hint", "hidden-answer");
    button.disabled = false;
});

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

const fiftyHint = document.querySelector("#fiftyHint");
const computerHint = document.querySelector("#computerHint");
let fiftyUsed = false;
let computerUsed = false;

bestScoreElement.textContent = bestScore;

const ACHIEVEMENTS_CONFIG = [
    {
        id: "first_step",
        title: "Первый шаг",
        description: "Сыграть первую игру",
        icon: "🧭",
        check: (stats) => stats.gamesPlayed >= 1
    },
    {
        id: "sharp_shooter",
        title: "Меткий игрок",
        description: "Дать 5 правильных ответов подряд",
        icon: "🎯",
        check: (stats) => stats.maxStreak >= 5
    },
    {
        id: "flawless",
        title: "Без ошибок",
        description: "Завершить игру без единой ошибки",
        icon: "⭐",
        check: (stats, game) => Boolean(game && game.correctAnswers === TOTAL_ROUNDS)
    },
    {
        id: "traveler",
        title: "Путешественник",
        description: "Правильно ответить на вопросы о 10 разных странах",
        icon: "🌍",
        check: (stats) => stats.uniqueCountries.length >= 10
    },
    {
        id: "streak_10",
        title: "Серия",
        description: "Достичь серии из 10 правильных ответов",
        icon: "🔥",
        check: (stats) => stats.maxStreak >= 10
    },
    {
        id: "veteran",
        title: "Опытный игрок",
        description: "Сыграть 10 игр",
        icon: "🏅",
        check: (stats) => stats.gamesPlayed >= 10
    },
    {
        id: "geographer",
        title: "Географ",
        description: "Дать 100 правильных ответов",
        icon: "👑",
        check: (stats) => stats.correctAnswers >= 100
    }
];

const DEFAULT_STATS = {
    gamesPlayed: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    bestScore: 0,
    currentStreak: 0,
    maxStreak: 0,
    uniqueCountries: []
};

function loadStats() {
    try {
        const raw = localStorage.getItem("geoGuesserStats");
        if (raw) {
            const data = JSON.parse(raw);
            return {
                gamesPlayed: Number(data.gamesPlayed) || 0,
                totalQuestions: Number(data.totalQuestions) || 0,
                correctAnswers: Number(data.correctAnswers) || 0,
                incorrectAnswers: Number(data.incorrectAnswers) || 0,
                bestScore: Math.max(Number(data.bestScore) || 0, bestScore),
                currentStreak: Number(data.currentStreak) || 0,
                maxStreak: Number(data.maxStreak) || 0,
                uniqueCountries: Array.isArray(data.uniqueCountries) ? data.uniqueCountries : []
            };
        }
    } catch (e) {
    }
    return { ...DEFAULT_STATS, bestScore: bestScore };
}

function loadAchievements() {
    try {
        const raw = localStorage.getItem("geoGuesserAchievements");
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (e) {
    }
    const initial = {};
    ACHIEVEMENTS_CONFIG.forEach(ach => {
        initial[ach.id] = false;
    });
    return initial;
}

let playerStats = loadStats();
let playerAchievements = loadAchievements();

function saveStats() {
    try {
        localStorage.setItem("geoGuesserStats", JSON.stringify(playerStats));
    } catch (e) {
    }
}

function saveAchievements() {
    try {
        localStorage.setItem("geoGuesserAchievements", JSON.stringify(playerAchievements));
    } catch (e) {
    }
}

function calculateAccuracy(correct, total) {
    if (!total || total === 0) return "0%";
    const percent = (correct / total) * 100;
    return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(1)}%`;
}

let prevStats = {
    gamesPlayed: playerStats.gamesPlayed,
    totalQuestions: playerStats.totalQuestions,
    correctAnswers: playerStats.correctAnswers,
    incorrectAnswers: playerStats.incorrectAnswers,
    bestScore: playerStats.bestScore,
    maxStreak: playerStats.maxStreak
};

function animateStatNumber(element, start, end, suffix = "") {
    if (!element) return;
    if (isReducedMotion() || start === end) {
        element.textContent = `${end}${suffix}`;
        return;
    }
    const obj = { val: start };
    gsap.to(obj, {
        val: end,
        duration: 0.75,
        ease: "power2.out",
        onUpdate: () => {
            element.textContent = `${Math.round(obj.val)}${suffix}`;
        },
        onComplete: () => {
            element.textContent = `${end}${suffix}`;
        }
    });
}

function updateStatsUI(animate = false) {
    const gamesPlayedEl = document.querySelector("#statGamesPlayed");
    const totalQuestionsEl = document.querySelector("#statTotalQuestions");
    const correctAnswersEl = document.querySelector("#statCorrectAnswers");
    const incorrectAnswersEl = document.querySelector("#statIncorrectAnswers");
    const accuracyEl = document.querySelector("#statAccuracy");
    const bestScoreEl = document.querySelector("#statBestScore");
    const maxStreakEl = document.querySelector("#statMaxStreak");

    if (!gamesPlayedEl) return;

    if (animate && !isReducedMotion()) {
        animateStatNumber(gamesPlayedEl, prevStats.gamesPlayed, playerStats.gamesPlayed);
        animateStatNumber(totalQuestionsEl, prevStats.totalQuestions, playerStats.totalQuestions);
        animateStatNumber(correctAnswersEl, prevStats.correctAnswers, playerStats.correctAnswers);
        animateStatNumber(incorrectAnswersEl, prevStats.incorrectAnswers, playerStats.incorrectAnswers);
        accuracyEl.textContent = calculateAccuracy(playerStats.correctAnswers, playerStats.totalQuestions);
        animateStatNumber(bestScoreEl, prevStats.bestScore, playerStats.bestScore);
        animateStatNumber(maxStreakEl, prevStats.maxStreak, playerStats.maxStreak);

        gsap.fromTo(
            ".player-stat-card",
            { scale: 0.98 },
            { scale: 1, duration: 0.35, stagger: 0.04, ease: "power2.out", clearProps: "transform" }
        );

        if (playerStats.bestScore > prevStats.bestScore) {
            gsap.fromTo(
                ["#bestScore", "#statBestScore"],
                { scale: 1.25, color: "#4ade80" },
                { scale: 1, color: "#f1f5f9", duration: 0.6, ease: "back.out(2)", clearProps: "transform,color" }
            );
        }
    } else {
        gamesPlayedEl.textContent = playerStats.gamesPlayed;
        totalQuestionsEl.textContent = playerStats.totalQuestions;
        correctAnswersEl.textContent = playerStats.correctAnswers;
        incorrectAnswersEl.textContent = playerStats.incorrectAnswers;
        accuracyEl.textContent = calculateAccuracy(playerStats.correctAnswers, playerStats.totalQuestions);
        bestScoreEl.textContent = playerStats.bestScore;
        maxStreakEl.textContent = playerStats.maxStreak;
    }

    prevStats = {
        gamesPlayed: playerStats.gamesPlayed,
        totalQuestions: playerStats.totalQuestions,
        correctAnswers: playerStats.correctAnswers,
        incorrectAnswers: playerStats.incorrectAnswers,
        bestScore: playerStats.bestScore,
        maxStreak: playerStats.maxStreak
    };
}

function renderAchievements(newlyUnlockedIds = []) {
    const container = document.querySelector("#achievementsGrid");
    if (!container) return;

    container.innerHTML = "";

    ACHIEVEMENTS_CONFIG.forEach(ach => {
        const isUnlocked = Boolean(playerAchievements[ach.id]);
        const card = document.createElement("div");
        card.className = `achievement-card ${isUnlocked ? "unlocked" : "locked"}`;
        card.id = `achievement-${ach.id}`;

        card.innerHTML = `
            <div class="achievement-icon-wrap">
                <span>${ach.icon}</span>
            </div>
            <div class="achievement-content">
                <div class="achievement-header">
                    <h4>${ach.title}</h4>
                    <span class="achievement-badge ${isUnlocked ? "unlocked" : "locked"}">
                        ${isUnlocked ? "🏆 Разблокировано" : "🔒 Заблокировано"}
                    </span>
                </div>
                <p class="achievement-desc">${ach.description}</p>
            </div>
        `;

        container.appendChild(card);

        if (newlyUnlockedIds.includes(ach.id)) {
            animateAchievementUnlock(card);
        }
    });
}

function checkAchievements(gameContext = null) {
    const newlyUnlocked = [];

    ACHIEVEMENTS_CONFIG.forEach(ach => {
        if (!playerAchievements[ach.id]) {
            if (ach.check(playerStats, gameContext)) {
                playerAchievements[ach.id] = true;
                newlyUnlocked.push(ach);
            }
        }
    });

    if (newlyUnlocked.length > 0) {
        saveAchievements();
        renderAchievements(newlyUnlocked.map(a => a.id));
        newlyUnlocked.forEach(ach => {
            queueAchievementToast(ach);
        });
    }

    return newlyUnlocked;
}

function animateAchievementUnlock(cardElement) {
    if (isReducedMotion() || !cardElement) return;

    const iconWrap = cardElement.querySelector(".achievement-icon-wrap");
    const badge = cardElement.querySelector(".achievement-badge");

    gsap.killTweensOf([cardElement, iconWrap, badge].filter(Boolean));

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    // 1. Карточка появляется + 2. Небольшой scale + 3. Glow
    tl.fromTo(cardElement,
        {
            scale: 0.94,
            borderColor: "#4ade80",
            boxShadow: "0 0 25px rgba(74, 222, 128, 0.45)"
        },
        {
            scale: 1.03,
            borderColor: "rgba(74, 222, 128, 0.65)",
            boxShadow: "0 0 20px rgba(74, 222, 128, 0.3)",
            duration: 0.35
        }
    )
    .to(cardElement, {
        scale: 1,
        borderColor: "rgba(74, 222, 128, 0.35)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
        duration: 0.35,
        ease: "power2.inOut",
        clearProps: "transform,boxShadow"
    });

    // 4. Иконка слегка увеличивается
    if (iconWrap) {
        tl.fromTo(iconWrap,
            { scale: 1 },
            { scale: 1.2, duration: 0.25, yoyo: true, repeat: 1, ease: "back.out(2)", clearProps: "transform" },
            "-=0.5"
        );
    }

    // 5. Состояние плавно обновляется
    if (badge) {
        tl.fromTo(badge,
            { scale: 0.9, opacity: 0.7 },
            { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.5)", clearProps: "transform,opacity" },
            "-=0.3"
        );
    }
}

let toastQueue = [];
let isToastShowing = false;

function queueAchievementToast(achievement) {
    toastQueue.push(achievement);
    processToastQueue();
}

function processToastQueue() {
    if (isToastShowing || toastQueue.length === 0) return;
    isToastShowing = true;
    const nextAch = toastQueue.shift();
    showAchievementToast(nextAch);
    setTimeout(() => {
        isToastShowing = false;
        processToastQueue();
    }, 3800);
}

function showAchievementToast(achievement) {
    const toast = document.querySelector("#achievementToast");
    const toastIcon = document.querySelector("#toastIcon");
    const toastName = document.querySelector("#toastName");
    if (!toast || !toastIcon || !toastName) return;

    toastIcon.textContent = achievement.icon || "🏆";
    toastName.textContent = achievement.title;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3200);
}

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
        try {
            gsap.killTweensOf(questionSplit.words);
            questionSplit.revert();
        } catch (e) {}
        questionSplit = null;
    }

    questionElement.textContent = text;

    if (isReducedMotion()) return;

    if (typeof SplitText !== "undefined") {
        try {
            questionSplit = SplitText.create(questionElement, {
                type: "words",
                wordsClass: "split-word",
                mask: "words",
                onSplit(self) {
                    return gsap.from(self.words, {
                        yPercent: 100,
                        opacity: 0,
                        stagger: 0.04,
                        duration: 0.5,
                        ease: "power3.out",
                        clearProps: "transform,opacity"
                    });
                }
            });
            return;
        } catch (e) {}
    }

    gsap.fromTo(questionElement,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", clearProps: "opacity,transform" }
    );
}

function revealLocation() {
    if (isReducedMotion()) {
        gsap.set(locationImage, { opacity: 1, scale: 1, y: 0 });
        return;
    }

    gsap.killTweensOf(locationImage);

    gsap.fromTo(
        locationImage,
        {
            opacity: 0,
            scale: 0.96,
            y: 15
        },
        {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.65,
            ease: "power3.out",
            clearProps: "transform"
        }
    );
}

function showLocation(fileName) {
    const requestId = ++imageRequestId;
    const src = encodeURI(`images/${fileName}`);

    gsap.killTweensOf(locationImage);

    // Smoothly fade out old image instead of an abrupt cut
    if (locationImage.src && !isReducedMotion()) {
        gsap.to(locationImage, {
            opacity: 0.25,
            scale: 0.98,
            duration: 0.2,
            ease: "power2.in"
        });
    } else {
        gsap.set(locationImage, { opacity: 0 });
    }

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

    if (isReducedMotion()) {
        gsap.set(progressElement, { width });
        return;
    }

    gsap.to(progressElement, {
        width,
        duration: 0.55,
        ease: "power3.out",
        overwrite: true
    });
}

function updateRoundDisplay(currentQuestionIndex) {
    const roundNumber = currentQuestionIndex + 1;
    if (isReducedMotion()) {
        roundElement.innerHTML = `${roundNumber} <small>/ ${TOTAL_ROUNDS}</small>`;
        return;
    }

    gsap.killTweensOf(roundElement);

    gsap.timeline()
        .to(roundElement, {
            y: -6,
            opacity: 0.3,
            duration: 0.15,
            ease: "power1.in",
            onComplete: () => {
                roundElement.innerHTML = `${roundNumber} <small>/ ${TOTAL_ROUNDS}</small>`;
            }
        })
        .fromTo(roundElement,
            { y: 6, opacity: 0.3 },
            { y: 0, opacity: 1, duration: 0.25, ease: "power2.out", clearProps: "transform" }
        );
}

function resetContainer(element) {
    if (!element) return;
    gsap.killTweensOf(element);
    gsap.set(element, { clearProps: "opacity,transform" });
}

function animateGameStart() {
    if (isReducedMotion()) return;

    gsap.killTweensOf([
        gameContainer,
        ".game-top",
        ".progress-bar",
        ".location-box",
        ".question-box",
        "#answers .answer-btn",
        ".hints .hint-btn",
        ".game-bottom",
        ".stat-card"
    ]);

    const tl = gsap.timeline({
        defaults: { ease: "power3.out" }
    });

    // Карточки раунда и очков
    tl.fromTo(".game-stats .stat-card",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, clearProps: "opacity,transform" }
    );

    // 1. Основной контейнер
    tl.fromTo(gameContainer,
        { opacity: 0, y: 22, scale: 0.99 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, clearProps: "opacity,transform" },
        "-=0.2"
    );

    // 2. Заголовок и прогресс бар
    tl.fromTo([".game-top", ".progress-bar"],
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.05, clearProps: "opacity,transform" },
        "-=0.25"
    );

    // 3. Изображение
    tl.fromTo(".location-box",
        { opacity: 0, y: 12, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, clearProps: "opacity,transform" },
        "-=0.18"
    );

    // 4. Вопрос
    tl.fromTo(".question-box",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, clearProps: "opacity,transform" },
        "-=0.2"
    );

    // 5. Варианты ответа
    tl.fromTo("#answers .answer-btn",
        { opacity: 0, y: 14, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.06, clearProps: "opacity,transform" },
        "-=0.15"
    );

    // 6. Подсказки
    tl.fromTo(".hints .hint-btn",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.06, clearProps: "opacity,transform" },
        "-=0.18"
    );

    // 7. Дополнительные элементы интерфейса (game-bottom)
    tl.fromTo(".game-bottom",
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.28, clearProps: "opacity,transform" },
        "-=0.15"
    );
}

function startGame() {
    clearInterval(timerInterval);

    const difficulty = document.querySelector("#difficulty").value;
    roundTime = ROUND_TIMES[difficulty] ?? ROUND_TIME;

    gameQuestions = shuffle(questions).slice(0, TOTAL_ROUNDS);

    currentQuestion = 0;
    score = 0;
    correctAnswers = 0;
    fiftyUsed = false;
    computerUsed = false;
    fiftyHint.disabled = false;
    computerHint.disabled = false;
    fiftyHint.classList.remove("used");
    computerHint.classList.remove("used");
    gsap.set([fiftyHint, computerHint], { clearProps: "opacity,transform" });

    document.querySelectorAll(".answer-btn").forEach(button => {
        button.classList.remove("computer-hint", "hidden-answer");
        button.disabled = false;
    });

    scoreElement.textContent = score;

    resetContainer(gameContainer);
    resetContainer(resultScreen);
    resetContainer(startScreen);

    startScreen.classList.remove("active");
    resultScreen.classList.remove("active");
    gameContainer.style.display = "block";

    gsap.set(progressElement, { width: "0%" });

    loadQuestion(true);
    animateGameStart();
}

function loadQuestion(isInitial = false) {
    clearInterval(timerInterval);

    answered = false;
    timeLeft = roundTime;

    const current = gameQuestions[currentQuestion];

    updateRoundDisplay(currentQuestion);
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

    if (!isInitial) {
        animateAnswers();
    }
    startTimer();
}

function animateAnswers() {
    if (isReducedMotion()) return;

    const buttons = answersContainer.querySelectorAll(".answer-btn");
    gsap.killTweensOf(buttons);

    gsap.fromTo(
        buttons,
        {
            opacity: 0,
            y: 16,
            scale: 0.98
        },
        {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.4,
            stagger: 0.07,
            ease: "power3.out",
            clearProps: "opacity,transform"
        }
    );
}

function pulseTimer() {
    if (isReducedMotion()) return;

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

    playerStats.totalQuestions++;

    if (isCorrect) {
        playerStats.correctAnswers++;
        playerStats.currentStreak++;
        if (playerStats.currentStreak > playerStats.maxStreak) {
            playerStats.maxStreak = playerStats.currentStreak;
        }
        if (current && current.answer && !playerStats.uniqueCountries.includes(current.answer)) {
            playerStats.uniqueCountries.push(current.answer);
        }
    } else {
        playerStats.incorrectAnswers++;
        playerStats.currentStreak = 0;
    }

    saveStats();
    updateStatsUI(false);

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
        const points = Math.round((timeLeft / roundTime) * 1000);

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

    if (!isReducedMotion()) {
        if (button) {
            gsap.killTweensOf(button);

            if (isCorrect) {
                // Правильный ответ: мягкое свечение и scale 1 -> 1.03 -> 1
                gsap.timeline()
                    .to(button, {
                        scale: 1.03,
                        boxShadow: "0 0 20px rgba(74, 222, 128, 0.45)",
                        duration: 0.22,
                        ease: "power2.out"
                    })
                    .to(button, {
                        scale: 1,
                        boxShadow: "0 0 10px rgba(74, 222, 128, 0.2)",
                        duration: 0.28,
                        ease: "power2.inOut",
                        clearProps: "transform"
                    });
            } else {
                // Неправильный ответ: короткая shake-анимация ТОЛЬКО для выбранной кнопки
                gsap.to(button, {
                    keyframes: [
                        { x: -6, duration: 0.05 },
                        { x: 6, duration: 0.06 },
                        { x: -4, duration: 0.06 },
                        { x: 4, duration: 0.06 },
                        { x: 0, duration: 0.05 }
                    ],
                    ease: "power2.out",
                    clearProps: "x"
                });
            }
        }

        // Появление feedback
        gsap.fromTo(
            feedback,
            { opacity: 0, y: -8, scale: 0.98 },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.35,
                ease: "back.out(1.5)",
                clearProps: "opacity,transform"
            }
        );
    }
}

function fadeOutGame(onComplete) {
    if (isReducedMotion()) {
        onComplete();
        return;
    }

    gsap.killTweensOf(gameContainer);

    gsap.to(gameContainer, {
        opacity: 0,
        y: 12,
        scale: 0.99,
        duration: 0.3,
        ease: "power2.in",
        onComplete
    });
}

function nextQuestion() {
    if (!answered || nextBtn.disabled) return;

    nextBtn.disabled = true;
    currentQuestion++;

    if (currentQuestion >= TOTAL_ROUNDS) {
        fadeOutGame(endGame);
        return;
    }

    if (isReducedMotion()) {
        loadQuestion();
        return;
    }

    const questionArea = [".question-box", "#answers", ".feedback"];
    gsap.killTweensOf(questionArea);

    // Старый контент аккуратно исчезает влево
    gsap.to(questionArea, {
        opacity: 0,
        x: -20,
        duration: 0.22,
        ease: "power2.in",
        onComplete: () => {
            loadQuestion();

            // Новый контент аккуратно появляется справа
            gsap.fromTo(
                questionArea,
                { opacity: 0, x: 20 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.38,
                    ease: "power3.out",
                    clearProps: "opacity,transform"
                }
            );
        }
    });
}

function endGame() {
    clearInterval(timerInterval);

    // 1. Игровой интерфейс плавно скрывается
    fadeOutGame(() => {
        resetContainer(gameContainer);
        gameContainer.style.display = "none";
        resultScreen.classList.add("active");

        playerStats.gamesPlayed++;

        const isNewBest = score > bestScore;
        if (isNewBest) {
            bestScore = score;
            localStorage.setItem("geoBestScore", bestScore);
        }
        if (bestScore > playerStats.bestScore) {
            playerStats.bestScore = bestScore;
        }

        saveStats();
        updateStatsUI(true);

        bestScoreElement.textContent = bestScore;
        finalBestScore.textContent = bestScore;
        finalScore.textContent = 0;
        correctAnswersElement.textContent = `${correctAnswers} / ${TOTAL_ROUNDS}`;

        resultTitle.textContent = score >= 4000
            ? "Невероятный результат!"
            : score >= 2000
                ? "Отличная игра!"
                : "Попробуй ещё раз!";

        const newlyUnlocked = checkAchievements({ correctAnswers, totalRounds: TOTAL_ROUNDS, score });

        if (isReducedMotion()) {
            finalScore.textContent = score;
            return;
        }

        // GSAP Timeline для завершения игры
        const endTl = gsap.timeline({ defaults: { ease: "power3.out" } });

        // 2. Появляется итоговый результат
        endTl.fromTo(resultScreen,
            { opacity: 0, y: 24, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 0.45, clearProps: "transform" }
        )
        .fromTo([".result-icon", ".result-screen .question-label", "#resultTitle", ".result-screen > p"],
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.35, stagger: 0.07, clearProps: "opacity,transform" },
            "-=0.2"
        )
        // 4. Появляется количество очков с ticker
        .fromTo(finalScore,
            { opacity: 0, scale: 0.75 },
            { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.8)" },
            "-=0.1"
        );

        // Number ticker для очков
        const scoreObj = { val: 0 };
        endTl.to(scoreObj, {
            val: score,
            duration: 1.0,
            ease: "power2.out",
            onUpdate: () => {
                finalScore.textContent = Math.round(scoreObj.val);
            },
            onComplete: () => {
                finalScore.textContent = score;
            }
        }, "-=0.3");

        // 3 & 5. Количество правильных ответов и лучший результат
        endTl.fromTo(".result-details > div",
            { opacity: 0, y: 14, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.38, stagger: 0.1, clearProps: "opacity,transform" },
            "-=0.6"
        );

        // 6. Достижения, полученные во время игры
        if (newlyUnlocked && newlyUnlocked.length > 0) {
            endTl.fromTo(".achievements-section",
                { opacity: 0.85, y: 10 },
                { opacity: 1, y: 0, duration: 0.4 },
                "-=0.2"
            );
        }

        // 7. Появляется кнопка новой игры
        endTl.fromTo(restartBtn,
            { opacity: 0, y: 14, scale: 0.94 },
            { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.7)", clearProps: "opacity,transform" },
            "-=0.2"
        );
    });
}

function animateIntro() {
    if (isReducedMotion()) return;

    const title = document.querySelector(".hero h1");

    if (title) {
        gsap.set(title, { autoAlpha: 0 });

        const setupTitle = () => {
            if (typeof SplitText !== "undefined") {
                try {
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
                    return;
                } catch (e) {}
            }
            gsap.set(title, { autoAlpha: 1 });
            gsap.fromTo(title, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
        };

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(setupTitle).catch(setupTitle);
        } else {
            setupTitle();
        }
    }

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

    animateIn(".player-stat-card", {
        y: 20,
        stagger: 0.05,
        duration: 0.6
    });

    animateIn(".achievement-card", {
        y: 20,
        stagger: 0.06,
        duration: 0.6
    });
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
nextBtn.addEventListener("click", nextQuestion);

const profileBtn = document.querySelector(".profile-btn");
if (profileBtn) {
    profileBtn.addEventListener("click", () => {
        const statsEl = document.querySelector("#playerStats");
        if (statsEl) {
            statsEl.scrollIntoView({ behavior: "smooth" });
        }
    });
}

gameContainer.style.display = "none";
startScreen.classList.add("active");

updateStatsUI(false);
checkAchievements();
renderAchievements();

animateIntro();

fiftyHint.addEventListener("click", () => {
    if (fiftyUsed || !gameQuestions[currentQuestion] || answered) return;

    fiftyUsed = true;
    fiftyHint.disabled = true;
    fiftyHint.classList.add("used");

    if (!isReducedMotion()) {
        gsap.to(fiftyHint, {
            scale: 0.96,
            opacity: 0.45,
            duration: 0.3,
            ease: "power2.out"
        });
    }

    const current = gameQuestions[currentQuestion];
    const answerButtons = [...answersContainer.querySelectorAll(".answer-btn")];

    const wrongButtons = answerButtons.filter(button => {
        return button.dataset.answer !== current.answer;
    });

    const toHide = shuffle(wrongButtons).slice(0, 2);

    if (isReducedMotion()) {
        toHide.forEach(button => {
            button.classList.add("hidden-answer");
            button.disabled = true;
        });
        return;
    }

    gsap.to(toHide, {
        opacity: 0,
        scale: 0.9,
        y: 8,
        duration: 0.35,
        stagger: 0.08,
        ease: "power2.inOut",
        onComplete: () => {
            toHide.forEach(button => {
                button.classList.add("hidden-answer");
                button.disabled = true;
                gsap.set(button, { pointerEvents: "none" });
            });
        }
    });
});

computerHint.addEventListener("click", () => {
    if (computerUsed || !gameQuestions[currentQuestion] || answered) return;

    computerUsed = true;
    computerHint.disabled = true;
    computerHint.classList.add("used");

    if (!isReducedMotion()) {
        gsap.to(computerHint, {
            scale: 0.96,
            opacity: 0.45,
            duration: 0.3,
            ease: "power2.out"
        });
    }

    const current = gameQuestions[currentQuestion];
    const answerButtons = [...answersContainer.querySelectorAll(".answer-btn")];

    const correctButton = answerButtons.find(button => {
        return button.dataset.answer === current.answer;
    });

    if (correctButton) {
        correctButton.classList.add("computer-hint");

        if (!isReducedMotion()) {
            gsap.timeline({ repeat: 2, yoyo: true })
                .to(correctButton, {
                    boxShadow: "0 0 16px rgba(74, 222, 128, 0.45)",
                    borderColor: "rgba(74, 222, 128, 0.7)",
                    duration: 0.6,
                    ease: "sine.inOut"
                });
        }
    }
});