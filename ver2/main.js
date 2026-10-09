// js/main.js
import { state, updateTasks } from "./state.js";
import { generateId, getToday, escapeHTML } from "./utils.js";
import { initBackupEvents } from "./storage.js";
import { initModalsAndTheme, openMemoModal } from "./modals.js";
import { initCalendarEvents, setOnDateSelect, renderWeekStrip } from "./calendar.js";
import {
  renderTasks,
  updateCounts,
  updatePageTitle,
  updateUpcomingTask,
  closeDetailPanel,
} from "./render.js";

/* =========================================================
   1. 詳細パネル（編集フォーム）の描画と保存ロジック
========================================================= */

function showDetail(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;

  state.selectedTaskId = id;
  renderDetailEditForm(task);

  if (window.innerWidth <= 900) {
    document.getElementById("detailPanel").classList.add("mobile-show");
  }
}

function renderDetailEditForm(task) {
  const panel = document.getElementById("detailPanel");

  // TODO（メモ形式）の場合
  if (!task.date) {
    panel.innerHTML = `
      <div class="detail-header">
        <h2>TODO編集</h2>
        <button class="close-detail" id="closeDetail">×</button>
      </div>
      <div class="detail-body">
        <input
          class="detail-title"
          id="detailTitle"
          value="${escapeHTML(task.title)}"
          placeholder="TODOのタイトル..."
        >
        <div class="detail-row" style="border-bottom: none;">
          <div class="detail-label">本文</div>
          <textarea
            id="detailMemo"
            placeholder="TODOの詳細を入力..."
          >${escapeHTML(task.memo || "")}</textarea>
        </div>
      </div>
      <div class="detail-footer">
        <button class="save-detail-btn" id="saveDetailBtn">保存</button>
      </div>
    `;

    document.getElementById("closeDetail").addEventListener("click", closeDetailPanel);
    document.getElementById("saveDetailBtn").addEventListener("click", saveDetailAndClose);
    return;
  }

  // 日付指定タスクの場合
  panel.innerHTML = `
    <div class="detail-header">
      <h2>タスク編集</h2>
      <button class="close-detail" id="closeDetail">×</button>
    </div>
    <div class="detail-body">
      <input
        class="detail-title"
        id="detailTitle"
        value="${escapeHTML(task.title)}"
        placeholder="タイトルを入力..."
      >
      <div class="detail-row">
        <div class="detail-label">カテゴリ</div>
        <div class="detail-value">
          <select class="form-select" id="detailCategory">
            <option ${task.category === "仕事" ? "selected" : ""}>仕事</option>
            <option ${task.category === "プライベート" ? "selected" : ""}>プライベート</option>
            <option ${task.category === "勉強" ? "selected" : ""}>勉強</option>
          </select>
        </div>
      </div>
      <div class="detail-row">
        <div class="detail-label">期限</div>
        <input class="form-input" type="date" id="detailDate" value="${task.date || ""}">
      </div>
      <div class="detail-row">
        <div class="detail-label">時間</div>
        <input class="form-input" type="time" id="detailTime" value="${task.time || ""}">
      </div>
      <div class="detail-row">
        <div class="detail-label">優先度</div>
        <div class="priority-select-wrap">
          <span class="priority-badge-dot ${task.priority}" id="priorityIndicator"></span>
          <select class="form-select" id="detailPriority">
            <option value="low" ${task.priority === "low" ? "selected" : ""}>🟢 低</option>
            <option value="medium" ${task.priority === "medium" ? "selected" : ""}>🟡 中</option>
            <option value="high" ${task.priority === "high" ? "selected" : ""}>🔴 高</option>
          </select>
        </div>
      </div>
      <div class="detail-row" style="border-bottom: none;">
        <div class="detail-label">メモ</div>
        <textarea id="detailMemo" placeholder="メモを入力...">${escapeHTML(task.memo || "")}</textarea>
      </div>
    </div>
    <div class="detail-footer">
      <button class="save-detail-btn" id="saveDetailBtn">保存</button>
    </div>
  `;

  const priorityEl = document.getElementById("detailPriority");
  if (priorityEl) {
    priorityEl.addEventListener("change", () => {
      const indicator = document.getElementById("priorityIndicator");
      if (indicator) {
        indicator.className = `priority-badge-dot ${priorityEl.value}`;
      }
    });
  }

  document.getElementById("closeDetail").addEventListener("click", closeDetailPanel);
  document.getElementById("saveDetailBtn").addEventListener("click", saveDetailAndClose);
}

