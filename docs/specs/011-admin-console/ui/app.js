const routes = [
  { id: "dashboard", label: "仪表盘", hint: "总览" },
  { id: "apps", label: "应用中心", hint: "23" },
  { id: "app-detail", label: "应用详情", hint: "绑定" },
  { id: "model-detail", label: "模型中心", hint: "路由" },
  { id: "knowledge-detail", label: "知识中心", hint: "导入" },
  { id: "tools", label: "工具中心", hint: "Schema" },
  { id: "workflows", label: "工作流", hint: "运行" },
  { id: "promptops", label: "PromptOps", hint: "Playground" },
  { id: "governance", label: "审计与审批", hint: "风险" },
  { id: "observability", label: "观测与成本", hint: "链路" },
  { id: "access", label: "权限治理", hint: "占位" },
];

const stateOptions = [
  { id: "default", label: "正常态" },
  { id: "loading", label: "加载中" },
  { id: "empty", label: "空态" },
  { id: "error", label: "异常态" },
  { id: "forbidden", label: "无权限" },
  { id: "approval", label: "审批中" },
];

const store = {
  route: getInitialRoute(),
  viewState: "default",
};

const pageRoot = document.querySelector("#page-root");
const sidebarNav = document.querySelector("#sidebar-nav");
const stateSwitcher = document.querySelector("#state-switcher");
const drawer = document.querySelector("#side-drawer");
const drawerTitle = document.querySelector("#drawer-title");
const drawerBody = document.querySelector("#drawer-body");
const drawerClose = document.querySelector("#drawer-close");

const appListRows = [
  {
    name: "制度问答助手",
    desc: "绑定 HR handbook / GPT-4.1 / FAQ 工具",
    owner: "人力数字化",
    bindings: "1 模型 / 2 知识库 / 1 工具",
    status: "已发布",
    statusTone: "success",
    release: "2026-03-12 18:40",
    risk: "低风险",
  },
  {
    name: "销售作战助手",
    desc: "灰度发布中，启用审批回写",
    owner: "销售运营",
    bindings: "2 模型 / 1 工作流 / 3 工具",
    status: "审批中",
    statusTone: "warning",
    release: "2026-03-13 09:10",
    risk: "需审批",
  },
  {
    name: "IT 运维 Copilot",
    desc: "接入告警工具与 SOP 知识库",
    owner: "基础架构",
    bindings: "1 模型 / 1 知识库 / 2 工具",
    status: "草稿",
    statusTone: "neutral",
    release: "未发布",
    risk: "中风险",
  },
];

const traces = [
  { node: "权限校验", status: "通过", tone: "success", time: "12ms", desc: "命中平台管理员策略集" },
  { node: "知识检索", status: "完成", tone: "success", time: "148ms", desc: "召回 12 篇文档，重排后保留 5 篇" },
  { node: "工具调用", status: "审批挂起", tone: "warning", time: "2m 12s", desc: "高风险 CRM 写入动作，等待审批人确认" },
  { node: "模型生成", status: "待执行", tone: "neutral", time: "-", desc: "审批通过后继续执行" },
];

const jsonSchema = {
  name: "crm_update_customer",
  method: "POST",
  auth: { type: "OAuth2", scope: ["crm.customer.write"] },
  input: {
    type: "object",
    required: ["customerId", "fields"],
    properties: {
      customerId: { type: "string", description: "客户主键" },
      fields: {
        type: "object",
        properties: {
          stage: { type: "string", enum: ["MQL", "SQL", "Won"] },
          owner: { type: "string" },
        },
      },
    },
  },
};

