var current = 0;
var score = 0;
var wrongList = [];
var activeQuestions = [];
var timerInterval = null;
var secondsLeft = 3600;
// Track answered state: { chosenIdx, correctIdx } or null
var answers = [];

function init(questionSet) {
  activeQuestions = questionSet.slice();
  answers = new Array(activeQuestions.length).fill(null);
  current = 0;
  score = 0;
  wrongList = [];
  secondsLeft = 3600;
  clearInterval(timerInterval);
  startTimer();
  loadQuestion();
}

/* ── Timer ── */
function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(function() {
    secondsLeft--;
    updateTimerDisplay();
    if (secondsLeft <= 0) { clearInterval(timerInterval); endQuiz(); }
  }, 1000);
}

function updateTimerDisplay() {
  var el = document.getElementById("timer");
  if (!el) return;
  var h = Math.floor(secondsLeft / 3600);
  var m = Math.floor((secondsLeft % 3600) / 60);
  var s = secondsLeft % 60;
  el.textContent = pad(h) + ":" + pad(m) + ":" + pad(s);
  el.className = secondsLeft <= 300 ? "danger" : secondsLeft <= 600 ? "warning" : "";
}

function pad(n) { return n < 10 ? "0" + n : "" + n; }

/* ── Load question ── */
function loadQuestion() {
  var q = activeQuestions[current];

  document.getElementById("q-number").textContent =
    "Q " + (current + 1) + " / " + activeQuestions.length;
  document.getElementById("score-display").textContent = "Score: " + score;

  var pct = (current / activeQuestions.length) * 100;
  document.getElementById("progress").style.width = pct + "%";

  document.getElementById("french-text").textContent = q.french;
  document.getElementById("content-en").textContent = q.english;
  document.getElementById("content-cn").textContent = q.chinese;

  collapseTranslation("en");
  collapseTranslation("cn");

  // Build options
  var optDiv = document.getElementById("options");
  optDiv.innerHTML = "";
  for (var i = 0; i < q.options.length; i++) {
    (function(idx) {
      var label = document.createElement("label");
      label.className = "option";

      var radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "answer";
      radio.value = idx;

      var span = document.createElement("span");
      span.textContent = q.options[idx];

      label.appendChild(radio);
      label.appendChild(span);
      label.addEventListener("click", function() { selectAnswer(idx); });
      optDiv.appendChild(label);
    })(i);
  }

  // If already answered, restore state
  var saved = answers[current];
  if (saved !== null) {
    renderAnswered(saved.chosenIdx, saved.correctIdx);
  }

  updateNavButtons();
}

/* ── Select answer ── */
function selectAnswer(chosenIdx) {
  if (answers[current] !== null) return; // already answered

  var correctIdx = activeQuestions[current].correct;
  answers[current] = { chosenIdx: chosenIdx, correctIdx: correctIdx };

  if (chosenIdx === correctIdx) {
    score++;
    document.getElementById("score-display").textContent = "Score: " + score;
  } else {
    wrongList.push(activeQuestions[current]);
  }

  renderAnswered(chosenIdx, correctIdx);
  updateNavButtons();
}

function renderAnswered(chosenIdx, correctIdx) {
  // Disable options and show correct/wrong
  var labels = document.querySelectorAll(".option");
  for (var i = 0; i < labels.length; i++) {
    var newLabel = labels[i].cloneNode(true);
    labels[i].parentNode.replaceChild(newLabel, labels[i]);
  }
  var updated = document.querySelectorAll(".option");
  for (var j = 0; j < updated.length; j++) {
    var radio = updated[j].querySelector("input");
    if (j === correctIdx) {
      updated[j].classList.add("correct");
      if (j === chosenIdx) radio.checked = true;
    } else if (j === chosenIdx) {
      updated[j].classList.add("wrong");
      radio.checked = true;
    }
    radio.disabled = true;
  }
}

/* ── Navigation ── */
function goToPrev() {
  if (current > 0) {
    current--;
    loadQuestion();
  }
}

function goToNext() {
  if (current < activeQuestions.length - 1) {
    current++;
    loadQuestion();
  } else {
    endQuiz();
  }
}

function updateNavButtons() {
  var prev = document.getElementById("btn-prev");
  var next = document.getElementById("btn-next");
  if (!prev || !next) return;

  prev.disabled = (current === 0);
  prev.style.opacity = (current === 0) ? "0.35" : "1";

  var isLast = (current === activeQuestions.length - 1);
  next.textContent = isLast ? "Finish →" : "Next →";
}

