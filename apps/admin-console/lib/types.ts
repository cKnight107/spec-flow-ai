import type { StatusTone } from "@enterprise-ai-hub/admin-ui";
import type { ReactNode } from "react";

export type MetricItem = {
  label: string;
  value: string;
  trend: string;
  note: string;
};

export type TimelineItem = {
  node: string;
  status: string;
  tone: StatusTone;
  time: string;
  desc: string;
};

export type AppListItem = {
  name: string;
  desc: string;
  owner: string;
  bindings: string;
  status: string;
  statusTone: StatusTone;
  release: string;
  risk: string;
};

export type NavItem = {
  href: string;
  label: string;
  hint: string;
};

export type ConsolePageData = {
  title: string;
  description: string;
  hero?: ReactNode;
  content: ReactNode;
};
