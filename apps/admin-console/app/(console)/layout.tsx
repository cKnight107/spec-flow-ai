import type { ReactNode } from "react";
import { ConsoleLayout } from "../../lib/consoleLayout";
import { publicConfig } from "../../lib/public-config";

export default function ConsoleRouteLayout({ children }: { children: ReactNode }) {
  return <ConsoleLayout publicConfig={publicConfig}>{children}</ConsoleLayout>;
}