function saveDetailAndClose() {
  const task = state.tasks.find((t) => t.id === state.selectedTaskId);
  if (!task) return;

  const titleEl = document.getElementById("detailTitle");
  if (titleEl) task.title = titleEl.value;

  if (!task.date) {
    const memoEl = document.getElementById("detailMemo");
    if (memoEl) task.memo = memoEl.value;
  } else {
    const categoryEl = document.getElementById("detailCategory");
    if (categoryEl) task.category = categoryEl.value;

    const dateEl = document.getElementById("detailDate");
    if (dateEl) task.date = dateEl.value;

    const timeEl = document.getElementById("detailTime");
    if (timeEl) task.time = timeEl.value;

    const priorityEl = document.getElementById("detailPriority");
    if (priorityEl) task.priority = priorityEl.value;

    const memoEl = document.getElementById("detailMemo");
    if (memoEl) task.memo = memoEl.value;
  }

  updateTasks(state.tasks);
  refreshUI();
  closeDetailPanel();
}

/* =========================================================
   2. タスク操作（完了 / 削除 / 全削除）
========================================================= */

function toggleTask(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;

  task.completed = !task.completed;
  updateTasks(state.tasks);
  refreshUI();

  if (state.selectedTaskId === id) {
    showDetail(id);
  }
}

function deleteTask(id) {
  const newTasks = state.tasks.filter((t) => t.id !== id);
  updateTasks(newTasks);
  refreshUI();

  if (state.selectedTaskId === id) {
    closeDetailPanel();
  }
}

function deleteAllCompleted() {
  if (!confirm("完了済みのタスクをすべて削除しますか？")) return;

  const newTasks = state.tasks.filter((t) => !t.completed);
  updateTasks(newTasks);
  refreshUI();

  if (state.selectedTaskId !== null) {
    const selectedTask = state.tasks.find((t) => t.id === state.selectedTaskId);
    if (!selectedTask) {
      closeDetailPanel();
    }
  }
}

/* =========================================================
   3. 全体UI更新の共通関数
========================================================= */

function refreshUI() {
  renderTasks();
  updateCounts();
  updatePageTitle();
  updateUpcomingTask();
  if (state.currentFilter === "week" || state.selectedDateFilter) {
    renderWeekStrip();
  }
}

/* =========================================================
   4. イベントリスナー登録
========================================================= */

