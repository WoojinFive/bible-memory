// 상태 변수
let currentVerseIndex = 0;
let participants = [];
let completions = {}; // 참가자별 암송 완료 구절 기록
let partialCompletions = {}; // 참가자별 부분 암송 구절 기록

// DOM 요소
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const verseReference = document.querySelector('.verse-reference');
const verseText = document.querySelector('.verse-text');
const prevVerseBtn = document.getElementById('prev-verse');
const nextVerseBtn = document.getElementById('next-verse');
const showAnswerBtn = document.getElementById('show-answer');
const verseAnswer = document.querySelector('.verse-answer');
const answerText = document.querySelector('.answer-text');
const currentVerseParticipants = document.getElementById('current-verse-participants');
const participantSelect = document.getElementById('participant-select');
const markCompleteBtn = document.getElementById('mark-complete');
const markPartialBtn = document.getElementById('mark-partial');
const markIncompleteBtn = document.getElementById('mark-incomplete');
const newParticipantInput = document.getElementById('new-participant');
const addParticipantBtn = document.getElementById('add-participant-btn');
const participantsTable = document.getElementById('participants-table').querySelector('tbody');
const individualStats = document.getElementById('individual-stats').querySelector('tbody');
const verseStats = document.getElementById('verse-stats').querySelector('tbody');
const rankingsList = document.getElementById('rankings-list');
const copyBtn = document.querySelector('.copy-btn');
const celebration = document.getElementById('celebration');

// 로컬 스토리지에서 데이터 불러오기
function loadData() {
  const savedParticipants = localStorage.getItem('versesParticipants');
  const savedCompletions = localStorage.getItem('versesCompletions');
  const savedPartialCompletions = localStorage.getItem('versesPartialCompletions');
  const savedCurrentVerseIndex = localStorage.getItem('currentVerseIndex');

  if (savedParticipants) {
    participants = JSON.parse(savedParticipants);
  }

  if (savedCompletions) {
    completions = JSON.parse(savedCompletions);
  }

  if (savedPartialCompletions) {
    partialCompletions = JSON.parse(savedPartialCompletions);
  } else {
    // 이전 데이터와의 호환성을 위해 빈 객체 초기화
    partialCompletions = {};
    participants.forEach(p => {
      if (!partialCompletions[p]) {
        partialCompletions[p] = [];
      }
    });
  }

  if (savedCurrentVerseIndex !== null) {
    currentVerseIndex = Number(savedCurrentVerseIndex);
  }
}

// 데이터 저장하기
function saveData() {
  localStorage.setItem('versesParticipants', JSON.stringify(participants));
  localStorage.setItem('versesCompletions', JSON.stringify(completions));
  localStorage.setItem('versesPartialCompletions', JSON.stringify(partialCompletions));
  localStorage.setItem('currentVerseIndex', currentVerseIndex);
}

// 탭 전환 기능
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.getAttribute('data-tab');

    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(tabId + '-tab').classList.add('active');

    updateStats();
  });
});

// 현재 구절 표시
function displayCurrentVerse() {
  const verse = verses[currentVerseIndex];
  verseReference.textContent = verse.reference;
  verseText.textContent = verse.category + " - " + (currentVerseIndex + 1) + "번";
  answerText.textContent = verse.text;

  // 이전/다음 버튼 상태 업데이트
  prevVerseBtn.disabled = currentVerseIndex === 0;
  nextVerseBtn.disabled = currentVerseIndex === verses.length - 1;

  // 정답 숨김
  verseAnswer.style.display = 'none';

  // 현재 구절 암송자 업데이트
  updateCurrentVerseParticipants();

  // 상태 저장
  saveData();
}

// 현재 구절 암송자 표시
function updateCurrentVerseParticipants() {
  currentVerseParticipants.innerHTML = '';

  const verseId = verses[currentVerseIndex].id;

  participants.forEach(participant => {
    const participantCard = document.createElement('div');
    participantCard.className = 'participant-card';

    if (completions[participant] && completions[participant].includes(verseId)) {
      participantCard.classList.add('completed');
      participantCard.innerHTML = `
                <span>${participant}</span>
                <span class="badge badge-success">완료 (1점)</span>
            `;
    } else if (partialCompletions[participant] && partialCompletions[participant].includes(verseId)) {
      participantCard.classList.add('partial');
      participantCard.innerHTML = `
                <span>${participant}</span>
                <span class="badge badge-warning">부분 (0.5점)</span>
            `;
    } else {
      participantCard.innerHTML = `<span>${participant}</span>`;
    }

    currentVerseParticipants.appendChild(participantCard);
  });

  // 참가자 선택 드롭다운 업데이트
  updateParticipantSelect();
}

// 참가자 선택 드롭다운 업데이트
function updateParticipantSelect() {
  participantSelect.innerHTML = '<option value="">참가자 선택</option>';

  participants.forEach(participant => {
    const option = document.createElement('option');
    option.value = participant;
    option.textContent = participant;
    participantSelect.appendChild(option);
  });
}

