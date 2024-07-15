const wordButton = document.getElementById("wordButton");
const mathButton = document.getElementById("mathButton");
const gameArea = document.getElementById("game-area");
const timerElement = document.getElementById("timer");
const actionButtons = document.getElementById("action-buttons");
const foundButton = document.getElementById("foundButton");
const hintButton = document.getElementById("hintButton");
const answerButton = document.getElementById("answerButton");
const gameButtons = document.getElementById("game-buttons");
const inGameButtons = document.getElementById("in-game-buttons");
const homeButton = document.getElementById("homeButton");
const playAgainButton = document.getElementById("playAgainButton");

const letters = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";
const joker = "?";

if (
  !wordButton ||
  !mathButton ||
  !gameArea ||
  !timerElement ||
  !actionButtons ||
  !foundButton ||
  !hintButton ||
  !answerButton ||
  !gameButtons ||
  !inGameButtons ||
  !homeButton ||
  !playAgainButton
) {
  console.error(
    "Bir veya daha fazla HTML elementi bulunamadı. Lütfen element ID'lerini kontrol edin."
  );
} else {
  wordButton.addEventListener(
    "click",
    () => !isGameStarting && !isGameActive && startGame("word")
  );
  mathButton.addEventListener(
    "click",
    () => !isGameStarting && !isGameActive && startGame("math")
  );
  foundButton.addEventListener("click", () => isGameActive && stopTimer());
  hintButton.addEventListener("click", () => isGameActive && showHint());
  answerButton.addEventListener("click", showAnswer);
  homeButton.addEventListener("click", () => !isGameStarting && goToHomePage());
  playAgainButton.addEventListener(
    "click",
    () => !isGameStarting && restartGame()
  );
}

let timer;
let timeLeft = 30;
let gameType = "";
let currentNumbers = [];
let currentTarget = 0;
let animationCount = 0;
let totalAnimations = 9;
let isGameStarting = false;
let isGameActive = false;
let startTimerTimeout;

async function startGame(type) {
  if (isGameStarting || isGameActive) {
    return;
  }
  isGameStarting = true;
  isGameActive = false;

  gameType = type;
  timeLeft = 30;
  clearInterval(timer);
  clearTimeout(startTimerTimeout);

  if (timerElement) {
    timerElement.textContent = timeLeft;
    timerElement.style.display = "block";
    timerElement.style.color = "";
  }
  if (actionButtons) actionButtons.style.display = "block";
  if (foundButton) foundButton.disabled = true;
  if (hintButton) hintButton.disabled = true;
  if (answerButton) answerButton.disabled = true;
  if (gameArea) gameArea.innerHTML = "";

  if (gameButtons) gameButtons.style.display = "none";
  if (inGameButtons) inGameButtons.style.display = "block";

  animationCount = 0;
  totalAnimations = type === "word" ? 9 : 7;

  if (type === "word") {
    await loadWordList();
    await createWordGame();
  } else {
    createMathGame();
  }

  startTimerTimeout = setTimeout(() => {
    startTimer();
    if (foundButton) foundButton.disabled = false;
    if (hintButton) hintButton.disabled = false;
    if (answerButton) answerButton.disabled = false;
    isGameStarting = false;
    isGameActive = true;
  }, (totalAnimations + 1) * 300);
}

function goToHomePage() {
  if (isGameStarting) return;

  clearInterval(timer);
  clearTimeout(startTimerTimeout);
  gameArea.innerHTML = "";
  actionButtons.style.display = "none";
  inGameButtons.style.display = "none";
  gameButtons.style.display = "block";
  timerElement.style.color = "";
  timerElement.textContent = "30";
  timerElement.style.display = "block";
  answerButton.textContent = "CEVAP";
  timeLeft = 30;
  isGameStarting = false;
  isGameActive = false;

  const paginationArea = document.getElementById("pagination-area");
  if (paginationArea) paginationArea.remove();

  const answerArea = document.getElementById("answer-area");
  if (answerArea) answerArea.remove();
}

