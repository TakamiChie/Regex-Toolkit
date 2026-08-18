async function readClipboardPayload() {
  if (navigator.clipboard?.read) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes("text/html")) {
          const blob = await item.getType("text/html");
          return {
            type: "html",
            content: await blob.text()
          };
        }
      }

      for (const item of items) {
        if (item.types.includes("text/plain")) {
          const blob = await item.getType("text/plain");
          return {
            type: "text",
            content: await blob.text()
          };
        }
      }
    } catch (error) {
      console.warn("navigator.clipboard.read() failed; trying readText().", error);
    }
  }

  const text = await navigator.clipboard.readText();
  return {
    type: "text",
    content: text
  };
}

async function writeClipboardPayload(content, sourceType) {
  if (sourceType === "html" && navigator.clipboard?.write && window.ClipboardItem) {
    const htmlBlob = new Blob([content], { type: "text/html" });
    const plainText = htmlToPlainText(content);
    const textBlob = new Blob([plainText], { type: "text/plain" });
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": htmlBlob,
        "text/plain": textBlob
      })
    ]);
    return;
  }

  await navigator.clipboard.writeText(content);
}

function htmlToPlainText(html) {
  const documentObject = new DOMParser().parseFromString(html, "text/html");
  return documentObject.body.textContent ?? "";
}
