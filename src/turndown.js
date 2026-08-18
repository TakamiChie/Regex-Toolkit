class TurndownService {
  constructor(options = {}) {
    this.options = options;
  }

  turndown(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return this.convertChildren(doc.body).replace(/\n{3,}/g, "\n\n").trim();
  }

  convertChildren(node) {
    return [...node.childNodes].map((child) => this.convertNode(child)).join("");
  }

  convertNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue ?? "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName.toLowerCase();
    const content = this.convertChildren(node);

    if (/^h[1-6]$/.test(tag)) {
      return `${"#".repeat(Number(tag[1]))} ${content.trim()}\n\n`;
    }

    if (tag === "p" || tag === "div" || tag === "section" || tag === "article") {
      return `${content.trim()}\n\n`;
    }

    if (tag === "br") {
      return "  \n";
    }

    if (tag === "strong" || tag === "b") {
      return `**${content}**`;
    }

    if (tag === "em" || tag === "i") {
      return `*${content}*`;
    }

    if (tag === "del" || tag === "s" || tag === "strike") {
      return `~~${content}~~`;
    }

    if (tag === "code" && node.parentElement?.tagName.toLowerCase() !== "pre") {
      return `\`${content.replace(/`/g, "\\`")}\``;
    }

    if (tag === "pre") {
      const language = node.querySelector("code")?.className.match(/language-([\w-]+)/)?.[1] ?? "";
      const text = node.textContent ?? "";
      return `\n\`\`\`${language}\n${text.replace(/\n$/, "")}\n\`\`\`\n\n`;
    }

    if (tag === "a") {
      const href = node.getAttribute("href") ?? "";
      return href ? `[${content || href}](${href})` : content;
    }

    if (tag === "img") {
      const src = node.getAttribute("src") ?? "";
      const alt = node.getAttribute("alt") ?? "";
      return src ? `![${alt}](${src})` : "";
    }

    if (tag === "blockquote") {
      return `${content.trim().split("\n").map((line) => `> ${line}`).join("\n")}\n\n`;
    }

    if (tag === "ul" || tag === "ol") {
      const ordered = tag === "ol";
      const items = [...node.children]
        .filter((child) => child.tagName.toLowerCase() === "li")
        .map((child, index) => {
          const marker = ordered ? `${index + 1}.` : (this.options.bulletListMarker ?? "-");
          const itemText = this.convertChildren(child).trim().replace(/\n/g, "\n  ");
          return `${marker} ${itemText}`;
        });
      return `${items.join("\n")}\n\n`;
    }

    if (tag === "li") {
      return content;
    }

    if (tag === "hr") {
      return "\n---\n\n";
    }

    if (tag === "table") {
      return this.convertTable(node);
    }

    return content;
  }

  convertTable(table) {
    const rows = [...table.querySelectorAll("tr")].map((row) =>
      [...row.children].filter((cell) => /^(TH|TD)$/.test(cell.tagName)).map((cell) => this.convertChildren(cell).trim())
    ).filter((row) => row.length > 0);

    if (rows.length === 0) {
      return "";
    }

    const width = Math.max(...rows.map((row) => row.length));
    const normalized = rows.map((row) => [...row, ...Array(width - row.length).fill("")]);
    const header = normalized[0];
    const body = normalized.slice(1);
    const line = (cells) => `| ${cells.map((cell) => cell.replace(/\|/g, "\\|")).join(" | ")} |`;
    return `${line(header)}\n${line(header.map(() => "---"))}\n${body.map(line).join("\n")}\n\n`;
  }
}