function restartGame() {
  if (isGameStarting) return;

  clearInterval(timer);
  clearTimeout(startTimerTimeout);
  isGameStarting = false;
  isGameActive = false;

  const answerArea = document.getElementById("answer-area");
  if (answerArea) {
    answerArea.style.display = "none";
  }
  if (answerButton) {
    answerButton.textContent = "CEVAP";
  }

  setTimeout(() => {
    startGame(gameType);
  }, 100);
}

function generateLetters() {
  const letterCount = 8;
  const generatedLetters = [];
  for (let i = 0; i < letterCount; i++) {
    generatedLetters.push(letters[Math.floor(Math.random() * letters.length)]);
  }
  generatedLetters.push(joker);
  return generatedLetters;
}

function generateNumbers() {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 50, 75, 100];
  const generatedNumbers = [];

  for (let i = 0; i < 4; i++) {
    const index = Math.floor(Math.random() * 10);
    generatedNumbers.push(numbers[index]);
  }

  for (let i = 0; i < 2; i++) {
    const index = Math.floor(Math.random() * 4) + 10;
    generatedNumbers.push(numbers[index]);
  }

  return generatedNumbers.sort(() => Math.random() - 0.5);
}

const vowels = "AEIİOÖUÜ";
const consonants = "BCÇDFGĞHJKLMNPRSŞTVYZ";

const consonantFrequency = {
  B: 2, C: 1, Ç: 1, D: 1, F: 1, G: 1, Ğ: 1, H: 1, J: 1, K: 5,
  L: 3, M: 3, N: 3, P: 1, R: 1, S: 3, Ş: 1, T: 1, V: 1, Y: 2, Z: 1
};

const vowelFrequency = {
  A: 8, E: 9, I: 5, İ: 7, O: 3, Ö: 1, U: 3, Ü: 2
};

function getWeightedLetter(isVowel) {
  const frequency = isVowel ? vowelFrequency : consonantFrequency;
  const totalWeight = Object.values(frequency).reduce((a, b) => a + b, 0);
  let random = Math.floor(Math.random() * totalWeight);
  for (let [letter, weight] of Object.entries(frequency)) {
    if (random < weight) return letter;
    random -= weight;
  }
}

function startTimer() {
  clearInterval(timer);
  timeLeft = 30;
  updateTimer();
  timer = setInterval(updateTimer, 1000);
}

function animateLetterOrNumber(element, finalContent, isWord) {
  const chars = isWord ? "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ" : "0123456789";
  let iterations = 0;
  const interval = setInterval(() => {
    element.textContent = chars[Math.floor(Math.random() * chars.length)];
    iterations++;
    if (iterations === 15) {
      clearInterval(interval);
      element.textContent = finalContent;
      animationCount++;
      if (animationCount === totalAnimations + 1) {
        startTimer();
      }
    }
  }, 100);
}

async function createWordGame() {
  let letters = [];
  let vowelCount = 0;

  const vowelDistribution = Math.random();
  if (vowelDistribution < 0.62) {
    vowelCount = 3;
  } else if (vowelDistribution < 0.92) {
    vowelCount = 4;
  } else {
    vowelCount = 5;
  }

  for (let i = 0; i < vowelCount; i++) {
    letters.push(getWeightedLetter(true));
  }

  while (letters.length < 8) {
    letters.push(getWeightedLetter(false));
  }

  letters = letters.sort(() => Math.random() - 0.5);

  letters.push(joker);

  if (gameArea) {
    const lettersContainer = document.createElement("div");
    lettersContainer.id = "letters-container";
    gameArea.appendChild(lettersContainer);

    animationCount = 0;
    letters.forEach((letter, index) => {
      setTimeout(() => {
        const letterBox = document.createElement("div");
        letterBox.className = "letter-box";
        letterBox.style.opacity = "0";
        lettersContainer.appendChild(letterBox);

        setTimeout(() => {
          letterBox.style.opacity = "1";
          animateLetterOrNumber(letterBox, letter, true);
        }, 50);
      }, index * 300);
    });
  }
}

