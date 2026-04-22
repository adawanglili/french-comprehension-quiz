var current = 0;
var score = 0;
var wrongList = [];
var activeQuestions = [];
var timerInterval = null;
var secondsLeft = 3600;

function init(questionSet) {
  activeQuestions = questionSet.slice();
  current = 0;
  score = 0;
  wrongList = [];
  secondsLeft = 3600;
  clearInterval(timerInterval);
  startTimer();
  loadQuestion();
}

function startTimer() {
  updateTimerDisplay();
  timerInterval = setInterval(function() {
    secondsLeft--;
    updateTimerDisplay();
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      endQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  var el = document.getElementById("timer");
  if (!el) return;
  var h = Math.floor(secondsLeft / 3600);
  var m = Math.floor((secondsLeft % 3600) / 60);
  var s = secondsLeft % 60;
  el.textContent =
    pad(h) + ":" + pad(m) + ":" + pad(s);
  if (secondsLeft <= 300) {
    el.className = "danger";
  } else if (secondsLeft <= 600) {
    el.className = "warning";
  } else {
    el.className = "";
  }
}

function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}

function loadQuestion() {
  var q = activeQuestions[current];

  document.getElementById("q-number").textContent =
    "Q " + (current + 1) + " / " + activeQuestions.length;
  document.getElementById("score-display").textContent =
    "Score: " + score;

  var pct = (current / activeQuestions.length) * 100;
  document.getElementById("progress").style.width = pct + "%";

  document.getElementById("french-text").textContent = q.french;
  document.getElementById("content-en").textContent = q.english;
  document.getElementById("content-cn").textContent = q.chinese;

  // Collapse both translations
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

      label.addEventListener("click", function() {
        selectAnswer(idx);
      });

      optDiv.appendChild(label);
    })(i);
  }
}

function selectAnswer(chosenIdx) {
  var correctIdx = activeQuestions[current].correct;

  // Remove all click handlers immediately
  var labels = document.querySelectorAll(".option");
  for (var i = 0; i < labels.length; i++) {
    var newLabel = labels[i].cloneNode(true);
    labels[i].parentNode.replaceChild(newLabel, labels[i]);
  }

  // Re-query after clone
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

  if (chosenIdx === correctIdx) {
    score++;
  } else {
    wrongList.push(activeQuestions[current]);
  }

  // Auto-expand translations after answering
  expandTranslation("en");
  expandTranslation("cn");

  setTimeout(function() {
    current++;
    if (current < activeQuestions.length) {
      loadQuestion();
    } else {
      endQuiz();
    }
  }, 1800);
}

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

function endQuiz() {
  clearInterval(timerInterval);
  var pct = Math.round((score / activeQuestions.length) * 100);
  var timeUsed = 3600 - secondsLeft;
  var m = Math.floor(timeUsed / 60);
  var s = timeUsed % 60;

  var retryBtn = wrongList.length > 0
    ? '<button class="btn btn-warning" onclick="retryWrong()">Retry ' + wrongList.length + ' Wrong Answer' + (wrongList.length > 1 ? "s" : "") + '</button>'
    : "";

  document.querySelector(".container").innerHTML =
    '<div class="end-screen">' +
      '<h2>Quiz Complete!</h2>' +
      '<div class="final-score">' + score + ' / ' + activeQuestions.length + '</div>' +
      '<p>' + pct + '% correct &nbsp;&middot;&nbsp; Time used: ' + m + 'm ' + s + 's</p>' +
      retryBtn +
      '<button class="btn btn-primary" onclick="location.reload()">Start Over</button>' +
    '</div>';
}

function retryWrong() {
  var saved = wrongList.slice();
  document.querySelector(".container").innerHTML =
    '<div class="header">' +
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
    '<div id="options"></div>';

  init(saved);
}

// Start with all questions
init(questions);
