const wordButton = document.getElementById("wordButton");
const mathButton = document.getElementById("mathButton");
const gameArea = document.getElementById("game-area");
const timerElement = document.getElementById("timer");
const actionButtons = document.getElementById("action-buttons");
const hintButton = document.getElementById("hintButton");
const answerButton = document.getElementById("answerButton");
if (answerButton) {
  answerButton.addEventListener('click', handleAnswerButton);
}
const gameButtons = document.getElementById("game-buttons");
const inGameButtons = document.getElementById("in-game-buttons");
const homeButton = document.getElementById("homeButton");
if (homeButton) {
  homeButton.addEventListener('click', function () {
    if (isPaused) {
      // Pause durumunu sıfırla
      isPaused = false;

      // Pause overlay'ı gizle
      const pausedOverlay = document.getElementById('paused-overlay');
      if (pausedOverlay) {
        pausedOverlay.style.display = 'none';
      }
    }

    // Ana sayfaya git
    if (!isGameStarting) {
      goToHomePage();
    }
  });
}
const playAgainButton = document.getElementById("playAgainButton");
if (playAgainButton) {
  playAgainButton.addEventListener('click', function () {
    if (isPaused) {
      // Pause durumunu sıfırla
      isPaused = false;

      // Pause overlay'ı gizle
      const pausedOverlay = document.getElementById('paused-overlay');
      if (pausedOverlay) {
        pausedOverlay.style.display = 'none';
      }
    }

    // Oyunu yeniden başlat
    if (!isGameStarting) {
      restartGame();
    }
  });
}

const letters = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";
const joker = "?";

if (
  !wordButton ||
  !mathButton ||
  !gameArea ||
  !timerElement ||
  !actionButtons ||
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

  hintButton.addEventListener("click", () => isGameActive && showHint());
  answerButton.addEventListener("click", showAnswer);
  homeButton.addEventListener("click", () => !isGameStarting && goToHomePage());
  playAgainButton.addEventListener(
    "click",
    () => !isGameStarting && restartGame()
  );
}

let timerInterval = null;
let timeLeft = 30;
let gameType = "";
let currentNumbers = [];
let currentTarget = 0;
let animationCount = 0;
let totalAnimations = 9;
let isGameStarting = false;
let isGameActive = false;
let startTimerTimeout;

let isPaused = false;

let soundEnabled = true;
let volumeLevel = 70;
let countdownMusicPlaying = false;

let calculationSteps = [];
let currentSelectedNumber = null;
let currentOperator = null;
let usedNumbers = [];

let isProcessingWordCheck = false;
let isProcessingMathCheck = false;
let isShowingHint = false;
let isProcessingUndoAction = false;
let isProcessingClearAction = false;

// Tüm aktif zamanlayıcıları izleyen global değişken
let activeIntervals = [];
let activeTasks = { pauseTimer: false };

let gameState = {
  timeLeft: 30,
  musicPosition: 0,
  isAnswerDisplayed: false
};

// DOM yüklendiğinde
document.addEventListener('DOMContentLoaded', function () {
  document.addEventListener('copy', function(e) {
    e.preventDefault();
    return false;
  });
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });
    // CSS ile seçimi önle
    const style = document.createElement('style');
    style.textContent = `
      .container {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      /* Sadece input alanlarına müdahale etme */
      input, textarea {
        -webkit-user-select: auto;
        -moz-user-select: auto;
        -ms-user-select: auto;
        user-select: auto;
      }
      
      /* Oyun içi butonlar her zaman tıklanabilir olsun */
      #in-game-buttons button {
        position: relative;
        z-index: 1000;
      }
      
      /* Pause durumunda overlay altında kalmasın */
      #paused-overlay {
        z-index: 999;
      }
    `;
    document.head.appendChild(style);
  // Temel bileşenleri yakala
  const soundToggleButton = document.getElementById('soundToggleButton');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumePercentage = document.getElementById('volumePercentage');
  const volumeControl = document.getElementById('volumeControl');
  const countdownMusic = document.getElementById('countdownMusic');
  const pauseButton = document.getElementById('pauseButton');
  const confirmYes = document.getElementById('confirm-yes');
  const confirmNo = document.getElementById('confirm-no');
  const modal = document.getElementById('confirmation-modal');
  const soundControls = document.querySelector('.sound-controls');
  if (soundControls) {
    document.body.appendChild(soundControls);
  }
  
  // Butonları ve oyun alanını ayarla
  setupGameButtons();
  setupModalButtons(); // Modal butonlarını bir kez ayarla
  addPlayButtonStyles();
  addStylesForMathInput();
  addSoundControlStyles();

  // Ses seviyesini ayarla
  if (countdownMusic) {
    countdownMusic.volume = volumeLevel / 100;
  }

  // Ses butonu ve panel işlevleri
  if (soundToggleButton) {
    soundToggleButton.addEventListener('click', function () {
      toggleSound();

      // Ses kontrol panelini göster - açıksa kapama
      if (volumeControl) {
        volumeControl.classList.add('active');
        
        // Eğer zamanlayıcı varsa temizle
        if (volumeControl.closeTimer) {
          clearTimeout(volumeControl.closeTimer);
          volumeControl.closeTimer = null;
        }
        
        // 5 saniye sonra otomatik kapat
        volumeControl.closeTimer = setTimeout(() => {
          volumeControl.classList.remove('active');
        }, 5000);
      }
    });

    // Ses butonu üzerine gelindiğinde kontrol panelini göster
    soundToggleButton.addEventListener('mouseenter', function () {
      if (volumeControl) {
        volumeControl.classList.add('active');
        
        // Eğer zamanlayıcı varsa temizle
        if (volumeControl.closeTimer) {
          clearTimeout(volumeControl.closeTimer);
          volumeControl.closeTimer = null;
        }
        
        // 5 saniye sonra otomatik kapat
        volumeControl.closeTimer = setTimeout(() => {
          volumeControl.classList.remove('active');
        }, 5000);
      }
    });
  }

  // Ses kontrol paneli etkileşimleri
  if (volumeControl) {
    // Fare panel üzerindeyken otomatik kapanmayı iptal et
    volumeControl.addEventListener('mouseenter', function () {
      if (volumeControl.closeTimer) {
        clearTimeout(volumeControl.closeTimer);
        volumeControl.closeTimer = null;
      }
    });

    // Fare panelden ayrıldığında 2 saniye sonra kapan
    volumeControl.addEventListener('mouseleave', function () {
      if (volumeControl.closeTimer) {
        clearTimeout(volumeControl.closeTimer);
        volumeControl.closeTimer = null;
      }
      
      volumeControl.closeTimer = setTimeout(() => {
        volumeControl.classList.remove('active');
      }, 2000);
    });
    
    // Dokunmatik cihazlar için - sayfa herhangi bir yerine dokunulduğunda kontrol et
    document.addEventListener('touchstart', function(e) {
      // Eğer tıklama ses kontrolü veya ses butonu dışında bir yere yapıldıysa
      if (volumeControl.classList.contains('active') && 
          !volumeControl.contains(e.target) && 
          soundToggleButton !== e.target &&
          !soundToggleButton.contains(e.target)) {
        
        // Panel açıksa kapat
        volumeControl.classList.remove('active');
        
        // Zamanlayıcıyı temizle
        if (volumeControl.closeTimer) {
          clearTimeout(volumeControl.closeTimer);
          volumeControl.closeTimer = null;
        }
      }
    });
  }

  // Ses seviyesi ayarı
  if (volumeSlider && volumePercentage) {
    volumeSlider.addEventListener('input', function () {
      volumeLevel = this.value;
      volumePercentage.textContent = volumeLevel + '%';

      // Tüm ses öğelerinin seviyesini güncelle
      if (countdownMusic) {
        countdownMusic.volume = soundEnabled ? (volumeLevel / 100) : 0;
      }
      
      // Diğer ses efektleri için de güncelle
      if (typeof playSound.sounds !== 'undefined') {
        Object.values(playSound.sounds).forEach(sound => {
          sound.volume = soundEnabled ? (volumeLevel / 100) : 0;
        });
      }

      // Ses seviyesi durumunu güncelle
      if (volumeLevel == 0) {
        if (soundEnabled) {
          soundEnabled = false;
          updateSoundIcon();
        }
      } else if (!soundEnabled) {
        soundEnabled = true;
        updateSoundIcon();
      }

      // Panel zamanlayıcısını sıfırla - 5 saniye sonra kapat
      if (volumeControl && volumeControl.closeTimer) {
        clearTimeout(volumeControl.closeTimer);
        volumeControl.closeTimer = null;
      }
      
      volumeControl.closeTimer = setTimeout(() => {
        volumeControl.classList.remove('active');
      }, 5000);
    });
  }

  // Duraklat butonunu ayarla
  if (pauseButton) {
    pauseButton.addEventListener('click', togglePause);
  }

  // Cevap butonunu ayarla
  const answerButton = document.getElementById('answerButton');
  if (answerButton) {
    answerButton.addEventListener('click', handleAnswerButton);
  }

  if (confirmYes) {
    confirmYes.addEventListener('click', function() {
      // Modalı kapat
      if (modal) modal.style.display = 'none';
      
      // Oyunu sonlandır
      isGameActive = false;
      
      // Timer'ı temizle
      clearAllTimers();
      
      // Müziği durdur
      stopCountdownMusic();
      
      // Timer rengini değiştir
      if (timerElement) {
        timerElement.style.color = "#ff3300";
      }
      
      // Butonları güncelle
      updateButtonStates();
      
      // Cevabı göster
      let answerArea = document.getElementById("answer-area");
      if (!answerArea) {
        answerArea = document.createElement("div");
        answerArea.id = "answer-area";
        gameArea.appendChild(answerArea);
      }
      
      // Cevap alanını doldur
      if (gameType === "word") {
        fillWordAnswers(answerArea);
      } else {
        fillMathAnswers(answerArea);
      }
      
      // Cevap alanını göster
      answerArea.style.display = "block";
      
      // Buton metnini güncelle
      if (answerButton) {
        answerButton.textContent = "CEVABI GİZLE";
      }
    });
  }
  
  if (confirmNo) {
    confirmNo.addEventListener('click', function() {
      // Sadece modalı kapat, oyun devam etsin
      if (modal) modal.style.display = 'none';
      
      // Oyun aktifse timer'ı tekrar başlat
      if (isGameActive) {
        timer = setInterval(updateTimerWithSound, 1000);
      }
    });
  }
});

// Oyunu duraklatma ve devam ettirme
function setupGameButtons() {
  // Önce tüm butonları tanımla
  const wordButton = document.getElementById("wordButton");
  const mathButton = document.getElementById("mathButton");
  const homeButton = document.getElementById("homeButton");
  const playAgainButton = document.getElementById("playAgainButton");
  const hintButton = document.getElementById("hintButton");

  // Kelime ve İşlem butonları
  if (wordButton) {
    const newWordButton = wordButton.cloneNode(true);
    wordButton.parentNode.replaceChild(newWordButton, wordButton);
    newWordButton.addEventListener('click', () => !isGameStarting && !isGameActive && startGame("word"));
  }

  if (mathButton) {
    const newMathButton = mathButton.cloneNode(true);
    mathButton.parentNode.replaceChild(newMathButton, mathButton);
    newMathButton.addEventListener('click', () => !isGameStarting && !isGameActive && startGame("math"));
  }

  // Ana Sayfa butonu
  if (homeButton) {
    const newHomeButton = homeButton.cloneNode(true);
    homeButton.parentNode.replaceChild(newHomeButton, homeButton);
    newHomeButton.addEventListener('click', () => {
      // Pause durumunu sıfırla
      if (isPaused) {
        isPaused = false;
        // Pause butonunu normal haline getir
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) {
          pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
          pauseButton.title = "Duraklat";
          pauseButton.classList.remove('play-active');
        }

        // Pause overlay'ı gizle
        const pausedOverlay = document.getElementById('paused-overlay');
        if (pausedOverlay) {
          pausedOverlay.style.display = 'none';
        }
      }

      // Ana sayfaya git
      if (!isGameStarting) {
        goToHomePage();
      }
    });
  }

  // Tekrar Oyna butonu
  if (playAgainButton) {
    const newPlayAgainButton = playAgainButton.cloneNode(true);
    playAgainButton.parentNode.replaceChild(newPlayAgainButton, playAgainButton);
    newPlayAgainButton.addEventListener('click', () => {
      // Pause durumunu sıfırla
      if (isPaused) {
        isPaused = false;

        // Pause butonunu normal haline getir
        const pauseButton = document.getElementById('pauseButton');
        if (pauseButton) {
          pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
          pauseButton.title = "Duraklat";
          pauseButton.classList.remove('play-active');
        }

        // Pause overlay'ı gizle
        const pausedOverlay = document.getElementById('paused-overlay');
        if (pausedOverlay) {
          pausedOverlay.style.display = 'none';
        }
      }

      // Oyunu yeniden başlat
      if (!isGameStarting) {
        restartGame();
      }
    });
  }

  // İpucu butonu
  if (hintButton) {
    const newHintButton = hintButton.cloneNode(true);
    hintButton.parentNode.replaceChild(newHintButton, hintButton);
    newHintButton.addEventListener('click', () => isGameActive && showHint());
  }
}