async function findLongestWord(letters, useJoker = false) {
  const availableLetters = letters.slice();
  const jokerIndex = availableLetters.indexOf('?');
  
  if (!window.wordList || window.wordList.length === 0) {
      await loadWordList();
  }
  
  return window.wordList
      .filter(word => canFormWord(word, availableLetters, useJoker))
      .reduce((longest, current) => current.length > longest.length ? current : longest, '');
}

function canFormWord(word, availableLetters, useJoker) {
  const lettersCopy = availableLetters.slice();
  const jokerIndex = lettersCopy.indexOf('?');
  let jokerUsed = false;

  for (let char of word) {
      const index = lettersCopy.indexOf(char);
      if (index !== -1) {
          lettersCopy[index] = null;
      } else if (useJoker && !jokerUsed && jokerIndex !== -1) {
          lettersCopy[jokerIndex] = null;
          jokerUsed = true;
      } else {
          return false;
      }
  }
  return true;
}

function createMathGame() {
  const smallNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const bigNumbers = [25, 50, 75, 100];

  currentNumbers = [];
  for (let i = 0; i < 4; i++) {
    const index = Math.floor(Math.random() * smallNumbers.length);
    currentNumbers.push(smallNumbers[index]);
    smallNumbers.splice(index, 1);
  }

  for (let i = 0; i < 2; i++) {
    const index = Math.floor(Math.random() * bigNumbers.length);
    currentNumbers.push(bigNumbers[index]);
    bigNumbers.splice(index, 1);
  }

  if (gameArea) {
    const numbersContainer = document.createElement("div");
    numbersContainer.id = "numbers-container";
    gameArea.appendChild(numbersContainer);

    animationCount = 0;
    currentNumbers.forEach((number, index) => {
      setTimeout(() => {
        const numberBox = document.createElement("div");
        numberBox.className = "number-box";
        numberBox.style.opacity = "0";
        numbersContainer.appendChild(numberBox);

        setTimeout(() => {
          numberBox.style.opacity = "1";
          animateLetterOrNumber(numberBox, number.toString(), false);
        }, 50);
      }, index * 300);
    });

    currentTarget = Math.floor(Math.random() * 900) + 100;
    setTimeout(() => {
      const targetElement = document.createElement("div");
      targetElement.id = "target";
      targetElement.innerHTML = `Hedef: <span id="target-number">000</span>`;
      targetElement.style.opacity = "0";
      gameArea.appendChild(targetElement);

      setTimeout(() => {
        targetElement.style.opacity = "1";
        const targetNumberElement = document.getElementById("target-number");
        animateNumber(targetNumberElement, currentTarget);
      }, 50);
    }, currentNumbers.length * 300);
  }
}

function animateNumber(element, finalNumber) {
  let current = 0;
  const interval = setInterval(() => {
    current = Math.min(current + Math.ceil(Math.random() * 100), finalNumber);
    element.textContent = current.toString().padStart(3, "0");
    if (current === finalNumber) {
      clearInterval(interval);
      animationCount++;
      if (animationCount === totalAnimations) {
        startTimer();
      }
    }
  }, 100);
}

function createBox(type, content) {
  const box = document.createElement("div");
  box.className = `${type}-box`;
  box.textContent = content;
  gameArea.appendChild(box);
}

function animateBoxes() {
  const boxes = document.querySelectorAll(".letter-box, .number-box, #target");
  boxes.forEach((box, index) => {
    setTimeout(() => {
      box.style.opacity = "1";
    }, index * 500);
  });
}

function stopTimer() {
  if (!isGameActive) return;

  clearInterval(timer);
  clearTimeout(startTimerTimeout);
  if (timerElement) {
    timerElement.style.display = "none";
  }
  if (foundButton) foundButton.disabled = true;
  if (hintButton) hintButton.disabled = true;
  isGameActive = false;
  updateButtonStates();
}

function updateButtonStates() {
  if (foundButton) foundButton.disabled = !isGameActive;
  if (hintButton) hintButton.disabled = !isGameActive;
  if (answerButton) answerButton.disabled = false;
}