const drawerTemplates = {
  app: `
    <div class="summary-card">
      <h3>销售作战助手</h3>
      <div class="summary-list">
        <div class="summary-item"><span>当前版本</span><strong>v1.8.2</strong></div>
        <div class="summary-item"><span>负责人</span><strong>刘一帆</strong></div>
        <div class="summary-item"><span>发布渠道</span><strong>Web / 企业微信</strong></div>
        <div class="summary-item"><span>待审批项</span><strong>模型路由切换</strong></div>
      </div>
    </div>
    <div class="summary-card">
      <h3>变更摘要</h3>
      <div class="detail-matrix">
        <div class="detail-row"><span>模型</span><strong>Claude 4 Sonnet -> GPT-4.1</strong></div>
        <div class="detail-row"><span>知识库</span><strong>新增 销售政策 2026Q1</strong></div>
        <div class="detail-row"><span>风险</span><strong>命中高价值客户写入动作</strong></div>
      </div>
    </div>
  `,
  tool: `
    <div class="summary-card">
      <h3>crm_update_customer</h3>
      <div class="summary-list">
        <div class="summary-item"><span>协议</span><strong>HTTP API</strong></div>
        <div class="summary-item"><span>提供方</span><strong>CRM Gateway</strong></div>
        <div class="summary-item"><span>风险级别</span><strong>高风险</strong></div>
        <div class="summary-item"><span>最近 24h 调用</span><strong>182 次</strong></div>
      </div>
    </div>
    <div class="summary-card">
      <h3>执行失败样本</h3>
      <div class="detail-matrix">
        <div class="detail-row"><span>Trace ID</span><strong>trc_78d1bf9a</strong></div>
        <div class="detail-row"><span>失败节点</span><strong>审批超时</strong></div>
        <div class="detail-row"><span>建议动作</span><strong>重试并缩小字段范围</strong></div>
      </div>
    </div>
  `,
  trace: `
    <div class="summary-card">
      <h3>链路摘要</h3>
      <div class="summary-list">
        <div class="summary-item"><span>入口应用</span><strong>销售作战助手</strong></div>
        <div class="summary-item"><span>调用模型</span><strong>gpt-4.1</strong></div>
        <div class="summary-item"><span>工具数</span><strong>2</strong></div>
        <div class="summary-item"><span>总耗时</span><strong>3.2s</strong></div>
      </div>
    </div>
    <div class="summary-card">
      <h3>治理标签</h3>
      <div class="chip-row">
        <span class="subtle-chip">高风险审批</span>
        <span class="subtle-chip">客户数据写入</span>
        <span class="subtle-chip">需保留审计</span>
      </div>
    </div>
  `,
};

renderSidebar();
renderStateSwitcher();
renderPage();

window.addEventListener("hashchange", () => {
  store.route = getInitialRoute();
  renderSidebar();
  renderPage();
});

drawerClose.addEventListener("click", closeDrawer);
document.addEventListener("click", handleGlobalClick);

function getInitialRoute() {
  const hash = window.location.hash.replace("#", "");
  const route = routes.find((item) => item.id === hash);
  return route ? route.id : "dashboard";
}

function handleGlobalClick(event) {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    const nextRoute = routeButton.dataset.route;
    if (nextRoute) {
      window.location.hash = nextRoute;
    }
  }

  const stateButton = event.target.closest("[data-state]");
  if (stateButton) {
    store.viewState = stateButton.dataset.state;
    renderStateSwitcher();
    renderPage();
  }

  const drawerButton = event.target.closest("[data-drawer]");
  if (drawerButton) {
    openDrawer(drawerButton.dataset.drawer);
  }
}

function renderSidebar() {
  sidebarNav.innerHTML = routes
    .map(
      (item) => `
        <button class="nav-button ${item.id === store.route ? "active" : ""}" data-route="${item.id}">
          <span>${item.label}</span>
          <small>${item.hint}</small>
        </button>
      `
    )
    .join("");

  document.querySelectorAll(".quick-links button").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === store.route);
  });
}

function renderStateSwitcher() {
  stateSwitcher.innerHTML = stateOptions
    .map(
      (item) => `
        <button class="state-button ${item.id === store.viewState ? "active" : ""}" data-state="${item.id}">
          ${item.label}
        </button>
      `
    )
    .join("");
}

function renderPage() {
  renderSidebar();

  if (store.viewState === "loading") {
    pageRoot.innerHTML = loadingTemplate();
    return;
  }

  if (store.viewState === "empty") {
    pageRoot.innerHTML = emptyTemplate();
    return;
  }

  if (store.viewState === "error") {
    pageRoot.innerHTML = statusTemplate("error");
    return;
  }

  if (store.viewState === "forbidden") {
    pageRoot.innerHTML = statusTemplate("forbidden");
    return;
  }

  const renderers = {
    dashboard: renderDashboard,
    apps: renderApps,
    "app-detail": renderAppDetail,
    "model-detail": renderModelDetail,
    "knowledge-detail": renderKnowledgeDetail,
    tools: renderTools,
    workflows: renderWorkflows,
    promptops: renderPromptOps,
    governance: renderGovernance,
    observability: renderObservability,
    access: renderAccess,
  };

  const pageMarkup = renderers[store.route] ? renderers[store.route]() : renderDashboard();
  pageRoot.innerHTML = store.viewState === "approval" ? approvalWrap(pageMarkup) : pageMarkup;
}

function approvalWrap(markup) {
  return `
    ${approvalBanner({
      title: "审批占位已激活",
      desc: "当前原型模拟高风险配置变更，提交后进入审批中状态，审批通过后继续发布或执行。",
      action: "查看审批单 AP-2026-0313",
    })}
    ${markup}
  `;
}

