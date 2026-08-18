const STORAGE_KEYS = {
  regexItems: "regexItems",
  checkedRegexIds: "checkedRegexIds",
  htmlToMarkdown: "htmlToMarkdown"
};

const regexListElement = document.querySelector("#regex-list");
const emptyMessageElement = document.querySelector("#empty-message");
const htmlToMarkdownElement = document.querySelector("#html-to-markdown");
const runButton = document.querySelector("#run-button");
const openOptionsButton = document.querySelector("#open-options");
const statusElement = document.querySelector("#status");

let regexItems = [];

init();

async function init() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.regexItems,
    STORAGE_KEYS.checkedRegexIds,
    STORAGE_KEYS.htmlToMarkdown
  ]);

  regexItems = stored[STORAGE_KEYS.regexItems] ?? [];
  const checkedRegexIds = new Set(stored[STORAGE_KEYS.checkedRegexIds] ?? []);
  htmlToMarkdownElement.checked = Boolean(stored[STORAGE_KEYS.htmlToMarkdown]);

  renderRegexList(checkedRegexIds);

  htmlToMarkdownElement.addEventListener("change", savePopupState);
  runButton.addEventListener("click", runProcessing);
  openOptionsButton.addEventListener("click", () => chrome.runtime.openOptionsPage());
}

function renderRegexList(checkedRegexIds) {
  regexListElement.replaceChildren();
  emptyMessageElement.hidden = regexItems.length !== 0;

  for (const item of regexItems) {
    const label = document.createElement("label");
    label.className = "check-row";
    label.title = formatRegexTitle(item);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.regexId = item.id;
    checkbox.checked = checkedRegexIds.has(item.id);
    checkbox.addEventListener("change", savePopupState);

    const name = document.createElement("span");
    name.textContent = item.name;

    label.append(checkbox, name);
    regexListElement.append(label);
  }
}

function formatRegexTitle(item) {
  const flags = item.flags || "";
  return `/${item.pattern}/${flags} → ${item.replacement ?? ""}`;
}

async function savePopupState() {
  const checkedRegexIds = [...document.querySelectorAll("input[data-regex-id]:checked")]
    .map((element) => element.dataset.regexId);

  await chrome.storage.local.set({
    [STORAGE_KEYS.checkedRegexIds]: checkedRegexIds,
    [STORAGE_KEYS.htmlToMarkdown]: htmlToMarkdownElement.checked
  });
}

async function runProcessing() {
  runButton.disabled = true;
  statusElement.textContent = "処理中…";

  try {
    await savePopupState();

    const checkedIds = new Set(
      [...document.querySelectorAll("input[data-regex-id]:checked")]
        .map((element) => element.dataset.regexId)
    );

    const selectedItems = regexItems.filter((item) => checkedIds.has(item.id));
    const clipboard = await readClipboardPayload();

    let content = clipboard.content;
    let outputType = clipboard.type;

    if (clipboard.type === "html" && htmlToMarkdownElement.checked) {
      if (typeof TurndownService !== "function") {
        throw new Error("Markdown変換ライブラリを読み込めませんでした。");
      }
      const turndown = new TurndownService({
        headingStyle: "atx",
        bulletListMarker: "-",
        codeBlockStyle: "fenced"
      });
      content = turndown.turndown(content);
      outputType = "text";
    }

    for (const item of selectedItems) {
      const regex = new RegExp(item.pattern, item.flags ?? "g");
      content = content.replace(regex, item.replacement ?? "");
    }

    await writeClipboardPayload(content, outputType);
    statusElement.textContent = `完了: ${selectedItems.length}件の正規表現を適用しました。`;
  } catch (error) {
    console.error(error);
    statusElement.textContent = `エラー: ${error.message}`;
  } finally {
    runButton.disabled = false;
  }
}