/**
 * Cevap butonuna tıklama işleyici
 */
function handleAnswerButton() {
  // Eğer oyun başlama aşamasındaysa işlem yapma
  if (isGameStarting) return;

  // Süre dolmuşsa veya oyun zaten bitmişse direkt cevabı göster/gizle
  if (!isGameActive) {
    toggleAnswerDisplay();
    return;
  }
  
  // Oyun aktifse onay modalını göster
  openConfirmationModal();
}

/**
 * Cevap alanını sadece gösterip gizleyen fonksiyon
 */
function toggleAnswerDisplay() {
  // Cevap alanını bul
  let answerArea = document.getElementById("answer-area");
  
  // Eğer cevap alanı yoksa oluştur
  if (!answerArea) {
    answerArea = document.createElement("div");
    answerArea.id = "answer-area";
    gameArea.appendChild(answerArea);
    
    // İçeriği doldur
    if (gameType === "word") {
      fillWordAnswers(answerArea);
    } else {
      fillMathAnswers(answerArea);
    }
    
    // Göster
    answerArea.style.display = "block";
    if (answerButton) answerButton.textContent = "CEVABI GİZLE";
  } 
  // Eğer cevap alanı varsa, görünürlüğü tersine çevir
  else {
    // Şu anda görünür ise gizle
    if (answerArea.style.display === "block") {
      answerArea.style.display = "none";
      if (answerButton) answerButton.textContent = "CEVAP";
      
      // Sayfalama alanını da gizle
      const paginationArea = document.getElementById("pagination-area");
      if (paginationArea) paginationArea.style.display = "none";
    }
    // Şu anda gizli ise göster
    else {
      // İçeriği güncelle
      if (gameType === "word") {
        fillWordAnswers(answerArea);
      } else {
        fillMathAnswers(answerArea);
      }
      
      // Göster
      answerArea.style.display = "block";
      if (answerButton) answerButton.textContent = "CEVABI GİZLE";
      
      // Sayfalama alanını da göster
      const paginationArea = document.getElementById("pagination-area");
      if (paginationArea) paginationArea.style.display = "block";
    }
  }
}

/**
 * Modal penceresini açan fonksiyon
 */
function openConfirmationModal() { 
  const modal = document.getElementById('confirmation-modal');
  if (!modal) return;
  
  // Oyun aktifse timer'ı tamamen durdur
  if (isGameActive) {
    // Mevcut timer'ı temizle - BU KISIM ÇOK ÖNEMLİ
    clearActiveTimers();
    
    // Müziği duraklat
    const countdownMusic = document.getElementById('countdownMusic');
    if (countdownMusic && countdownMusicPlaying) {
      countdownMusic.pause();
      // Müzik pozisyonunu kaydet
      gameState.musicPosition = countdownMusic.currentTime;
    }
  }
  
  // Modalı göster
  modal.style.display = 'flex';
}

// Oyun alanını bulanıklaştırma/netleştirme
function blurGameArea(blur) {
  const gameAreaContent = document.querySelectorAll("#game-area > *, #word-input-area, #math-input-area");
  
  if (blur) {
    // Bulanıklaştır ve işlevsiz hale getir
    gameAreaContent.forEach(element => {
      element.style.filter = 'blur(5px)';
      element.style.pointerEvents = 'none';
    });
    
    // Tüm sayfada kopyalamayı engelle
    const style = document.createElement('style');
    style.id = 'disable-selection-style';
    style.textContent = `
      body {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
    `;
    document.head.appendChild(style);
    
    // "DURAKLADI" yazısı ekleme
    let pausedOverlay = document.getElementById('paused-overlay');
    if (!pausedOverlay) {
      pausedOverlay = document.createElement('div');
      pausedOverlay.id = 'paused-overlay';
      pausedOverlay.innerHTML = '<div class="paused-text">DURAKLADI</div>';
      document.querySelector('.container').appendChild(pausedOverlay);
    }
    pausedOverlay.style.display = 'flex';
    
    // Oyun butonlarının ÜZERİNDE olduğundan emin ol
    const inGameButtons = document.getElementById('in-game-buttons');
    if (inGameButtons) {
      inGameButtons.style.position = 'relative';
      inGameButtons.style.zIndex = '1000';
      
      // Butonları tıklanabilir yap
      const buttons = inGameButtons.querySelectorAll('button');
      buttons.forEach(button => {
        button.style.pointerEvents = 'auto';
      });
    }
  } else {
    // Normal hale getir
    gameAreaContent.forEach(element => {
      element.style.filter = '';
      element.style.pointerEvents = 'auto';
    });
    
    // Seçim engelleme stilini kaldır
    const disableSelectionStyle = document.getElementById('disable-selection-style');
    if (disableSelectionStyle) {
      disableSelectionStyle.remove();
    }
    
    // "DURAKLADI" yazısını kaldır
    const pausedOverlay = document.getElementById('paused-overlay');
    if (pausedOverlay) {
      pausedOverlay.style.display = 'none';
    }
    
    // Butonları normal hale getir
    const inGameButtons = document.getElementById('in-game-buttons');
    if (inGameButtons) {
      inGameButtons.style.position = '';
      inGameButtons.style.zIndex = '';
    }
  }
}

// Ses ikonunu güncelleme
function updateSoundIcon() {
  const soundToggleButton = document.getElementById('soundToggleButton');
  const soundIcon = soundToggleButton.querySelector('i');

  if (soundToggleButton && soundIcon) {
    if (soundEnabled) {
      soundIcon.className = 'fas fa-volume-up';
      soundIcon.classList.remove('sound-muted');
    } else {
      soundIcon.className = 'fas fa-volume-mute';
      soundIcon.classList.add('sound-muted');
    }
  }
}

// Sesi açıp kapatan fonksiyon
function toggleSound() {
  soundEnabled = !soundEnabled;
  updateSoundIcon();

  const countdownMusic = document.getElementById('countdownMusic');
  if (!countdownMusic) {
    console.error("Müzik elementi bulunamadı!");
    return;
  }

  if (!soundEnabled) {
    countdownMusic.volume = 0;
    
    // Diğer ses efektlerini de sustur
    if (typeof playSound.sounds !== 'undefined') {
      Object.values(playSound.sounds).forEach(sound => {
        sound.volume = 0;
      });
    }
  } else {
    countdownMusic.volume = volumeLevel / 100;
    
    // Eğer oyun aktifse ve müzik oynatılması gerekiyorsa
    if (isGameActive) {     
      try {
        // Eğer müzik duraklatıldıysa ve hala oynatılabilir durumdaysa
        if (countdownMusic.paused && countdownMusicPlaying) {
          countdownMusic.play()
            .catch(err => console.error("Müzik başlatma hatası:", err));
        }
        // Müzik hiç çalmıyorsa
        else if (!countdownMusicPlaying) {
          startCountdownMusic();
        }
      } catch (err) {
        console.error("Müzik oynatma hatası:", err);
      }
    }
    
    // Diğer ses efektlerinin seviyesini ayarla
    if (typeof playSound.sounds !== 'undefined') {
      Object.values(playSound.sounds).forEach(sound => {
        sound.volume = volumeLevel / 100;
      });
    }
  }
}

function startCountdownMusic() {
  const countdownMusic = document.getElementById('countdownMusic');
  
  if (!countdownMusic) {
    console.error("countdown müzik elementi bulunamadı!");
    return;
  }
  
  // Müzik çalmak için ses açık olmalı ve oyun aktif olmalı
  if (!soundEnabled || !isGameActive) {
    return;
  }
  
  try {
    // Ses seviyesini kesinlikle ayarla
    countdownMusic.volume = volumeLevel / 100;
    
    // Pozisyonunu başa ayarla ve çal
    countdownMusic.currentTime = 0;
    
    // Müziği çalmayı dene
    const playPromise = countdownMusic.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        countdownMusicPlaying = true;
        
        // Müzik bittiğinde yapılacaklar
        countdownMusic.onended = function() {
          countdownMusicPlaying = false;
          
          // Eğer oyun hala aktifse ve süre de dolmadıysa
          if (isGameActive && timeLeft > 0) {
            // Süreyi 0 yap ve bitir
            timeLeft = 0;
            if (timerElement) {
              timerElement.textContent = timeLeft;
            }
            handleTimeExpiration();
          }
        };
      }).catch(error => {
        console.error('Müzik çalma hatası:', error);
        countdownMusicPlaying = false;
      });
    }
  } catch (error) {
    console.error("Müzik başlatma hatası:", error);
  }
}

function stopCountdownMusic() { 
  const countdownMusic = document.getElementById('countdownMusic');

  if (!countdownMusic) {
    console.error("countdown müzik elementi bulunamadı!");
    return;
  }

  try {
    countdownMusic.pause();
    countdownMusic.currentTime = 0;
    countdownMusicPlaying = false;
  } catch (error) {
    console.error("Müzik durdurma hatası:", error);
  }
}

function setupWordInputArea() {
  const wordForm = document.getElementById('word-form');
  const wordAnswer = document.getElementById('word-answer');
  const checkWordButton = document.getElementById('check-word-button');
  const wordResult = document.getElementById('word-result');

  if (!wordForm || !wordAnswer || !checkWordButton || !wordResult) return;

  // Önceki olay dinleyicileri temizle
  const newWordForm = wordForm.cloneNode(true);
  wordForm.parentNode.replaceChild(newWordForm, wordForm);

  // Yeni kontrol butonu oluştur
  const newCheckButton = document.createElement('button');
  newCheckButton.id = 'check-word-button';
  newCheckButton.type = 'submit';
  newCheckButton.textContent = 'Kontrol Et';
  checkWordButton.parentNode.replaceChild(newCheckButton, checkWordButton);

  // Sonuç alanını temizle
  wordResult.innerHTML = '';
  wordResult.style.display = 'none';

  // Input alanını temizle ve odaklan
  wordAnswer.value = '';
  setTimeout(() => {
    wordAnswer.focus();
  }, 100);

  // Form gönderildiğinde
  newWordForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!isProcessingWordCheck) {
      wordAnswer.value = turkishToUpperCase(wordAnswer.value);
      checkWordAnswer();
    }
  });

  // Kontrol Et butonuna tıklandığında
  newCheckButton.addEventListener('click', function (e) {
    e.preventDefault();
    if (!isProcessingWordCheck) {
      wordAnswer.value = turkishToUpperCase(wordAnswer.value);
      checkWordAnswer();
    }
  });

  // Türkçe karakter dönüşümü için input olayı
  wordAnswer.addEventListener('input', function () {
    let newValue = turkishToUpperCase(this.value);

    if (newValue !== this.value) {
      const cursorPos = this.selectionStart;
      this.value = newValue;
      this.setSelectionRange(cursorPos, cursorPos);
    }
  });
}

// Türkçe karakterleri doğru şekilde büyük harfe çeviren fonksiyon
function turkishToUpperCase(text) {
  if (!text) return '';

  // Türkçe karakter çiftleri
  const turkishPairs = {
    'i': 'İ', 'İ': 'İ',
    'ı': 'I', 'I': 'I',
    'ö': 'Ö', 'Ö': 'Ö',
    'ü': 'Ü', 'Ü': 'Ü',
    'ş': 'Ş', 'Ş': 'Ş',
    'ğ': 'Ğ', 'Ğ': 'Ğ',
    'ç': 'Ç', 'Ç': 'Ç'
  };

  // Metin içindeki her karakteri kontrol et ve dönüştür
  return text.split('').map(char => {
    // Eğer Türkçe karakter ise karşılığını kullan
    if (turkishPairs[char] !== undefined) {
      return turkishPairs[char];
    }
    // Değilse, normal büyük harfe çevir
    return char.toUpperCase();
  }).join('');
}

