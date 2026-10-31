
// ======================================
// PROJECT 자애법
// MAIN SCRIPT + FIREBASE
// ======================================


// ======================================
// 1. FIREBASE CONFIG
// ======================================

const firebaseConfig = {
  apiKey: "AIzaSyAziIz9lpVXLmjGNfp98Vk5rQiVaG7o7SM",
  authDomain: "project-kj-ab7ca.firebaseapp.com",
  databaseURL: "https://project-kj-ab7ca-default-rtdb.firebaseio.com",
  projectId: "project-kj-ab7ca",
  storageBucket: "project-kj-ab7ca.firebasestorage.app",
  messagingSenderId: "337752253562",
  appId: "1:337752253562:web:e072f65e547607d0cf87c3"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();

let currentUser = null;


// ======================================
// 2. ACCORDION MENU
// ======================================

const accordionButtons =
  document.querySelectorAll(".accordion-button");

accordionButtons.forEach((button) => {

  button.addEventListener("click", () => {

    const contentId = button.getAttribute("aria-controls");
    const content = document.getElementById(contentId);

    const wasOpen =
      button.getAttribute("aria-expanded") === "true";

    accordionButtons.forEach((otherButton) => {

      const otherContent = document.getElementById(
        otherButton.getAttribute("aria-controls")
      );

      otherButton.setAttribute("aria-expanded", "false");
      otherContent.hidden = true;

    });

    if (!wasOpen) {
      button.setAttribute("aria-expanded", "true");
      content.hidden = false;
    }

    // 메뉴가 닫혀도 음악은 계속 재생

  });

});


// ======================================
// 3. MUSIC PLAYER
// ======================================

const audio = document.getElementById("audio");
const playButton = document.getElementById("play-button");
const progress = document.getElementById("progress");

const currentTimeText =
  document.getElementById("current-time");

const totalTimeText =
  document.getElementById("total-time");

function formatTime(seconds) {

  if (!Number.isFinite(seconds)) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  return `${minutes}:${String(remaining).padStart(2, "0")}`;

}

function updatePlayButton() {

  const isPlaying = !audio.paused;

  playButton.textContent = isPlaying ? "Ⅱ" : "▶";

  playButton.setAttribute(
    "aria-label",
    isPlaying ? "일시정지" : "재생"
  );

}

playButton.addEventListener("click", async () => {

  if (audio.paused) {

    try {
      await audio.play();
    } catch (error) {
      console.error("음악 재생 오류:", error);
      alert("음원 파일을 확인해주세요.");
    }

  } else {
    audio.pause();
  }

});

function updateProgressDisplay() {

  currentTimeText.textContent = formatTime(audio.currentTime);

  if (Number.isFinite(audio.duration) && audio.duration > 0) {

    totalTimeText.textContent = formatTime(audio.duration);

    const percentage =
      (audio.currentTime / audio.duration) * 100;

    progress.value = percentage;

    progress.style.setProperty(
      "--progress",
      `${percentage}%`
    );

  }

}

audio.addEventListener("loadedmetadata", updateProgressDisplay);
audio.addEventListener("durationchange", updateProgressDisplay);
audio.addEventListener("timeupdate", updateProgressDisplay);
audio.addEventListener("seeked", updateProgressDisplay);

audio.addEventListener("play", updatePlayButton);
audio.addEventListener("pause", updatePlayButton);

progress.addEventListener("input", () => {

  if (Number.isFinite(audio.duration) && audio.duration > 0) {

    const percentage = Number(progress.value);

    audio.currentTime =
      (percentage / 100) * audio.duration;

    updateProgressDisplay();

  }

});

audio.addEventListener("ended", () => {

  audio.currentTime = 0;
  progress.value = 0;
  progress.style.setProperty("--progress", "0%");

  updateProgressDisplay();
  updatePlayButton();

});


// ======================================
// 4. SOCIAL ELEMENTS
// ======================================

const likeButton = document.getElementById("like-button");
const likeCount = document.getElementById("like-count");

const commentToggle = document.getElementById("comment-toggle");
const commentPanel = document.getElementById("comment-panel");

const commentForm = document.getElementById("comment-form");
const commentName = document.getElementById("comment-name");
const commentText = document.getElementById("comment-text");

const commentCount = document.getElementById("comment-count");
const commentListCount = document.getElementById("comment-list-count");
const commentList = document.getElementById("comment-list");


// ======================================
// 5. COMMENT POPUP
// ======================================

const modalCard = document.createElement("div");
modalCard.className = "comment-modal-card";

const modalHeader = document.createElement("div");
modalHeader.className = "comment-modal-header";

const modalTitle = document.createElement("h3");
modalTitle.className = "comment-modal-title";
modalTitle.textContent = "Comments";

const closeButton = document.createElement("button");
closeButton.className = "comment-close";
closeButton.type = "button";
closeButton.textContent = "×";
closeButton.setAttribute("aria-label", "댓글창 닫기");

modalHeader.append(modalTitle, closeButton);

while (commentPanel.firstChild) {
  modalCard.appendChild(commentPanel.firstChild);
}

modalCard.prepend(modalHeader);
commentPanel.appendChild(modalCard);

document.body.appendChild(commentPanel);

commentPanel.setAttribute("role", "dialog");
commentPanel.setAttribute("aria-modal", "true");
commentPanel.setAttribute("aria-label", "댓글");

function openCommentModal() {

  commentPanel.hidden = false;
  commentToggle.setAttribute("aria-expanded", "true");

  document.body.style.overflow = "hidden";

  closeButton.focus();

}

function closeCommentModal() {

  commentPanel.hidden = true;
  commentToggle.setAttribute("aria-expanded", "false");

  document.body.style.overflow = "";

  commentToggle.focus();

}

commentToggle.addEventListener("click", () => {

  if (commentPanel.hidden) {
    openCommentModal();
  } else {
    closeCommentModal();
  }

});

closeButton.addEventListener("click", closeCommentModal);

commentPanel.addEventListener("click", (event) => {

  if (event.target === commentPanel) {
    closeCommentModal();
  }

});

document.addEventListener("keydown", (event) => {

  if (event.key === "Escape" && !commentPanel.hidden) {
    closeCommentModal();
  }

});


// ======================================
// 6. FIREBASE AUTHENTICATION
// ======================================

auth.onAuthStateChanged(async (user) => {

  if (user) {

    currentUser = user;

    await checkMyLike();

  } else {

    currentUser = null;

    try {
      await auth.signInAnonymously();
    } catch (error) {
      console.error("익명 인증 실패:", error);
      console.warn("댓글 및 좋아요를 사용할 수 없습니다.");
    }

  }

});


// ======================================
// 7. LIKES
// ======================================

let myLiked = false;

function updateLikeButton() {

  likeButton.querySelector(".heart-symbol").textContent =
    myLiked ? "♥" : "♡";

  likeButton.setAttribute(
    "aria-pressed",
    String(myLiked)
  );

}

// 전체 좋아요 수 실시간 확인
database.ref("likes").on("value", (snapshot) => {

  likeCount.textContent = snapshot.numChildren();

}, (error) => {

  console.error("좋아요 불러오기 오류:", error);

});

// 내가 이미 눌렀는지 확인
async function checkMyLike() {

  if (!currentUser) return;

  try {

    const snapshot = await database
      .ref("likes/" + currentUser.uid)
      .once("value");

    myLiked = snapshot.val() === true;

    updateLikeButton();

  } catch (error) {

    console.error("좋아요 확인 오류:", error);

  }

}

// 좋아요 등록
likeButton.addEventListener("click", async () => {

  if (!currentUser) {
    alert("연결 중입니다. 잠시 후 다시 눌러주세요.");
    return;
  }

  if (myLiked) return;

  likeButton.disabled = true;

  try {

    await database
      .ref("likes/" + currentUser.uid)
      .set(true);

    myLiked = true;
    updateLikeButton();

  } catch (error) {

    console.error("좋아요 등록 오류:", error);
    alert("좋아요를 저장하지 못했습니다.");

  } finally {

    likeButton.disabled = false;

  }

});


// ======================================
// 8. COMMENTS
// ======================================

let comments = [];

// 댓글 표시
function renderComments() {

  commentList.replaceChildren();

  commentCount.textContent = comments.length;
  commentListCount.textContent = comments.length;

  if (comments.length === 0) {

    const empty = document.createElement("p");
    empty.className = "no-comments";
    empty.textContent = "아직 댓글이 없습니다.";

    commentList.appendChild(empty);
    return;

  }

  // 최신 댓글부터 표시
  const sortedComments = [...comments].sort((a, b) => {
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  sortedComments.forEach((item) => {

    const entry = document.createElement("div");
    entry.className = "comment-entry";

    const name = document.createElement("strong");
    name.textContent = item.name || "익명";

    const text = document.createElement("p");
    text.textContent = item.text || "";

    entry.append(name, text);
    commentList.appendChild(entry);

  });

}

// Firebase에서 모든 댓글 불러오기
database.ref("comments").on("value", (snapshot) => {

  comments = [];

  snapshot.forEach((child) => {

    const item = child.val();

    if (item) {
      comments.push(item);
    }

  });

  renderComments();

}, (error) => {

  console.error("댓글 불러오기 오류:", error);

});


// 댓글 등록
commentForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  if (!currentUser) {
    alert("연결 중입니다. 잠시 후 다시 등록해주세요.");
    return;
  }

  const name = commentName.value.trim();
  const text = commentText.value.trim();

  if (!name || !text) return;

  if (name.length > 20 || text.length > 300) {
    alert("닉네임 또는 댓글이 너무 깁니다.");
    return;
  }

  const submitButton =
    commentForm.querySelector(".comment-submit");

  submitButton.disabled = true;
  submitButton.textContent = "등록 중...";

  try {

    const newCommentRef =
      database.ref("comments").push();

    await newCommentRef.set({

      name: name,
      text: text,
      uid: currentUser.uid,
      createdAt: firebase.database.ServerValue.TIMESTAMP

    });

    commentForm.reset();

  } catch (error) {

    console.error("댓글 등록 오류:", error);
    alert("댓글을 저장하지 못했습니다. 연결 상태를 확인해주세요.");

  } finally {

    submitButton.disabled = false;
    submitButton.textContent = "등록하기";

  }

});
