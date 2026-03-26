import type { ReactNode } from "react";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export type SearchFilterBarProps = {
  chips: string[];
  title?: string;
  description?: string;
};

export type StatusBadgeProps = {
  tone: StatusTone;
  children: ReactNode;
};

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
};

export type JsonViewerProps = {
  value: unknown;
  title?: string;
  caption?: string;
};

export type ApprovalBannerProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export type TimelineItem = {
  node: string;
  status: string;
  tone: StatusTone;
  time: string;
  desc: string;
};

export type ToolExecutionTimelineProps = {
  items: TimelineItem[];
};