function loadingTemplate() {
  return `
    ${pageHeader({
      eyebrow: "Loading State",
      title: "后台控制台骨架屏",
      desc: "用于验证页面在加载中的结构稳定性与视觉节奏。",
      actions: '<button class="ghost-button">取消加载</button>',
    })}
    <div class="skeleton-grid">
      <div class="skeleton-block"></div>
      <div class="skeleton-block"></div>
      <div class="skeleton-block"></div>
    </div>
    <div class="skeleton-table"></div>
  `;
}

function emptyTemplate() {
  return `
    ${pageHeader({
      eyebrow: "Empty State",
      title: "当前页面暂无可展示数据",
      desc: "用于验证空态说明、引导文案与主操作入口。",
      actions: '<button class="primary-button">从模板创建</button>',
    })}
    <section class="empty-state">
      <div class="state-visual">◇</div>
      <div>
        <h3>尚未创建资源</h3>
        <p>建议先从标准模板创建一个应用或导入一个知识库，以便验证完整主路径。</p>
      </div>
      <div class="chip-row">
        <span class="subtle-chip">模板：制度问答</span>
        <span class="subtle-chip">模板：销售 Copilot</span>
        <span class="subtle-chip">模板：IT 运维</span>
      </div>
    </section>
  `;
}

function statusTemplate(type) {
  const configs = {
    error: {
      title: "页面加载失败",
      icon: "!",
      desc: "静态原型模拟 API 失败场景，展示错误摘要、重试入口和帮助说明。",
      action: '<button class="primary-button">重试加载</button>',
    },
    forbidden: {
      title: "当前角色无访问权限",
      icon: "⛶",
      desc: "入口保持可见但页面进入权限占位态，提示申请路径和可联系角色。",
      action: '<button class="ghost-button">申请权限</button>',
    },
  };

  const config = configs[type];

  return `
    ${pageHeader({
      eyebrow: "State Preview",
      title: config.title,
      desc: config.desc,
      actions: config.action,
    })}
    <section class="status-panel">
      <div class="state-visual">${config.icon}</div>
      <div>
        <h3>${config.title}</h3>
        <p>${config.desc}</p>
      </div>
      <div class="chip-row">
        <span class="subtle-chip">Trace: trc_preview_001</span>
        <span class="subtle-chip">角色：审计人员</span>
        <span class="subtle-chip">建议：联系平台管理员</span>
      </div>
    </section>
  `;
}

function renderDashboard() {
  return `
    ${heroHeader("企业 AI 中台运营看板", "面向平台管理员的一屏总览，聚焦请求、成本、审批和风险事件。")}
    <section class="metrics-grid">
      ${metricCard("在线应用", "23", "+3 本周", "所有业务入口")}
      ${metricCard("模型调用量", "1.24M", "+12.8%", "近 7 天")}
      ${metricCard("导入任务", "48", "6 个失败", "知识处理流水线")}
      ${metricCard("待审批", "6", "2 个高风险", "发布与写入动作")}
      ${metricCard("异常告警", "4", "1 个升级", "工具与链路监控")}
    </section>
    <section class="insight-grid">
      <article class="insight-card">
        <h3>今日重点</h3>
        <div class="insight-list">
          <div class="insight-item"><span>销售作战助手</span><strong>等待 CRM 写入审批</strong></div>
          <div class="insight-item"><span>财务知识库</span><strong>导入任务失败率 18%</strong></div>
          <div class="insight-item"><span>gpt-4.1 路由组</span><strong>Token 成本较昨日 +21%</strong></div>
        </div>
      </article>
      <article class="insight-card">
        <h3>待处理审批</h3>
        <div class="insight-list">
          <div class="insight-item"><span>模型切换</span><strong>AP-2026-0313</strong></div>
          <div class="insight-item"><span>工具写入权限</span><strong>AP-2026-0311</strong></div>
          <div class="insight-item"><span>发布回滚</span><strong>AP-2026-0308</strong></div>
        </div>
      </article>
      <article class="insight-card">
        <h3>快捷入口</h3>
        <div class="chip-row">
          <button class="quick-links" data-route="apps">应用配置</button>
          <button class="quick-links" data-route="model-detail">模型路由</button>
          <button class="quick-links" data-route="governance">审批中心</button>
        </div>
      </article>
    </section>
    <section class="content-grid">
      <div class="table-card">
        <div class="table-toolbar">
          <div>
            <p class="section-label">Recent Activity</p>
            <h3>最近访问资源</h3>
          </div>
          <div class="chip-row">
            <span class="subtle-chip">组织：AI 平台</span>
            <span class="subtle-chip">区域：华东</span>
          </div>
        </div>
        ${dataTable(
          ["资源", "类型", "负责人", "状态", "最后操作"],
          [
            ["销售作战助手", "应用", "刘一帆", statusBadge("审批中", "warning"), "10 分钟前"],
            ["crm_update_customer", "工具", "陈晨", statusBadge("高风险", "danger"), "18 分钟前"],
            ["财务制度库", "知识库", "韩璐", statusBadge("失败重试", "warning"), "42 分钟前"],
          ]
        )}
      </div>
      <aside class="summary-card">
        <h3>原型范围提醒</h3>
        <div class="summary-list">
          <div class="summary-item"><span>静态数据</span><strong>是</strong></div>
          <div class="summary-item"><span>真实鉴权</span><strong>否</strong></div>
          <div class="summary-item"><span>审批流引擎</span><strong>占位</strong></div>
          <div class="summary-item"><span>链路图</span><strong>时间线替代</strong></div>
        </div>
      </aside>
    </section>
  `;
}

