import { state } from './state.js';
import { closeDetailPanel } from './render.js';

/* =========================
   本文全文モーダル表示
========================= */
export function openMemoModal(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task || !task.memo) return;

  const titleEl = document.getElementById("memoModalTitle");
  const bodyEl = document.getElementById("memoModalBody");
  const modalEl = document.getElementById("memoModal");

  if (titleEl) titleEl.textContent = task.title || "本文詳細";
  if (bodyEl) bodyEl.textContent = task.memo;
  if (modalEl) modalEl.classList.add("show");
}

/* =========================
   モーダル & ダークモード初期化
========================= */
export function initModalsAndTheme() {
  // --- 1. ダークモード設定 ---
  const darkModeBtn = document.getElementById("darkModeBtn");
  const savedDarkMode = localStorage.getItem("myTodoDarkMode") === "true";

  if (savedDarkMode) {
    document.body.classList.add("dark-mode");
    if (darkModeBtn) darkModeBtn.textContent = "☀️";
  }

  if (darkModeBtn) {
    darkModeBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      localStorage.setItem("myTodoDarkMode", isDark);
      darkModeBtn.textContent = isDark ? "☀️" : "🌙";
    });
  }

  // --- 2. 本文モーダル制御 ---
  const memoModal = document.getElementById("memoModal");
  const memoModalClose = document.getElementById("memoModalClose");

  if (memoModalClose) {
    memoModalClose.addEventListener("click", () => {
      memoModal.classList.remove("show");
    });
  }

  if (memoModal) {
    memoModal.addEventListener("click", (e) => {
      if (e.target === memoModal) {
        memoModal.classList.remove("show");
      }
    });
  }

  // --- 3. 使い方説明モーダル制御 ---
  const helpModal = document.getElementById("helpModal");
  const helpBtn = document.getElementById("helpBtn");
  const helpModalClose = document.getElementById("helpModalClose");

  if (helpBtn) {
    helpBtn.addEventListener("click", () => {
      if (helpModal) helpModal.classList.add("show");
    });
  }

  if (helpModalClose) {
    helpModalClose.addEventListener("click", () => {
      if (helpModal) helpModal.classList.remove("show");
    });
  }

  if (helpModal) {
    helpModal.addEventListener("click", (e) => {
      if (e.target === helpModal) {
        helpModal.classList.remove("show");
      }
    });
  }

  // --- 4. ESCキー共通制御 ---
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const calendarModal = document.getElementById("calendarModal");
      if (calendarModal) calendarModal.classList.remove("show");
      if (memoModal) memoModal.classList.remove("show");
      if (helpModal) helpModal.classList.remove("show");
      closeDetailPanel();
    }
  });
}