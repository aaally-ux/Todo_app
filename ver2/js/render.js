import { state } from './state.js';
import { 
  getToday, 
  getTomorrow, 
  getCurrentTimeString, 
  isWithinNext7Days, 
  escapeHTML 
} from './utils.js';

/* =========================
   タスク一覧の描画
========================= */
export function renderTasks() {
  const list = document.getElementById("taskList");
  const searchInput = document.getElementById("search");
  const search = searchInput ? searchInput.value.toLowerCase() : "";

  // 1. フィルター処理
  let filtered = state.tasks.filter((task) => {
    if (search && !task.title.toLowerCase().includes(search)) {
      return false;
    }

    if (state.selectedDateFilter) {
      return task.date === state.selectedDateFilter;
    }

    if (state.currentCategory) {
      return (
        task.date &&
        isWithinNext7Days(task.date) &&
        task.category === state.currentCategory
      );
    }

    if (state.currentFilter === "today") {
      const todayStr = getToday();
      return (
        task.date === todayStr ||
        (!task.completed && task.date && task.date < todayStr)
      );
    }

    if (state.currentFilter === "week") {
      return (
        isWithinNext7Days(task.date) ||
        (!task.completed &&
          task.date &&
          task.date < getToday() &&
          task.date !== getToday())
      );
    }

    if (state.currentFilter === "completed") {
      return task.completed;
    }

    if (state.currentFilter === "memo") {
      return !task.date && !task.completed;
    }

    return true;
  });

  // 日付・時間順でソート
  filtered.sort((a, b) => {
    const aDate = `${a.date || ""} ${a.time || ""}`;
    const bDate = `${b.date || ""} ${b.time || ""}`;
    return aDate.localeCompare(bDate);
  });

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty">タスクはありません</div>`;
    return;
  }

  // 2. グループ分け（日付別・期限切れ）
  const groups = {};
  filtered.forEach((task) => {
    let key = task.date || "TODO";
    const todayStr = getToday();
    const currentTimeStr = getCurrentTimeString();

    if (!task.completed && task.date) {
      if (
        task.date < todayStr ||
        (task.date === todayStr && task.time && task.time < currentTimeStr)
      ) {
        if (
          state.currentFilter === "today" ||
          state.currentFilter === "week" ||
          state.selectedDateFilter
        ) {
          key = "OVERDUE";
        }
      }
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  });

  list.innerHTML = "";

  const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
    if (a === "OVERDUE") return -1;
    if (b === "OVERDUE") return 1;
    return a.localeCompare(b);
  });

  // 3. DOM生成
  sortedGroupKeys.forEach((date) => {
    const groupTasks = groups[date];
    const group = document.createElement("div");
    group.className = "task-group";

    const title = document.createElement("div");
    title.className = "group-title";
    title.innerHTML = `
      ${getGroupTitle(date)}
      <span>${groupTasks.length}</span>
    `;

    group.appendChild(title);

    groupTasks.forEach((task) => {
      group.appendChild(createTaskElement(task));
    });

    list.appendChild(group);
  });
}