function updateTimer() {
  if (timerElement && isGameActive) {
    timerElement.textContent = timeLeft;
    if (timeLeft === 0) {
      clearInterval(timer);
      timerElement.textContent = "Süre doldu!";
      timerElement.style.color = "yellow";
      isGameActive = false;
      const gameAreaContent = document.querySelectorAll("#game-area > *");
      gameAreaContent.forEach((element) => {
        element.style.opacity = "0.5";
      });
    } else {
      timeLeft--;
    }
  }
}

async function showHint() {
  if (isGameStarting) return;

  if (timerElement.style.color === "yellow") {
    clearInterval(timer);
    clearTimeout(startTimerTimeout);
    timerElement.style.color = "";
    updateButtonStates();
  }

  if (gameType === "word") {
    const letters = Array.from(document.querySelectorAll('.letter-box')).map(box => box.textContent);
    const longestWithoutJoker = await findLongestWord(letters, false);
    const longestWithJoker = await findLongestWord(letters, true);
    alert(`En uzun kelime (jokersiz): ${longestWithoutJoker.length} harfli\nEn uzun kelime (jokerli): ${longestWithJoker.length} harfli`);
  } else {
    const solution = solve_numbers(currentNumbers, currentTarget, false);
    const lines = solution.split("\n");
    if (lines.length > 1) {
      alert("Tam çözüm mevcut");
    } else {
      alert("Tam çözüm bulunamadı, yaklaşık çözümler mevcut");
    }
  }
}

let currentPage = 1;
const resultsPerPage = 3;

async function showAnswer() {
  if (isGameStarting) return;

  if (timerElement.style.color === "yellow") {
    clearInterval(timer);
    clearTimeout(startTimerTimeout);
    timerElement.style.color = "";
    updateButtonStates();
  }

  let answerArea = document.getElementById("answer-area");
  if (!answerArea) {
    answerArea = document.createElement("div");
    answerArea.id = "answer-area";
    gameArea.appendChild(answerArea);
  }

  if (answerArea.style.display === "none" || answerArea.style.display === "") {
    if (gameType === "word") {
      const letters = Array.from(document.querySelectorAll('.letter-box')).map(box => box.textContent);
      const longestWithoutJoker = await findLongestWord(letters, false);
      const longestWithJoker = await findLongestWord(letters, true);
      
      const highlightJoker = (word) => {
        const jokerIndex = word.split('').findIndex((char, index) => !letters.includes(char) || (char === '?' && letters.indexOf(char) === index));
        if (jokerIndex !== -1) {
          return word.split('').map((char, index) => 
            index === jokerIndex ? `<span class="joker-letter">${char}</span>` : char
          ).join('');
        }
        return word;
      };

      answerArea.innerHTML = `
        En uzun kelime (jokersiz): ${longestWithoutJoker}<br>
        En uzun kelime (jokerli): ${highlightJoker(longestWithJoker)}
      `;
    } else {
      const solution = solve_numbers(currentNumbers, currentTarget, false);
      allResults = solution.split("\n\n").filter((r) => r.trim() !== "");

      if (allResults.length > 0) {
        displayResults();
        createPagination();
      } else {
        answerArea.textContent = "Çözüm bulunamadı.";
      }
    }
    answerArea.style.display = "block";
    answerButton.textContent = "CEVABI GİZLE";
  } else {
    answerArea.style.display = "none";
    answerButton.textContent = "CEVABI GÖSTER";
    const paginationArea = document.getElementById("pagination-area");
    if (paginationArea) paginationArea.remove();
  }
}

function displayResults() {
  const answerArea = document.getElementById("answer-area");
  const start = (currentPage - 1) * resultsPerPage;
  const end = start + resultsPerPage;
  const pageResults = allResults.slice(start, end);

  answerArea.innerHTML = pageResults.join('<hr>');
}