// Kelime cevabını kontrol et
function checkWordAnswer() {
  if (isProcessingWordCheck) return;
  isProcessingWordCheck = true;

  // İpucu bildirimini kapat
  closeHintNotification();

  const wordAnswer = document.getElementById('word-answer');
  const wordResult = document.getElementById('word-result');

  if (!wordAnswer || !wordResult) {
    isProcessingWordCheck = false;
    return;
  }

  // Kullanıcı girdisini Türkçe büyük harflere çevir
  const userWord = turkishToUpperCase(wordAnswer.value.trim());

  // Kelime boş ise uyarı ver
  if (userWord.length === 0) {
    showNotification('Lütfen bir kelime girin.', 'warning');
    isProcessingWordCheck = false;
    return;
  }

  // En az 4 harfli bir kelime olmalı
  if (userWord.length < 4) {
    showNotification('En az 4 harfli bir kelime girmelisiniz.', 'warning');
    isProcessingWordCheck = false;
    return;
  }

  // Harfleri al
  const lettersElements = document.querySelectorAll('.letter-box');
  const availableLetters = Array.from(lettersElements).map(el => el.textContent);

  // Kelime doğrulaması
  if (canFormWord(userWord, availableLetters, true)) {
    // Kelime gerçekten var mı kontrol et (Türkçe kelime listesinde)
    checkWordInList(userWord);
  } else {
    showNotification(`"${userWord}" verilen harflerle oluşturulamaz.`, 'error');
    playSound('wrong');
  }

  // Input alanını temizle
  wordAnswer.value = '';

  // Belirli bir gecikme sonra yeni kontrollere izin ver
  setTimeout(() => {
    isProcessingWordCheck = false;
  }, 500);
}

// Kelime Türkçe sözlükte var mı kontrol et
function checkWordInList(word) {
  if (window.wordList && Array.isArray(window.wordList)) {
    if (window.wordList.includes(word)) {
      // Kelime doğru, bildirim göster
      showNotification(`Tebrikler! "${word}" geçerli bir kelime.`, 'success');
      playSound('correct');

      // Bulduğu kelimeyi değerlendir ve geri bildirim ver
      evaluateUserWord(word);
    } else {
      showNotification(`"${word}" Türkçe sözlükte bulunamadı.`, 'warning');
      playSound('wrong');
    }
  } else {
    // Kelime listesi yüklenmediyse
    showNotification(`"${word}" harflerle eşleşiyor, ancak sözlük kontrolü yapılamadı.`, 'warning');
  }
}

// Kullanıcının bulduğu kelimeyi değerlendir
async function evaluateUserWord(word) {
  const lettersElements = document.querySelectorAll('.letter-box');
  const availableLetters = Array.from(lettersElements).map(el => el.textContent);

  // En iyi kelimeleri bul
  const longestWithoutJoker = await findLongestWord(availableLetters, false);
  const longestWithJoker = await findLongestWord(availableLetters, true);

  // Kelime uzunluklarını karşılaştır
  const userWordLength = word.length;
  const bestNoJokerLength = longestWithoutJoker.length;
  const bestWithJokerLength = longestWithJoker.length;

  if (userWordLength === bestWithJokerLength) {
    // En iyi kelimeyi buldu
    showNotification('MÜKEMMELSİN! En uzun kelimeyi buldun!', 'success');

    // Oyunu sonlandır ve cevabı göster
    if (isGameActive) {
      // Oyunu kazandı olarak sonlandır
      endGame(true, true);
    }
  }
  else if (userWordLength === bestNoJokerLength) {
    // Jokersiz en iyi kelimeyi buldu
    showNotification('Harika! Jokersiz en uzun kelimeyi buldun!', 'success');
  }
  else if (userWordLength >= bestNoJokerLength * 0.8) {
    // En iyi kelimenin %80'i kadar uzun bir kelime buldu
    showNotification('Çok iyi gidiyorsun! Daha uzun kelimeler de var!', 'info');
  }
  else if (userWordLength >= 4) {
    // 4 veya daha uzun bir kelime buldu
    showNotification('İyi bir kelime! Daha uzunları da mümkün.', 'info');
  }
  else {
    // Standart bildirim
    showNotification('Doğru kelime, devam et!', 'info');
  }
}

function showNotification(message, type) {
  notificationSystem.init();
  notificationSystem.show(message, type, type === 'hint' ? 5000 : 3000); // İpuçları için daha uzun süre, diğerleri için kısa
}

// Sonuç mesajını göster
function showWordResult(message, type) {
  const wordResult = document.getElementById('word-result');

  if (!wordResult) return;

  // Varsa önceki sınıfları temizle
  wordResult.classList.remove('result-correct', 'result-warning', 'result-error');

  // Yeni sınıfı ekle
  wordResult.classList.add(`result-${type}`);

  // Mesajı göster
  wordResult.innerHTML = message;
  wordResult.style.display = 'block';

  // 6 saniye sonra otomatik kapat (sadece hata değilse)
  if (type !== 'error') {
    setTimeout(() => {
      wordResult.style.display = 'none';
    }, 6000);
  }
}

function playSound(type) {
  if (!soundEnabled) return;

  // Eğer henüz tanımlanmamışsa tanımlayalım
  if (typeof playSound.sounds === 'undefined') {
    playSound.sounds = {
      correct: new Audio('sounds/correct.mp3') || new Audio(),
      wrong: new Audio('sounds/wrong.mp3') || new Audio()
    };

    // Ses seviyelerini ayarla
    Object.values(playSound.sounds).forEach(sound => {
      sound.volume = volumeLevel / 100;
    });
  }

  // Sesi çal
  if (playSound.sounds[type]) {
    try {
      playSound.sounds[type].currentTime = 0;
      playSound.sounds[type].play().catch(err => console.log('Ses çalma hatası:', err));
    } catch (err) {
      console.log('Ses çalma hatası:', err);
    }
  }
}

function setupMathInputArea() {
  const mathInputArea = document.getElementById('math-input-area');
  const availableNumbersContainer = document.getElementById('available-numbers');
  const operatorButtons = document.querySelectorAll('.operator-button');
  const undoButton = document.getElementById('undo-button');
  const clearButton = document.getElementById('clear-button');
  const checkCalculationButton = document.getElementById('check-calculation-button');
  const calculationStepsElement = document.getElementById('calculation-steps');
  const currentCalculationElement = document.getElementById('current-calculation');
  const mathResult = document.getElementById('math-result');

  if (!mathInputArea || !availableNumbersContainer) return;

  // Temizle
  availableNumbersContainer.innerHTML = '';
  if (calculationStepsElement) calculationStepsElement.innerHTML = '';
  if (currentCalculationElement) currentCalculationElement.innerHTML = '';
  if (mathResult) {
    mathResult.innerHTML = '';
    mathResult.style.display = 'none';
  }

  // Hesaplama değişkenlerini sıfırla
  calculationSteps = [];
  currentSelectedNumber = null;
  currentOperator = null;
  usedNumbers = [];

  // Mevcut sayıları butonlar olarak ekle
  currentNumbers.forEach(number => {
    const button = document.createElement('button');
    button.className = 'number-button';
    button.textContent = number;
    button.dataset.value = number;
    button.setAttribute('aria-label', `Sayı ${number}`);
    availableNumbersContainer.appendChild(button);
  });

  // Hedef sayıyı göster
  if (calculationStepsElement) {
    const targetInfo = document.createElement('div');
    targetInfo.className = 'target-info';
    targetInfo.innerHTML = `<span>Hedef: <strong>${currentTarget}</strong></span>`;
    calculationStepsElement.appendChild(targetInfo);
  }

  // Sayı butonları için event listener'ları değiştir
  const numberButtons = availableNumbersContainer.querySelectorAll('.number-button');
  numberButtons.forEach(button => {
    // Önceki event listener'ları temizle
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // Yeni listener ekle
    newButton.addEventListener('click', function() {
      // Buton kullanılmamışsa
      if (!this.classList.contains('used')) {
        selectNumber(parseInt(this.dataset.value), this);
      }
    });

    // Hover efektleri
    newButton.addEventListener('mouseenter', function() {
      if (!this.classList.contains('used')) {
        this.classList.add('hover');
      }
    });
    
    newButton.addEventListener('mouseleave', function() {
      this.classList.remove('hover');
    });
  });

   // Operatör butonları için event listener'ları değiştir
   operatorButtons.forEach(button => {
    // Önceki event listener'ları temizle
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // Yeni listener ekle - her zaman tıklanabilir olsun
    newButton.addEventListener('click', function() {
      selectOperator(this.getAttribute('data-op'));
    });
    
    // Görsel geri bildirim
    newButton.addEventListener('mouseenter', function() {
      // Sadece bir sayı seçiliyse hover efekti ver
      if (currentSelectedNumber !== null) {
        this.classList.add('operator-hover');
      }
    });
    
    newButton.addEventListener('mouseleave', function() {
      this.classList.remove('operator-hover');
    });
  });

  // Diğer butonlar için event listener'lar
  if (undoButton) {
    // Önceki listener'ı temizle
    const newUndoButton = undoButton.cloneNode(true);
    undoButton.parentNode.replaceChild(newUndoButton, undoButton);
    
    // Yeni listener ekle
    newUndoButton.addEventListener('click', function() {
      if (!isProcessingUndoAction) {
        undoLastStep();
      }
    });
  }

  if (clearButton) {
    // Önceki listener'ı temizle
    const newClearButton = clearButton.cloneNode(true);
    clearButton.parentNode.replaceChild(newClearButton, clearButton);
    
    // Yeni listener ekle
    newClearButton.addEventListener('click', function() {
      if (!isProcessingClearAction) {
        clearCalculation();
      }
    });
  }

  if (checkCalculationButton) {
    // Önceki olay dinleyicileri temizle
    const newCheckButton = checkCalculationButton.cloneNode(true);
    checkCalculationButton.parentNode.replaceChild(newCheckButton, checkCalculationButton);

    // Yeni olay dinleyicisi ekle
    newCheckButton.addEventListener('click', function () {
      if (!isProcessingMathCheck && calculationSteps.length > 0) {
        checkMathAnswer();
      }
    });

    // Başlangıçta sayı seçilmediği için devre dışı bırak
    newCheckButton.disabled = calculationSteps.length === 0;
  }

  // İpucu mesajı göster
  showGuideMessage("Bir sayı seçin, sonra bir işlem seçin, ardından başka bir sayı seçin.");
}

// Yardımcı rehber mesajları gösterme
function showGuideMessage(message, autoHide = true) {
  const mathResult = document.getElementById('math-result');

  if (!mathResult) return;

  // Mesaj stili
  mathResult.classList.remove('result-correct', 'result-warning', 'result-error');
  mathResult.classList.add('result-guide');

  // Mesajı göster
  mathResult.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
  mathResult.style.display = 'block';

  // 5 saniye sonra otomatik gizle
  if (autoHide) {
    setTimeout(() => {
      mathResult.style.display = 'none';
    }, 5000);
  }
}

/**
 * Sayı seçimi fonksiyonu
 */
function selectNumber(number, buttonElement) {
  closeHintNotification();
  
  // Eğer buton zaten kullanılmışsa, geri dön
  if (buttonElement.classList.contains('used')) return;
  
  // DURUM 1: Henüz hiçbir şey seçilmemişse - ilk sayıyı seç
  if (currentSelectedNumber === null) {
    currentSelectedNumber = number;
    buttonElement.classList.add('selected');
    showGuideMessage("Şimdi bir işlem seçin (+, -, ×, ÷)");
  }
  // DURUM 2: Birinci sayı seçili ama operatör seçili değilse - sayıyı değiştir
  else if (currentSelectedNumber !== null && currentOperator === null) {
    // Önceki seçili sayıyı temizle
    const buttons = document.querySelectorAll('.number-button');
    for (const btn of buttons) {
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        break;
      }
    }
    
    // Yeni sayıyı seç
    currentSelectedNumber = number;
    buttonElement.classList.add('selected');
    showGuideMessage("Şimdi bir işlem seçin (+, -, ×, ÷)");
  }
  // DURUM 3: Birinci sayı ve operatör seçilmişse - işlemi tamamla
  else if (currentSelectedNumber !== null && currentOperator !== null) {
    // İşlemi hesapla
    const result = calculateStep(currentSelectedNumber, number, currentOperator);
    
    if (result !== false) {
      // İlk sayı butonunu kullanıldı olarak işaretle
      const buttons = document.querySelectorAll('.number-button');
      for (const btn of buttons) {
        if (btn.classList.contains('selected')) {
          btn.classList.remove('selected');
          btn.classList.add('used');
          usedNumbers.push(btn);
          break;
        }
      }
      
      // İkinci sayıyı da kullanıldı olarak işaretle
      buttonElement.classList.add('used');
      usedNumbers.push(buttonElement);
      
      // İşlemi adımlara ekle
      calculationSteps.push({
        leftNumber: currentSelectedNumber,
        rightNumber: number,
        operator: currentOperator,
        result: result
      });
      
      // Seçili operatör butonunu temizle
      const operatorButtons = document.querySelectorAll('.operator-button');
      operatorButtons.forEach(btn => {
        btn.classList.remove('selected');
      });
      
      // Yeni sonuç butonunu oluştur
      const resultButton = document.createElement('button');
      resultButton.className = 'number-button result-button';
      resultButton.textContent = result;
      resultButton.dataset.value = result;
      resultButton.setAttribute('aria-label', `Sonuç: ${result}`);
      
      // Buton için event listener'lar
      resultButton.addEventListener('click', function() {
        selectNumber(parseInt(this.dataset.value), this);
      });
      
      resultButton.addEventListener('mouseenter', function() {
        if (!this.classList.contains('used') && !this.classList.contains('selected')) {
          this.classList.add('hover');
        }
      });
      
      resultButton.addEventListener('mouseleave', function() {
        this.classList.remove('hover');
      });
      
      // Butonu ekle
      const availableNumbersContainer = document.getElementById('available-numbers');
      if (availableNumbersContainer) {
        availableNumbersContainer.appendChild(resultButton);
      }
      
      // Değişkenleri sıfırla
      currentSelectedNumber = null;
      currentOperator = null;
      
      // Ses efekti çal
      playSound('correct');
      
      // Rehberlik mesajı
      if (Math.abs(result - currentTarget) === 0) {
        showGuideMessage("Hedef sayıya ulaştınız! Kontrol Et butonuna basabilirsiniz.", false);
      } else {
        showGuideMessage("Harika! Şimdi bir sonraki işleme başlayabilirsiniz.");
      }
      
      // Kontrol Et butonunu etkinleştir
      const checkCalculationButton = document.getElementById('check-calculation-button');
      if (checkCalculationButton) {
        checkCalculationButton.disabled = false;
      }
    }
  }
  
  // Ekranı güncelle
  updateCalculationDisplay();
}