function renderApps() {
  return `
    ${pageHeader({
      eyebrow: "Application Center",
      title: "应用中心",
      desc: "统一查看应用资产、绑定关系、发布状态和负责人。",
      actions: '<button class="ghost-button">批量导出</button><button class="primary-button">新建应用</button>',
    })}
    ${searchFilterBar(["关键词：销售", "负责人：全部", "状态：已发布 / 审批中", "渠道：Web / 企业微信"])}
    <section class="table-card">
      <div class="table-toolbar">
        <div>
          <p class="section-label">Assets</p>
          <h3>应用列表</h3>
        </div>
        <div class="chip-row">
          <span class="subtle-chip">总计 23</span>
          <span class="subtle-chip">草稿 4</span>
          <span class="subtle-chip">审批中 2</span>
        </div>
      </div>
      ${dataTable(
        ["应用名称", "归属部门", "绑定关系", "状态", "最近发布", "风险"],
        appListRows.map((row) => [
          `<button class="row-link" data-route="app-detail" data-drawer="app">${row.name}<small>${row.desc}</small></button>`,
          row.owner,
          row.bindings,
          statusBadge(row.status, row.statusTone),
          row.release,
          row.risk,
        ])
      )}
    </section>
  `;
}

function renderAppDetail() {
  return `
    ${pageHeader({
      eyebrow: "Application Detail",
      title: "销售作战助手",
      desc: "应用概览、绑定资源、发布版本和反馈分析的统一入口。",
      actions:
        '<button class="ghost-button">保存草稿</button><button class="ghost-button">查看反馈</button><button class="primary-button">提交发布</button>',
    })}
    ${approvalBanner({
      title: "存在未发布变更",
      desc: "模型路由、工具鉴权和知识库版本已更新。发布前需二次确认影响范围，并按规则提交审批。",
      action: "查看变更摘要",
    })}
    <div class="tabs">
      <button class="tab-button active">概览</button>
      <button class="tab-button">基础配置</button>
      <button class="tab-button">绑定关系</button>
      <button class="tab-button">发布与版本</button>
      <button class="tab-button">反馈分析</button>
    </div>
    <section class="detail-grid">
      <article class="summary-card">
        <h3>应用摘要</h3>
        <div class="summary-list">
          <div class="summary-item"><span>负责人</span><strong>刘一帆</strong></div>
          <div class="summary-item"><span>渠道</span><strong>Web / 企业微信</strong></div>
          <div class="summary-item"><span>当前版本</span><strong>v1.8.2</strong></div>
          <div class="summary-item"><span>状态</span><strong>${statusBadge("审批中", "warning")}</strong></div>
        </div>
      </article>
      <article class="summary-card">
        <h3>绑定关系</h3>
        <div class="summary-list">
          <div class="summary-item"><span>模型</span><strong>gpt-4.1 / claude-4-sonnet</strong></div>
          <div class="summary-item"><span>知识库</span><strong>销售政策库 / 招采 FAQ</strong></div>
          <div class="summary-item"><span>工具</span><strong>CRM 写入 / 价格计算</strong></div>
          <div class="summary-item"><span>工作流</span><strong>销售线索推进流程</strong></div>
        </div>
      </article>
    </section>
    <section class="content-grid">
      <div class="table-card">
        <div class="table-toolbar">
          <div>
            <p class="section-label">Release Notes</p>
            <h3>变更摘要</h3>
          </div>
          <button class="ghost-button" data-drawer="app">打开详情抽屉</button>
        </div>
        ${dataTable(
          ["变更项", "旧值", "新值", "影响范围", "审批要求"],
          [
            ["主模型", "claude-4-sonnet", "gpt-4.1", "6 个生产渠道", "需要"],
            ["工具权限", "只读 CRM", "允许客户阶段写入", "销售团队", "需要"],
            ["知识库版本", "2025Q4", "2026Q1", "销售政策问答", "不需要"],
          ]
        )}
      </div>
      <aside class="summary-card">
        <h3>反馈摘要</h3>
        <div class="summary-list">
          <div class="summary-item"><span>近 7 天好评率</span><strong>92%</strong></div>
          <div class="summary-item"><span>引用率</span><strong>84%</strong></div>
          <div class="summary-item"><span>工具成功率</span><strong>96%</strong></div>
          <div class="summary-item"><span>主要问题</span><strong>审批等待时间长</strong></div>
        </div>
      </aside>
    </section>
  `;
}

