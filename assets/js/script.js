
"use strict";

// ==========================================
// PROJECT 자애법
// MAIN JAVASCRIPT
// ==========================================


// ==========================================
// 1. ACCORDION MENU
// ==========================================

const accordionButtons =
  document.querySelectorAll(".accordion-button");

accordionButtons.forEach((button) => {

  button.addEventListener("click", () => {

    const contentId =
      button.getAttribute("aria-controls");

    const content =
      document.getElementById(contentId);

    if (!content) return;

    const wasOpen =
      button.getAttribute("aria-expanded") === "true";

    accordionButtons.forEach((otherButton) => {

      const otherId =
        otherButton.getAttribute("aria-controls");

      const otherContent =
        document.getElementById(otherId);

      otherButton.setAttribute(
        "aria-expanded",
        "false"
      );

      if (otherContent) {
        otherContent.hidden = true;
      }

    });

    if (!wasOpen) {

      button.setAttribute(
        "aria-expanded",
        "true"
      );

      content.hidden = false;

    }

  });

});


// ==========================================
// 2. MUSIC PLAYER
// ==========================================

const audio =
  document.getElementById("audio");

const playButton =
  document.getElementById("play-button");

const progress =
  document.getElementById("progress");

const currentTimeText =
  document.getElementById("current-time");

const totalTimeText =
  document.getElementById("total-time");


function formatTime(seconds) {

  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes =
    Math.floor(seconds / 60);

  const remainingSeconds =
    Math.floor(seconds % 60);

  return (
    minutes +
    ":" +
    String(remainingSeconds).padStart(2, "0")
  );

}


function updatePlayButton() {

  const isPlaying = !audio.paused;

  playButton.textContent =
    isPlaying ? "Ⅱ" : "▶";

  playButton.setAttribute(
    "aria-label",
    isPlaying ? "일시정지" : "재생"
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
      percentage + "%"
    );

  }

}


playButton.addEventListener("click", async () => {

  if (audio.paused) {

    try {

      await audio.play();

    } catch (error) {

      console.error("음악 재생 오류:", error);

      alert(
        "음원을 재생할 수 없습니다. " +
        "assets/song.mp3 파일을 확인해주세요."
      );

    }

  } else {

    audio.pause();

  }

});


audio.addEventListener(
  "loadedmetadata",
  updateProgress
);

audio.addEventListener(
  "durationchange",
  updateProgress
);

audio.addEventListener(
  "timeupdate",
  updateProgress
);

audio.addEventListener(
  "seeked",
  updateProgress
);

audio.addEventListener(
  "play",
  updatePlayButton
);

audio.addEventListener(
  "pause",
  updatePlayButton
);


progress.addEventListener("input", () => {

  if (
    Number.isFinite(audio.duration) &&
    audio.duration > 0
  ) {

    const percentage =
      Number(progress.value);

    audio.currentTime =
      audio.duration * (percentage / 100);

    updateProgress();

  }

});