// 암송 완료 표시 (1점)
function markComplete() {
  const selectedParticipant = participantSelect.value;

  if (!selectedParticipant) {
    alert('참가자를 선택해주세요');
    return;
  }

  const verseId = verses[currentVerseIndex].id;

  if (!completions[selectedParticipant]) {
    completions[selectedParticipant] = [];
  }

  // 이미 부분 점수가 있다면 제거
  if (partialCompletions[selectedParticipant] && partialCompletions[selectedParticipant].includes(verseId)) {
    partialCompletions[selectedParticipant] = partialCompletions[selectedParticipant].filter(id => id !== verseId);
  }

  if (!completions[selectedParticipant].includes(verseId)) {
    completions[selectedParticipant].push(verseId);
    saveData();
    updateCurrentVerseParticipants();
    showCelebration();
  }
}

// 부분 암송 표시 (0.5점)
function markPartial() {
  const selectedParticipant = participantSelect.value;

  if (!selectedParticipant) {
    alert('참가자를 선택해주세요');
    return;
  }

  const verseId = verses[currentVerseIndex].id;

  if (!partialCompletions[selectedParticipant]) {
    partialCompletions[selectedParticipant] = [];
  }

  // 이미 완료 점수가 있다면 제거
  if (completions[selectedParticipant] && completions[selectedParticipant].includes(verseId)) {
    completions[selectedParticipant] = completions[selectedParticipant].filter(id => id !== verseId);
  }

  if (!partialCompletions[selectedParticipant].includes(verseId)) {
    partialCompletions[selectedParticipant].push(verseId);
    saveData();
    updateCurrentVerseParticipants();
    showCelebration(true); // 부분 암송 축하 (간소화된 효과)
  }
}

// 암송 취소
function markIncomplete() {
  const selectedParticipant = participantSelect.value;

  if (!selectedParticipant) {
    alert('참가자를 선택해주세요');
    return;
  }

  const verseId = verses[currentVerseIndex].id;

  // 완료 점수 제거
  if (completions[selectedParticipant] && completions[selectedParticipant].includes(verseId)) {
    completions[selectedParticipant] = completions[selectedParticipant].filter(id => id !== verseId);
  }

  // 부분 점수 제거
  if (partialCompletions[selectedParticipant] && partialCompletions[selectedParticipant].includes(verseId)) {
    partialCompletions[selectedParticipant] = partialCompletions[selectedParticipant].filter(id => id !== verseId);
  }

  saveData();
  updateCurrentVerseParticipants();
}

// 참가자 추가
function addParticipant() {
  const name = newParticipantInput.value.trim();

  if (!name) {
    alert('참가자 이름을 입력해주세요');
    return;
  }

  if (participants.includes(name)) {
    alert('이미 등록된 참가자입니다');
    return;
  }

  participants.push(name);
  completions[name] = [];
  partialCompletions[name] = [];
  saveData();

  newParticipantInput.value = '';
  updateParticipantsTable();
  updateParticipantSelect();
}

// 참가자 삭제
function removeParticipant(name) {
  if (confirm(`정말로 ${name} 참가자를 삭제하시겠습니까?`)) {
    participants = participants.filter(p => p !== name);
    delete completions[name];
    delete partialCompletions[name];
    saveData();
    updateParticipantsTable();
    updateParticipantSelect();
    updateCurrentVerseParticipants();
  }
}

// 참가자별 총점 계산 (1점 + 0.5점)
function calculateTotalScore(participant) {
  const fullPoints = completions[participant] ? completions[participant].length : 0;
  const halfPoints = partialCompletions[participant] ? partialCompletions[participant].length * 0.5 : 0;
  return fullPoints + halfPoints;
}

// 참가자 테이블 업데이트
function updateParticipantsTable() {
  participantsTable.innerHTML = '';

  participants.forEach(participant => {
    const totalScore = calculateTotalScore(participant);

    const row = document.createElement('tr');
    row.innerHTML = `
          <td>${participant}</td>
          <td>${totalScore.toFixed(1)} / ${verses.length}</td>
          <td>
              <button class="danger" onclick="removeParticipant('${participant}')">삭제</button>
          </td>
      `;

    participantsTable.appendChild(row);
  });
}