function renderModelDetail() {
  return `
    ${pageHeader({
      eyebrow: "Model Routing",
      title: "gpt-4.1 路由策略",
      desc: "管理主备模型、灰度比例、配额和安全控制。",
      actions: '<button class="ghost-button">保存草稿</button><button class="primary-button">提交审批</button>',
    })}
    <section class="detail-grid">
      ${statePanel("主路由", "GPT-4.1", "生产流量 65% / 平均时延 1.8s")}
      ${statePanel("备路由", "Claude 4 Sonnet", "故障切换 / 高复杂度问题承接")}
      ${statePanel("灰度策略", "15%", "面向销售和客服应用灰度开放")}
      ${statePanel("降级策略", "o4-mini", "成本或故障告警触发时启用")}
    </section>
    <section class="content-grid">
      <div class="table-card">
        <div class="table-toolbar">
          <div>
            <p class="section-label">Quota</p>
            <h3>应用级配额</h3>
          </div>
          <span class="subtle-chip">影响应用数：12</span>
        </div>
        ${dataTable(
          ["应用", "部门", "QPS", "Token 配额", "告警阈值", "状态"],
          [
            ["销售作战助手", "销售运营", "30", "4.2M / 月", "80%", statusBadge("正常", "success")],
            ["制度问答助手", "人力数字化", "18", "1.4M / 月", "90%", statusBadge("正常", "success")],
            ["运营分析 Copilot", "运营平台", "10", "2.0M / 月", "70%", statusBadge("即将超限", "warning")],
          ]
        )}
      </div>
      <aside class="summary-card">
        <h3>风险提醒</h3>
        <div class="summary-list">
          <div class="summary-item"><span>高成本应用</span><strong>运营分析 Copilot</strong></div>
          <div class="summary-item"><span>需复核变更</span><strong>主备切换比例</strong></div>
          <div class="summary-item"><span>审批理由</span><strong>影响生产流量</strong></div>
        </div>
      </aside>
    </section>
  `;
}

function renderKnowledgeDetail() {
  return `
    ${pageHeader({
      eyebrow: "Knowledge Ingestion",
      title: "销售政策知识库",
      desc: "查看文档导入流水线、失败原因、权限映射和检索配置。",
      actions: '<button class="ghost-button">导出失败报告</button><button class="primary-button">新增导入任务</button>',
    })}
    <div class="tabs">
      <button class="tab-button">概览</button>
      <button class="tab-button">文档列表</button>
      <button class="tab-button active">导入任务</button>
      <button class="tab-button">权限映射</button>
      <button class="tab-button">检索配置</button>
    </div>
    <section class="trace-grid">
      <div class="timeline-card">
        <h3>ToolExecutionTimeline / 导入任务时间线</h3>
        ${timeline(traces)}
      </div>
      <aside class="summary-card">
        <h3>任务摘要</h3>
        <div class="summary-list">
          <div class="summary-item"><span>任务批次</span><strong>KB-ING-20260313-07</strong></div>
          <div class="summary-item"><span>文档数</span><strong>36</strong></div>
          <div class="summary-item"><span>成功率</span><strong>83%</strong></div>
          <div class="summary-item"><span>失败原因</span><strong>OCR 提取失败 / 权限字段缺失</strong></div>
        </div>
      </aside>
    </section>
  `;
}

function renderTools() {
  return `
    ${pageHeader({
      eyebrow: "Tool Center",
      title: "工具中心",
      desc: "展示工具定义、Schema、鉴权方式和执行记录。",
      actions: '<button class="ghost-button">导入 Schema</button><button class="primary-button">新建工具</button>',
    })}
    ${searchFilterBar(["协议：HTTP / MCP", "风险等级：高风险", "发布状态：已发布", "提供方：CRM Gateway"])}
    <section class="content-grid">
      <div class="table-card">
        <div class="table-toolbar">
          <div>
            <p class="section-label">Schema</p>
            <h3>JsonViewer / 工具定义</h3>
          </div>
          <button class="ghost-button" data-drawer="tool">查看执行摘要</button>
        </div>
        ${jsonViewer(jsonSchema)}
      </div>
      <div class="timeline-card">
        <h3>执行记录</h3>
        ${timeline([
          { node: "参数校验", status: "成功", tone: "success", time: "8ms", desc: "customerId 与 fields 校验通过" },
          { node: "权限检查", status: "成功", tone: "success", time: "15ms", desc: "命中 crm.customer.write scope" },
          { node: "审批检查", status: "待确认", tone: "warning", time: "1m 22s", desc: "高价值客户变更需销售总监审批" },
          { node: "CRM 写入", status: "未执行", tone: "neutral", time: "-", desc: "等待审批结果" },
        ])}
      </div>
    </section>
  `;
}

