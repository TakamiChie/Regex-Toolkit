const STORAGE_KEY = "regexItems";

const nameInput = document.querySelector("#regex-name");
const patternInput = document.querySelector("#regex-pattern");
const replacementInput = document.querySelector("#regex-replacement");
const flagsInput = document.querySelector("#regex-flags");
const saveButton = document.querySelector("#save-regex");
const cancelButton = document.querySelector("#cancel-edit");
const editorTitle = document.querySelector("#editor-title");
const editorStatus = document.querySelector("#editor-status");
const listElement = document.querySelector("#saved-regex-list");
const emptyMessage = document.querySelector("#options-empty-message");

let regexItems = [];
let editingId = null;

init();

async function init() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  regexItems = stored[STORAGE_KEY] ?? [];
  renderList();

  saveButton.addEventListener("click", saveRegex);
  cancelButton.addEventListener("click", resetEditor);
}

async function saveRegex() {
  const name = nameInput.value.trim();
  const pattern = patternInput.value;
  const replacement = replacementInput.value;
  const flags = flagsInput.value.trim();

  if (!name) {
    editorStatus.textContent = "名前を入力してください。";
    return;
  }

  if (!pattern) {
    editorStatus.textContent = "正規表現を入力してください。";
    return;
  }

  try {
    new RegExp(pattern, flags);
  } catch (error) {
    editorStatus.textContent = `正規表現エラー: ${error.message}`;
    return;
  }

  if (editingId) {
    regexItems = regexItems.map((item) => item.id === editingId
      ? { ...item, name, pattern, replacement, flags }
      : item
    );
  } else {
    regexItems.push({
      id: crypto.randomUUID(),
      name,
      pattern,
      replacement,
      flags
    });
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: regexItems });
  editorStatus.textContent = editingId ? "更新しました。" : "追加しました。";
  resetEditor({ preserveStatus: true });
  renderList();
}

function renderList() {
  listElement.replaceChildren();
  emptyMessage.hidden = regexItems.length !== 0;

  regexItems.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "regex-card";

    const heading = document.createElement("div");
    heading.className = "regex-card-heading";

    const title = document.createElement("strong");
    title.textContent = item.name;

    const order = document.createElement("span");
    order.className = "muted";
    order.textContent = `${index + 1}`;

    heading.append(order, title);

    const pattern = document.createElement("code");
    pattern.textContent = `/${item.pattern}/${item.flags ?? ""}`;

    const replacement = document.createElement("div");
    replacement.className = "replacement-preview";
    replacement.textContent = `置換: ${item.replacement ?? ""}`;

    const actions = document.createElement("div");
    actions.className = "actions compact";

    const upButton = createButton("↑", () => moveItem(index, -1), index === 0);
    const downButton = createButton("↓", () => moveItem(index, 1), index === regexItems.length - 1);
    const editButton = createButton("編集", () => startEdit(item));
    const deleteButton = createButton("削除", () => deleteItem(item.id), false, "danger");

    actions.append(upButton, downButton, editButton, deleteButton);
    card.append(heading, pattern, replacement, actions);
    listElement.append(card);
  });
}

function createButton(text, handler, disabled = false, className = "secondary") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.disabled = disabled;
  button.addEventListener("click", handler);
  return button;
}

function startEdit(item) {
  editingId = item.id;
  editorTitle.textContent = "正規表現を編集";
  saveButton.textContent = "更新";
  cancelButton.hidden = false;

  nameInput.value = item.name;
  patternInput.value = item.pattern;
  replacementInput.value = item.replacement ?? "";
  flagsInput.value = item.flags ?? "";
  editorStatus.textContent = "";

  nameInput.focus();
}

function resetEditor(options = {}) {
  editingId = null;
  editorTitle.textContent = "正規表現を追加";
  saveButton.textContent = "追加";
  cancelButton.hidden = true;

  nameInput.value = "";
  patternInput.value = "";
  replacementInput.value = "";
  flagsInput.value = "g";

  if (!options.preserveStatus) {
    editorStatus.textContent = "";
  }
}

async function deleteItem(id) {
  regexItems = regexItems.filter((item) => item.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEY]: regexItems });

  const stored = await chrome.storage.local.get("checkedRegexIds");
  const checkedRegexIds = (stored.checkedRegexIds ?? []).filter((checkedId) => checkedId !== id);
  await chrome.storage.local.set({ checkedRegexIds });

  if (editingId === id) {
    resetEditor();
  }

  renderList();
}

async function moveItem(index, delta) {
  const targetIndex = index + delta;
  if (targetIndex < 0 || targetIndex >= regexItems.length) {
    return;
  }

  [regexItems[index], regexItems[targetIndex]] = [regexItems[targetIndex], regexItems[index]];
  await chrome.storage.local.set({ [STORAGE_KEY]: regexItems });
  renderList();
}