/* ── Translations ── */
function collapseTranslation(id) {
  var content = document.getElementById("content-" + id);
  var arrow = document.getElementById("arrow-" + id);
  var toggle = document.getElementById("toggle-" + id);
  if (content) content.classList.remove("visible");
  if (arrow) arrow.style.transform = "";
  if (toggle) toggle.classList.remove("open");
}

function expandTranslation(id) {
  var content = document.getElementById("content-" + id);
  var arrow = document.getElementById("arrow-" + id);
  var toggle = document.getElementById("toggle-" + id);
  if (content) content.classList.add("visible");
  if (arrow) arrow.style.transform = "rotate(180deg)";
  if (toggle) toggle.classList.add("open");
}

function toggleTranslation(id) {
  var content = document.getElementById("content-" + id);
  if (!content) return;
  if (content.classList.contains("visible")) {
    collapseTranslation(id);
  } else {
    expandTranslation(id);
  }
}

/* ── Get level from score ── */
function getLevel(s) {
  if (s <= 12) return "X (below A / inférieur à A)";
  if (s <= 16) return "X/A";
  if (s <= 20) return "A";
  if (s <= 24) return "A/B";
  if (s <= 28) return "B";
  if (s <= 32) return "B/C";
  return "C";
}

function getLevelClass(s) {
  if (s <= 12) return "level-x";
  if (s <= 16) return "level-xa";
  if (s <= 20) return "level-a";
  if (s <= 24) return "level-ab";
  if (s <= 28) return "level-b";
  if (s <= 32) return "level-bc";
  return "level-c";
}

/* ── End quiz ── */
function endQuiz() {
  clearInterval(timerInterval);
  score = 0;
  for (var i = 0; i < answers.length; i++) {
    if (answers[i] !== null && answers[i].chosenIdx === answers[i].correctIdx) score++;
  }
  var total = activeQuestions.length;
  var timeUsed = 3600 - secondsLeft;
  var tm = Math.floor(timeUsed / 60);
  var ts = timeUsed % 60;
  var timeStr = tm + " min " + ts + " sec";
  var overtime = timeUsed > 3600;
  var level = getLevel(score);
  var lvlClass = getLevelClass(score);

  var retryBtn = wrongList.length > 0
    ? '<button class="btn btn-warning" onclick="retryWrong()">Retry ' + wrongList.length + ' Wrong Answer' + (wrongList.length > 1 ? "s" : "") + '</button>'
    : "";

  var rows = [
    ["1–12",  "X (below A)",  "level-x"],
    ["13–16", "X/A",          "level-xa"],
    ["17–20", "A",            "level-a"],
    ["21–24", "A/B",          "level-ab"],
    ["25–28", "B",            "level-b"],
    ["29–32", "B/C",          "level-bc"],
    ["33–40", "C",            "level-c"]
  ];
  var rows_fr = [
    ["1–12",  "X (inférieur à A)", "level-x"],
    ["13–16", "X/A",               "level-xa"],
    ["17–20", "A",                 "level-a"],
    ["21–24", "A/B",               "level-ab"],
    ["25–28", "B",                 "level-b"],
    ["29–32", "B/C",               "level-bc"],
    ["33–40", "C",                 "level-c"]
  ];

  function buildTable(rowData, scoreCol, levelCol) {
    var t = '<table class="level-table"><thead><tr><th>' + scoreCol + '</th><th>' + levelCol + '</th></tr></thead><tbody>';
    for (var i = 0; i < rowData.length; i++) {
      var r = rowData[i];
      var highlight = (r[2] === lvlClass) ? ' class="highlight"' : '';
      t += '<tr' + highlight + '><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>';
    }
    t += '</tbody></table>';
    return t;
  }

  var overtimeWarningEN = overtime
    ? '<p class="overtime-warn">⚠ You took longer than 60 minutes to complete the Level Test. Your score may not be an accurate predictor of your level.</p>'
    : '';
  var overtimeWarningFR = overtime
    ? '<p class="overtime-warn">⚠ Vous avez pris plus de 60 minutes pour compléter ce Test de niveau. Votre note n\'est peut-être pas représentative de votre niveau.</p>'
    : '';

  document.querySelector(".container").innerHTML =
    '<div class="summary">' +

    // ── English section ──
    '<div class="summary-section">' +
      '<div class="summary-flag">🇬🇧 English</div>' +
      '<h2>Level Test for Reading Comprehension in the Second Official Language</h2>' +
      '<p>Thank you for completing this Level Test. Your result is not official, but will provide you with an indication of the level that you may achieve on the SLE – Test of Reading Comprehension.</p>' +
      '<p style="margin-top:8px">Please print this page for your records.</p>' +
      '<div class="score-block">' +
        '<div class="score-label">You obtained</div>' +
        '<div class="score-num">' + score + '<span class="score-total"> / ' + total + '</span></div>' +
        '<div class="score-level ' + lvlClass + '">Level: ' + level + '</div>' +
      '</div>' +
      '<p style="margin-bottom:10px">Use the table below to find the level associated with your score.</p>' +
      buildTable(rows, "Score", "Level") +
      '<p class="time-taken">It took you <strong>' + timeStr + '</strong> to complete the Level Check.</p>' +
      overtimeWarningEN +
    '</div>' +

    '<hr class="summary-divider">' +

    // ── French section ──
    '<div class="summary-section">' +
      '<div class="summary-flag">🇫🇷 Français</div>' +
      '<h2>Test de niveau pour la compréhension de l\'écrit dans la seconde langue officielle</h2>' +
      '<p>Merci d\'avoir complété le Test de niveau. Votre résultat n\'est pas officiel et a pour but de vous donner une idée du niveau que vous pourriez obtenir au Test de compréhension de l\'ELS.</p>' +
      '<p style="margin-top:8px">Veuillez imprimer cette page pour vos dossiers.</p>' +
      '<div class="score-block">' +
        '<div class="score-label">Vous avez obtenu</div>' +
        '<div class="score-num">' + score + '<span class="score-total"> / ' + total + '</span></div>' +
        '<div class="score-level ' + lvlClass + '">Niveau : ' + level + '</div>' +
      '</div>' +
      '<p style="margin-bottom:10px">Veuillez utiliser le tableau ci-dessous pour connaître le niveau associé à la note que vous avez obtenue.</p>' +
      buildTable(rows_fr, "Note", "Niveau") +
      '<p class="time-taken">Cela vous a pris <strong>' + timeStr + '</strong> pour répondre aux questions du Test de niveau.</p>' +
      overtimeWarningFR +
      '<p style="margin-top:12px">Si vous avez des commentaires à formuler, veuillez aller à la page suivante.</p>' +
    '</div>' +

    // ── Buttons ──
    '<div class="summary-actions">' +
      retryBtn +
      '<button class="btn btn-primary" onclick="window.print()">🖨 Print this page</button>' +
      '<button class="btn btn-secondary" onclick="location.reload()">Start Over</button>' +
      '<a href="landing.html" class="btn btn-secondary">← Back to Tests</a>' +
    '</div>' +

    '</div>';
}