/* =========================
   グループタイトル生成
========================= */
export function getGroupTitle(date) {
  if (date === "OVERDUE") return "⚠️ 過ぎた予定";
  if (date === "TODO" || !date) return "TODO";
  if (date === getToday()) return "今日";
  if (date === getTomorrow()) return "明日";
  const d = new Date(date);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/* =========================
   タスク要素の生成
========================= */
export function createTaskElement(task) {
  const element = document.createElement("div");
  element.className = "task" + (task.completed ? " completed" : "");

  const priorityHtml = task.date
    ? `<span class="priority ${task.priority}"></span>`
    : "";
  const defaultTitle = task.date ? "（新規タスク）" : "（新規TODO）";

  const memoPreviewHtml = task.memo
    ? `<div class="task-memo-preview" data-action="open-memo" data-id="${task.id}" title="クリックして全文を表示">${escapeHTML(task.memo)}</div>`
    : "";

  element.innerHTML = `
    <button class="checkbox" data-action="complete" data-id="${task.id}"></button>
    <div class="task-main" data-action="detail" data-id="${task.id}">
      <div class="task-title">
        ${escapeHTML(task.title || defaultTitle)}
      </div>
      <div class="task-meta">
        ${priorityHtml}
        <span>${escapeHTML(task.category || "TODO")}</span>
        ${memoPreviewHtml}
      </div>
    </div>
    ${task.time ? `<div class="task-time">${task.time}</div>` : ""}
    <button class="delete-task" data-action="delete" data-id="${task.id}">×</button>
  `;

  return element;
}

/* =========================
   ヘッダー「次の予定」の更新
========================= */
export function updateUpcomingTask() {
  const container = document.getElementById("upcomingTask");
  const textEl = document.getElementById("upcomingTaskText");
  if (!textEl) return;

  const todayStr = getToday();
  const currentTimeStr = getCurrentTimeString();

  const upcomingTasks = state.tasks.filter((task) => {
    if (task.completed || !task.date) return false;
    if (task.date > todayStr) return true;
    if (task.date === todayStr) {
      if (!task.time) return true;
      return task.time >= currentTimeStr;
    }
    return false;
  });

  upcomingTasks.sort((a, b) => {
    const aDateTime = `${a.date} ${a.time || "23:59"}`;
    const bDateTime = `${b.date} ${b.time || "23:59"}`;
    return aDateTime.localeCompare(bDateTime);
  });

  const nextTask = upcomingTasks[0];

  if (nextTask) {
    let dateDisplay = "";
    if (nextTask.date === todayStr) {
      dateDisplay = "今日";
    } else if (nextTask.date === getTomorrow()) {
      dateDisplay = "明日";
    } else {
      const d = new Date(nextTask.date);
      dateDisplay = `${d.getMonth() + 1}/${d.getDate()}`;
    }

    const timeDisplay = nextTask.time ? ` ${nextTask.time}` : "";
    textEl.textContent = `${dateDisplay}${timeDisplay} ${nextTask.title}`;

    container.onclick = () => {
      const memoText = nextTask.memo ? nextTask.memo : "（メモはありません）";
      const timeStr = nextTask.time ? ` [${nextTask.time}]` : "";
      const dateStr = `【${nextTask.date}${timeStr}】\n\n`;

      document.getElementById("memoModalTitle").textContent = nextTask.title;
      document.getElementById("memoModalBody").textContent = dateStr + memoText;
      document.getElementById("memoModal").classList.add("show");
    };
  } else {
    textEl.textContent = "直近の予定はありません";
    container.onclick = null;
  }
}

/* =========================
   サイドバー件数バッジの更新
========================= */
export function updateCounts() {
  const today = state.tasks.filter(
    (task) => task.date === getToday() && !task.completed
  ).length;
  const week = state.tasks.filter(
    (task) => isWithinNext7Days(task.date) && !task.completed
  ).length;
  const memo = state.tasks.filter((task) => !task.date && !task.completed).length;

  document.getElementById("todayCount").textContent = today;
  document.getElementById("weekCount").textContent = week;
  document.getElementById("memoCount").textContent = memo;
}

/* =========================
   ページタイトル & クイック入力欄の切り替え
========================= */
export function updatePageTitle() {
  const title = document.getElementById("pageTitle");
  const deleteAllBtn = document.getElementById("deleteAllCompleted");
  const quickAddTaskContainer = document.getElementById("quickAddTaskContainer");
  const taskInputWrap = document.getElementById("taskInputWrap");
  const memoInputWrap = document.getElementById("memoInputWrap");

  if (
    state.currentFilter === "completed" &&
    !state.selectedDateFilter &&
    !state.currentCategory
  ) {
    deleteAllBtn.classList.add("show");
    quickAddTaskContainer.classList.add("hidden");
  } else {
    deleteAllBtn.classList.remove("show");
    quickAddTaskContainer.classList.remove("hidden");
  }

  if (state.currentFilter === "memo" && !state.currentCategory && !state.selectedDateFilter) {
    taskInputWrap.style.display = "none";
    memoInputWrap.style.display = "flex";
  } else {
    taskInputWrap.style.display = "flex";
    memoInputWrap.style.display = "none";
  }

  if (state.selectedDateFilter) {
    const d = new Date(state.selectedDateFilter);
    title.textContent = `${d.getMonth() + 1}月${d.getDate()}日`;
    return;
  }

  if (state.currentCategory) {
    title.textContent = state.currentCategory;
    return;
  }

  const titles = {
    today: "今日",
    week: "次の7日間",
    memo: "TODO",
    completed: "完了",
  };

  title.textContent = titles[state.currentFilter] || "タスク";
}

/* =========================
   詳細パネル（閉じる処理）
========================= */
export function closeDetailPanel() {
  state.selectedTaskId = null;
  const panel = document.getElementById("detailPanel");
  panel.classList.remove("mobile-show");
  panel.innerHTML = `
    <div class="detail-empty">
      タスクを選択すると<br>
      詳細が表示されます
    </div>
  `;
}