function createPagination() {
  const totalPages = Math.ceil(allResults.length / resultsPerPage);
  let paginationHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    paginationHTML += `<button onclick="changePage(${i})"${i === currentPage ? ' class="active"' : ''}>${i}</button>`;
  }

  let paginationArea = document.getElementById("pagination-area");
  if (!paginationArea) {
    paginationArea = document.createElement('div');
    paginationArea.id = "pagination-area";
    document.getElementById("answer-area").after(paginationArea);
  }
  paginationArea.innerHTML = paginationHTML;
}

function changePage(page) {
  currentPage = page;
  displayResults();
  createPagination();
}

function stopTimer() {
  clearInterval(timer);
  timerElement.style.color = "#ff3300";
  updateButtonStates();
}

function showPopup(content) {
  let popup = document.createElement("div");
  popup.className = "popup";

  let popupContent = document.createElement("div");
  popupContent.className = "popup-content";

  let contentDiv = document.createElement("div");
  contentDiv.innerHTML = content;

  let closeButton = document.createElement("button");
  closeButton.textContent = "Kapat";
  closeButton.onclick = function () {
    popup.remove();
  };

  popupContent.appendChild(contentDiv);
  popupContent.appendChild(closeButton);
  popup.appendChild(popupContent);
  document.body.appendChild(popup);
}

let wordList = [];

function loadWordList() {
  return new Promise((resolve, reject) => {
      if (window.wordList && window.wordList.length > 0) {
          resolve(window.wordList);
      } else {
          const script = document.createElement('script');
          script.src = 'turkce_kelimeler.js';
          script.onload = () => {
              if (window.wordList && window.wordList.length > 0) {
                  resolve(window.wordList);
              } else {
                  reject(new Error('Kelime listesi yüklenemedi veya boş'));
              }
          };
          script.onerror = () => reject(new Error('Kelime listesi yüklenemedi'));
          document.head.appendChild(script);
      }
  });
}

function calculateResult() {
  let solution = findSolution(currentNumbers, currentTarget);
  if (solution) {
    let solutionHTML = "";
    solution.forEach((step, index) => {
      solutionHTML += `${step.left} ${step.op} ${step.right} = ${step.result}<br>`;
    });
    solutionHTML += `<br><strong>Sonuç: ${solution[solution.length - 1].result
      }</strong>`;
    return solutionHTML;
  } else {
    return "Çözüm bulunamadı.";
  }
}

var bestdiff;
var bestvalsums;
var allresults = [];
var bestresult;

const OPS = {
  "+": function (n1, n2) {
    if (n1 < 0 || n2 < 0) return false;
    return n1 + n2;
  },
  "-": function (n1, n2) {
    if (n2 >= n1) return false;
    return n1 - n2;
  },
  _: function (n2, n1) {
    if (n2 >= n1) return false;
    return n1 - n2;
  },
  "*": function (n1, n2) {
    return n1 * n2;
  },
  "/": function (n1, n2) {
    if (n2 == 0 || n1 % n2 != 0) return false;
    return n1 / n2;
  },
  "?": function (n2, n1) {
    if (n2 == 0 || n1 % n2 != 0) return false;
    return n1 / n2;
  },
};

const OPCOST = {
  "+": 1,
  "-": 1.05,
  _: 1.05,
  "*": 1.2,
  "/": 1.3,
  "?": 1.3,
};

let allResults = [];

function solveNumbers(numbers, target) {
  allResults = [];
  const initialNumbers = numbers.map((n) => [n, false]);
  recursiveSolve(
    initialNumbers,
    0,
    new Array(numbers.length).fill(false),
    target,
    numbers.length,
    0
  );
  return sortAndFormatResults(target);
}

