import { getToday, getTomorrow, getDateAfter } from './utils.js';

const STORAGE_KEY = "myTodoTasks";

// 初回起動時やLocalStorageが空のときに使う初期タスク
const initialTasks = [
  {
    id: 1,
    title: "朝のランニング",
    category: "プライベート",
    date: getToday(),
    time: "07:00",
    priority: "medium",
    completed: false,
    memo: "",
  },
  {
    id: 2,
    title: "メールを確認する",
    category: "仕事",
    date: getToday(),
    time: "09:00",
    priority: "high",
    completed: false,
    memo: "",
  },
  {
    id: 3,
    title: "仕事の報告書を作成",
    category: "仕事",
    date: getToday(),
    time: "13:00",
    priority: "high",
    completed: false,
    memo: "午後までに完成させる。提出先のフォーマットや上長への確認事項を忘れずにチェックする。",
  },
  {
    id: 4,
    title: "本を読む",
    category: "プライベート",
    date: getToday(),
    time: "22:00",
    priority: "low",
    completed: false,
    memo: "",
  },
  {
    id: 5,
    title: "会議に出席",
    category: "仕事",
    date: getTomorrow(),
    time: "13:00",
    priority: "high",
    completed: false,
    memo: "",
  },
  {
    id: 6,
    title: "仕事の報告書を確認",
    category: "仕事",
    date: getTomorrow(),
    time: "10:00",
    priority: "medium",
    completed: false,
    memo: "",
  },
  {
    id: 7,
    title: "家族に電話する",
    category: "プライベート",
    date: getDateAfter(2),
    time: "19:00",
    priority: "low",
    completed: false,
    memo: "",
  },
  {
    id: 8,
    title: "JavaScriptの勉強",
    category: "勉強",
    date: getDateAfter(3),
    time: "20:00",
    priority: "medium",
    completed: false,
    memo: "DOM操作について勉強。イベントリスナーやローカルストレージの活用方法を深掘りする。",
  },
];

/* =========================
   LocalStorage 読み書き
========================= */

// 保存されたタスクを取得（未保存なら初期タスクを返す）
export function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialTasks;
  } catch (err) {
    console.error("LocalStorageの読み込みに失敗しました:", err);
    return initialTasks;
  }
}

// タスクをLocalStorageへ保存
export function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error("LocalStorageへの保存に失敗しました:", err);
  }
}

/* =========================
   バックアップ機能（エクスポート & インポート）
========================= */

// JSONファイルとして書き出しダウンロード
export function exportTasksAsJSON(tasks) {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(tasks, null, 2));
  const downloadAnchor = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);

  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `mytodo_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// JSONファイルからタスクを読み込む（成功時にonSuccessコールバックを実行）
export function importTasksFromJSON(file, onSuccess) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      if (Array.isArray(importedData)) {
        if (
          confirm(
            `移行データから ${importedData.length} 件のタスクを読み込みます。現在のデータに上書きしますか？`
          )
        ) {
          saveTasks(importedData);
          if (typeof onSuccess === "function") {
            onSuccess(importedData);
          }
          alert("バックアップの復元が完了しました！");
        }
      } else {
        alert("ファイルの形式が正しくありません。");
      }
    } catch (err) {
      alert("JSONファイルの解析に失敗しました。");
    }
  };
  reader.readAsText(file);
}

// エクスポート・インポートのイベントリスナー初期化
export function initBackupEvents(getCurrentTasks, onImportSuccess) {
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importFile = document.getElementById("importFile");

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const currentTasks = getCurrentTasks();
      exportTasksAsJSON(currentTasks);
    });
  }

  if (importBtn && importFile) {
    importBtn.addEventListener("click", () => {
      importFile.click();
    });

    importFile.addEventListener("change", (event) => {
      const file = event.target.files[0];
      importTasksFromJSON(file, onImportSuccess);
      event.target.value = "";
    });
  }
}