
"use strict";

// ==========================================
// PROJECT 자애법 - SCRIPT
// ==========================================


// ==========================================
// 1. ACCORDION
// ==========================================

const accordionButtons =
  document.querySelectorAll(".accordion-button");

accordionButtons.forEach((button) => {
  button.addEventListener("click", () => {

    const id = button.getAttribute("aria-controls");
    const content = document.getElementById(id);

    if (!content) return;

    const wasOpen =
      button.getAttribute("aria-expanded") === "true";

    accordionButtons.forEach((otherButton) => {
      const otherId =
        otherButton.getAttribute("aria-controls");

      const otherContent =
        document.getElementById(otherId);

      otherButton.setAttribute("aria-expanded", "false");

      if (otherContent) {
        otherContent.hidden = true;
      }
    });

    if (!wasOpen) {
      button.setAttribute("aria-expanded", "true");
      content.hidden = false;
    }
  });
});


// ==========================================
// 2. MUSIC PLAYER
// ==========================================

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
  const playing = !audio.paused;

  playButton.textContent = playing ? "Ⅱ" : "▶";

  playButton.setAttribute(
    "aria-label",
    playing ? "일시정지" : "재생"
  );
}


function updateProgress() {
  currentTimeText.textContent =
    formatTime(audio.currentTime);

  if (
    Number.isFinite(audio.duration) &&
    audio.duration > 0
  ) {
    totalTimeText.textContent =
      formatTime(audio.duration);

    const percentage =
      (audio.currentTime / audio.duration) * 100;

    progress.value = percentage;

    progress.style.setProperty(
      "--progress",
      `${percentage}%`
    );
  }
}


playButton.addEventListener("click", async () => {
  if (audio.paused) {
    try {
      await audio.play();
    } catch (error) {
      console.error("음악 재생 오류:", error);
      alert("음악을 재생할 수 없습니다. 음원 파일을 확인해주세요.");
    }
  } else {
    audio.pause();
  }
});


audio.addEventListener("loadedmetadata", updateProgress);
audio.addEventListener("durationchange", updateProgress);
audio.addEventListener("timeupdate", updateProgress);
audio.addEventListener("seeked", updateProgress);
audio.addEventListener("play", updatePlayButton);
audio.addEventListener("pause", updatePlayButton);

audio.addEventListener("ended", () => {
  audio.currentTime = 0;
  progress.value = 0;
  updateProgress();
  updatePlayButton();
});


progress.addEventListener("input", () => {
  if (
    Number.isFinite(audio.duration) &&
    audio.duration > 0
  ) {
    audio.currentTime =
      audio.duration * Number(progress.value) / 100;

    updateProgress();
  }
});


// ==========================================
// 3. COMMENT POPUP
// ==========================================

const commentToggle =
  document.getElementById("comment-toggle");

const commentPanel =
  document.getElementById("comment-panel");

const commentClose =
  document.getElementById("comment-close");

const commentCard =
  document.querySelector(".comment-modal-card");


function openComments() {
  commentPanel.hidden = false;
  commentToggle.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
  commentClose.focus();
}


function closeComments() {
  commentPanel.hidden = true;
  commentToggle.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
  commentToggle.focus();
}


commentToggle.addEventListener("click", () => {
  if (commentPanel.hidden) {
    openComments();
  } else {
    closeComments();
  }
});


commentClose.addEventListener("click", closeComments);


commentPanel.addEventListener("click", (event) => {
  if (event.target === commentPanel) {
    closeComments();
  }
});


document.addEventListener("keydown", (event) => {
  if (commentPanel.hidden) return;

  if (event.key === "Escape") {
    closeComments();
    return;
  }

  if (event.key !== "Tab") return;

  const focusable = Array.from(
    commentCard.querySelectorAll(
      "button:not(:disabled), input:not(:disabled), textarea:not(:disabled)"
    )
  );

  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (
    !event.shiftKey &&
    document.activeElement === last
  ) {
    event.preventDefault();
    first.focus();
  }
});


// ==========================================
// 4. ELEMENTS AND STATE
// ==========================================

