import type { Metadata } from "next";
import type { ReactNode } from "react";
import { publicConfig } from "../lib/public-config";
import "./globals.css";

export const metadata: Metadata = {
  title: publicConfig.WEB_TITLE,
  description: "企业 AI 中台后台管理控制台",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        data-api-base-url={publicConfig.NEXT_PUBLIC_API_BASE_URL}
        data-app-env={publicConfig.NEXT_PUBLIC_APP_ENV}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = window.localStorage.getItem("admin-console-theme");
                  var systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                  var theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : systemTheme;
                  document.documentElement.dataset.theme = theme;
                  document.documentElement.style.colorScheme = theme;
                } catch (error) {}
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