function recursiveSolve(
  numbers,
  searchIndex,
  wasGenerated,
  target,
  levels,
  valueSum
) {
  if (levels <= 0) return;

  for (let i = 0; i < numbers.length - 1; i++) {
    if (numbers[i] === false) continue;
    const ni = numbers[i];
    numbers[i] = false;

    for (let j = i + 1; j < numbers.length; j++) {
      if (numbers[j] === false) continue;
      const nj = numbers[j];

      if (i < searchIndex && !wasGenerated[i] && !wasGenerated[j]) continue;

      for (const [op, func] of Object.entries(OPS)) {
        const result = func(ni[0], nj[0]);
        if (result === null) continue;

        const opCost = calculateOpCost(result, op);
        const newValueSum = valueSum + opCost;

        allResults.push({
          valueSum: newValueSum,
          answer: [result, op, ni, nj],
        });

        numbers[j] = [result, op, ni, nj];
        const oldWasGenerated = wasGenerated[j];
        wasGenerated[j] = true;

        recursiveSolve(
          numbers,
          i + 1,
          wasGenerated,
          target,
          levels - 1,
          newValueSum
        );

        wasGenerated[j] = oldWasGenerated;
        numbers[j] = nj;
      }
    }

    numbers[i] = ni;
  }
}

function calculateOpCost(result, op) {
  let opCost = Math.abs(result);
  while (opCost % 10 === 0 && opCost !== 0) opCost /= 10;
  return opCost * OPCOST[op];
}

function sortAndFormatResults(target) {
  allResults.sort((a, b) => {
    const diffA = Math.abs(a.answer[0] - target);
    const diffB = Math.abs(b.answer[0] - target);
    if (diffA !== diffB) return diffA - diffB;
    return a.valueSum - b.valueSum;
  });

  const uniqueResults = new Set();
  let formattedResults = "";

  for (const result of allResults) {
    const formatted = formatResult(result.answer, target);
    if (!uniqueResults.has(formatted)) {
      uniqueResults.add(formatted);
      formattedResults += formatted + "\n\n";
    }
  }

  return formattedResults.trim();
}

function formatResult(result, target) {
  const steps = serializeResult(tidyUpResult(result));
  return stringifyResult(steps, target);
}

function tidyup_result(result) {
  var mapping = {
    "?": "/",
    _: "-",
  };

  var swappable = {
    "*": true,
    "+": true,
  };

  if (result.length < 4) return result;

  for (var i = 2; i < result.length; i++) {
    var child = result[i];

    child = tidyup_result(child);

    if (child[1] == result[1] && swappable[result[1]]) {
      result.splice(i--, 1);
      result = result.concat(child.slice(2));
    } else {
      result[i] = child;
    }
  }

  if (result[1] in mapping) {
    result[1] = mapping[result[1]];
    var j = result[2];
    result[2] = result[3];
    result[3] = j;
  } else if (swappable[result[1]]) {
    childs = result.slice(2).sort(function (a, b) {
      return b[0] - a[0];
    });
    for (var i = 2; i < result.length; i++) result[i] = childs[i - 2];
  }

  return result;
}

function serialise_result(result) {
  var childparts = [];

  for (var i = 2; i < result.length; i++) {
    var child = result[i];

    if (child.length >= 4) childparts.push(serialise_result(child));
  }

  childparts = childparts.sort(function (a, b) {
    return fullsize(b) - fullsize(a);
  });

  var parts = [];
  for (var i = 0; i < childparts.length; i++) {
    parts = parts.concat(childparts[i]);
  }

  var sliced = result.slice(2).map(function (l) {
    return l[0];
  });
  var thispart = [result[0], result[1]].concat(sliced);

  return parts.concat([thispart]);
}

function stringify_result(serialised, target) {
  var output = "";

  serialised = serialised.slice(0);

  for (var i = 0; i < serialised.length; i++) {
    var x = serialised[i];

    var args = x.slice(2);
    output += args.join(" " + x[1] + " ") + " = " + x[0] + "\n";
  }

  var result = serialised[serialised.length - 1][0];
  if (result != target)
    output += "(off by " + Math.abs(result - target) + ")\n";

  return output;
}

function fullsize(array) {
  if (array.constructor != Array) return 0;

  var l = 0;

  for (var i = 0; i < array.length; i++) l += fullsize(array[i]);

  return l + array.length;
}