/**
 * Operatör seçimi fonksiyonu - geliştirme yapıldı
 */
function selectOperator(operator) {
  closeHintNotification();
  
  // Sayı seçilmediyse uyarı ver
  if (currentSelectedNumber === null) {
    showGuideMessage("Önce bir sayı seçmelisiniz!", true);
    return;
  }
  
  // Tüm operatör butonlarını temizle - her durumda
  const operatorButtons = document.querySelectorAll('.operator-button');
  operatorButtons.forEach(btn => {
    btn.classList.remove('selected');
  });
  
  // Operatör değiştiriliyorsa, sadece operatörü güncelle
  if (currentOperator !== null) {
    currentOperator = operator;
  } 
  // İlk kez operatör seçiliyorsa
  else {
    currentOperator = operator;
  }
  
  // Seçilen operatörü işaretle
  const selectedButton = document.querySelector(`.operator-button[data-op="${operator}"]`);
  if (selectedButton) {
    selectedButton.classList.add('selected');
  }
  
  // Rehberlik mesajı göster
  showGuideMessage("Şimdi ikinci sayıyı seçin");
  
  // Ekranı güncelle
  updateCalculationDisplay();
}

function clearButton_onClick() {
  // Eğer bir seçim varsa sadece onu temizle
  if (currentSelectedNumber !== null) {
    // Seçili sayıyı temizle
    const buttons = document.querySelectorAll('.number-button');
    for (const btn of buttons) {
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
      }
    }
    
    // Seçili operatörü temizle
    const operatorButtons = document.querySelectorAll('.operator-button');
    operatorButtons.forEach(btn => {
      btn.classList.remove('selected');
    });
    
    // Değişkenleri sıfırla
    currentSelectedNumber = null;
    currentOperator = null;
    
    // Ekranı güncelle
    updateCalculationDisplay();
    
    // Rehberlik mesajı göster
    showGuideMessage("İşlem iptal edildi. Yeni bir sayı seçin.");
  } 
  // Seçim yoksa tüm hesaplamaları temizle
  else if (!isProcessingClearAction && calculationSteps.length > 0) {
    clearCalculation();
  }
}

// Hesaplama ekranını güncelle - geliştirilmiş
function updateCalculationDisplay() {
  const calculationStepsElement = document.getElementById('calculation-steps');
  const currentCalculationElement = document.getElementById('current-calculation');

  if (!calculationStepsElement || !currentCalculationElement) return;

  // Önceki adımları göster
  if (calculationSteps.length > 0) {
    // Target info her zaman kalır
    let targetInfo = calculationStepsElement.querySelector('.target-info');
    if (!targetInfo) {
      targetInfo = document.createElement('div');
      targetInfo.className = 'target-info';
      targetInfo.innerHTML = `<span>Hedef: <strong>${currentTarget}</strong></span>`;
    }

    // Diğer adımları temizle ve hedef bilgisi dışındaki içeriği yeniden oluştur
    calculationStepsElement.innerHTML = '';
    calculationStepsElement.appendChild(targetInfo);

    // Tüm adımları ekle
    calculationSteps.forEach((step, index) => {
      const stepElement = document.createElement('div');
      stepElement.className = 'step';
      const operator = displayOperator(step.operator);
      stepElement.innerHTML = `${step.leftNumber} ${operator} ${step.rightNumber} = ${step.result}`;

      // Son adımı vurgula
      if (index === calculationSteps.length - 1) {
        stepElement.classList.add('last-step');
      }

      calculationStepsElement.appendChild(stepElement);
    });
  }

  // Mevcut hesaplamayı göster
  if (currentSelectedNumber !== null) {
    let currentHTML = `${currentSelectedNumber}`;

    if (currentOperator !== null) {
      currentHTML += ` ${displayOperator(currentOperator)}`;
    }

    currentCalculationElement.innerHTML = currentHTML;
  } else {
    currentCalculationElement.innerHTML = '';
  }
}

// Hesaplama adımını gerçekleştir
function calculateStep(left, right, operator) {
  switch (operator) {
    case '+': return left + right;
    case '-':
      // Negatif sayı kontrolü
      if (left < right) {
        showMathResult(`${left} - ${right} hesaplaması negatif sonuç veriyor.`, 'warning');
        return false;
      }
      return left - right;
    case '*': return left * right;
    case '/':
      // Sıfıra bölme ve tam bölünebilme kontrolü
      if (right === 0) {
        showMathResult('Sıfıra bölme işlemi yapılamaz!', 'error');
        return false;
      }
      if (left % right !== 0) {
        showMathResult(`${left} sayısı ${right} sayısına tam bölünmüyor.`, 'warning');
        return false;
      }
      return left / right;
    default:
      return false;
  }
}

// Son adımı geri al
function undoLastStep() {
  if (isProcessingUndoAction || calculationSteps.length === 0) return;
  isProcessingUndoAction = true;
  
  // İpucu bildirimini kapat
  closeHintNotification();
  
  // DURUM 1: Devam eden bir işlem varsa önce onu iptal et
  if (currentSelectedNumber !== null || currentOperator !== null) {
    // Seçili sayıyı temizle
    const buttons = document.querySelectorAll('.number-button');
    buttons.forEach(btn => {
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
      }
    });
    
    // Seçili operatörü temizle
    const operatorButtons = document.querySelectorAll('.operator-button');
    operatorButtons.forEach(btn => {
      btn.classList.remove('selected');
    });
    
    // Değişkenleri sıfırla
    currentSelectedNumber = null;
    currentOperator = null;
    
    // Ekranı güncelle
    updateCalculationDisplay();
    
    // Rehberlik mesajı
    showGuideMessage("Mevcut işlem iptal edildi. Şimdi son adımı geri alabilirsiniz.");
    
    // Burada return yapmıyoruz, işlem hem iptal edilip hem de son adım geri alınacak
  }
  
  // Son adımı kaldır
  calculationSteps.pop();
  
  // Tüm butonları temizle
  const availableNumbersContainer = document.getElementById('available-numbers');
  if (availableNumbersContainer) {
    availableNumbersContainer.innerHTML = '';
  }
  
  // Kullanılmış sayılar listesini temizle
  usedNumbers = [];
  
  // Değişkenleri sıfırla
  currentSelectedNumber = null;
  currentOperator = null;
  
  // Sayıları baştan ekle
  currentNumbers.forEach(number => {
    const button = document.createElement('button');
    button.className = 'number-button';
    button.textContent = number;
    button.dataset.value = number;
    button.addEventListener('click', function() {
      selectNumber(parseInt(this.dataset.value), this);
    });
    button.setAttribute('aria-label', `Sayı ${number}`);
    
    // Hover efektleri
    button.addEventListener('mouseenter', function() {
      if (!this.classList.contains('used') && !this.classList.contains('selected')) {
        this.classList.add('hover');
      }
    });
    
    button.addEventListener('mouseleave', function() {
      this.classList.remove('hover');
    });
    
    availableNumbersContainer.appendChild(button);
  });
  
  // Tüm hesaplama adımlarını yeniden uygula
  for (const step of calculationSteps) {
    // Sol sayıyı bul ve işaretle
    const leftButton = findOrCreateButton(step.leftNumber);
    if (leftButton) {
      leftButton.classList.add('used');
      usedNumbers.push(leftButton);
    }
    
    // Sağ sayıyı bul ve işaretle
    const rightButton = findOrCreateButton(step.rightNumber);
    if (rightButton) {
      rightButton.classList.add('used');
      usedNumbers.push(rightButton);
    }
    
    // Sonuç için yeni buton ekle
    const resultButton = document.createElement('button');
    resultButton.className = 'number-button result-button';
    resultButton.textContent = step.result;
    resultButton.dataset.value = step.result;
    resultButton.addEventListener('click', function() {
      selectNumber(parseInt(this.dataset.value), this);
    });
    
    // Hover efektleri
    resultButton.addEventListener('mouseenter', function() {
      if (!this.classList.contains('used') && !this.classList.contains('selected')) {
        this.classList.add('hover');
      }
    });
    
    resultButton.addEventListener('mouseleave', function() {
      this.classList.remove('hover');
    });
    
    availableNumbersContainer.appendChild(resultButton);
  }
  
  // Ekranı güncelle
  updateCalculationDisplay();
  
  // Ses efekti
  playSound('wrong');
  
  // Rehberlik mesajı
  if (calculationSteps.length === 0) {
    showGuideMessage("Tüm adımlar geri alındı. Baştan başlayabilirsiniz.");
  } else {
    showGuideMessage("Son adım geri alındı. Devam edebilirsiniz.");
  }
  
  // Anti-spam için kısa bir gecikme
  setTimeout(() => {
    isProcessingUndoAction = false;
  }, 300);
}

// Değere göre buton bul veya oluştur
function findOrCreateButton(value) {
  const availableNumbersContainer = document.getElementById('available-numbers');

  // Önce mevcut butonlar arasında ara
  const buttons = availableNumbersContainer.querySelectorAll('.number-button:not(.used)');
  for (const button of buttons) {
    if (parseInt(button.dataset.value) === value) {
      return button;
    }
  }

  // Bulunamadıysa yeni bir buton oluştur
  const newButton = document.createElement('button');
  newButton.className = 'number-button';
  newButton.textContent = value;
  newButton.dataset.value = value;
  newButton.addEventListener('click', function () {
    selectNumber(parseInt(this.dataset.value), this);
  });

  availableNumbersContainer.appendChild(newButton);
  return newButton;
}

/**
 * Temizle butonuna ek özellik: Geçerli işlemi iptal etme
 */
function clearCalculation() {
  if (isProcessingClearAction) return;
  isProcessingClearAction = true;
  
  // İpucu bildirimini kapat
  closeHintNotification();
  
  // DURUM 1: Devam eden bir işlem varsa sadece onu iptal et
  if (currentSelectedNumber !== null || currentOperator !== null) {
    // Seçili sayıyı temizle
    const buttons = document.querySelectorAll('.number-button');
    buttons.forEach(btn => {
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
      }
    });
    
    // Seçili operatörü temizle
    const operatorButtons = document.querySelectorAll('.operator-button');
    operatorButtons.forEach(btn => {
      btn.classList.remove('selected');
    });
    
    // Değişkenleri sıfırla
    currentSelectedNumber = null;
    currentOperator = null;
    
    // Rehberlik mesajı
    showGuideMessage("Mevcut işlem iptal edildi. Yeni bir işleme başlayabilirsiniz.");
    
    // Ekranı güncelle
    updateCalculationDisplay();
    
    // Ses efekti
    playSound('wrong');
  }
  // DURUM 2: Hiçbir şey seçili değilse tüm hesaplamayı sıfırla
  else {
    // Tüm değişkenleri sıfırla
    calculationSteps = [];
    usedNumbers = [];
    currentSelectedNumber = null;
    currentOperator = null;
    
    // Input alanını yeniden kur
    setupMathInputArea();
    
    // Ses efekti
    playSound('wrong');
    
    // Rehberlik mesajı
    showGuideMessage("Tüm hesaplama sıfırlandı. Baştan başlayabilirsiniz.");
  }
  
  // Anti-spam için gecikme
  setTimeout(() => {
    isProcessingClearAction = false;
  }, 300);
}

