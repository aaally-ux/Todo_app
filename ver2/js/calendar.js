// js/calendar.js
import { state } from './state.js';
import { getToday, formatDate } from './utils.js';

// 日付がクリックされたときに外側（main.jsなど）から実行させたい処理を保持する
let onDateSelectCallback = null;

export function setOnDateSelect(callback) {
  onDateSelectCallback = callback;
}

/* =========================
   月間カレンダー描画
========================= */
export function renderMonthCalendar() {
  const titleEl = document.getElementById("calMonthTitle");
  const gridEl = document.getElementById("calDaysGrid");
  if (!titleEl || !gridEl) return;

  titleEl.textContent = `${state.calCurrentYear}年 ${state.calCurrentMonth + 1}月`;
  gridEl.innerHTML = "";

  const firstDayIndex = new Date(state.calCurrentYear, state.calCurrentMonth, 1).getDay();
  const lastDay = new Date(state.calCurrentYear, state.calCurrentMonth + 1, 0).getDate();
  const prevLastDay = new Date(state.calCurrentYear, state.calCurrentMonth, 0).getDate();

  // 前月の余白
  for (let i = firstDayIndex; i > 0; i--) {
    const dayNum = prevLastDay - i + 1;
    const m = state.calCurrentMonth === 0 ? 12 : state.calCurrentMonth;
    const y = state.calCurrentMonth === 0 ? state.calCurrentYear - 1 : state.calCurrentYear;
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    createCell(gridEl, dayNum, dateStr, true);
  }

  // 当月の日付
  for (let i = 1; i <= lastDay; i++) {
    const m = state.calCurrentMonth + 1;
    const dateStr = `${state.calCurrentYear}-${String(m).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    createCell(gridEl, i, dateStr, false);
  }

  // 翌月の余白
  const totalCells = firstDayIndex + lastDay;
  const nextDaysCount = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
  for (let i = 1; i <= nextDaysCount; i++) {
    const m = state.calCurrentMonth === 11 ? 1 : state.calCurrentMonth + 2;
    const y = state.calCurrentMonth === 11 ? state.calCurrentYear + 1 : state.calCurrentYear;
    const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    createCell(gridEl, i, dateStr, true);
  }
}

function createCell(gridEl, dayNum, dateStr, isOtherMonth) {
  const cell = document.createElement("div");
  cell.className = "cal-cell";
  if (isOtherMonth) cell.classList.add("other-month");
  if (dateStr === getToday()) cell.classList.add("today");
  if (dateStr === state.selectedDateFilter) cell.classList.add("selected");

  const hasTask = state.tasks.some((task) => task.date === dateStr);

  let html = `<span>${dayNum}</span>`;
  if (hasTask) {
    html += `<span class="cal-cell-dot"></span>`;
  }
  cell.innerHTML = html;

  // 日付セルクリック時
  cell.addEventListener("click", () => {
    state.selectedDateFilter = dateStr;
    state.currentFilter = "date";
    state.currentCategory = null;

    document
      .querySelectorAll(".nav-item")
      .forEach((item) => item.classList.remove("active"));

    document.getElementById("calendarModal").classList.remove("show");

    // 画面再描画を呼び出し元に通知
    if (onDateSelectCallback) {
      onDateSelectCallback(dateStr);
    }
  });

  gridEl.appendChild(cell);
}

/* =========================
   1週間バー（weekStrip）の描画
========================= */
export function renderWeekStrip() {
  const stripEl = document.getElementById("weekStrip");
  if (!stripEl) return;
  stripEl.innerHTML = "";

  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = formatDate(d);
    const dayName = dayNames[d.getDay()];
    const dayNum = d.getDate();

    const item = document.createElement("div");
    item.className = "week-strip-item";
    if (dateStr === state.selectedDateFilter) {
      item.classList.add("selected");
    }

    const hasTask = state.tasks.some((task) => task.date === dateStr);

    let html = `
      <span class="ws-dayname">${dayName}</span>
      <span class="ws-daynum">${dayNum}</span>
    `;
    if (hasTask) {
      html += `<span class="ws-dot"></span>`;
    }
    item.innerHTML = html;

    item.addEventListener("click", () => {
      if (state.selectedDateFilter === dateStr) {
        state.selectedDateFilter = null;
        state.currentFilter = "week";
      } else {
        state.selectedDateFilter = dateStr;
        state.currentFilter = "date";
      }

      renderWeekStrip();

      // 画面再描画を呼び出し元に通知
      if (onDateSelectCallback) {
        onDateSelectCallback(state.selectedDateFilter);
      }
    });

    stripEl.appendChild(item);
  }
}

/* =========================
   カレンダー関連のイベント初期化
========================= */
export function initCalendarEvents() {
  const calPrevBtn = document.getElementById("calPrevMonth");
  const calNextBtn = document.getElementById("calNextMonth");
  const openCalBtn = document.getElementById("openCalendarModal");
  const calendarModal = document.getElementById("calendarModal");

  calPrevBtn.addEventListener("click", () => {
    state.calCurrentMonth--;
    if (state.calCurrentMonth < 0) {
      state.calCurrentMonth = 11;
      state.calCurrentYear--;
    }
    renderMonthCalendar();
  });

  calNextBtn.addEventListener("click", () => {
    state.calCurrentMonth++;
    if (state.calCurrentMonth > 11) {
      state.calCurrentMonth = 0;
      state.calCurrentYear++;
    }
    renderMonthCalendar();
  });

  openCalBtn.addEventListener("click", () => {
    if (state.selectedDateFilter) {
      const parts = state.selectedDateFilter.split("-");
      state.calCurrentYear = Number(parts[0]);
      state.calCurrentMonth = Number(parts[1]) - 1;
    }
    renderMonthCalendar();
    calendarModal.classList.add("show");
  });

  calendarModal.addEventListener("click", (e) => {
    if (e.target === calendarModal) {
      calendarModal.classList.remove("show");
    }
  });
}