function updateAnswerButton() {
  const solution = findSolution(numbers, target);
  let answerText = "";

  if (solution !== null) {
    answerText = "TAM ÇÖZÜM\n" + formatSolution(solution);
  } else {
    const approximateSolution = findApproximateSolution(numbers, target);
    if (approximateSolution <= 1) {
      answerText =
        "TAM ÇÖZÜM YOK, 1 YAKLAŞIK ÇÖZÜM\n" +
        formatApproximateSolutions(numbers, target, 1);
    } else if (approximateSolution <= 2) {
      answerText =
        "TAM ÇÖZÜM YOK, 2 YAKLAŞIK ÇÖZÜM\n" +
        formatApproximateSolutions(numbers, target, 2);
    } else if (approximateSolution <= 3) {
      answerText =
        "TAM ÇÖZÜM YOK, 3 YAKLAŞIK ÇÖZÜM\n" +
        formatApproximateSolutions(numbers, target, 3);
    } else {
      answerText = "ÇÖZÜM BULUNAMADI";
    }
  }

  answerButton.textContent = answerText;
}

function formatSolution(solution) {
  return (
    solution
      .map(
        (step) =>
          `${formatNumber(step.left)} ${step.op} ${formatNumber(
            step.right
          )} = ${formatNumber(step.result)}`
      )
      .join("\n") + "\n"
  );
}

function formatNumber(num) {
  return Number.isInteger(num) ? num.toString() : num.toFixed(2);
}

function formatApproximateSolutions(numbers, target, range) {
  const solutions = [];

  function tryOperations(nums, current = nums[0], steps = []) {
    if (nums.length === 1) {
      if (Number.isInteger(current) && Math.abs(current - target) <= range) {
        solutions.push({ result: current, steps: steps });
      }
      return;
    }

    for (let i = 1; i < nums.length; i++) {
      for (const op of ["+", "-", "*"]) {
        const newCurrent = calculate(current, nums[i], op);
        if (Number.isInteger(newCurrent)) {
          const remaining = nums.filter((_, index) => index !== i);
          tryOperations(remaining, newCurrent, [
            ...steps,
            { left: current, right: nums[i], op: op, result: newCurrent },
          ]);
        }
      }
      if (nums[i] !== 0 && current % nums[i] === 0) {
        const newCurrent = current / nums[i];
        const remaining = nums.filter((_, index) => index !== i);
        tryOperations(remaining, newCurrent, [
          ...steps,
          { left: current, right: nums[i], op: "/", result: newCurrent },
        ]);
      }
    }
  }

  tryOperations(numbers);

  return solutions
    .map((sol) => {
      const difference = sol.result - target;
      const formattedDifference =
        difference > 0 ? `+${difference}` : `${difference}`;
      const stepsFormatted = sol.steps
        .map((step) => `${step.left} ${step.op} ${step.right} = ${step.result}`)
        .join("\n");
      return `${target}${formattedDifference}:\n${stepsFormatted}`;
    })
    .join("\n\n");
}

function solve_numbers(numbers, target, trickshot) {
  numbers.sort();
  bestresult = [numbers[0], numbers[0]];

  if (!trickshot) {
    for (var i = 1; i < numbers.length; i++) {
      if (Math.abs(numbers[i] - target) < Math.abs(bestresult[0] - target)) {
        bestresult = [numbers[i], numbers[i]];
        bestvalsums = numbers[i];
      }
    }
    if (bestresult[0] == target) return target + " = " + target;
  }

  allresults = [];
  _solve_numbers(numbers, target, trickshot);

  allresults.sort(function (a, b) {
    return a.valsums - b.valsums;
  });

  var s = "";
  var got = {};
  for (var i = 0; i < allresults.length; i++) {
    var this_str =
      stringify_result(
        serialise_result(tidyup_result(allresults[i].answer)),
        target
      ) + "\n\n";
    if (!got[this_str]) {
      got[this_str] = true;
      s += this_str;
    }
  }
  return s;
}