audio.addEventListener("ended", () => {

  audio.currentTime = 0;

  progress.value = 0;

  progress.style.setProperty(
    "--progress",
    "0%"
  );

  updateProgress();
  updatePlayButton();

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

  commentToggle.setAttribute(
    "aria-expanded",
    "true"
  );

  document.body.style.overflow = "hidden";

  commentClose.focus();

}


function closeComments() {

  commentPanel.hidden = true;

  commentToggle.setAttribute(
    "aria-expanded",
    "false"
  );

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


commentClose.addEventListener(
  "click",
  closeComments
);


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

  if (event.key === "Tab") {

    const focusable = Array.from(
      commentCard.querySelectorAll(
        "button:not(:disabled), " +
        "input:not(:disabled), " +
        "textarea:not(:disabled)"
      )
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (
      event.shiftKey &&
      document.activeElement === first
    ) {

      event.preventDefault();
      last.focus();

    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {

      event.preventDefault();
      first.focus();

    }

  }

});


// ==========================================
// 4. LIKE AND COMMENT ELEMENTS
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


// ==========================================
// 5. SHARED STATE
// ==========================================

let comments = [];

let myLiked = false;

let firebaseReady = false;

let currentUser = null;

let database = null;

let auth = null;

let likeBusy = false;


// ==========================================
// 6. DISPLAY FUNCTIONS
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

  commentCount.textContent =
    comments.length;

  commentListCount.textContent =
    comments.length;

  if (comments.length === 0) {

    const empty =
      document.createElement("p");

    empty.className = "no-comments";

    empty.textContent =
      "아직 댓글이 없습니다.";

    commentList.appendChild(empty);

    return;

  }

  const sorted = [...comments].sort((a, b) => {

    return (
      (b.createdAt || 0) -
      (a.createdAt || 0)
    );

  });

  sorted.forEach((item) => {

    const entry =
      document.createElement("div");

    entry.className = "comment-entry";

    const name =
      document.createElement("strong");

    name.textContent =
      item.name || "익명";

    const body =
      document.createElement("p");

    body.textContent =
      item.text || "";

    entry.append(name, body);

    commentList.appendChild(entry);

  });

}


function showConnectionError() {

  alert(
    "서버에 아직 연결되지 않았습니다.\n" +
    "잠시 후 다시 시도해주세요.\n" +
    "문제가 계속되면 GitHub Pages에서 확인해주세요."
  );

}


// ==========================================
// 7. FIREBASE CONFIG
// ==========================================

const firebaseConfig = {

  apiKey:
    "AIzaSyAziIz9lpVXLmjGNfp98Vk5rQiVaG7o7SM",

  authDomain:
    "project-kj-ab7ca.firebaseapp.com",

  databaseURL:
    "https://project-kj-ab7ca-default-rtdb.firebaseio.com",

  projectId:
    "project-kj-ab7ca",

  storageBucket:
    "project-kj-ab7ca.firebasestorage.app",

  messagingSenderId:
    "337752253562",

  appId:
    "1:337752253562:web:e072f65e547607d0cf87c3"

};


// ==========================================
// 8. FIREBASE INITIALIZATION
// ==========================================

function initializeFirebase() {

  // Firebase가 로드되지 않아도
  // 메뉴와 음악 기능에는 영향을 주지 않음.

  if (typeof firebase === "undefined") {

    console.warn(
      "Firebase 라이브러리가 로드되지 않았습니다."
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


    // --------------------------------------
    // COMMENTS: REALTIME READ
    // --------------------------------------

    database.ref("comments").on(
      "value",

      (snapshot) => {

        comments = [];

        snapshot.forEach((child) => {

          const item = child.val();

          if (item) {
            comments.push(item);
          }

        });

        renderComments();

      },

      (error) => {

        console.error(
          "댓글 불러오기 오류:",
          error
        );

      }
    );


    // --------------------------------------
    // LIKES: REALTIME COUNT
    // --------------------------------------

    database.ref("likes").on(
      "value",

      (snapshot) => {

        likeCount.textContent =
          snapshot.numChildren();

        // Firebase 데이터 구조:
        // likes
        //   사용자UID1: true
        //   사용자UID2: true
        //
        // 좋아요 취소 시 해당 UID 삭제
        // 따라서 전체 숫자도 자동 감소

      },

      (error) => {

        console.error(
          "좋아요 불러오기 오류:",
          error
        );

      }
    );


    // --------------------------------------
    // ANONYMOUS AUTHENTICATION
    // --------------------------------------

    auth.onAuthStateChanged(async (user) => {

      if (user) {

        currentUser = user;

        try {

          const snapshot = await database
            .ref("likes/" + user.uid)
            .once("value");

          // 인증 사용자가 바뀐 경우
          // 이전 요청으로 상태를 덮어쓰지 않음
          if (
            !currentUser ||
            currentUser.uid !== user.uid
          ) {
            return;
          }

          myLiked =
            snapshot.val() === true;

          updateLikeButton();

        } catch (error) {

          console.error(
            "내 좋아요 확인 오류:",
            error
          );

        }

      } else {

        currentUser = null;

        myLiked = false;

        updateLikeButton();

        try {

          await auth.signInAnonymously();

        } catch (error) {

          console.error(
            "익명 인증 오류:",
            error
          );

        }

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


// 모든 defer 스크립트가 실행된 후
// Firebase 연결 시도

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
// 9. LIKE BUTTON
// REGISTER + CANCEL
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

  try {

    const userId = currentUser.uid;

    const likeRef =
      database.ref("likes/" + userId);

    // transaction을 사용하면
    // 여러 요청이 동시에 와도 현재 값을
    // 확인하고 안전하게 변경할 수 있음.

    const result = await likeRef.transaction(
      (currentValue) => {

        if (currentValue === true) {

          // 좋아요가 있으면 삭제 = 취소
          return null;

        }

        // 좋아요가 없으면 등록
        return true;

      }
    );

    if (result.committed) {

      myLiked =
        result.snapshot.val() === true;

      updateLikeButton();

    } else {

      // 트랜잭션이 완료되지 않았다면
      // 실제 서버 상태 다시 확인

      const snapshot =
        await likeRef.once("value");

      myLiked =
        snapshot.val() === true;

      updateLikeButton();

    }

  } catch (error) {

    console.error(
      "좋아요 변경 오류:",
      error
    );

    alert(
      "좋아요 상태를 변경하지 못했습니다.\n" +
      "Firebase 규칙을 확인해주세요."
    );

    // 실패했을 때 실제 저장된 상태 확인
    try {

      if (currentUser) {

        const snapshot = await database
          .ref("likes/" + currentUser.uid)
          .once("value");

        myLiked =
          snapshot.val() === true;

        updateLikeButton();

      }

    } catch (readError) {

      console.error(
        "좋아요 상태 재확인 오류:",
        readError
      );

    }

  } finally {

    likeBusy = false;
    likeButton.disabled = false;

  }

});


// ==========================================
// 10. COMMENT SUBMIT
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

  const name =
    commentName.value.trim();

  const text =
    commentText.value.trim();

  if (!name || !text) {

    alert(
      "닉네임과 댓글 내용을 모두 입력해주세요."
    );

    return;

  }

  if (
    name.length > 20 ||
    text.length > 300
  ) {

    alert(
      "닉네임은 최대 20자, " +
      "댓글은 최대 300자까지 입력할 수 있습니다."
    );

    return;

  }

  submitButton.disabled = true;

  submitButton.textContent =
    "등록 중...";

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

    // 댓글 목록은 Firebase의 실시간 감지로
    // 모든 방문객에게 자동 업데이트됨.

  } catch (error) {

    console.error(
      "댓글 등록 오류:",
      error
    );

    alert(
      "댓글을 저장하지 못했습니다.\n" +
      "인터넷 연결과 Firebase 규칙을 확인해주세요."
    );

  } finally {

    submitButton.disabled = false;

    submitButton.textContent =
      "등록하기";

  }

});


// ==========================================
// 11. INITIAL DISPLAY
// ==========================================

updateLikeButton();

renderComments();

updatePlayButton();