// Hesaplama ekranını güncelle
function updateCalculationDisplay() {
  const calculationStepsElement = document.getElementById('calculation-steps');
  const currentCalculationElement = document.getElementById('current-calculation');

  if (!calculationStepsElement || !currentCalculationElement) return;

  // Önceki adımları göster
  if (calculationSteps.length > 0) {
    let stepsHTML = '';
    calculationSteps.forEach((step, index) => {
      const operator = displayOperator(step.operator);
      stepsHTML += `<div class="step">${step.leftNumber} ${operator} ${step.rightNumber} = ${step.result}</div>`;
    });
    calculationStepsElement.innerHTML = stepsHTML;
  } else {
    calculationStepsElement.innerHTML = '';
  }

  // Mevcut hesaplamayı göster
  if (currentSelectedNumber !== null) {
    let currentHTML = `${currentSelectedNumber}`;

    if (currentOperator !== null) {
      currentHTML += ` ${displayOperator(currentOperator)}`;
    }

    currentCalculationElement.innerHTML = currentHTML;
  } else {
    currentCalculationElement.innerHTML = '';
  }
}

// Operatör görüntüleme
function displayOperator(op) {
  switch (op) {
    case '+': return '+';
    case '-': return '−';
    case '*': return '×';
    case '/': return '÷';
    default: return op;
  }
}

// Matematik cevabını kontrol et - geliştirilmiş
function checkMathAnswer() {
  if (isProcessingMathCheck) return;
  isProcessingMathCheck = true;

  // İpucu bildirimini kapat
  closeHintNotification();

  // Son adımdan sonuç al
  let finalResult = null;
  if (calculationSteps.length > 0) {
    finalResult = calculationSteps[calculationSteps.length - 1].result;
  }

  if (finalResult === null) {
    showNotification('Henüz bir hesaplama yapmadınız.', 'warning');
    isProcessingMathCheck = false;
    return;
  }

  // Hedef sayıya olan uzaklık
  const difference = Math.abs(finalResult - currentTarget);

  if (difference === 0) {
    showNotification(`<i class="fas fa-check-circle"></i> Tebrikler! Hedef sayı ${currentTarget}'a ulaştınız!`, 'success');
    playSound('correct');

    // Oyunu kazanma durumunda sonlandır
    if (isGameActive) {
      endGame(true, true);
    }
  } else {
    showNotification(`Sonucunuz: ${finalResult} (Hedef sayıdan ${difference} uzaktasınız)`, 'warning');
  }

  // Anti-spam için kısa bir gecikme
  setTimeout(() => {
    isProcessingMathCheck = false;
  }, 500);
}

function addPlayButtonStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #pauseButton.play-active {
      background-color: #00cc66;
      transform: scale(1.1);
      box-shadow: 0 0 8px rgba(0, 204, 102, 0.6);
      animation: pulse-play 1.5s infinite;
    }
    
    @keyframes pulse-play {
      0% {
        transform: scale(1.1);
        box-shadow: 0 0 8px rgba(0, 204, 102, 0.6);
      }
      50% {
        transform: scale(1.15);
        box-shadow: 0 0 12px rgba(0, 204, 102, 0.8);
      }
      100% {
        transform: scale(1.1);
        box-shadow: 0 0 8px rgba(0, 204, 102, 0.6);
      }
    }
  `;
  document.head.appendChild(style);
}

// CSS için ek stil ekleme
function addStylesForMathInput() {
  const style = document.createElement('style');
  style.textContent = `
    .target-info {
      background-color: rgba(255, 204, 0, 0.2);
      padding: 8px;
      border-radius: 5px;
      margin-bottom: 10px;
      text-align: center;
    }
    
    .target-info strong {
      font-size: 1.2em;
      color: #ffcc00;
    }
    
    .step {
      position: relative;
      padding-left: 20px;
    }
    
    .step::before {
      content: "→";
      position: absolute;
      left: 0;
      color: #0099cc;
    }
    
    .last-step {
      font-weight: bold;
      background-color: rgba(0, 204, 102, 0.15);
    }
    
    .number-button.hover {
      background-color: #e6f7ff;
      transform: scale(1.05);
      box-shadow: 0 0 5px rgba(0, 153, 204, 0.5);
    }
    
    .number-button.result-button {
      background-color: #e6fff2;
      border: 2px solid #00cc66;
    }
    
    .operator-button.selected {
      background-color: #ff6600;
      transform: scale(1.1);
      box-shadow: 0 0 10px rgba(255, 102, 0, 0.5);
    }
    
    .operator-hover {
      background-color: #ffbb33;
      transform: scale(1.05);
    }
    
    .result-guide {
      background-color: #004080;
      font-size: 14px;
      font-weight: normal;
    }
  `;
  document.head.appendChild(style);
}

// Matematik sonucunu göster
function showMathResult(message, type) {
  const mathResult = document.getElementById('math-result');

  if (!mathResult) return;

  // Varsa önceki sınıfları temizle
  mathResult.classList.remove('result-correct', 'result-warning', 'result-error');

  // Yeni sınıfı ekle
  mathResult.classList.add(`result-${type}`);

  // Mesajı göster
  mathResult.innerHTML = message;
  mathResult.style.display = 'block';

  // 6 saniye sonra kapat (error olmadığı sürece)
  if (type !== 'error') {
    setTimeout(() => {
      mathResult.style.display = 'none';
    }, 6000);
  }
}

function startGame(type) { 
  if (isGameStarting || isGameActive) {
    return;
  }

  resetPagination();

  isGameStarting = true;
  isGameActive = false;
  isPaused = false;

  // Cevap butonunu sıfırla - ÖNEMLİ!
  resetAnswerButton();

  gameType = type;
  timeLeft = 30;
  clearAllTimers();
  
  // Müziği ön yükleme
  preloadMusic();

  const pauseButton = document.getElementById('pauseButton');
  if (pauseButton) {
    pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
  }

  if (timerElement) {
    timerElement.textContent = timeLeft;
    timerElement.style.display = "block";
    timerElement.style.color = "";
  }

  // BULDUM butonu artık gizlenecek, diğer butonlar gösterilecek
  if (actionButtons) actionButtons.style.display = "block";
  if (hintButton) hintButton.disabled = true;
  if (answerButton) answerButton.disabled = true;
  if (gameArea) gameArea.innerHTML = "";

  if (gameButtons) gameButtons.style.display = "none";
  if (inGameButtons) inGameButtons.style.display = "block";

  // Input alanlarını gizle - oyun başlangıçta
  const wordInputArea = document.getElementById('word-input-area');
  const mathInputArea = document.getElementById('math-input-area');
  if (wordInputArea) wordInputArea.style.display = "none";
  if (mathInputArea) mathInputArea.style.display = "none";

  animationCount = 0;
  totalAnimations = type === "word" ? 9 : 7;

  if (type === "word") {
    loadWordList().then(() => {
      createWordGame();
    }).catch(err => {
      console.error("Kelime listesi yüklenirken hata:", err);
    });
  } else {
    createMathGame();
  }

  startTimerTimeout = setTimeout(() => {
    startTimer(); // Bu timer başladığında input alanları gösterilecek
    if (hintButton) hintButton.disabled = false;
    if (answerButton) answerButton.disabled = false;
    isGameStarting = false;
    isGameActive = true;
    
    // Cevap gösterme durumunu sıfırla
    gameState.isAnswerDisplayed = false;
  }, (totalAnimations + 1) * 300);
}

// Müziği ön yükleme fonksiyonu
function preloadMusic() {
  const countdownMusic = document.getElementById('countdownMusic');
  
  if (!countdownMusic) {
    console.error("countdown müzik elementi bulunamadı!");
    return;
  }
  
  try {
    // Müziği yükle ama çalma
    countdownMusic.load();
    countdownMusic.volume = soundEnabled ? (volumeLevel / 100) : 0;
    countdownMusic.currentTime = 0;
    countdownMusicPlaying = false;
  } catch (error) {
    console.error("Müzik ön yükleme hatası:", error);
  }
}

/// Ana sayfaya gitme fonksiyonu - TÜM oyunu tamamen sıfırlayan versiyon
function goToHomePage() {
  if (isGameStarting) return;

  // ÖNEMLİ: Tüm zamanlayıcıları tamamen temizle
  clearAllTimers();
  
  // Oyun durumunu sıfırla
  resetGameState();
  
  // Oyun alanını temizle
  if (gameArea) gameArea.innerHTML = "";
  
  // Duraklama göstergesi ve efektlerini kaldır
  removeBlurAndPause();
  
  // Butonları göster/gizle
  if (actionButtons) actionButtons.style.display = "none";
  if (inGameButtons) inGameButtons.style.display = "none";
  if (gameButtons) gameButtons.style.display = "block";
  
  // Timer'ı sıfırla
  resetTimer();
  
  // Countdown müziğini tamamen durdur
  stopCountdownMusic();

  // Input alanlarını temizle ve gizle
  resetInputAreas();
  
  // Sonuç alanlarını temizle
  clearResultAreas();
  
  // Pagination'ı sıfırla
  resetPagination();

  // Cevap alanını kaldır ve cevap butonunu sıfırla
  resetAnswerButton();
}

// Oyunu yeniden başlatma fonksiyonu - TÜM oyunu tamamen sıfırlayan versiyon
function restartGame() { 
  if (isGameStarting) return;

  // Eski oyun tipini sakla
  const oldGameType = gameType;

  // ÖNEMLİ: Tüm zamanlayıcıları temizle
  clearAllTimers();
  
  // Oyun durumunu sıfırla
  resetGameState();
  
  // Duraklama göstergesi ve efektlerini kaldır
  removeBlurAndPause();
  
  // Countdown müziğini durdur
  stopCountdownMusic();

  // Cevap alanını kaldır ve cevap butonunu sıfırla
  resetAnswerButton();

  // Input alanlarını temizle ve gizle
  resetInputAreas();
  
  // Sonuç alanlarını temizle
  clearResultAreas();
  
  // Pagination'ı sıfırla
  resetPagination();

  // Kısa bir gecikme sonra yeni oyun başlat
  setTimeout(() => {
    startGame(oldGameType);
  }, 100);
}

/**
 * Tüm zamanlayıcıları ve interval'ları temizleyen yardımcı fonksiyon
 */
function clearAllTimers() {
  // Bilinen ana interval'ı temizle
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Başlangıç zamanlayıcısını temizle
  if (startTimerTimeout) {
    clearTimeout(startTimerTimeout);
    startTimerTimeout = null;
  }
  
  // Tüm aktif interval'ları temizle (kritik!)
  activeIntervals.forEach(intervalId => {
    clearInterval(intervalId);
  });
  
  // Array'i boşalt
  activeIntervals = [];
  
  // Ses kontrolleri için zamanlayıcıları temizle
  if (window.closeTimer) {
    clearTimeout(window.closeTimer);
    window.closeTimer = null;
  }
  
  // Diğer aktif görevleri sıfırla
  activeTasks = { pauseTimer: false };
}

/**
 * Oyun durumunu sıfırlayan yardımcı fonksiyon
 */
function resetGameState() {
  isGameStarting = false;
  isGameActive = false;
  isPaused = false;
  isProcessingWordCheck = false;
  isProcessingMathCheck = false;
  isShowingHint = false;
  isProcessingUndoAction = false;
  isProcessingClearAction = false;
  
  // İşlem değişkenleri
  calculationSteps = [];
  currentSelectedNumber = null;
  currentOperator = null;
  usedNumbers = [];
  
  // Müzik durumunu sıfırla
  countdownMusicPlaying = false;
  
  // Cevap gösterme durumunu sıfırla
  gameState.isAnswerDisplayed = false;
}

/**
 * Duraklama göstergesi ve efektlerini kaldıran yardımcı fonksiyon
 */
function removeBlurAndPause() {
  const pausedOverlay = document.getElementById('paused-overlay');
  if (pausedOverlay) {
    pausedOverlay.style.display = 'none';
  }

  const pauseStyle = document.getElementById('pause-style');
  if (pauseStyle) {
    pauseStyle.remove();
  }
  
  document.body.classList.remove('paused');

  const gameAreaContent = document.querySelectorAll("#game-area > *, #word-input-area, #math-input-area");
  gameAreaContent.forEach(element => {
    element.style.filter = '';
    element.style.pointerEvents = 'auto';
    element.style.userSelect = 'auto';
  });
  
  // Pause butonunu normal haline getir
  const pauseButton = document.getElementById('pauseButton');
  if (pauseButton) {
    pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
    pauseButton.title = "Duraklat";
    pauseButton.classList.remove('play-active');
  }
}

/**
 * Timer'ı sıfırlayan yardımcı fonksiyon
 */
function resetTimer() {
  if (timerElement) {
    timerElement.style.color = "";
    timerElement.textContent = "30";
    timerElement.style.display = "block";
  }
  timeLeft = 30;
}

/**
 * Input alanlarını sıfırlayan yardımcı fonksiyon
 */
function resetInputAreas() {
  const wordInputArea = document.getElementById('word-input-area');
  const mathInputArea = document.getElementById('math-input-area');
  const wordAnswer = document.getElementById('word-answer');
  
  if (wordInputArea) {
    wordInputArea.style.display = "none";
    // Kelime input alanını temizle
    if (wordAnswer) wordAnswer.value = '';
  }
  
  if (mathInputArea) {
    mathInputArea.style.display = "none";
  }
}

/**
 * Sonuç alanlarını temizleyen yardımcı fonksiyon
 */
function clearResultAreas() {
  const wordResult = document.getElementById('word-result');
  const mathResult = document.getElementById('math-result');
  
  if (wordResult) {
    wordResult.innerHTML = '';
    wordResult.style.display = 'none';
  }
  
  if (mathResult) {
    mathResult.innerHTML = '';
    mathResult.style.display = 'none';
  }
}

/**
 * Cevap alanını kaldıran yardımcı fonksiyon
 */
function removeAnswerArea() {
  const answerArea = document.getElementById("answer-area");
  if (answerArea) {
    answerArea.remove();
  }
  
  const paginationArea = document.getElementById("pagination-area");
  if (paginationArea) {
    paginationArea.remove();
  }
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

// Timer'ı başlatan fonksiyon - optimize edilmiş
function startTimer() {
  // Önce tüm eski zamanlayıcıları temizle
  clearAllTimers();
  
  // Süreyi sıfırla ve görüntüyü güncelle
  timeLeft = 30;
  if (timerElement) {
    timerElement.textContent = timeLeft;
  }
  
  // TEK BİR YENİ interval oluştur - ARTIK BU BİZİM TEK INTERVAL'IMIZ
  timerInterval = setInterval(function() {
    // Sadece oyun aktifse devam et
    if (!isGameActive) return;
    
    // Duraklama durumunda sayacı güncelleme
    if (isPaused) return;
    
    // Süreyi güncelle
    if (timerElement) {
      timerElement.textContent = timeLeft;
    }
    
    // Süre dolduğunda işlem yap
    if (timeLeft === 0) {
      handleTimeExpiration();
    } else {
      // Süreyi azalt
      timeLeft--;
    }
  }, 1000);
  
  // Yeni interval'ı listeye ekle
  activeIntervals.push(timerInterval);
  
  // Timer başladığında oyun tipine göre input alanını göster
  if (gameType === "word") {
    const wordInputArea = document.getElementById('word-input-area');
    if (wordInputArea) {
      wordInputArea.style.display = "block";
      setupWordInputArea();
    }
  } else if (gameType === "math") {
    const mathInputArea = document.getElementById('math-input-area');
    if (mathInputArea) {
      mathInputArea.style.display = "block";
      setupMathInputArea();
    }
  }
  
  // Countdown müziğini başlat - ses sorunu için özel önlem
  setTimeout(() => {
    startCountdownMusic();
  }, 100);
}

// YENİ: Cevap butonunu ve cevap gösterme alanını sıfırlayan fonksiyon
function resetAnswerButton() {
  // Cevap butonu metnini sıfırla
  if (answerButton) {
    answerButton.textContent = "CEVAP";
  }
  
  // Cevap alanını kaldır
  const answerArea = document.getElementById("answer-area");
  if (answerArea) {
    answerArea.remove();
  }
  
  // Sayfalama alanını kaldır
  const paginationArea = document.getElementById("pagination-area");
  if (paginationArea) {
    paginationArea.remove();
  }
  
  // Cevap gösterme durumunu sıfırla
  gameState.isAnswerDisplayed = false;
}

// Sadece timer'ın gösterimini güncelleyen fonksiyon
function updateTimerDisplay() {
  if (timerElement) {
    timerElement.textContent = timeLeft;
  }
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
      lettersCopy[index] = null; // Kullanılan harfi işaretle
    } else if (useJoker && !jokerUsed && jokerIndex !== -1) {
      lettersCopy[jokerIndex] = null; // Jokeri kullan
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

function stopTimer() {
  if (!isGameActive) return;

  clearAllTimers();;
  clearTimeout(startTimerTimeout);
  if (timerElement) {
    timerElement.style.color = "#ff3300";
  }
  updateButtonStates();
  isGameActive = false;

  // Countdown müziğini durdur
  stopCountdownMusic();

  // Eğer kelime oyunu ise input alanını göster
  if (gameType === "word") {
    const wordInputArea = document.getElementById('word-input-area');
    if (wordInputArea) {
      wordInputArea.style.display = "block";
      setupWordInputArea();
    }
  } else if (gameType === "math") {
    const mathInputArea = document.getElementById('math-input-area');
    if (mathInputArea) {
      mathInputArea.style.display = "block";
      setupMathInputArea();
    }
  }
}

function updateButtonStates() {
  if (hintButton) hintButton.disabled = !isGameActive;
  if (answerButton) answerButton.disabled = false;
}

function updateTimer() {
  if (timerElement && isGameActive) {
    timerElement.textContent = timeLeft;

    // Süre dolduğunda
    if (timeLeft === 0) {
      // Süre doldu, oyunu sonlandır
      clearAllTimers();;

      // Süre göstergesini güncelle
      timerElement.textContent = "Süre doldu!";
      timerElement.style.color = "yellow";

      // Oyunu sonlandır
      isGameActive = false;

      // Müziği durdur
      stopCountdownMusic();

      // Oyun alanına efekt uygula
      const gameAreaContent = document.querySelectorAll("#game-area > *");
      gameAreaContent.forEach((element) => {
        element.style.opacity = "0.75";
      });

      // Butonları güncelle
      if (hintButton) hintButton.disabled = false;
      if (answerButton) answerButton.disabled = false;

      // 2 saniye sonra cevabı göster
      setTimeout(function () {
        showAnswers();
      }, 2000);
    } else {
      timeLeft--;
    }
  }
}

// Timer'ı ve sesi güncelleyen fonksiyon
function updateTimerWithSound() {
  if (timerElement && isGameActive) {
    // Önce gösterimi güncelle
    updateTimerDisplay();
    
    // Süre dolduğunda
    if (timeLeft === 0) {
      handleTimeExpiration();
    } else {
      // Süreyi azalt
      timeLeft--;
    }
  }
}

// handleWordTimeUp fonksiyonu açıklaması
/*
* Bu fonksiyon, kelime oyunu süresi dolduğunda kullanıcının son girdiği kelimeyi değerlendirmek için kullanılır.
* 
* Çalışma Akışı:
* 1. Kullanıcının girmiş olduğu kelimeyi alır
* 2. "Süre doldu!" bildirimi gösterir
* 3. Girilen kelimeyi doğrular (harflerle oluşturulabilir mi ve Türkçe sözlükte var mı?)
* 4. Geçerli bir kelime ise tebrik eder, değilse uyarı verir
* 5. Son olarak en iyi çözümü (en uzun kelimeyi) gösterir
*
* Amacı: Kullanıcının süre dolduğunda son girdiği kelimeyi değerlendirmek ve 
* kullanıcıya anında geri bildirim vermek, sonrasında da en iyi cevabı göstermektir.
*/
function handleWordTimeUp(userWord) {
  // Kullanıcının girdiği kelimeyi alır ve değerlendirir
  // userWord: Kullanıcının girdiği kelime

  // Kelime boş değilse değerlendir
  if (userWord.length > 0) {
    // "Süre doldu!" bildirimi göster
    showNotification(`Süre doldu! Girdiğiniz kelime: ${userWord.toUpperCase()}`, 'warning');

    // Kelime doğrulaması yap
    setTimeout(() => {
      // Mevcut harfleri al
      const lettersElements = document.querySelectorAll('.letter-box');
      const availableLetters = Array.from(lettersElements).map(el => el.textContent);

      // Kelime geçerli mi kontrol et
      if (canFormWord(userWord.toUpperCase(), availableLetters, true)) {
        // Sözlükte var mı kontrol et
        if (window.wordList && Array.isArray(window.wordList)) {
          if (window.wordList.includes(userWord.toUpperCase())) {
            showNotification(`"${userWord.toUpperCase()}" geçerli bir kelime. Tebrikler!`, 'success');
          } else {
            showNotification(`"${userWord.toUpperCase()}" Türkçe sözlükte bulunamadı.`, 'warning');
          }
        }
      } else {
        showNotification(`"${userWord.toUpperCase()}" verilen harflerle oluşturulamaz.`, 'error');
      }

      // Olası en iyi cevabı göster
      setTimeout(() => {
        // En uzun kelimeyi göster - showAnswer() fonksiyonu çağrılır
        showAnswer();
      }, 1500);
    }, 1500);
  } else {
    // Kelime boşsa direkt cevabı göster
    setTimeout(() => {
      showAnswer();
    }, 1000);
  }
}

// Add this function to handle time expiration consistently in both games
function handleTimeExpiration() {
  // Timer'ı temizle ve UI'ı güncelle
  clearAllTimers();;

  if (timerElement) {
    timerElement.textContent = "Süre doldu!";
    timerElement.style.color = "yellow";
  }

  // Oyun durumunu güncelle
  isGameActive = false;

  // Oyun alanına görsel efekt uygula
  const gameAreaContent = document.querySelectorAll("#game-area > *");
  gameAreaContent.forEach((element) => {
    element.style.opacity = "0.75";
  });

  // Countdown müziğini durdur
  stopCountdownMusic();

  // İpucu ve cevap butonlarını etkinleştir
  if (hintButton) hintButton.disabled = false;
  if (answerButton) answerButton.disabled = false;

  // Oyun tipine göre özel işlem yap
  if (gameType === "word") {
    // Süre dolsa bile kelime kontrolüne izin ver
    showNotification('Süre doldu! Ancak yine de kelime girmeye devam edebilirsiniz.', 'info');

    // Input alanına odaklan
    const wordAnswer = document.getElementById('word-answer');
    if (wordAnswer) {
      setTimeout(() => {
        wordAnswer.focus();
      }, 1000);
    }
  } else if (gameType === "math") {
    // İşlem oyununda süre sonrası kontrol için bildirim
    showNotification('Süre doldu! Ancak hesaplamaya devam edebilirsiniz.', 'info');
  }

  // Belirli bir gecikme sonra cevabı göster
  setTimeout(() => {
    displayAnswers();
  }, 2000);
}

function handleMathTimeUp() {
  // Son hesaplama adımını al
  let finalResult = null;
  if (calculationSteps.length > 0) {
    finalResult = calculationSteps[calculationSteps.length - 1].result;
  }

  if (finalResult !== null) {
    // Hedef sayıya olan uzaklık
    const difference = Math.abs(finalResult - currentTarget);

    if (difference === 0) {
      showMathResult(`Tebrikler! Tam sonuç: ${finalResult}`, 'correct');
    } else {
      showMathResult(`Sonucunuz: ${finalResult} (Hedef sayıdan ${difference} uzaktasınız)`, 'warning');
    }
  }

  // 2 saniye sonra olası çözümleri göster
  setTimeout(() => {
    if (answerButton) {
      showAnswer(); // En iyi çözümü göster
    }
  }, 2000);
}

async function showHint() {
  if (isGameStarting || isShowingHint) return; // Eğer zaten bir ipucu gösteriliyorsa, işlemi durdur

  if (timerElement.style.color === "yellow") {
    clearAllTimers();;
    clearTimeout(startTimerTimeout);
    timerElement.style.color = "";
    updateButtonStates();
  }

  // İpucu gösteriliyor olarak işaretle
  isShowingHint = true;

  // Bildirim sistemini başlat
  notificationSystem.init();

  if (gameType === "word") {
    const letters = Array.from(document.querySelectorAll('.letter-box')).map(box => box.textContent);
    const longestWithoutJoker = await findLongestWord(letters, false);
    const longestWithJoker = await findLongestWord(letters, true);

    const hintMessage = `
      <div class="hint-content">
        <h3>İpucu</h3>
        <p>En uzun kelime (jokersiz): <strong>${longestWithoutJoker.length} harfli</strong></p>
        <p>En uzun kelime (jokerli): <strong>${longestWithJoker.length} harfli</strong></p>
      </div>
    `;

    notificationSystem.show(hintMessage, 'hint', 5000);
  } else {
    const solution = solve_numbers(currentNumbers, currentTarget, false);
    const lines = solution.split("\n");

    let hintMessage;
    if (lines.length > 1) {
      hintMessage = `
        <div class="hint-content">
          <h3>İpucu</h3>
          <p>Tam çözüm mevcut!</p>
          <p>Hedef sayı: <strong>${currentTarget}</strong></p>
          <p>İşlem yaparken çıkarma ve bölme işlemlerinde tam sayı sonucu veren işlemler kullanmayı deneyin.</p>
        </div>
      `;
    } else {
      hintMessage = `
        <div class="hint-content">
          <h3>İpucu</h3>
          <p>Tam çözüm bulunamadı, ancak yaklaşık çözümler mevcut.</p>
          <p>Hedef sayı: <strong>${currentTarget}</strong></p>
          <p>Hedefe en yakın sonucu bulmayı deneyin.</p>
        </div>
      `;
    }

    notificationSystem.show(hintMessage, 'hint', 5000);
  }

  // Bildirimin kapanması için bir zaman aşımı ayarla
  setTimeout(() => {
    isShowingHint = false;
  }, 5000);
}

// Mevcut ipucu bildirimini kapatmak için yardımcı fonksiyon
function closeHintNotification() {
  if (notificationSystem.isShowingHintNotification()) {
    notificationSystem.clearAllNotifications();
    isShowingHint = false;
  }
}

let currentPage = 1;
const resultsPerPage = 3;

function showAnswer() {
  if (!isGameActive) {
    toggleAnswerDisplay();
  } else {
    openConfirmationModal();
  }
}

function showAnswers() {
  if (!isGameActive) {
    toggleAnswerDisplay();
  } else {
    openConfirmationModal();
  }
}

function displayAnswers() {
  if (!isGameActive) {
    toggleAnswerDisplay();
  } else {
    openConfirmationModal();
  }
}

function showConfirmationModal() {
  openConfirmationModal();
}

// Tüm olası kelimeleri bulan yeni fonksiyon
async function findAllPossibleWords(letters, minLength, showOnlyBest = true) {
  if (!window.wordList || window.wordList.length === 0) {
    await loadWordList();
  }

  // Olası kelimeleri filtrele
  const possibleWords = window.wordList
    .filter(word => word.length >= minLength && canFormWord(word, letters, true))
    .sort((a, b) => b.length - a.length || a.localeCompare(b)); // uzunluğa ve alfabetik sıraya göre

  if (showOnlyBest && possibleWords.length > 0) {
    // En uzun kelime uzunluğunu bul
    const maxLength = possibleWords[0].length;
    // Sadece en uzun kelimeleri döndür
    return possibleWords.filter(word => word.length === maxLength);
  }

  return possibleWords;
}

// Olası kelimeleri formatla
function formatPossibleWords(words, letters) {
  if (!words || words.length === 0) return "Kelime bulunamadı";

  // Kelimeleri uzunluklarına göre grupla
  const groupedWords = {};
  words.forEach(word => {
    const length = word.length;
    if (!groupedWords[length]) {
      groupedWords[length] = [];
    }
    groupedWords[length].push(word);
  });

  // Her uzunluk için bir satır oluştur
  let html = '';
  Object.keys(groupedWords)
    .sort((a, b) => b - a) // uzunluğa göre azalan sıra
    .forEach(length => {
      const wordsOfLength = groupedWords[length];
      if (wordsOfLength.length > 0) {
        // Jokerli kelimeler için vurgu ekleyerek listeyi oluştur
        const formattedWords = wordsOfLength.map(word => highlightJoker(word, letters)).join(', ');

        html += `<div class="word-group">
          <h4>${length} harfli kelimeler (${wordsOfLength.length} adet):</h4>
          <p>${formattedWords}</p>
        </div>`;
      }
    });

  return html;
}

// Joker harflerini vurgulama
function highlightJoker(word, availableLetters) {
  if (!word || word.length === 0) return "";

  // Kopya oluştur
  const letters = [...availableLetters];
  const wordChars = word.split('');
  const result = [];

  // Her harf için kontrol et
  for (let char of wordChars) {
    const index = letters.indexOf(char);
    if (index !== -1) {
      // Eğer harf varsa, kullan ve işaretle
      letters[index] = null; // Kullanıldı olarak işaretle
      result.push(char); // Normal harf
    } else {
      // Harf yoksa, joker kullanıldı demektir
      result.push(`<span style="color: #ff9900; font-weight: bold; background-color: rgba(255, 153, 0, 0.2); padding: 0 3px; border-radius: 3px;">${char}</span>`); // Joker ile oluşan harf
    }
  }

  return result.join('');
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

function resetPagination() {
  currentPage = 1;
}

function stopTimer() {
  clearAllTimers();;
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

const notificationSystem = {
  container: null,
  timeout: null,
  activeNotification: null,

  init() {
    // Container'ı oluştur veya mevcut olanı al
    this.container = document.getElementById('notification-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      document.body.appendChild(this.container);
    }
  },

  // Yeni bildirim gösterme - öncekileri temizler
  show(message, type = 'info', duration = 3000) {
    // İpucu için özel durum kontrolü
    if (type === 'hint' && this.isShowingHintNotification()) {
      return; // Zaten bir ipucu varsa yeni ipucu gösterme
    }

    // Varsa bekleyen zamanlanmış bildirimi iptal et
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    // Varsa mevcut bildirimi hemen temizle
    this.clearAllNotifications();

    // Yeni bildirimi oluştur
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    // Bildirim içeriği
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">
          ${this.getIcon(type)}
        </div>
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close">&times;</button>
      <div class="notification-progress"></div>
    `;

    // Aktif bildirimi ayarla
    this.activeNotification = { element: notification, type: type };

    // Kapatma butonu
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
      this.hide(notification);
    });

    // Progress bar animasyonu
    const progressBar = notification.querySelector('.notification-progress');
    progressBar.style.animationDuration = `${duration}ms`;

    // Bildirimi göster
    this.container.appendChild(notification);

    // Bildirim tipi ipucu ise isShowingHint'i güncelle
    if (type === 'hint') {
      isShowingHint = true;
    }

    // Belirli süre sonra gizle
    this.timeout = setTimeout(() => {
      this.hide(notification);
    }, duration);
  },

  // Aktif bildirim ipucu tipinde mi kontrol et
  isShowingHintNotification() {
    return this.activeNotification && this.activeNotification.type === 'hint';
  },

  // Tüm aktif bildirimleri temizle
  clearAllNotifications() {
    // Container'ı temizle
    if (this.container) {
      this.container.innerHTML = '';
    }

    // Aktif bildirimi sıfırla
    if (this.activeNotification && this.activeNotification.type === 'hint') {
      isShowingHint = false;
    }
    this.activeNotification = null;
  },

  // Belirli bir bildirimi gizle
  hide(notification) {
    notification.classList.add('notification-hiding');

    // İpucu bildirimini kapatılıyorsa isShowingHint'i sıfırla
    if (this.activeNotification && this.activeNotification.type === 'hint') {
      isShowingHint = false;
    }

    // Animasyon bittikten sonra bildirimi kaldır
    notification.addEventListener('animationend', () => {
      if (notification.classList.contains('notification-hiding') && this.container.contains(notification)) {
        this.container.removeChild(notification);
        this.activeNotification = null;
      }
    });
  },

  getIcon(type) {
    switch (type) {
      case 'success':
        return '<i class="fas fa-check-circle"></i>';
      case 'error':
        return '<i class="fas fa-exclamation-circle"></i>';
      case 'warning':
        return '<i class="fas fa-exclamation-triangle"></i>';
      case 'hint':
        return '<i class="fas fa-lightbulb"></i>';
      default:
        return '<i class="fas fa-info-circle"></i>';
    }
  }
};

