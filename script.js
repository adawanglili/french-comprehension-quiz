let current = 0;

function loadQuestion() {
  const q = questions[current];

  document.getElementById("q-number").innerText = `Question ${q.id}`;

  document.getElementById("french").innerText = q.french;
  document.getElementById("english").innerText = q.english;
  document.getElementById("chinese").innerText = q.chinese;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  q.options.forEach((opt, index) => {
    const div = document.createElement("div");
    div.className = "option";
    div.innerText = opt;

    div.onclick = () => selectAnswer(div, index);

    optionsDiv.appendChild(div);
  });
}

function selectAnswer(element, index) {
  const correctIndex = questions[current].correct;
  const options = document.querySelectorAll(".option");

  options.forEach((opt, i) => {
    opt.onclick = null;

    if (i === correctIndex) {
      opt.classList.add("correct");
    } else if (i === index) {
      opt.classList.add("wrong");
    }
  });

  setTimeout(() => {
    current++;
    if (current < questions.length) {
      loadQuestion();
    } else {
      document.querySelector(".container").innerHTML =
        "<h2>🎉 Completed!</h2>";
    }
  }, 1500);
}

loadQuestion();