import React from "react";

interface MarkdownFormatterProps {
  text: string;
}

export default function MarkdownFormatter({ text }: MarkdownFormatterProps) {
  if (!text) return null;

  // Split text by lines to parse structure
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let listType: "bullet" | "number" | null = null;
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const flushList = (key: string | number) => {
    if (currentList.length > 0) {
      if (listType === "bullet") {
        elements.push(
          <ul key={`list-${key}`} className="list-disc pl-5 space-y-1 my-2 text-slate-300">
            {...currentList}
          </ul>
        );
      } else if (listType === "number") {
        elements.push(
          <ol key={`list-${key}`} className="list-decimal pl-5 space-y-1 my-2 text-slate-300">
            {...currentList}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  lines.forEach((line, index) => {
    // Handle Code Blocks
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <pre key={`code-${index}`} className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto my-3 leading-relaxed">
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        // Start code block
        flushList(index);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Handle Headings (e.g. ### Title)
    if (line.startsWith("### ")) {
      flushList(index);
      elements.push(
        <h4 key={index} className="text-sm font-extrabold text-emerald-400 mt-4 mb-2 tracking-tight">
          {renderInlineStyles(line.slice(4))}
        </h4>
      );
      return;
    }
    if (line.startsWith("## ")) {
      flushList(index);
      elements.push(
        <h3 key={index} className="text-base font-black text-emerald-400 mt-4 mb-2 tracking-tight">
          {renderInlineStyles(line.slice(3))}
        </h3>
      );
      return;
    }
    if (line.startsWith("# ")) {
      flushList(index);
      elements.push(
        <h2 key={index} className="text-lg font-black text-emerald-400 mt-5 mb-2.5 tracking-tight">
          {renderInlineStyles(line.slice(2))}
        </h2>
      );
      return;
    }

    // Handle Bullet points
    if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
      if (listType !== "bullet") {
        flushList(index);
        listType = "bullet";
      }
      const itemText = line.replace(/^[\s]*[\*\-]\s+/, "");
      currentList.push(
        <li key={`li-${index}`} className="leading-relaxed">
          {renderInlineStyles(itemText)}
        </li>
      );
      return;
    }

    // Handle Numbered lists
    if (/^\s*\d+\.\s+/.test(line)) {
      if (listType !== "number") {
        flushList(index);
        listType = "number";
      }
      const itemText = line.replace(/^\s*\d+\.\s+/, "");
      currentList.push(
        <li key={`li-${index}`} className="leading-relaxed">
          {renderInlineStyles(itemText)}
        </li>
      );
      return;
    }

    // Standard empty line
    if (!line.trim()) {
      flushList(index);
      return;
    }

    // Standard text line
    flushList(index);
    elements.push(
      <p key={index} className="leading-relaxed text-slate-300 my-1">
        {renderInlineStyles(line)}
      </p>
    );
  });

  // Flush any final list elements
  flushList("final");

  return <div className="space-y-2 text-xs md:text-sm">{elements}</div>;
}

function renderInlineStyles(text: string) {
  // Matches markdown bold "**text**" and inline code "`code`"
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-extrabold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={idx} className="bg-slate-950 text-emerald-400 font-mono px-1.5 py-0.5 rounded text-[11px] border border-slate-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
