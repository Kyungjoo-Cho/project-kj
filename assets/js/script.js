
// ========================
// ACCORDION MENU
// ========================

const accordionButtons =
  document.querySelectorAll(".accordion-button");

accordionButtons.forEach((button) => {

  button.addEventListener("click", () => {

    const contentId = button.getAttribute("aria-controls");
    const content = document.getElementById(contentId);

    const isOpen =
      button.getAttribute("aria-expanded") === "true";

    // 모든 메뉴 닫기
    accordionButtons.forEach((otherButton) => {

      const otherId =
        otherButton.getAttribute("aria-controls");

      const otherContent =
        document.getElementById(otherId);

      otherButton.setAttribute("aria-expanded", "false");
      otherContent.hidden = true;

    });

    // 선택한 메뉴만 열기
    if (!isOpen) {
      button.setAttribute("aria-expanded", "true");
      content.hidden = false;
    }

    // 중요!
    // 메뉴를 닫아도 audio.pause()를 실행하지 않음
    // 따라서 음악이 계속 재생됨

  });

});


// ========================
// MUSIC PLAYER
// ========================

const audio = document.getElementById("audio");

const playButton =
  document.getElementById("play-button");

const progress =
  document.getElementById("progress");

const currentTimeText =
  document.getElementById("current-time");

const totalTimeText =
  document.getElementById("total-time");


// 시간을 0:00 형식으로 표시
function formatTime(seconds) {

  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  return `${minutes}:${String(remaining).padStart(2, "0")}`;

}


// 재생 버튼 상태 갱신
function updatePlayButton() {

  if (audio.paused) {

    playButton.textContent = "▶";
    playButton.setAttribute("aria-label", "재생");

  } else {

    playButton.textContent = "Ⅱ";
    playButton.setAttribute("aria-label", "일시정지");

  }

}


// 재생 / 일시정지
playButton.addEventListener("click", async () => {

  if (audio.paused) {

    try {
      await audio.play();
    } catch (error) {
      console.error("음원 재생 오류:", error);
      alert("아직 음원이 연결되지 않았거나 재생할 수 없습니다.");
    }

  } else {

    audio.pause();

  }

});


// 전체 재생 시간 표시
function updateDuration() {

  if (Number.isFinite(audio.duration)) {
    totalTimeText.textContent =
      formatTime(audio.duration);
  }

}

audio.addEventListener("loadedmetadata", updateDuration);
audio.addEventListener("durationchange", updateDuration);


// 현재 시간과 진행바 동기화
audio.addEventListener("timeupdate", () => {

  currentTimeText.textContent =
    formatTime(audio.currentTime);

  if (Number.isFinite(audio.duration) && audio.duration > 0) {

    const percentage =
      (audio.currentTime / audio.duration) * 100;

    progress.value = percentage;

    progress.style.setProperty(
      "--progress",
      `${percentage}%`
    );

  }

});


// 진행바 터치 / 드래그
progress.addEventListener("input", () => {

  const percentage = Number(progress.value);

  if (Number.isFinite(audio.duration) && audio.duration > 0) {

    audio.currentTime =
      (percentage / 100) * audio.duration;

    currentTimeText.textContent =
      formatTime(audio.currentTime);

    progress.style.setProperty(
      "--progress",
      `${percentage}%`
    );

  }

});


// 재생 상태가 변경될 때 버튼 갱신
audio.addEventListener("play", updatePlayButton);
audio.addEventListener("pause", updatePlayButton);


// 노래가 끝났을 때
audio.addEventListener("ended", () => {

  progress.value = 0;
  progress.style.setProperty("--progress", "0%");

  audio.currentTime = 0;
  currentTimeText.textContent = "0:00";

  updatePlayButton();

});
