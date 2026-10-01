/**
 * worldmap.js - Режим "Карта мира" для GeoGuesser
 * Изолированный IIFE, не влияет на основную игру.
 */

(function () {
    "use strict";

    /* === 1. НАСТРОЙКИ === */
    var WM_CONFIG = {
        TOTAL_QUESTIONS: 8,
        POINTS_CORRECT: 100,
        STREAK_BONUS: 25,
        STORAGE_KEY: "geoWMStats"
    };

    /* === 2. СОСТОЯНИЕ === */
    var wmState = {
        questions: [],
        currentIndex: 0,
        score: 0,
        correctCount: 0,
        incorrectCount: 0,
        streak: 0,
        maxStreak: 0,
        answered: false,
        mapLocked: false,
        fiftyUsed: false,
        computerUsed: false,
        dimmedPaths: [],
        hintActive: false
    };

    /* === 3. СЛОВАРЬ СТРАН (ISO -> RU) === */
    var CN_RU = {
        AF:"Афганистан",AL:"Албания",DZ:"Алжир",AD:"Андорра",AO:"Ангола",
        AG:"Антигуа и Барбуда",AR:"Аргентина",AM:"Армения",AU:"Австралия",AT:"Австрия",
        AZ:"Азербайджан",BS:"Багамы",BH:"Бахрейн",BD:"Бангладеш",BB:"Барбадос",
        BY:"Беларусь",BE:"Бельгия",BZ:"Белиз",BJ:"Бенин",BT:"Бутан",
        BO:"Боливия",BA:"Босния и Герц.",BW:"Ботсвана",BR:"Бразилия",BN:"Бруней",
        BG:"Болгария",BF:"Буркина-Фасо",BI:"Бурунди",CV:"Кабо-Верде",KH:"Камбоджа",
        CM:"Камерун",CA:"Канада",CF:"ЦАР",TD:"Чад",CL:"Чили",
        CN:"Китай",CO:"Колумбия",KM:"Коморы",CG:"Конго",CD:"ДР Конго",
        CR:"Коста-Рика",CI:"Кот-д'Ивуар",HR:"Хорватия",CU:"Куба",CY:"Кипр",
        CZ:"Чехия",DK:"Дания",DJ:"Джибути",DM:"Доминика",DO:"Доминик. республика",
        EC:"Эквадор",EG:"Египет",SV:"Сальвадор",GQ:"Эквадор. Гвинея",ER:"Эритрея",
        EE:"Эстония",SZ:"Эсватини",ET:"Эфиопия",FJ:"Фиджи",FI:"Финляндия",
        FR:"Франция",GA:"Габон",GM:"Гамбия",GE:"Грузия",DE:"Германия",
        GH:"Гана",GR:"Греция",GL:"Гренландия",GD:"Гренада",GT:"Гватемала",
        GN:"Гвинея",GW:"Гвинея-Бисау",GY:"Гайана",HT:"Гаити",VA:"Ватикан",
        HN:"Гондурас",HU:"Венгрия",IS:"Исландия",IN:"Индия",ID:"Индонезия",
        IR:"Иран",IQ:"Ирак",IE:"Ирландия",IL:"Израиль",IT:"Италия",
        JM:"Ямайка",JP:"Япония",JO:"Иордания",KZ:"Казахстан",KE:"Кения",
        KI:"Кирибати",KP:"Сев. Корея",KR:"Юж. Корея",KW:"Кувейт",KG:"Кыргызстан",
        LA:"Лаос",LV:"Латвия",LB:"Ливан",LS:"Лесото",LR:"Либерия",
        LY:"Ливия",LI:"Лихтенштейн",LT:"Литва",LU:"Люксембург",MG:"Мадагаскар",
        MW:"Малави",MY:"Малайзия",MV:"Мальдивы",ML:"Мали",MT:"Мальта",
        MH:"Маршалловы о-ва",MR:"Мавритания",MU:"Маврикий",MX:"Мексика",
        FM:"Микронезия",MD:"Молдова",MC:"Монако",MN:"Монголия",ME:"Черногория",
        MA:"Марокко",MZ:"Мозамбик",MM:"Мьянма",NA:"Намибия",NR:"Науру",
        NP:"Непал",NL:"Нидерланды",NZ:"Новая Зеландия",NI:"Никарагуа",NE:"Нигер",
        NG:"Нигерия",MK:"Сев. Македония",NO:"Норвегия",OM:"Оман",PK:"Пакистан",
        PW:"Палау",PS:"Палестина",PA:"Панама",PG:"Папуа — Нов. Гвинея",PY:"Парагвай",
        PE:"Перу",PH:"Филиппины",PL:"Польша",PT:"Португалия",QA:"Катар",
        RO:"Румыния",RU:"Россия",RW:"Руанда",KN:"Сент-Китс и Невис",LC:"Сент-Люсия",
        VC:"Сент-Винсент",WS:"Самоа",SM:"Сан-Марино",ST:"Сан-Томе и Принсипи",
        SA:"Саудовская Аравия",SN:"Сенегал",RS:"Сербия",SC:"Сейшелы",SL:"Сьерра-Леоне",
        SG:"Сингапур",SK:"Словакия",SI:"Словения",SB:"Соломоновы о-ва",SO:"Сомали",
        ZA:"ЮАР",SS:"Юж. Судан",ES:"Испания",LK:"Шри-Ланка",SD:"Судан",
        SR:"Суринам",SE:"Швеция",CH:"Швейцария",SY:"Сирия",TW:"Тайвань",
        TJ:"Таджикистан",TZ:"Танзания",TH:"Таиланд",TL:"Вост. Тимор",TG:"Того",
        TO:"Тонга",TT:"Тринидад и Тобаго",TN:"Тунис",TR:"Турция",TM:"Туркменистан",
        TV:"Тувалу",UG:"Уганда",UA:"Украина",AE:"ОАЭ",GB:"Великобритания",
        US:"США",UY:"Уругвай",UZ:"Узбекистан",VU:"Вануату",VE:"Венесуэла",
        VN:"Вьетнам",YE:"Йемен",ZM:"Замбия",ZW:"Зимбабве"
    };

    function cnRu(code) { return CN_RU[code] || code; }

    /* === 4. HELPERS === */
    function rmq() {
        return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function shuffle(arr) {
        var a = arr.slice(), i = a.length, j, t;
        while (i--) { j = Math.random() * (i + 1) | 0; t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
    }


    /* === 5. ЭЛЕМЕНТЫ DOM === */
    var el = {};

    function getEls() {
        el.mode        = document.getElementById("worldMapMode");
        el.gameArea    = document.getElementById("wmGameArea");
        el.result      = document.getElementById("wmResultScreen");
        el.question    = document.getElementById("wmQuestion");
        el.feedback    = document.getElementById("wmFeedback");
        el.nextBtn     = document.getElementById("wmNextBtn");
        el.progFill    = document.getElementById("wmProgressFill");
        el.score       = document.getElementById("wmScore");
        el.correct     = document.getElementById("wmCorrect");
        el.qNum        = document.getElementById("wmQuestionNum");
        el.fiftyBtn    = document.getElementById("wmFiftyBtn");
        el.compBtn     = document.getElementById("wmComputerBtn");
        el.tooltip     = document.getElementById("wmTooltip");
        el.resTitle    = document.getElementById("wmResultTitle");
        el.resStats    = document.getElementById("wmResultStats");
        el.resScore    = document.getElementById("wmResultScore");
    }

    /* === 6. TOOLTIP === */
    function showTip(name, x, y) {
        if (!el.tooltip) return;
        el.tooltip.textContent = name;
        el.tooltip.style.left = (x + 14) + "px";
        el.tooltip.style.top  = (y - 30) + "px";
        el.tooltip.classList.add("wm-tooltip-show");
    }
    function hideTip() {
        if (el.tooltip) el.tooltip.classList.remove("wm-tooltip-show");
    }

    /* === 7. КАРТА: получение путей === */
    function mapCont() { return document.getElementById("wmMapContainer"); }

    function pathsByCode(code) {
        var c = mapCont(); if (!c) return [];
        return Array.from(c.querySelectorAll('[id="svgMap-country-' + code + '"]'));
    }

    function allPaths() {
        var c = mapCont(); if (!c) return [];
        return Array.from(c.querySelectorAll("[id^='svgMap-country-']"));
    }

    function codeFromPath(p) {
        var id = p.getAttribute("id") || "";
        var m = id.match(/svgMap-country-([A-Z]{2,3})/);
        return m ? m[1] : null;
    }

    function setCountryState(code, state) {
        pathsByCode(code).forEach(function(p) {
            p.setAttribute("data-wm-state", state);
        });
    }

    function clearAllStates() {
        allPaths().forEach(function(p) {
            p.removeAttribute("data-wm-state");
            p.style.opacity = "";
            p.style.pointerEvents = "";
        });
        wmState.dimmedPaths = [];
        wmState.hintActive = false;
    }

    /* === 8. ОБРАБОТЧИКИ КАРТЫ === */
    function attachMapHandlers() {
        allPaths().forEach(function(path) {
            var code = codeFromPath(path);
            if (!code) return;

            path.addEventListener("mouseenter", function(e) {
                if (wmState.mapLocked) return;
                var s = path.getAttribute("data-wm-state");
                if (!s || s === "default") path.setAttribute("data-wm-state", "hover");
                showTip(cnRu(code), e.clientX, e.clientY);
            });

            path.addEventListener("mousemove", function(e) {
                showTip(cnRu(code), e.clientX, e.clientY);
            });

            path.addEventListener("mouseleave", function() {
                hideTip();
                if (path.getAttribute("data-wm-state") === "hover") {
                    path.removeAttribute("data-wm-state");
                }
            });

            path.addEventListener("click", function() {
                if (wmState.mapLocked || wmState.answered) return;
                handleClick(code);
            });

            path.addEventListener("touchend", function(e) {
                e.preventDefault();
                if (wmState.mapLocked || wmState.answered) return;
                handleClick(code);
            }, { passive: false });
        });
    }


    /* === 9. ЛОГИКА ОТВЕТА === */
    function handleClick(code) {
        if (wmState.answered) return;
        wmState.answered = true;
        wmState.mapLocked = true;
        hideTip();

        var cur = wmState.questions[wmState.currentIndex];
        var ok  = (code === cur.answer);

        /* Сброс hover */
        allPaths().forEach(function(p) {
            if (p.getAttribute("data-wm-state") === "hover") p.removeAttribute("data-wm-state");
        });

        if (ok) {
            wmState.score += WM_CONFIG.POINTS_CORRECT;
            wmState.streak++;
            wmState.correctCount++;
            if (wmState.streak >= 2) {
                wmState.score += WM_CONFIG.STREAK_BONUS * (wmState.streak - 1);
            }
            if (wmState.streak > wmState.maxStreak) wmState.maxStreak = wmState.streak;
            setCountryState(code, "correct");
            showFeedback(true, null, wmState.streak);
        } else {
            wmState.streak = 0;
            wmState.incorrectCount++;
            setCountryState(code, "incorrect");
            setCountryState(cur.answer, "correct");
            showFeedback(false, cur.answerName, 0);
        }

        animateAnswer(code, ok);

        if (el.score)   el.score.textContent   = wmState.score;
        if (el.correct) el.correct.textContent = wmState.correctCount;

        if (el.nextBtn) {
            el.nextBtn.disabled = false;
            var last = wmState.currentIndex === wmState.questions.length - 1;
            el.nextBtn.textContent = last ? "Посмотреть результат \u2192" : "Следующий вопрос \u2192";
        }
    }

    /* === 10. FEEDBACK === */
    function showFeedback(ok, wrongName, streak) {
        if (!el.feedback) return;
        el.feedback.className = "wm-feedback";
        var txt;
        if (ok) {
            var pts = WM_CONFIG.POINTS_CORRECT;
            txt = "\u2713 Правильно! +" + pts + " очков";
            if (streak >= 2) txt += " \uD83D\uDD25 Серия x" + streak + " (бонус +" + (WM_CONFIG.STREAK_BONUS * (streak-1)) + ")";
            el.feedback.classList.add("wm-show", "wm-success");
        } else {
            txt = "\u2715 Неправильно! Правильный ответ: " + wrongName;
            el.feedback.classList.add("wm-show", "wm-error");
        }
        el.feedback.textContent = txt;

        if (!rmq() && typeof gsap !== "undefined") {
            gsap.fromTo(el.feedback,
                { opacity: 0, y: -8, scale: 0.97 },
                { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: "back.out(1.4)", clearProps: "transform" }
            );
        }
    }

    function hideFeedback() {
        if (!el.feedback) return;
        el.feedback.className = "wm-feedback";
        el.feedback.textContent = "";
    }

    /* === 11. АНИМАЦИИ === */
    function animateAnswer(code, ok) {
        if (rmq() || typeof gsap === "undefined") return;
        var paths = pathsByCode(code);
        if (!paths.length) return;
        if (ok) {
            gsap.timeline()
                .to(paths, { attr: { "fill-opacity": 0.5 }, duration: 0.15 })
                .to(paths, { attr: { "fill-opacity": 1 }, duration: 0.3 });
        } else {
            gsap.to(paths, {
                keyframes: [
                    { x: -5, duration: 0.06 },
                    { x:  5, duration: 0.06 },
                    { x: -3, duration: 0.05 },
                    { x:  3, duration: 0.05 },
                    { x:  0, duration: 0.05 }
                ],
                clearProps: "x"
            });
        }
    }

    function animateQIn() {
        if (rmq() || typeof gsap === "undefined") return;
        var nodes = [
            document.querySelector(".wm-question-box"),
            document.querySelector(".wm-hints"),
            document.querySelector(".wm-map-wrap"),
            document.querySelector(".wm-bottom")
        ].filter(Boolean);
        gsap.fromTo(nodes,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power3.out", clearProps: "opacity,transform" }
        );
    }

    function animateResultIn() {
        if (rmq() || typeof gsap === "undefined") return;
        var rs = document.getElementById("wmResultScreen");
        if (rs) {
            gsap.fromTo(rs,
                { opacity: 0, y: 22 },
                { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", clearProps: "transform" }
            );
        }
        gsap.fromTo(".wm-result-card",
            { opacity: 0, y: 12, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.06, ease: "power3.out", clearProps: "opacity,transform", delay: 0.15 }
        );
        if (el.resScore) {
            var target = wmState.score;
            var obj = { v: 0 };
            gsap.fromTo(el.resScore, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.8)" });
            gsap.to(obj, {
                v: target, duration: 1.1, ease: "power2.out", delay: 0.3,
                onUpdate: function() { el.resScore.textContent = Math.round(obj.v); },
                onComplete: function() { el.resScore.textContent = target; }
            });
        }
    }


    /* === 12. ЗАГРУЗКА ВОПРОСА === */
    function loadQuestion() {
        var cur = wmState.questions[wmState.currentIndex];
        if (el.qNum)    el.qNum.textContent    = (wmState.currentIndex + 1) + " / " + wmState.questions.length;
        if (el.progFill) el.progFill.style.width = ((wmState.currentIndex / wmState.questions.length) * 100) + "%";
        if (el.question) el.question.textContent = cur.question;

        hideFeedback();
        if (el.nextBtn) el.nextBtn.disabled = true;
        wmState.answered  = false;
        wmState.mapLocked = false;
        wmState.fiftyUsed = false;
        wmState.computerUsed = false;

        if (el.fiftyBtn) { el.fiftyBtn.disabled = false; el.fiftyBtn.classList.remove("wm-used"); }
        if (el.compBtn)  { el.compBtn.disabled  = false; el.compBtn.classList.remove("wm-used"); }

        clearAllStates();
        animateQIn();
    }

    function nextQuestion() {
        if (!wmState.answered || !el.nextBtn || el.nextBtn.disabled) return;
        el.nextBtn.disabled = true;
        wmState.currentIndex++;

        if (wmState.currentIndex >= wmState.questions.length) {
            endGame();
            return;
        }

        if (!rmq() && typeof gsap !== "undefined") {
            var areas = [
                document.querySelector(".wm-question-box"),
                document.querySelector(".wm-map-wrap"),
                el.feedback
            ].filter(Boolean);
            gsap.to(areas, {
                opacity: 0, x: -16, duration: 0.2, ease: "power2.in",
                onComplete: function() {
                    loadQuestion();
                    gsap.fromTo(areas,
                        { opacity: 0, x: 16 },
                        { opacity: 1, x: 0, duration: 0.35, ease: "power3.out", clearProps: "opacity,transform" }
                    );
                }
            });
        } else {
            loadQuestion();
        }
    }

    /* === 13. КОНЕЦ ИГРЫ === */
    function endGame() {
        wmState.mapLocked = true;
        if (el.progFill) el.progFill.style.width = "100%";

        var session = {
            total: wmState.questions.length,
            correct: wmState.correctCount,
            incorrect: wmState.incorrectCount,
            score: wmState.score,
            maxStreak: wmState.maxStreak
        };
        saveSession(session);

        if (el.gameArea) el.gameArea.style.display = "none";
        if (el.result)   el.result.style.display = "flex";

        var acc = wmState.questions.length > 0
            ? Math.round((wmState.correctCount / wmState.questions.length) * 100) + "%"
            : "0%";

        if (el.resTitle) {
            el.resTitle.textContent =
                wmState.correctCount >= wmState.questions.length ? "Идеальный результат!" :
                wmState.correctCount >= Math.ceil(wmState.questions.length * 0.7) ? "Отличная игра!" :
                "Попробуй ещё раз!";
        }

        if (el.resScore) el.resScore.textContent = "0";

        if (el.resStats) {
            el.resStats.innerHTML =
                mkCard("\u2713", "Правильно",  wmState.correctCount) +
                mkCard("\u2715", "Неверно",    wmState.incorrectCount) +
                mkCard("\uD83D\uDCCA", "Точность",   acc) +
                mkCard("\uD83D\uDD25", "Серия",      wmState.maxStreak) +
                mkCard("\u2753", "Вопросов",   wmState.questions.length) +
                mkCard("\u2B50", "Очков",      wmState.score);
        }

        animateResultIn();
    }

    function mkCard(icon, label, val) {
        return '<div class="wm-result-card">' +
            '<span class="wm-rc-icon">' + icon + '</span>' +
            '<span class="wm-rc-label">' + label + '</span>' +
            '<span class="wm-rc-value">' + val + '</span>' +
            '</div>';
    }

    /* === 14. СОХРАНЕНИЕ СТАТИСТИКИ === */
    function saveSession(session) {
        /* Интеграция в глобальную статистику */
        if (typeof playerStats !== "undefined" && typeof saveStats === "function") {
            playerStats.gamesPlayed    = (playerStats.gamesPlayed    || 0) + 1;
            playerStats.totalQuestions = (playerStats.totalQuestions || 0) + session.total;
            playerStats.correctAnswers = (playerStats.correctAnswers || 0) + session.correct;
            playerStats.incorrectAnswers = (playerStats.incorrectAnswers || 0) + session.incorrect;
            if (session.maxStreak > (playerStats.maxStreak || 0)) playerStats.maxStreak = session.maxStreak;
            if (session.score > (playerStats.bestScore || 0)) playerStats.bestScore = session.score;
            saveStats();
            if (typeof updateStatsUI === "function") updateStatsUI(true);
            if (typeof checkAchievements === "function") checkAchievements();
            if (typeof renderAchievements === "function") renderAchievements();
        }

        /* Отдельная запись для режима карты */
        try {
            var raw = localStorage.getItem(WM_CONFIG.STORAGE_KEY);
            var s = raw ? JSON.parse(raw) : { gamesPlayed:0, bestScore:0, correctAnswers:0, bestStreak:0 };
            s.gamesPlayed    = (s.gamesPlayed    || 0) + 1;
            s.correctAnswers = (s.correctAnswers || 0) + session.correct;
            if (session.score    > (s.bestScore  || 0)) s.bestScore  = session.score;
            if (session.maxStreak > (s.bestStreak || 0)) s.bestStreak = session.maxStreak;
            localStorage.setItem(WM_CONFIG.STORAGE_KEY, JSON.stringify(s));
        } catch(e) {}
    }


    /* === 15. ПОДСКАЗКИ === */
    function fiftyHint() {
        if (wmState.fiftyUsed || wmState.answered) return;
        wmState.fiftyUsed = true;
        if (el.fiftyBtn) { el.fiftyBtn.disabled = true; el.fiftyBtn.classList.add("wm-used"); }

        /* Затемняем ~60% карты (не правильный ответ) */
        var cur = wmState.questions[wmState.currentIndex];
        var wrong = Object.keys(CN_RU).filter(function(c) { return c !== cur.answer; });
        var grey = shuffle(wrong).slice(0, 60);

        grey.forEach(function(code) {
            pathsByCode(code).forEach(function(p) {
                if (!p.getAttribute("data-wm-state")) {
                    p.style.opacity = "0.18";
                    p.style.pointerEvents = "none";
                    wmState.dimmedPaths.push(p);
                }
            });
        });

        if (!rmq() && typeof gsap !== "undefined" && el.fiftyBtn) {
            gsap.to(el.fiftyBtn, { scale: 0.95, opacity: 0.45, duration: 0.28, ease: "power2.out" });
        }
    }

    function computerHint() {
        if (wmState.computerUsed || wmState.answered) return;
        wmState.computerUsed = true;
        wmState.hintActive = true;
        if (el.compBtn) { el.compBtn.disabled = true; el.compBtn.classList.add("wm-used"); }

        var cur = wmState.questions[wmState.currentIndex];
        setCountryState(cur.answer, "hint");

        if (!rmq() && typeof gsap !== "undefined") {
            var paths = pathsByCode(cur.answer);
            if (paths.length) {
                gsap.timeline({ repeat: 2, yoyo: true })
                    .to(paths, { attr: { "fill-opacity": 0.55 }, duration: 0.5, ease: "sine.inOut" })
                    .to(paths, { attr: { "fill-opacity": 1 },    duration: 0.5, ease: "sine.inOut" });
            }
            gsap.to(el.compBtn, { scale: 0.95, opacity: 0.45, duration: 0.28, ease: "power2.out" });
        }
    }

    /* === 16. КАРТА: инициализация === */
    function initMap() {
        var cont = mapCont();
        if (!cont) return;
        cont.innerHTML = "";

        if (typeof svgMap === "undefined") {
            cont.innerHTML = '<p style="color:var(--muted);text-align:center;padding:60px 20px">Загрузка карты...</p>';
            return;
        }

        try {
            new svgMap({
                targetElementID: "wmMapContainer",
                colorMax:    "#1e2d45",
                colorMin:    "#1e2d45",
                colorNoData: "#1e2d45",
                flagType:    "none",
                data: {
                    data: { x: { name:"", format:"", thousandSeparator:"" } },
                    applyData: "x",
                    values: {}
                },
                onGetTooltip: function() { return ""; }
            });
        } catch(e) {
            console.warn("[WorldMap] svgMap error:", e);
        }

        /* Вешаем обработчики после рендера */
        setTimeout(attachMapHandlers, 400);
    }

    /* === 17. СТАРТ / РЕСТАРТ === */
    function startGame() {
        if (typeof MAP_QUESTIONS === "undefined") {
            alert("Ошибка: worldmap-questions.js не загружен");
            return;
        }

        wmState.currentIndex  = 0;
        wmState.score         = 0;
        wmState.correctCount  = 0;
        wmState.incorrectCount = 0;
        wmState.streak        = 0;
        wmState.maxStreak     = 0;
        wmState.answered      = false;
        wmState.mapLocked     = false;
        wmState.dimmedPaths   = [];
        wmState.hintActive    = false;

        wmState.questions = shuffle(MAP_QUESTIONS).slice(0, WM_CONFIG.TOTAL_QUESTIONS);

        if (el.score)   el.score.textContent   = "0";
        if (el.correct) el.correct.textContent = "0";

        if (el.gameArea) el.gameArea.style.display = "block";
        if (el.result)   el.result.style.display   = "none";

        initMap();
        loadQuestion();
    }

    /* === 18. ОТКРЫТЬ / ЗАКРЫТЬ РЕЖИМ === */
    function openMode() {
        var overlay = document.getElementById("worldMapMode");
        if (!overlay) return;
        overlay.classList.add("wm-active");
        document.body.style.overflow = "hidden";

        if (!rmq() && typeof gsap !== "undefined") {
            gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: "power2.out", clearProps: "opacity" });
        }

        startGame();
    }

    function closeMode() {
        var overlay = document.getElementById("worldMapMode");
        if (!overlay) return;

        function doClose() {
            overlay.classList.remove("wm-active");
            document.body.style.overflow = "";
        }

        if (!rmq() && typeof gsap !== "undefined") {
            gsap.to(overlay, { opacity: 0, duration: 0.22, ease: "power2.in", onComplete: doClose });
        } else {
            doClose();
        }
    }


    /* === 19. HTML ОВЕРЛЕЯ === */
    function injectHTML() {
        if (document.getElementById("worldMapMode")) return;

        var html = [
            '<div id="worldMapMode" aria-label="Режим Карта мира">',
            '<div class="wm-tooltip" id="wmTooltip"></div>',

            '<header class="wm-header">',
            '<div class="wm-title"><span class="wm-title-badge">\uD83D\uDDFA\uFE0F \u041A\u0410\u0420\u0422\u0410 \u041C\u0418\u0420\u0410</span></div>',
            '<button class="wm-exit-btn" id="wmExitBtn">\u2190 \u0412\u044B\u0439\u0442\u0438</button>',
            '</header>',

            '<div class="wm-content">',

            '<div id="wmGameArea">',

            '<div class="wm-hud">',
            '<div class="wm-progress-wrap">',
            '<div class="wm-progress-label"><span class="wm-live-dot"></span> \u0412\u041E\u041F\u0420\u041E\u0421 <span id="wmQuestionNum">1 / 8</span></div>',
            '<div class="wm-progress-bar"><div class="wm-progress-fill" id="wmProgressFill"></div></div>',
            '</div>',
            '<div class="wm-stat-pill"><span>\u041E\u0427\u041A\u0418</span><strong id="wmScore">0</strong></div>',
            '<div class="wm-stat-pill wm-correct"><span>\u0412\u0415\u0420\u041D\u041E</span><strong id="wmCorrect">0</strong></div>',
            '</div>',

            '<div class="wm-question-box">',
            '<span class="wm-question-label">\u0412\u041E\u041F\u0420\u041E\u0421</span>',
            '<h2 class="wm-question-text" id="wmQuestion">\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...</h2>',
            '<p class="wm-question-hint">\u041D\u0430\u0436\u043C\u0438 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0443 \u043D\u0430 \u043A\u0430\u0440\u0442\u0435</p>',
            '</div>',

            '<div class="wm-feedback" id="wmFeedback" aria-live="polite"></div>',

            '<div class="wm-hints">',
            '<button class="wm-hint-btn" id="wmFiftyBtn">\u26A1 50 / 50</button>',
            '<button class="wm-hint-btn" id="wmComputerBtn">\uD83D\uDCBB \u041F\u043E\u043C\u043E\u0449\u044C \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430</button>',
            '</div>',

            '<div class="wm-map-wrap"><div id="wmMapContainer" class="wm-map-container"></div></div>',

            '<div class="wm-bottom">',
            '<div class="wm-bottom-hint">\uD83D\uDCA1 \u041D\u0430\u0436\u043C\u0438 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0443 \u043D\u0430 \u043A\u0430\u0440\u0442\u0435</div>',
            '<button class="wm-next-btn" id="wmNextBtn" disabled>\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0432\u043E\u043F\u0440\u043E\u0441 \u2192</button>',
            '</div>',

            '</div>',

            '<div id="wmResultScreen" class="wm-result-screen" style="display:none">',
            '<div class="wm-result-icon">\uD83C\uDFC6</div>',
            '<span class="wm-result-label">\u0418\u0413\u0420\u0410 \u0417\u0410\u0412\u0415\u0420\u0428\u0415\u041D\u0410</span>',
            '<h2 class="wm-result-title" id="wmResultTitle">\u041E\u0442\u043B\u0438\u0447\u043D\u0430\u044F \u0438\u0433\u0440\u0430!</h2>',
            '<p style="color:var(--muted);font-size:14px">\u0422\u0432\u043E\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442</p>',
            '<div class="wm-result-score" id="wmResultScore">0</div>',
            '<div class="wm-result-grid" id="wmResultStats"></div>',
            '<div class="wm-result-actions">',
            '<button class="wm-next-btn" id="wmRestartBtn">\u0418\u0433\u0440\u0430\u0442\u044C \u0441\u043D\u043E\u0432\u0430 \u21BB</button>',
            '<button class="wm-back-btn" id="wmBackBtn">\u2190 \u0412 \u0433\u043B\u0430\u0432\u043D\u043E\u0435 \u043C\u0435\u043D\u044E</button>',
            '</div>',
            '</div>',

            '</div>',
            '</div>'
        ].join("");

        document.body.insertAdjacentHTML("beforeend", html);
    }

    /* === 20. КНОПКА РЕЖИМА НА СТАРТОВОМ ЭКРАНЕ === */
    function addModeButton() {
        var ss = document.getElementById("startScreen");
        if (!ss || document.getElementById("wmModeRow")) return;

        var sb = document.getElementById("startBtn");
        if (!sb) return;

        var pickerHTML = [
            '<div class="wm-mode-picker" id="wmModeRow">',
            '<button class="wm-mode-btn wm-mode-active" id="wmModeClassic">',
            '<span class="wm-mode-icon">\uD83C\uDFAF</span>\u041A\u043B\u0430\u0441\u0441\u0438\u0447\u0435\u0441\u043A\u0438\u0439',
            '</button>',
            '<button class="wm-mode-btn" id="wmModeMap">',
            '<span class="wm-mode-icon">\uD83D\uDDFA\uFE0F</span>\u041A\u0430\u0440\u0442\u0430 \u043C\u0438\u0440\u0430',
            '</button>',
            '</div>'
        ].join("");

        ss.insertAdjacentHTML("afterbegin", pickerHTML);

        var origOnClick = sb.onclick;
        var origText    = sb.textContent;

        document.getElementById("wmModeClassic").addEventListener("click", function() {
            this.classList.add("wm-mode-active");
            document.getElementById("wmModeMap").classList.remove("wm-mode-active");
            sb.textContent = origText;
            sb.onclick = origOnClick;
        });

        document.getElementById("wmModeMap").addEventListener("click", function() {
            this.classList.add("wm-mode-active");
            document.getElementById("wmModeClassic").classList.remove("wm-mode-active");
            sb.textContent = "\uD83D\uDDFA\uFE0F \u041D\u0430\u0447\u0430\u0442\u044C \u041A\u0430\u0440\u0442\u0443 \u043C\u0438\u0440\u0430 \u2192";
            sb.onclick = function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                openMode();
            };
        });
    }

    /* === 21. СОБЫТИЯ === */
    function bindEvents() {
        document.addEventListener("click", function(e) {
            var id = e.target.id;
            if (id === "wmExitBtn")    closeMode();
            if (id === "wmNextBtn")    nextQuestion();
            if (id === "wmFiftyBtn")   fiftyHint();
            if (id === "wmComputerBtn") computerHint();
            if (id === "wmRestartBtn") startGame();
            if (id === "wmBackBtn")    closeMode();
        });
    }

    /* === 22. ЗАГРУЗКА svgMap === */
    function loadLib(cb) {
        if (typeof svgMap !== "undefined") { cb(); return; }
        var s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/svgmap/dist/svgMap.min.js";
        s.onload = function() {
            var lnk = document.createElement("link");
            lnk.rel = "stylesheet";
            lnk.href = "https://cdn.jsdelivr.net/npm/svgmap/dist/svgMap.min.css";
            document.head.appendChild(lnk);
            cb();
        };
        s.onerror = function() { console.error("[WorldMap] svgMap CDN failed"); };
        document.head.appendChild(s);
    }

    /* === 23. ТОЧКА ВХОДА === */
    function init() {
        injectHTML();
        getEls();
        addModeButton();
        bindEvents();
        loadLib(function() { /* ready */ });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
