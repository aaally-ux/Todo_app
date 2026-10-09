// js/state.js
import { loadTasks, saveTasks } from './storage.js';

// 状態オブジェクト
export const state = {
  tasks: loadTasks(),
  currentFilter: "memo",
  currentCategory: null,
  selectedTaskId: null,
  selectedDateFilter: null,
  calCurrentYear: new Date().getFullYear(),
  calCurrentMonth: new Date().getMonth()
};

// データを変更するときはstateを更新して自動保存
export function updateTasks(newTasks) {
  state.tasks = newTasks;
  saveTasks(state.tasks);
}