// 통계 업데이트
function updateStats() {
  // 개인별 통계
  individualStats.innerHTML = '';

  participants.sort((a, b) => {
    return calculateTotalScore(b) - calculateTotalScore(a);
  }).forEach(participant => {
    const totalScore = calculateTotalScore(participant);
    const percentage = Math.round((totalScore / verses.length) * 100);

    const row = document.createElement('tr');
    row.innerHTML = `
          <td>${participant}</td>
          <td>${totalScore.toFixed(1)} / ${verses.length}</td>
          <td>${percentage}%</td>
      `;

    individualStats.appendChild(row);
  });

  // 구절별 통계
  verseStats.innerHTML = '';

  verses.forEach((verse, index) => {
    const fullCompletedCount = participants.filter(p =>
      completions[p] && completions[p].includes(verse.id)
    ).length;

    const partialCompletedCount = participants.filter(p =>
      partialCompletions[p] && partialCompletions[p].includes(verse.id)
    ).length;

    const row = document.createElement('tr');
    row.innerHTML = `
          <td class="verse-number">${index + 1}. ${verse.reference}</td>
          <td>완료: ${fullCompletedCount}, 부분: ${partialCompletedCount}</td>
      `;

    verseStats.appendChild(row);
  });

  // 순위 업데이트
  rankingsList.innerHTML = '';

  // 참가자별 암송 완료 개수 계산 및 정렬 (부분 점수 포함)
  const participantsWithScores = participants.map(participant => {
    const score = calculateTotalScore(participant);
    return { name: participant, score: score };
  }).sort((a, b) => b.score - a.score);

  // 상위 10명만 선택
  const topParticipants = participantsWithScores.slice(0, 10);

  if (topParticipants.length > 0) {
    // 순위 계산을 위한 변수
    let distinctScores = [];
    topParticipants.forEach(p => {
      if (!distinctScores.includes(p.score)) {
        distinctScores.push(p.score);
      }
    });
    distinctScores.sort((a, b) => b - a);

    // 각 참가자에게 순위 할당
    topParticipants.forEach(participant => {
      // 점수의 인덱스 + 1이 순위
      const rank = distinctScores.indexOf(participant.score) + 1;

      const li = document.createElement('li');
      li.innerHTML = `
              ${rank}위 - ${participant.name} <span class="badge badge-primary">${participant.score.toFixed(1)}점</span>
          `;

      // 메달 표시 (순위에 따른 메달)
      if (rank === 1 && participant.score > 0) {
        li.innerHTML += ' 🥇';
      } else if (rank === 2 && participant.score > 0) {
        li.innerHTML += ' 🥈';
      } else if (rank === 3 && participant.score > 0) {
        li.innerHTML += ' 🥉';
      }

      rankingsList.appendChild(li);
    });
  }
}

// 축하 효과 표시
function showCelebration(isPartial = false) {
  celebration.classList.add('active');

  // 색종이 효과 생성 (부분 암송은 더 적은 색종이)
  const confettiCount = isPartial ? 30 : 100;
  for (let i = 0; i < confettiCount; i++) {
    createConfetti();
  }

  setTimeout(() => {
    celebration.classList.remove('active');
    celebration.innerHTML = '';
  }, isPartial ? 1500 : 3000);
}

// 색종이 생성
function createConfetti() {
  const confetti = document.createElement('div');
  confetti.className = 'confetti';

  // 랜덤 위치
  const x = Math.random() * window.innerWidth;
  const y = -20;

  // 랜덤 크기
  const size = Math.random() * 10 + 5;

  // 랜덤 색상
  const colors = ['#FFD54F', '#4CAF50', '#2196F3', '#9C27B0', '#F44336'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  // 스타일 설정
  confetti.style.left = `${x}px`;
  confetti.style.top = `${y}px`;
  confetti.style.width = `${size}px`;
  confetti.style.height = `${size}px`;
  confetti.style.backgroundColor = color;

  celebration.appendChild(confetti);

  // 애니메이션
  const animationDuration = Math.random() * 3 + 2;
  const xMove = (Math.random() - 0.5) * 200;

  confetti.animate(
    [
      { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${xMove}px, ${window.innerHeight}px) rotate(360deg)`, opacity: 0 }
    ],
    {
      duration: animationDuration * 1000,
      easing: 'cubic-bezier(0,1,1,1)'
    }
  );

  // 애니메이션 종료 후 제거
  setTimeout(() => {
    confetti.remove();
  }, animationDuration * 1000);
}

// 이벤트 리스너 등록
function setupEventListeners() {
  prevVerseBtn.addEventListener('click', () => {
    if (currentVerseIndex > 0) {
      currentVerseIndex--;
      displayCurrentVerse();
    }
  });

  nextVerseBtn.addEventListener('click', () => {
    if (currentVerseIndex < verses.length - 1) {
      currentVerseIndex++;
      displayCurrentVerse();
    }
  });

  showAnswerBtn.addEventListener('click', () => {
    verseAnswer.style.display = verseAnswer.style.display === 'none' ? 'block' : 'none';
  });

  markCompleteBtn.addEventListener('click', markComplete);
  markPartialBtn.addEventListener('click', markPartial);
  markIncompleteBtn.addEventListener('click', markIncomplete);

  addParticipantBtn.addEventListener('click', addParticipant);

  newParticipantInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      addParticipant();
    }
  });

  copyBtn.addEventListener('click', () => {
    const verse = verses[currentVerseIndex];
    const textToCopy = `${verse.reference}: ${verse.text}`;

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        alert('구절이 클립보드에 복사되었습니다!');
      })
      .catch(() => {
        alert('복사에 실패했습니다.');
      });
  });

  // 전역 함수로 등록
  window.removeParticipant = removeParticipant;
}

// 초기화
function init() {
  loadData();
  setupEventListeners();
  displayCurrentVerse();
  updateParticipantsTable();
  updateStats();
}

// 앱 시작
init();