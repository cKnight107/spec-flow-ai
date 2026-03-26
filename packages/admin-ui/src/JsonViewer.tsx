import type { JsonViewerProps } from "./types";

export function JsonViewer({ value, title = "结构定义", caption = "只读" }: JsonViewerProps) {
  return (
    <div className="json-viewer">
      <div className="json-viewer-header">
        <strong>{title}</strong>
        <span>{caption}</span>
      </div>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}