function renderWorkflows() {
  return `
    ${pageHeader({
      eyebrow: "Workflow Center",
      title: "工作流运行视图",
      desc: "第二阶段只交付列表、版本、运行与审批节点，不实现拖拽编排器。",
      actions: '<button class="ghost-button">查看版本</button><button class="primary-button">新建工作流</button>',
    })}
    <section class="detail-grid">
      ${statePanel("流程摘要", "销售线索推进", "12 个节点 / 2 个审批节点 / 3 个工具节点")}
      ${statePanel("当前版本", "v0.9.6", "今日 14 次运行 / 2 次失败")}
    </section>
    <section class="content-grid">
      <div class="table-card">
        <div class="table-toolbar">
          <div>
            <p class="section-label">Runs</p>
            <h3>运行记录</h3>
          </div>
          <span class="subtle-chip">失败 2 / 成功 12</span>
        </div>
        ${dataTable(
          ["运行 ID", "触发来源", "状态", "耗时", "失败节点", "操作"],
          [
            ["run_70081", "销售作战助手", statusBadge("成功", "success"), "18s", "-", "查看"],
            ["run_70077", "CRM 批处理", statusBadge("失败", "danger"), "5m 12s", "审批超时", "重试"],
            ["run_70074", "人工触发", statusBadge("运行中", "info"), "2m 31s", "-", "跟踪"],
          ]
        )}
      </div>
      <aside class="summary-card">
        <h3>审批节点</h3>
        <div class="summary-list">
          <div class="summary-item"><span>客户信息写入</span><strong>销售总监</strong></div>
          <div class="summary-item"><span>价格策略变更</span><strong>运营负责人</strong></div>
        </div>
      </aside>
    </section>
  `;
}

function renderPromptOps() {
  return `
    ${pageHeader({
      eyebrow: "PromptOps",
      title: "Playground",
      desc: "使用静态问答结果、引用面板和工具执行时间线来模拟调试体验。",
      actions: '<button class="ghost-button">版本对比</button><button class="primary-button">保存 Prompt</button>',
    })}
    <section class="content-grid">
      <div class="table-card">
        <div class="table-toolbar">
          <div>
            <p class="section-label">Prompt</p>
            <h3>输入与参数</h3>
          </div>
          <div class="chip-row">
            <span class="subtle-chip">模型：gpt-4.1</span>
            <span class="subtle-chip">温度：0.2</span>
            <span class="subtle-chip">引用：开启</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="detail-matrix">
            <div class="detail-row"><span>用户输入</span><strong>请给出销售折扣审批规则，并同步判断是否需要 CRM 写入。</strong></div>
            <div class="detail-row"><span>系统 Prompt</span><strong>你是企业销售助手，只能引用受权限控制的知识，并在写入前触发审批。</strong></div>
            <div class="detail-row"><span>预期输出</span><strong>先回答规则，再给出审批建议。</strong></div>
          </div>
        </div>
      </div>
      <aside class="summary-card">
        <h3>静态结果</h3>
        <p>折扣高于 15% 时必须经过销售总监审批；若客户阶段需要同步为 SQL，则需触发 CRM 写入审批。</p>
        <div class="chip-row">
          <span class="subtle-chip">引用：销售政策 2026Q1</span>
          <span class="subtle-chip">工具：crm_update_customer</span>
        </div>
      </aside>
    </section>
    <section class="trace-grid">
      <div class="timeline-card">
        <h3>ToolExecutionTimeline</h3>
        ${timeline([
          { node: "Prompt 组装", status: "成功", tone: "success", time: "6ms", desc: "注入系统 Prompt 与角色约束" },
          { node: "知识召回", status: "成功", tone: "success", time: "133ms", desc: "命中《销售政策 2026Q1》第 3 节" },
          { node: "工具决策", status: "成功", tone: "success", time: "31ms", desc: "识别出 CRM 写入前置审批" },
        ])}
      </div>
      <div class="json-viewer">
        <div class="json-viewer-header">
          <strong>Citation Panel / Mock</strong>
          <span>只读</span>
        </div>
        <pre>{
  "citations": [
    {
      "doc": "销售政策 2026Q1",
      "section": "3.2 折扣审批规则",
      "quote": "折扣高于 15% 时必须经过销售总监审批。"
    },
    {
      "doc": "CRM 写入守则",
      "section": "2.1 高价值客户写入",
      "quote": "涉及客户阶段变更时应触发审批并写入审计日志。"
    }
  ]
}</pre>
      </div>
    </section>
  `;
}