const likeButton =
  document.getElementById("like-button");

const likeCount =
  document.getElementById("like-count");

const commentCount =
  document.getElementById("comment-count");

const commentListCount =
  document.getElementById("comment-list-count");

const commentList =
  document.getElementById("comment-list");

const commentForm =
  document.getElementById("comment-form");

const commentName =
  document.getElementById("comment-name");

const commentText =
  document.getElementById("comment-text");

const submitButton =
  commentForm.querySelector(".comment-submit");


let database = null;
let auth = null;
let currentUser = null;

let firebaseReady = false;
let authError = null;

let myLiked = false;
let likeBusy = false;
let comments = [];


// ==========================================
// 5. DISPLAY FUNCTIONS
// ==========================================

function updateLikeButton() {
  likeButton.setAttribute(
    "aria-pressed",
    String(myLiked)
  );

  likeButton.setAttribute(
    "aria-label",
    myLiked ? "좋아요 취소" : "좋아요"
  );
}


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

  const sorted = [...comments].sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );

  sorted.forEach((item) => {
    const entry = document.createElement("div");
    entry.className = "comment-entry";

    const name = document.createElement("strong");
    name.textContent = item.name || "익명";

    const body = document.createElement("p");
    body.textContent = item.text || "";

    entry.append(name, body);
    commentList.appendChild(entry);
  });
}


function showConnectionError() {
  if (!firebaseReady) {
    alert(
      "Firebase 라이브러리를 연결하지 못했습니다.\n" +
      "인터넷 연결 및 index.html의 스크립트 경로를 확인해주세요."
    );
    return;
  }

  if (authError) {
    alert(
      "Firebase 익명 로그인에 실패했습니다.\n" +
      "Chrome 개발자 도구의 Console에서 오류를 확인해주세요."
    );
    return;
  }

  alert(
    "Firebase 사용자 인증이 아직 완료되지 않았습니다.\n" +
    "잠시 후 다시 시도해주세요."
  );
}


// ==========================================
// 6. FIREBASE CONFIG
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyAziIz91pVXLmjGNfp98Vk5rQiVaG7o7SM",
  authDomain: "project-kj-ab7ca.firebaseapp.com",
  databaseURL: "https://project-kj-ab7ca-default-rtdb.firebaseio.com",
  projectId: "project-kj-ab7ca",
  storageBucket: "project-kj-ab7ca.firebasestorage.app",
  messagingSenderId: "337752253562",
  appId: "1:337752253562:web:e072f65e547607d0cf87c3"
};


// ==========================================
// 7. FIREBASE INITIALIZATION
// ==========================================

function initializeFirebase() {

  // Firebase 오류가 있더라도
  // 기존 메뉴와 음악 기능은 계속 작동함.
  if (
    typeof firebase === "undefined" ||
    typeof firebase.auth !== "function" ||
    typeof firebase.database !== "function"
  ) {
    console.error(
      "Firebase 라이브러리를 불러오지 못했습니다. " +
      "index.html의 Firebase script 태그를 확인해주세요."
    );
    return;
  }

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    auth = firebase.auth();
    database = firebase.database();
    firebaseReady = true;

    console.log("Firebase 초기화 완료");


    // ======================================
    // COMMENTS: REALTIME READING
    // ======================================

    database.ref("comments").on(
      "value",

      (snapshot) => {
        comments = [];

        snapshot.forEach((child) => {
          const item = child.val();

          if (item && typeof item === "object") {
            comments.push(item);
          }
        });

        renderComments();
      },

      (error) => {
        console.error("댓글 읽기 오류:", error);

        commentList.replaceChildren();

        const message = document.createElement("p");
        message.className = "no-comments";
        message.textContent =
          "댓글을 불러오지 못했습니다.";

        commentList.appendChild(message);
      }
    );


    // ======================================
    // LIKES: REALTIME COUNT
    // ======================================

    database.ref("likes").on(
      "value",

      (snapshot) => {
        likeCount.textContent = snapshot.numChildren();

        if (currentUser) {
          myLiked =
            snapshot.child(currentUser.uid).val() === true;

          updateLikeButton();
        }
      },

      (error) => {
        console.error("좋아요 읽기 오류:", error);
      }
    );


    // ======================================
    // ANONYMOUS AUTHENTICATION
    // ======================================

    auth.onAuthStateChanged(async (user) => {

      if (!user) {
        currentUser = null;
        myLiked = false;
        updateLikeButton();

        try {
          authError = null;
          await auth.signInAnonymously();

        } catch (error) {
          authError = error;

          console.error(
            "Firebase 익명 로그인 실패:",
            error.code,
            error.message
          );
        }

        return;
      }

      currentUser = user;
      authError = null;

      console.log("Firebase 익명 로그인 성공");

      try {
        const snapshot = await database
          .ref("likes/" + user.uid)
          .once("value");

        if (
          currentUser &&
          currentUser.uid === user.uid &&
          !likeBusy
        ) {
          myLiked = snapshot.val() === true;
          updateLikeButton();
        }

      } catch (error) {
        console.error(
          "내 좋아요 확인 오류:",
          error
        );
      }
    });

  } catch (error) {
    firebaseReady = false;
    console.error(
      "Firebase 초기화 오류:",
      error
    );
  }
}