function _solve_numbers(numbers, target, trickshot) {
  numbers = numbers.map(function (x) {
    return [x, false];
  });

  var was_generated = [];
  for (var i = 0; i < numbers.length; i++) was_generated.push(false);

  bestresult = [0, 0];

  _recurse_solve_numbers(
    numbers,
    0,
    was_generated,
    target,
    numbers.length,
    0,
    trickshot
  );

  return bestresult;
}

function _recurse_solve_numbers(
  numbers,
  searchedi,
  was_generated,
  target,
  levels,
  valsums,
  trickshot
) {
  levels--;

  for (var i = 0; i < numbers.length - 1; i++) {
    var ni = numbers[i];

    if (ni === false) continue;

    numbers[i] = false;

    for (var j = i + 1; j < numbers.length; j++) {
      var nj = numbers[j];

      if (nj === false) continue;

      if (i < searchedi && !was_generated[i] && !was_generated[j]) continue;

      for (var o in OPS) {
        var r = OPS[o](ni[0], nj[0]);
        if (r === false) continue;

        if (o == "/" && nj[0] == 1) continue;
        if (o == "?" && ni[0] == 1) continue;
        if (o == "*" && (ni[0] == 1 || nj[0] == 1)) continue;
        if (r == ni[0] || r == nj[0]) continue;

        var op_cost = Math.abs(r);
        while (op_cost % 10 == 0 && op_cost != 0) op_cost /= 10;
        if ((ni[0] == 10 || nj[0] == 10) && o == "*") op_cost = 1;
        op_cost *= OPCOST[o];

        var newvalsums = valsums + op_cost;

        if (
          allresults.length == 0 ||
          Math.abs(r - target) < Math.abs(allresults[0].answer[0] - target)
        )
          allresults = [];
        if (
          allresults.length == 0 ||
          Math.abs(r - target) <= Math.abs(allresults[0].answer[0] - target)
        )
          allresults.push(
            JSON.parse(
              JSON.stringify({ valsums: valsums, answer: [r, o, ni, nj] })
            )
          );

        if (
          Math.abs(r - target) < Math.abs(bestresult[0] - target) ||
          (Math.abs(r - target) == Math.abs(bestresult[0] - target) &&
            (trickshot || newvalsums < bestvalsums))
        ) {
          bestresult = [r, o, ni, nj];
          bestvalsums = newvalsums;
        }

        numbers[j] = [r, o, ni, nj];
        var old_was_gen = was_generated[j];
        was_generated[j] = true;

        if (levels > 0)
          _recurse_solve_numbers(
            numbers,
            i + 1,
            was_generated,
            target,
            levels,
            newvalsums,
            trickshot
          );

        was_generated[j] = old_was_gen;
        numbers[j] = nj;
      }
    }

    numbers[i] = ni;
  }
}

function _solve_numbers(numbers, target, trickshot) {
  numbers = numbers.map(function (x) {
    return [x, false];
  });

  var was_generated = [];
  for (var i = 0; i < numbers.length; i++) was_generated.push(false);

  bestresult = [0, 0];

  _recurse_solve_numbers(
    numbers,
    0,
    was_generated,
    target,
    numbers.length,
    0,
    trickshot
  );

  return bestresult;
}

function solve_numbers(numbers, target, trickshot) {
  numbers.sort();
  bestresult = [numbers[0], numbers[0]];

  if (!trickshot) {
    for (var i = 1; i < numbers.length; i++) {
      if (Math.abs(numbers[i] - target) < Math.abs(bestresult[0] - target)) {
        bestresult = [numbers[i], numbers[i]];
        bestvalsums = numbers[i];
      }
    }
    if (bestresult[0] == target) return target + " = " + target;
  }

  allresults = [];
  _solve_numbers(numbers, target, trickshot);

  allresults.sort(function (a, b) {
    return a.valsums - b.valsums;
  });

  var s = "";
  var got = {};
  for (var i = 0; i < allresults.length; i++) {
    var this_str =
      stringify_result(
        serialise_result(tidyup_result(allresults[i].answer)),
        target
      ) + "\n\n";
    if (!got[this_str]) {
      got[this_str] = true;
      s += this_str;
    }
  }
  return s;
}