// Onay penceresi gösterme
function showConfirmationModal() {
  const modal = document.getElementById('confirmation-modal');
  if (!modal) return;

  // Modalı göster
  modal.style.display = 'flex';

  // Eğer oyun aktifse, pause yapma - oyunu sadece durduracağız
  if (isGameActive) {
    clearAllTimers();;
  }
}

/**
 * Modal butonlarını ayarlama
 */
function setupModalButtons() {
  const confirmYes = document.getElementById('confirm-yes');
  const confirmNo = document.getElementById('confirm-no');
  const modal = document.getElementById('confirmation-modal');
  
  if (!confirmYes || !confirmNo || !modal) {
    console.error("Modal butonları bulunamadı!");
    return;
  }
  
  // Eski event listener'ları kaldır
  confirmYes.replaceWith(confirmYes.cloneNode(true));
  confirmNo.replaceWith(confirmNo.cloneNode(true));
  
  // Yeni referansları al
  const newConfirmYes = document.getElementById('confirm-yes');
  const newConfirmNo = document.getElementById('confirm-no');
  
  // "Evet" butonuna tıklanınca
  newConfirmYes.addEventListener('click', function() { 
    // Modalı kapat
    modal.style.display = 'none';
    
    // Oyunu sonlandır
    isGameActive = false;
    
    // TÜM zamanlayıcıları temizle
    clearAllTimers();
    
    // Süreyi kırmızı yap
    if (timerElement) {
      timerElement.style.color = "#ff3300";
    }
    
    // Müziği tamamen durdur
    stopCountdownMusic();
    
    // Cevabı göster
    toggleAnswerDisplay();
    
    // Cevap gösterildi durumunu kaydet
    gameState.isAnswerDisplayed = true;
  });
  
  // "Hayır" butonuna tıklanınca - SÜREYİ KORUYAN VERSİYON
  newConfirmNo.addEventListener('click', function() {
    // Modalı kapat
    modal.style.display = 'none';
    
    // Oyun aktifse devam ettir
    if (isGameActive) {
      // ÖNEMLİ: Aktif zamanlayıcıları temizle ama süreyi SIFIRLAMA
      clearActiveTimers();
      
      // Mevcut süreyi koruyarak yeni bir interval başlat
      resumeTimer();
      
      // Müziği devam ettir
      if (soundEnabled) {
        resumeCountdownMusic();
      }
    }
  });
}

// Yeni: Sadece aktif zamanlayıcıları temizleyen ama süreyi sıfırlamayan fonksiyon
function clearActiveTimers() {
  // Bilinen ana interval'ı temizle
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // Tüm aktif interval'ları temizle
  activeIntervals.forEach(intervalId => {
    clearInterval(intervalId);
  });
  
  // Array'i boşalt
  activeIntervals = [];
}

// Yeni: Mevcut süreyi koruyarak timer'ı devam ettiren fonksiyon
function resumeTimer() {
  // Sadece zamanlayıcıları temizle ama süreyi SIFIRLAMA
  clearActiveTimers();
  
  // Mevcut süreyi göster
  if (timerElement) {
    timerElement.textContent = timeLeft;
  }
  
  // TEK BİR YENİ interval oluştur - mevcut süre ile
  timerInterval = setInterval(function() {
    // Sadece oyun aktifse devam et
    if (!isGameActive) return;
    
    // Duraklama durumunda sayacı güncelleme
    if (isPaused) return;
    
    // Süreyi güncelle
    if (timerElement) {
      timerElement.textContent = timeLeft;
    }
    
    // Süre dolduğunda işlem yap
    if (timeLeft === 0) {
      handleTimeExpiration();
    } else {
      // Süreyi azalt
      timeLeft--;
    }
  }, 1000);
  
  // Yeni interval'ı listeye ekle
  activeIntervals.push(timerInterval);
}

// Müziği duraklatmadan devam ettiren yeni fonksiyon
function resumeCountdownMusic() {
  const countdownMusic = document.getElementById('countdownMusic');
  
  if (!countdownMusic) {
    console.error("countdown müzik elementi bulunamadı!");
    return;
  }
  
  // Ses açık değilse çalma
  if (!soundEnabled) {
    console.log("Ses kapalı olduğu için müzik devam ettirilmiyor");
    return;
  }
  
  try {
    // Ses seviyesini ayarla
    countdownMusic.volume = volumeLevel / 100;
    
    // Eğer duraklama durumundaysa devam ettir
    if (countdownMusic.paused && countdownMusicPlaying) {
      const playPromise = countdownMusic.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
        }).catch(error => {
          console.error('Müzik devam ettirme hatası:', error);
        });
      }
    }
    // Eğer hiç başlatılmadıysa başlat
    else if (!countdownMusicPlaying) {
      startCountdownMusic();
    }
  } catch (error) {
    console.error("Müzik devam ettirme hatası:", error);
  }
}

// Yardımcı fonksiyonlar - kelime ve math cevapları için
async function showWordAnswers(answerArea) {
  const letters = Array.from(document.querySelectorAll('.letter-box')).map(box => box.textContent);
  const longestWithoutJoker = await findLongestWord(letters, false);
  const longestWithJoker = await findLongestWord(letters, true);

  // Sadece en uzun kelimeleri bul
  const possibleWords = await findAllPossibleWords(letters, 3, true);

  // Daha basit ve hatasız bir HTML yapısı
  answerArea.innerHTML = `
    <h3 style="color: #ffcc00; margin-top: 0; margin-bottom: 10px;">En İyi Çözümler</h3>
    
    <div style="background-color: rgba(0, 0, 0, 0.2); border-radius: 5px; padding: 10px; margin-bottom: 15px;">
      <div style="margin-bottom: 8px;">
        <strong>En uzun kelime (jokersiz):</strong> 
        <span style="color: #00cc66; font-size: 18px; font-weight: bold;">${highlightJoker(longestWithoutJoker, letters)}</span>
      </div>
      
      <div>
        <strong>En uzun kelime (jokerli):</strong> 
        <span style="color: #00cc66; font-size: 18px; font-weight: bold;">${highlightJoker(longestWithJoker, letters)}</span>
      </div>
    </div>
    
    ${possibleWords.length > 0 ? `
    <h3 style="color: #ffcc00; margin-top: 15px; margin-bottom: 10px;">Diğer Olası ${possibleWords[0].length} Harfli Kelimeler</h3>
    
    <div style="background-color: rgba(0, 0, 0, 0.2); border-radius: 5px; padding: 10px;">
      <p style="margin: 0; line-height: 1.4;">
        ${possibleWords.map(word => highlightJoker(word, letters)).join(', ')}
      </p>
    </div>
    ` : ''}
  `;
}