function renderGovernance() {
  return `
    ${pageHeader({
      eyebrow: "Governance",
      title: "审计与审批",
      desc: "统一查看审批单、风险事件和审计日志入口。",
      actions: '<button class="ghost-button">导出审计</button><button class="primary-button">创建审批规则</button>',
    })}
    ${approvalBanner({
      title: "高风险变更待审批",
      desc: "销售作战助手正在申请 CRM 客户阶段写入权限，需销售总监与平台管理员双重确认。",
      action: "进入审批中心",
    })}
    <section class="content-grid">
      <div class="table-card">
        <div class="table-toolbar">
          <div>
            <p class="section-label">Audit Log</p>
            <h3>最近审计记录</h3>
          </div>
          <div class="chip-row">
            <span class="subtle-chip">操作人：全部</span>
            <span class="subtle-chip">结果：成功 / 拒绝</span>
          </div>
        </div>
        ${dataTable(
          ["时间", "资源", "动作", "操作人", "结果", "链路"],
          [
            ["03-13 10:05", "销售作战助手", "提交发布", "刘一帆", statusBadge("待审批", "warning"), "trc_7812"],
            ["03-13 09:48", "crm_update_customer", "修改鉴权", "陈晨", statusBadge("已记录", "success"), "trc_7801"],
            ["03-13 09:15", "gpt-4.1 路由组", "调整灰度", "Chen Kai", statusBadge("已拒绝", "danger"), "trc_7791"],
          ]
        )}
      </div>
      <aside class="summary-card">
        <h3>风险事件</h3>
        <div class="summary-list">
          <div class="summary-item"><span>高成本异常</span><strong>运营分析 Copilot</strong></div>
          <div class="summary-item"><span>越权尝试</span><strong>审计人员访问模型配置</strong></div>
          <div class="summary-item"><span>工具写入告警</span><strong>CRM 高价值客户记录</strong></div>
        </div>
      </aside>
    </section>
  `;
}

function renderObservability() {
  return `
    ${pageHeader({
      eyebrow: "Observability",
      title: "执行链路与成本分析",
      desc: "通过时间线而非真实调用图展示检索、模型、工具和审批的链路关系。",
      actions: '<button class="ghost-button" data-drawer="trace">查看链路摘要</button><button class="primary-button">导出链路</button>',
    })}
    <section class="metrics-grid">
      ${metricCard("请求成功率", "97.2%", "+1.1%", "近 24h")}
      ${metricCard("平均时延", "2.1s", "-180ms", "近 24h")}
      ${metricCard("引用率", "84%", "+6%", "问答类应用")}
      ${metricCard("工具成功率", "93%", "-2%", "写入动作受审批影响")}
      ${metricCard("单日成本", "¥18,240", "+9.7%", "含模型与向量检索")}
    </section>
    <section class="trace-grid">
      <div class="timeline-card">
        <h3>Trace / ToolExecutionTimeline</h3>
        ${timeline(traces)}
      </div>
      <div class="summary-card">
        <h3>成本排行</h3>
        <div class="summary-list">
          <div class="summary-item"><span>1. 运营分析 Copilot</span><strong>¥5,640</strong></div>
          <div class="summary-item"><span>2. 销售作战助手</span><strong>¥4,920</strong></div>
          <div class="summary-item"><span>3. 制度问答助手</span><strong>¥2,880</strong></div>
        </div>
      </div>
    </section>
  `;
}