function initEventListeners() {
  // --- タスク一覧のクリックイベント（イベント委任） ---
  const taskList = document.getElementById("taskList");
  taskList.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!target) return;

    const id = Number(target.dataset.id);
    const action = target.dataset.action;

    if (action === "complete") toggleTask(id);
    if (action === "delete") deleteTask(id);
    if (action === "detail") showDetail(id);
    if (action === "open-memo") {
      event.stopPropagation();
      openMemoModal(id);
    }
  });

  // --- クイック追加エリア ---
  const quickAddTaskContainer = document.getElementById("quickAddTaskContainer");
  quickAddTaskContainer.addEventListener("click", () => {
    const isMemoMode =
      state.currentFilter === "memo" && !state.currentCategory && !state.selectedDateFilter;

    const tempTask = {
      id: generateId(),
      title: "",
      category: isMemoMode ? "TODO" : state.currentCategory || "仕事",
      date: isMemoMode ? "" : state.selectedDateFilter || getToday(),
      time: "",
      priority: isMemoMode ? "none" : "medium",
      completed: false,
      memo: "",
    };

    state.selectedTaskId = tempTask.id;
    renderDetailEditForm(tempTask);

    if (window.innerWidth <= 900) {
      document.getElementById("detailPanel").classList.add("mobile-show");
    }

    const saveBtn = document.getElementById("saveDetailBtn");
    if (saveBtn) {
      saveBtn.onclick = () => {
        const titleEl = document.getElementById("detailTitle");
        if (titleEl) tempTask.title = titleEl.value;

        if (!tempTask.date) {
          const memoEl = document.getElementById("detailMemo");
          if (memoEl) tempTask.memo = memoEl.value;
        } else {
          const categoryEl = document.getElementById("detailCategory");
          if (categoryEl) tempTask.category = categoryEl.value;

          const dateEl = document.getElementById("detailDate");
          if (dateEl) tempTask.date = dateEl.value;

          const timeEl = document.getElementById("detailTime");
          if (timeEl) tempTask.time = timeEl.value;

          const priorityEl = document.getElementById("detailPriority");
          if (priorityEl) tempTask.priority = priorityEl.value;

          const memoEl = document.getElementById("detailMemo");
          if (memoEl) tempTask.memo = memoEl.value;
        }

        state.tasks.push(tempTask);
        updateTasks(state.tasks);
        refreshUI();
        closeDetailPanel();
      };
    }

    setTimeout(() => {
      const titleInput = document.getElementById("detailTitle");
      if (titleInput) titleInput.focus();
    }, 50);
  });

  // --- サイドバーのナビゲーション切り替え ---
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      if (["exportBtn", "importBtn", "helpBtn"].includes(button.id)) return;

      document
        .querySelectorAll(".sidebar-section .nav-item")
        .forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      state.currentCategory = button.dataset.category || null;
      state.selectedDateFilter = null;

      if (button.dataset.filter) {
        state.currentFilter = button.dataset.filter;
      }
      if (state.currentCategory) {
        state.currentFilter = "all";
      }

      refreshUI();
    });
  });

  // --- 検索入力 ---
  const searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.addEventListener("input", renderTasks);
  }

  // --- 完了タスク全削除ボタン ---
  const deleteAllBtn = document.getElementById("deleteAllCompleted");
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener("click", deleteAllCompleted);
  }
}

/* =========================================================
   5. ブラウザ通知機能（Notification API）
========================================================= */

function initNotificationWatcher() {
  // ブラウザ通知に対応していない場合は終了
  if (!("Notification" in window)) return;

  // ユーザーに許可をリクエスト（未許可の場合）
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }

  // 30秒ごとにタスクの時間になったかチェック
  setInterval(() => {
    if (Notification.permission !== "granted") return;

    const now = new Date();
    const todayStr = getToday();
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    let isUpdated = false;

    state.tasks.forEach((task) => {
      // 未完了 かつ 今日指定 かつ 時間が設定されている かつ まだ通知していない
      if (
        !task.completed &&
        task.date === todayStr &&
        task.time &&
        task.time <= currentTimeStr &&
        !task.notified
      ) {
        new Notification("My Todo リマインダー", {
          body: `時間です！: ${task.title || "名称未設定"}`,
          icon: "./icon.png", // アイコンがあれば指定
        });

        // 二重通知防止フラグをセット
        task.notified = true;
        isUpdated = true;
      }
    });

    // 通知フラグの変更をLocalStorageに反映
    if (isUpdated) {
      updateTasks(state.tasks);
    }
  }, 30000);
}

/* =========================================================
   6. アプリケーション起動
========================================================= */

function initApp() {
  // 1. 各種サブ機能の初期化
  initModalsAndTheme();
  initCalendarEvents();

  // カレンダー/週バーで日付選択された時のコールバック
  setOnDateSelect(() => {
    updatePageTitle();
    renderTasks();
  });

  // バックアップ入出力の初期化
  initBackupEvents(
    () => state.tasks,
    (importedTasks) => {
      state.tasks = importedTasks;
      refreshUI();
    }
  );

  // 2. メインのイベント登録
  initEventListeners();

  // 3. 通知監視の開始
  initNotificationWatcher();

  // 4. 初回描画
  refreshUI();
}

// 実行
initApp();