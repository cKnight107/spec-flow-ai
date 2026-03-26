"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { consoleNavItems } from "./navigation";

type ConsoleLayoutProps = {
  children: ReactNode;
  publicConfig: Readonly<{
    NEXT_PUBLIC_APP_ENV: string;
    NEXT_PUBLIC_CONSOLE_TITLE: string;
    NEXT_PUBLIC_API_BASE_URL: string;
  }>;
};

type ThemeMode = "light" | "dark";

const SIDEBAR_DEFAULT_WIDTH = 196;
const SIDEBAR_MIN_WIDTH = 176;
const SIDEBAR_MAX_WIDTH = 320;

function clampSidebarWidth(width: number) {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width));
}

export function ConsoleLayout({ children, publicConfig }: ConsoleLayoutProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [isSidebarResizing, setIsSidebarResizing] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("admin-console-theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const nextTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : systemTheme;
    setTheme(nextTheme);

    const savedSidebarState = window.localStorage.getItem("admin-console-sidebar-collapsed");
    setIsSidebarCollapsed(savedSidebarState === "true");

    const savedSidebarWidth = Number(window.localStorage.getItem("admin-console-sidebar-width"));
    if (Number.isFinite(savedSidebarWidth) && savedSidebarWidth > 0) {
      setSidebarWidth(clampSidebarWidth(savedSidebarWidth));
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("admin-console-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("admin-console-sidebar-collapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    window.localStorage.setItem("admin-console-sidebar-width", String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isSidebarResizing) {
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      setSidebarWidth(clampSidebarWidth(event.clientX - 14));
    };

    const stopResizing = () => {
      setIsSidebarResizing(false);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResizing);

    return () => {
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResizing);
    };
  }, [isSidebarResizing]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((currentState) => !currentState);
  };

  const startSidebarResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isSidebarCollapsed) {
      return;
    }

    event.preventDefault();
    setIsSidebarResizing(true);
  };

  const shellStyle = {
    "--sidebar-width-current": `${sidebarWidth}px`,
  } as CSSProperties & Record<"--sidebar-width-current", string>;

  return (
    <div
      className={`app-shell${isSidebarCollapsed ? " sidebar-collapsed" : ""}${isSidebarResizing ? " sidebar-resizing" : ""}`}
      style={shellStyle}
    >
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-block">
            <div className="brand-mark">AI</div>
            <div className="brand-copy">
              {/* <p className="eyebrow">Enterprise Control Plane</p> */}
              <h1>{publicConfig.NEXT_PUBLIC_CONSOLE_TITLE}</h1>
            </div>
          </div>
          <button
            aria-label={isSidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
            aria-pressed={isSidebarCollapsed}
            className="sidebar-toggle"
            onClick={toggleSidebar}
            type="button"
          >
            <span>{isSidebarCollapsed ? ">" : "<"}</span>
          </button>
        </div>
        <div className="sidebar-section">
          <p className="section-label">环境</p>
          <div className="environment-card">
            <span className="status-dot online" />
            <div className="sidebar-copy">
              <strong>生产环境</strong>
              <p>华东区域 / 平台治理空间</p>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {consoleNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                aria-label={item.label}
                className={`nav-link${isActive ? " active" : ""}`}
                href={item.href}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <span className="nav-label">{isSidebarCollapsed ? item.label.slice(0, 2) : item.label}</span>
                <small className="nav-hint">{item.hint}</small>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-section">
          <p className="section-label">角色</p>
          <div className="role-chips">
            <span className="role-chip">平台管理员</span>
            <span className="role-chip">应用管理员</span>
            <span className="role-chip">审计人员</span>
          </div>
        </div>
        <div
          aria-label="调整侧边栏宽度"
          aria-orientation="vertical"
          className="sidebar-resize-handle"
          onPointerDown={startSidebarResize}
          role="separator"
        />
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-search">
            <div className="topbar-kicker">
              {/* <p className="section-label">Control Plane</p> */}
              <strong>治理控制台</strong>
            </div>
            <input aria-label="全局搜索" placeholder="搜索应用、模型、知识库或链路 ID" readOnly />
          </div>
          <div className="topbar-actions">
            <div className="topbar-meta">
              <span className="topbar-status">Production</span>
              <button
                aria-label={theme === "light" ? "切换到深色模式" : "切换到浅色模式"}
                aria-pressed={theme === "dark"}
                className={`theme-toggle ${theme}`}
                onClick={toggleTheme}
                type="button"
              >
                <span className="theme-toggle-track">
                  <span className="theme-toggle-thumb" />
                </span>
                <span>{theme === "light" ? "浅色" : "深色"}</span>
              </button>
            </div>
            <button className="ghost-button" type="button">
              快捷新建
            </button>
            <button className="ghost-button" type="button">
              待审批 6
            </button>
            <div className="user-pill">
              <span className="avatar">CK</span>
              <div>
                <strong>Chen Kai</strong>
                {/* <p>Platform Owner</p> */}
              </div>
            </div>
          </div>
        </header>
        <section className="page-root">{children}</section>
      </main>
    </div>
  );
}