function renderAccess() {
  return `
    ${pageHeader({
      eyebrow: "Access Control",
      title: "权限治理",
      desc: "第二阶段仅提供用户、角色、策略的原型页面和占位说明。",
      actions: '<button class="ghost-button">同步组织架构</button><button class="primary-button">新建角色</button>',
    })}
    <section class="detail-grid">
      <article class="summary-card">
        <h3>用户管理</h3>
        <div class="summary-list">
          <div class="summary-item"><span>活跃用户</span><strong>128</strong></div>
          <div class="summary-item"><span>冻结用户</span><strong>6</strong></div>
          <div class="summary-item"><span>最近同步</span><strong>今天 08:40</strong></div>
        </div>
      </article>
      <article class="summary-card">
        <h3>策略占位</h3>
        <p>所有编辑动作仅用于原型演示。真实 IAM / OPA / Casbin 规则将在第三阶段与契约同步定义。</p>
        <div class="chip-row">
          <span class="subtle-chip">资源：应用</span>
          <span class="subtle-chip">资源：知识库</span>
          <span class="subtle-chip">资源：工具</span>
        </div>
      </article>
    </section>
    <section class="table-card">
      <div class="table-toolbar">
        <div>
          <p class="section-label">Roles</p>
          <h3>角色列表</h3>
        </div>
      </div>
      ${dataTable(
        ["角色", "权限范围", "关联人数", "默认能力", "状态"],
        [
          ["平台管理员", "全局配置 / 发布 / 观测", "5", "可审批 / 可发布", statusBadge("生效中", "success")],
          ["应用管理员", "应用配置 / 反馈", "18", "仅限所属应用", statusBadge("生效中", "success")],
          ["审计人员", "日志 / 链路 / 审批只读", "9", "无写权限", statusBadge("只读", "info")],
        ]
      )}
    </section>
  `;
}

function heroHeader(title, desc) {
  return `
    <section class="hero-banner">
      <div>
        <p class="eyebrow">Phase 2 Prototype</p>
        <h2>${title}</h2>
        <p>${desc}</p>
      </div>
      <div class="header-actions">
        <span class="subtle-chip">静态数据</span>
        <span class="subtle-chip">HTML / CSS / JS</span>
        <span class="subtle-chip">审批占位</span>
      </div>
    </section>
  `;
}

function pageHeader({ eyebrow, title, desc, actions }) {
  return `
    <section class="page-header">
      <div>
        <p class="section-label">${eyebrow}</p>
        <h2>${title}</h2>
        <p>${desc}</p>
      </div>
      <div class="header-actions">${actions}</div>
    </section>
  `;
}

function metricCard(label, value, trend, note) {
  return `
    <article class="metric-card">
      <p class="section-label">${label}</p>
      <strong>${value}</strong>
      <div class="trend">${trend}</div>
      <p class="small-text">${note}</p>
    </article>
  `;
}

function searchFilterBar(chips) {
  return `
    <section class="search-filter-bar">
      <div>
        <p class="section-label">SearchFilterBar</p>
        <p>统一承载搜索、筛选、标签和排序占位。</p>
      </div>
      <div class="filter-row">
        ${chips.map((chip) => `<span class="filter-chip">${chip}</span>`).join("")}
      </div>
    </section>
  `;
}

function dataTable(headers, rows) {
  return `
    <div class="table-card-inner">
      <table>
        <thead>
          <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function statusBadge(text, tone) {
  const toneMap = {
    success: "success",
    warning: "warning",
    danger: "danger",
    info: "info",
    neutral: "neutral",
  };

  return `<span class="status-badge ${toneMap[tone] || "neutral"}">${text}</span>`;
}

function approvalBanner({ title, desc, action }) {
  return `
    <section class="approval-banner">
      <div>
        <p class="section-label">ApprovalBanner</p>
        <strong>${title}</strong>
        <p>${desc}</p>
      </div>
      <button class="primary-button">${action}</button>
    </section>
  `;
}

function jsonViewer(value) {
  return `
    <div class="json-viewer">
      <div class="json-viewer-header">
        <strong>JsonViewer</strong>
        <span>只读 Schema</span>
      </div>
      <pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>
    </div>
  `;
}

function timeline(items) {
  return `
    <div class="timeline-list">
      ${items
        .map(
          (item) => `
            <div class="timeline-item ${timelineTone(item.tone)}">
              <div>
                <strong>${item.node}</strong>
                <p>${item.desc}</p>
              </div>
              <div class="meta-stack">
                <p>${item.status}</p>
                <p>${item.time}</p>
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function statePanel(title, value, note) {
  return `
    <article class="state-panel">
      <div>
        <p class="section-label">${title}</p>
        <h3>${value}</h3>
        <p>${note}</p>
      </div>
      <span class="subtle-chip">可配置</span>
    </article>
  `;
}

function timelineTone(tone) {
  if (tone === "warning") {
    return "warning";
  }
  if (tone === "danger") {
    return "danger";
  }
  return "";
}

function openDrawer(templateKey) {
  const titles = {
    app: "应用变更摘要",
    tool: "工具执行摘要",
    trace: "链路详情摘要",
  };

  drawerTitle.textContent = titles[templateKey] || "资源摘要";
  drawerBody.innerHTML = drawerTemplates[templateKey] || "<p>暂无详情。</p>";
  drawer.classList.remove("hidden");
  drawer.setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  drawer.classList.add("hidden");
  drawer.setAttribute("aria-hidden", "true");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