function showMathAnswers(answerArea) {
  const solution = solve_numbers(currentNumbers, currentTarget, false);
  allResults = solution.split("\n\n").filter((r) => r.trim() !== "");

  if (allResults.length > 0) {
    displayResults();
    createPagination();
  } else {
    answerArea.textContent = "Çözüm bulunamadı.";
  }
}

// CSS iyileştirmeleri için dinamik stil ekleme
function addFixedWordStyles() {
  const styleElement = document.createElement('style');
  styleElement.id = 'fixed-word-results-styles';
  styleElement.textContent = `
    /* Kelime sonuçları için özel stilller */
    .answer-section {
      margin-bottom: 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      padding-bottom: 10px;
    }
    
    .answer-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    
    .answer-section h3 {
      color: #ffcc00;
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 18px;
    }
    
    /* Olası kelimeler bölümü */
    .possible-words {
      max-height: none; /* Kaydırma çubuğu olmasın */
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 5px;
      padding: 10px;
    }
    
    /* Kelime grupları için daha kompakt stil */
    .word-group {
      margin-bottom: 8px;
      padding: 6px 8px;
      background-color: rgba(0, 51, 102, 0.4);
      border-radius: 5px;
    }
    
    .word-group:last-child {
      margin-bottom: 0;
    }
    
    .word-group h4 {
      color: #0099cc;
      margin: 0 0 3px 0;
      font-size: 15px;
    }
    
    .word-group p {
      margin: 0;
      line-height: 1.4;
      word-wrap: break-word;
    }
    
    /* En iyi çözümler için stil */
    .best-answer {
      font-size: 16px;
      margin: 8px 0;
      padding: 8px 10px;
      background-color: rgba(0, 204, 102, 0.1);
      border-radius: 5px;
    }
    
    .best-answer strong {
      color: #00cc66;
      font-size: 18px;
    }
    
    /* Joker harfleri için daha belirgin vurgu */
    .joker-letter {
      color: #ff9900;
      font-weight: bold;
      background-color: rgba(255, 153, 0, 0.2);
      padding: 0 3px;
      border-radius: 3px;
    }
  `;

  // Eğer stil zaten varsa kaldırıp yenisini ekle
  const existingStyle = document.getElementById('fixed-word-results-styles');
  if (existingStyle) {
    existingStyle.remove();
  }

  document.head.appendChild(styleElement);
}

// Sayfanın yüklenmesi tamamlandığında stili ekle
document.addEventListener('DOMContentLoaded', () => {
  addFixedWordStyles();
});

// Eğer sayfa zaten yüklenmişse, hemen ekle
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  addFixedWordStyles();
}

// Ana Sayfa ve Tekrar Oyna butonları pause durumunda çalışırken pause durumunu sıfırlayacak
function setupGameButtons() {
  const homeButton = document.getElementById('homeButton');
  const playAgainButton = document.getElementById('playAgainButton');
  const pauseButton = document.getElementById('pauseButton');

  if (homeButton) {
    // Önceki event listener'ları temizle
    const newHomeButton = homeButton.cloneNode(true);
    homeButton.parentNode.replaceChild(newHomeButton, homeButton);

    // Yeni event listener ekle
    newHomeButton.addEventListener('click', () => {
      // Pause durumunu sıfırla
      if (isPaused) {
        isPaused = false;
        // Pause butonunu normal haline getir
        if (pauseButton) {
          pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
          pauseButton.title = "Duraklat";
          pauseButton.classList.remove('play-active');
        }
      }

      // Pause overlay'ı gizle
      const pausedOverlay = document.getElementById('paused-overlay');
      if (pausedOverlay) {
        pausedOverlay.style.display = 'none';
      }

      // Ana sayfaya git
      if (!isGameStarting) {
        goToHomePage();
      }
    });
  }

  if (playAgainButton) {
    // Önceki event listener'ları temizle
    const newPlayAgainButton = playAgainButton.cloneNode(true);
    playAgainButton.parentNode.replaceChild(newPlayAgainButton, playAgainButton);

    // Yeni event listener ekle
    newPlayAgainButton.addEventListener('click', () => {
      // Pause durumunu sıfırla
      if (isPaused) {
        isPaused = false;

        // Pause butonunu normal haline getir
        if (pauseButton) {
          pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
          pauseButton.title = "Duraklat";
          pauseButton.classList.remove('play-active');
        }

        // Pause overlay'ı gizle
        const pausedOverlay = document.getElementById('paused-overlay');
        if (pausedOverlay) {
          pausedOverlay.style.display = 'none';
        }
      }

      // Oyunu yeniden başlat
      if (!isGameStarting) {
        restartGame();
      }
    });
  }
}

// Oyun durumunu tutarlı şekilde sonlandıran fonksiyon
function endGame(showAnswerImmediately = true, userWon = false) {
  // Eğer oyun zaten aktif değilse, işlem yapma
  if (!isGameActive && !isGameStarting) return;

  // Oyunun aktif olmadığını belirt
  isGameActive = false;

  // Süreyi durdur
  clearAllTimers();;
  clearTimeout(startTimerTimeout);

  // Süre göstergesini güncelle - kazanma durumuna göre renk belirle
  if (timerElement) {
    timerElement.style.color = userWon ? "#00cc66" : "#ff3300"; // Kazandıysa yeşil, kaybettiyse kırmızı
  }

  // Müziği durdur
  stopCountdownMusic();

  // Butonları güncelle
  updateButtonStates();

  // Kullanıcı kazandıysa özel bildirim göster
  if (userWon) {
    showNotification('Tebrikler! Mükemmel bir sonuç!', 'success');
  }

  // Cevabı hemen göster
  if (showAnswerImmediately) {
    setTimeout(() => {
      // Cevap butonunun metnini güncelle ve cevabı göster
      if (answerButton) answerButton.textContent = "CEVABI GİZLE";
      displayAnswers();
    }, userWon ? 1500 : 500); // Kazandıysa biraz daha beklet, bildirimler görünsün
  }
}

// Modal penceresinden cevabı göstermeyi onaylayınca
function confirmAnswer() {
  const modal = document.getElementById('confirmation-modal');

  // Modal penceresini kapat
  if (modal) {
    modal.style.display = 'none';
  }

  // Oyunu sonlandır ve cevabı göster
  endGame(true);
}

// Cevap alanını kelime oyunu için doldur
async function fillWordAnswers(answerArea) {
  // Mevcut harfleri al
  const letters = Array.from(document.querySelectorAll('.letter-box')).map(box => box.textContent);

  // En iyi çözümleri bul
  const longestWithoutJoker = await findLongestWord(letters, false);
  const longestWithJoker = await findLongestWord(letters, true);

  // Sadece en uzun kelimeleri bul
  const possibleWords = await findAllPossibleWords(letters, 3, true);

  // Cevap alanını doldur
  answerArea.innerHTML = `
    <h3 style="color: #ffcc00; margin-top: 0; margin-bottom: 10px;">En İyi Çözümler</h3>
    
    <div style="background-color: rgba(0, 0, 0, 0.2); border-radius: 5px; padding: 10px; margin-bottom: 15px;">
      <div style="margin-bottom: 8px;">
        <strong>En uzun kelime (jokersiz):</strong> 
        <span style="color: #00cc66; font-size: 18px; font-weight: bold;">${highlightJoker(longestWithoutJoker, letters)}</span>
      </div>
      
      <div>
        <strong>En uzun kelime (jokerli):</strong> 
        <span style="color: #00cc66; font-size: 18px; font-weight: bold;">${highlightJoker(longestWithJoker, letters)}</span>
      </div>
    </div>
    
    ${possibleWords.length > 0 ? `
    <h3 style="color: #ffcc00; margin-top: 15px; margin-bottom: 10px;">Diğer Olası ${possibleWords[0].length} Harfli Kelimeler</h3>
    
    <div style="background-color: rgba(0, 0, 0, 0.2); border-radius: 5px; padding: 10px;">
      <p style="margin: 0; line-height: 1.4;">
        ${possibleWords.map(word => highlightJoker(word, letters)).join(', ')}
      </p>
    </div>
    ` : ''}
  `;
}

// Cevap alanını matematik oyunu için doldur
function fillMathAnswers(answerArea) {
  const solution = solve_numbers(currentNumbers, currentTarget, false);
  allResults = solution.split("\n\n").filter((r) => r.trim() !== "");

  if (allResults.length > 0) {
    displayResults();
    createPagination();
  } else {
    answerArea.textContent = "Çözüm bulunamadı.";
  }
}

function setupNotificationSystem() {
  // Mevcut bildirimleri temizle
  notificationSystem.clearAllNotifications();

  // Bildirimi hazırla
  notificationSystem.init();
}

function togglePause() {
  const pauseButton = document.getElementById('pauseButton');
  if (!pauseButton) return;
  
  // Oyun aktif değilse veya başlatılma aşamasındaysa işlem yapma
  if (!isGameActive || isGameStarting) {
    console.log("Oyun aktif değil veya başlatılıyor, duraklama işlemi iptal edildi");
    return;
  }
  
  isPaused = !isPaused;
  
  if (isPaused) {
    // Duraklat butonunu güncelle
    pauseButton.innerHTML = '<i class="fas fa-play"></i>';
    pauseButton.title = "Devam Et";
    pauseButton.classList.add('play-active');
    
    // Oyun alanını blur yap
    blurGameArea(true);
    
    // Countdown müziğini duraklat
    const countdownMusic = document.getElementById('countdownMusic');
    if (countdownMusic && countdownMusicPlaying) {
      countdownMusic.pause();
    }
    
    // Duraklama bildirimi göster
    notificationSystem.init();
    notificationSystem.show('Oyun duraklatıldı! Devam etmek için play butonuna basın.', 'info', 3000);
  } else {
    // Duraklat butonunu güncelle
    pauseButton.innerHTML = '<i class="fas fa-pause"></i>';
    pauseButton.title = "Duraklat";
    pauseButton.classList.remove('play-active');
    
    // Timer'ı göster
    if (timerElement) {
      timerElement.style.display = "block";
    }
    
    // Oyun alanını normal hale getir
    blurGameArea(false);
    
    // Countdown müziğini devam ettir
    if (soundEnabled) {
      resumeCountdownMusic();
    }
    
    // Devam bildirimi göster
    notificationSystem.init();
    notificationSystem.show('Oyun devam ediyor!', 'info', 1500);
  }
}

function addSoundControlStyles() {
  // Mevcut stil varsa kaldır
  const existingStyle = document.getElementById('sound-control-fixed-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Yeni stil oluştur
  const style = document.createElement('style');
  style.id = 'sound-control-fixed-styles';
  style.textContent = `
    .sound-controls {
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      z-index: 999;
      pointer-events: auto;
    }
    
    .sound-button {
      width: 40px;
      height: 40px;
      background-color: rgba(0, 51, 102, 0.8);
      color: #ff9900;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 18px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
      pointer-events: auto;
    }
    
    .sound-button:hover {
      background-color: rgba(0, 51, 102, 1);
      transform: scale(1.05);
    }
    
    .volume-control {
      background-color: rgba(0, 51, 102, 0.9);
      padding: 8px 12px;
      border-radius: 20px;
      margin-top: 8px;
      display: flex;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      transition: all 0.3s ease;
      max-width: 0;
      overflow: hidden;
      opacity: 0;
      pointer-events: auto;
    }
    
    .volume-control.active {
      max-width: 150px;
      opacity: 1;
      border: 1px solid rgba(255, 153, 0, 0.3);
    }
    
    .volume-slider {
      width: 80px;
      height: 8px;
      border-radius: 4px;
      background: #004080;
      outline: none;
      margin-right: 10px;
      pointer-events: auto;
    }
    
    .volume-percentage {
      color: #ff9900;
      font-size: 12px;
      min-width: 35px;
      font-weight: bold;
    }
    
    /* Ekranın üstünde sabit pozisyonda durur */
    .container {
      position: relative;
    }
  `;
  
  // Stili sayfaya ekle
  document.head.appendChild(style);
}