/* ── Retry wrong ── */
function retryWrong() {
  var saved = wrongList.slice();
  document.querySelector(".container").innerHTML =
    '<div class="top-bar">' +
      '<a href="landing.html" class="back-link">← Back</a>' +
      '<span id="q-number"></span>' +
      '<span id="score-display">Score: 0</span>' +
    '</div>' +
    '<div id="timer">01:00:00</div>' +
    '<div id="progress-bar"><div id="progress"></div></div>' +
    '<div class="passage-label">🇫🇷 French</div>' +
    '<div class="passage" id="french-text"></div>' +
    '<div class="translation-block">' +
      '<div class="translation-toggle" id="toggle-en" onclick="toggleTranslation(\'en\')">' +
        '<span><span class="lang-badge en-badge">EN</span> &nbsp;English Translation</span>' +
        '<span class="arrow" id="arrow-en">▼</span>' +
      '</div>' +
      '<div class="translation-content" id="content-en"></div>' +
    '</div>' +
    '<div class="translation-block">' +
      '<div class="translation-toggle" id="toggle-cn" onclick="toggleTranslation(\'cn\')">' +
        '<span><span class="lang-badge cn-badge">中文</span> &nbsp;Chinese Translation</span>' +
        '<span class="arrow" id="arrow-cn">▼</span>' +
      '</div>' +
      '<div class="translation-content" id="content-cn"></div>' +
    '</div>' +
    '<div class="question-prompt" id="question-prompt">Choose the best answer:</div>' +
    '<div id="options"></div>' +
    '<div class="nav-buttons">' +
      '<button class="btn btn-nav" id="btn-prev" onclick="goToPrev()">← Previous</button>' +
      '<button class="btn btn-nav" id="btn-next" onclick="goToNext()">Next →</button>' +
    '</div>';

  init(saved);
}

// Start
init(questions);