// defer 스크립트 실행이 끝난 뒤 초기화
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeFirebase,
    { once: true }
  );
} else {
  initializeFirebase();
}


// ==========================================
// 8. LIKE BUTTON: REGISTER / CANCEL
// ==========================================

likeButton.addEventListener("click", async () => {

  if (
    !firebaseReady ||
    !database ||
    !currentUser
  ) {
    showConnectionError();
    return;
  }

  if (likeBusy) return;

  likeBusy = true;
  likeButton.disabled = true;

  const userId = currentUser.uid;
  const likeRef = database.ref("likes/" + userId);

  try {

    // true → null : 좋아요 취소
    // null → true : 좋아요 등록
    const result = await likeRef.transaction(
      (currentValue) => {
        return currentValue === true ? null : true;
      }
    );

    if (result.committed) {
      myLiked = result.snapshot.val() === true;

    } else {
      const snapshot = await likeRef.once("value");
      myLiked = snapshot.val() === true;
    }

    updateLikeButton();

  } catch (error) {

    console.error(
      "좋아요 등록/취소 오류:",
      error.code,
      error.message
    );

    alert(
      "좋아요를 변경하지 못했습니다.\n" +
      "Firebase 규칙과 Console 오류를 확인해주세요."
    );

    try {
      const snapshot = await likeRef.once("value");
      myLiked = snapshot.val() === true;
      updateLikeButton();
    } catch (readError) {
      console.error(readError);
    }

  } finally {
    likeBusy = false;
    likeButton.disabled = false;
  }
});


// ==========================================
// 9. COMMENT SUBMIT
// ==========================================

commentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (
    !firebaseReady ||
    !database ||
    !currentUser
  ) {
    showConnectionError();
    return;
  }

  const name = commentName.value.trim();
  const text = commentText.value.trim();

  if (!name || !text) {
    alert("닉네임과 댓글을 모두 입력해주세요.");
    return;
  }

  if (name.length > 20 || text.length > 300) {
    alert(
      "닉네임은 20자, 댓글은 300자 이하로 입력해주세요."
    );
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "등록 중...";

  try {
    const newCommentRef =
      database.ref("comments").push();

    await newCommentRef.set({
      name: name,
      text: text,
      uid: currentUser.uid,
      createdAt:
        firebase.database.ServerValue.TIMESTAMP
    });

    commentForm.reset();

    // 실시간 리스너가 댓글 목록을 자동 갱신함.

  } catch (error) {
    console.error(
      "댓글 등록 오류:",
      error.code,
      error.message
    );

    alert(
      "댓글을 저장하지 못했습니다.\n" +
      "Firebase 규칙과 인터넷 연결을 확인해주세요."
    );

  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "등록하기";
  }
});


// ==========================================
// 10. INITIAL UI
// ==========================================

updateLikeButton();
updatePlayButton();
