const menus = [
  { id: "center", icon: "▣", title: "检测工具" },
  { id: "records", icon: "▤", title: "检测记录" },
  { id: "plans", icon: "▥", title: "方案管理" },
  { id: "models", icon: "◎", title: "模型管理" },
  { id: "cameras", icon: "◉", title: "相机管理" },
  { id: "io", icon: "⚙", title: "IO模块管理" }
];

const sampleImages = [
  { name: "MST-XRAY-240626-001.jpg", result: "NG", defects: 2, step: "X光初筛", backflow: true },
  { name: "MST-XRAY-240626-002.jpg", result: "OK", defects: 0, step: "X光初筛", backflow: false },
  { name: "MST-XRAY-240626-003.jpg", result: "NG", defects: 1, step: "加热复核", backflow: true },
  { name: "MST-XRAY-240626-004.jpg", result: "OK", defects: 0, step: "加热复核", backflow: false }
];

const tools = [
  { name: "稳定性测试 副本4", status: "idle", tone: "blue" },
  { name: "压板验收", status: "running", tone: "green" },
  { name: "稳定性测试 副本 副本", status: "running", tone: "green" },
  { name: "稳定性测试 副本", status: "idle", tone: "blue" },
  { name: "部分实例未配置检测", status: "idle", tone: "blue" },
  { name: "三羊-1063-0702 副本", status: "idle", tone: "blue" },
  { name: "新bug 验证", status: "idle", tone: "blue" },
  { name: "稳定性测试", status: "running", tone: "green" },
  { name: "背板-0702", status: "idle", tone: "blue" },
  { name: "三羊-1063-0702", status: "running", tone: "green" },
  { name: "三羊-CS008-0702", status: "idle", tone: "blue" },
  { name: "三羊-1062 副本 副本 副本R", status: "error", tone: "blue" },
  { name: "三羊0701副本1", status: "error", tone: "blue" },
  { name: "三羊0701-CS008", status: "error", tone: "blue" },
  { name: "singleTest 副本", status: "idle", tone: "blue" }
];

const state = {
  page: "center",
  modal: null,
  selected: 0,
  selectedTool: 0,
  toolEditStep: 0,
  processMethod: "模型识别检测区域",
  imageSourceType: "file",
  activeDropdown: null,
  modalMode: "edit",
  detected: false,
  marked: true,
  planVersion: "MST-XRAY 视觉检测方案 V1.4.2",
  planKeyword: "",
  currentMode: "detect",
  schemes: [
    { name: "MST-XRAY 视觉检测方案", desc: "供应商 X 光图片上传检测，包含 ROI 裁图、X光初筛、规则判定", version: "MST-XRAY-20260703", source: "云端同步", time: "2026-07-05 19:30" },
    { name: "MST-HEAT 加热复核方案", desc: "加热复核检测方案，关联初筛输出图像", version: "MST-HEAT-20260702", source: "本地上传", time: "2026-07-04 10:22" }
  ],
  localRecords: [
    { id: "MST-20260626-014", tool: "马斯特来料X光检测", result: "NG", total: 24, ok: 18, ng: 6, backflow: "待回流", time: "2026-06-26 15:42" },
    { id: "MST-20260626-013", tool: "马斯特加热复核检测", result: "OK", total: 16, ok: 16, ng: 0, backflow: "未标记", time: "2026-06-26 14:18" },
    { id: "MST-20260625-021", tool: "供应商A批次复检", result: "NG", total: 32, ok: 27, ng: 5, backflow: "已导出", time: "2026-06-25 17:03" }
  ]
};

const nav = document.querySelector("#nav");
const view = document.querySelector("#view");

function statusClass(result) {
  return result === "OK" ? "ok" : result === "NG" ? "bad" : "warn";
}

function renderShell() {
  document.querySelector(".client-shell").classList.toggle("detect-active", false);
  nav.innerHTML = menus.map(item => `
    <button class="${state.page === item.id ? "active" : ""}" data-page="${item.id}">
      <span class="nav-ico">${item.icon}</span><span>${item.title}</span>
    </button>
  `).join("");

  nav.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      state.page = btn.dataset.page;
      render();
    });
  });
}

function center() {
  return `
    <section class="tool-home">
      <div class="tool-grid">
        <button class="tool-tile create" id="newTool">
          <span class="tool-create-icon">＋</span>
          <strong class="tool-create-title">新建检测工具</strong>
          <span class="tool-create-sub">开始部署新的视觉检测工具</span>
        </button>
        ${tools.map((tool, index) => `
          <div class="tool-tile ${tool.tone === "green" ? "running" : ""}" data-open-tool="${index}">
            ${tool.status === "running" ? '<span class="tool-status">● 运行中</span>' : ""}
            ${tool.status === "error" ? '<span class="tool-status bad">ⓘ 配置异常</span>' : ""}
            <span class="tool-actions">
              <button title="复制" aria-label="复制" data-tool-action="copy" data-index="${index}">▣</button>
              <button title="IO模块配置" aria-label="IO模块配置" data-tool-action="io" data-index="${index}">⬡</button>
              <button title="编辑" aria-label="编辑" data-tool-action="edit" data-index="${index}">✎</button>
            </span>
            <span class="tool-name">${tool.name}</span>
            <span class="tool-watermark">${tool.status === "running" ? "✖" : "▤"}</span>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function toolEdit() {
  const tool = tools[state.selectedTool] || tools[0];
  const steps = ["图像来源", "图像处理", "图像检测", "规则判定"];
  const stepIndex = state.toolEditStep;
  return `
    <section class="tool-config-page">
      <div class="tool-edit-head">
        <div class="tool-edit-title">
          <strong>配置检测工具</strong>
          <span>${tool.name || "X光图像缺陷检测"}</span>
          <button class="icon-link" id="renameTool">✎</button>
        </div>
        <div class="actions">
          <button class="outline-blue" data-page="center">‹ 返回工具列表</button>
          <button class="outline-red" id="deleteTool">⌫ 删除工具</button>
        </div>
      </div>

      <div class="config-steps">
        ${steps.map((name, index) => `
          <button class="${stepIndex === index ? "active" : ""}" data-edit-step="${index}">
            <span>✓</span>${name}
          </button>
        `).join("")}
      </div>

      <div class="tool-config-card">
        ${toolEditContent(stepIndex)}
      </div>

      <div class="tool-config-footer">
        ${stepIndex > 0 ? '<button class="outline-blue" id="prevToolStep">⊙ 上一步</button>' : '<span></span>'}
        ${stepIndex < steps.length - 1 ? '<button class="outline-blue" id="nextToolStep">⊙ 下一步</button>' : '<button class="outline-blue" id="finishToolEdit">⊙ 完成并返回</button>'}
      </div>
    </section>
  `;
}

function toolEditContent(stepIndex) {
  const sourceLabel = state.imageSourceType === "file" ? "图片/图片集" : state.imageSourceType === "camera" ? "相机" : "接口";
  if (stepIndex === 0) return `
    <div class="config-section-head">
      <h2>图像获取实例</h2>
      <div class="section-actions"><span class="page-pill">1/20</span><button class="outline-blue" id="addImageSource">⊕ 新增图像来源</button></div>
    </div>
    <div class="config-instance-card image-source-card">
      <div class="xray-thumb"><span></span></div>
      <div class="instance-main">
        <h3>X光检测 <em>${sourceLabel}</em></h3>
        <p>来源： 1</p>
        <p>示例图像：13.bmp</p>
      </div>
      <div class="instance-actions">
        <button class="soft-blue" id="editImageSource">编辑</button>
        <button class="soft-red">删除</button>
      </div>
    </div>
  `;

  if (stepIndex === 1) return `
    <div class="config-section-head">
      <h2>图像处理实例</h2>
      <div class="section-actions"><span class="page-pill">1/20</span><button class="outline-blue" id="addProcessStep">⊕ 新增处理步骤</button></div>
    </div>
    <div class="config-instance-card">
      <div class="instance-main">
        <h3>X光图像处理 <em>${state.processMethod}</em></h3>
        <p>输入实例:X光检测　　模型:马斯特X光-定位 类别：零件</p>
      </div>
      <div class="instance-actions">
        <button class="soft-blue" id="editProcessStep">编辑</button>
        <button class="soft-red">删除</button>
      </div>
    </div>
  `;

  if (stepIndex === 2) return `
    <div class="config-section-head">
      <h2>图像检测实例</h2>
      <div class="section-actions"><span class="page-pill">1/20</span><button class="outline-blue" id="addDetectStep">⊕ 新增检测步骤</button></div>
    </div>
    <div class="config-instance-card">
      <div class="instance-main">
        <h3>检测 <em>${sourceLabel}</em></h3>
        <p>关联处理结果图像： X光图像处理:零件</p>
        <p>使用模型: X光对比测试/2026052023467</p>
      </div>
      <div class="instance-actions">
        <button class="soft-blue" id="editDetectStep">编辑</button>
        <button class="soft-blue disabled">参数配置</button>
        <button class="soft-red">删除</button>
      </div>
    </div>
  `;

  return `
    <div class="config-section-head">
      <h2>规则判断</h2>
      <div class="section-actions"><button class="outline-blue">↯ 切换表达式编辑</button><button class="outline-blue">恢复默认</button></div>
    </div>
    <div class="rule-workbench">
      <aside class="rule-items">
        <h3>检测项</h3>
        <button class="active">检测 <em>缺陷</em></button>
      </aside>
      <main class="rule-editor">
        <div class="rule-editor-head"><h3>检测</h3><em>缺陷</em></div>
        <div class="rule-condition">
          <div class="condition-title"><strong>OK判定条件</strong><button class="select-like">全部满足⌄</button></div>
          <div class="condition-row">
            <button class="select-like grow">缺陷⌄</button>
            <div class="operator-select">
              <button class="select-like" data-dropdown="operator">数量=⌄</button>
              <div class="operator-menu ${state.activeDropdown === "operator" ? "open" : ""}">
                <span class="selected">数量= ✓</span>
                <span>数量≤</span><span>数量&lt;</span><span>数量≥</span><span>数量&gt;</span><span>数量≠</span>
              </div>
            </div>
            <div class="stepper"><button>−</button><input value="0" /><button>＋</button></div>
          </div>
        </div>
      </main>
    </div>
  `;
}

function detect() {
  const tool = tools[state.selectedTool] || tools[0];
  return state.imageSourceType === "file" ? fileRunPage(tool) : liveRunPage(tool);
}

function runModeButtons() {
  const modes = state.imageSourceType === "file"
    ? [{ id: "process", label: "图片处理模式" }, { id: "detect", label: "检测模式" }]
    : [{ id: "capture", label: "采图模式" }, { id: "process", label: "图片处理模式" }, { id: "detect", label: "检测模式" }];
  return `<div class="run-mode-tabs">${modes.map(mode => `<button class="${state.currentMode === mode.id ? "active" : ""}" data-mode="${mode.id}">${mode.label}</button>`).join("")}</div>`;
}

function fileRunPage(tool) {
  return `
    <section class="run-page file-run-page">
      <div class="run-head">
        <h1>${tool.name || "检测工具A"}</h1>
        <div class="actions"><button class="outline-blue" data-page="center">返回工具列表</button><button class="outline-blue" data-page="center">退出工具</button></div>
      </div>
      <div class="file-run-layout">
        <aside class="file-image-panel">
          <h2>图像列表</h2>
          <div class="file-upload-actions"><button class="btn primary" id="uploadImages">⇧ 上传图像</button><button class="btn">清空</button></div>
          <table>
            <thead><tr><th>状态</th><th>图片名称</th><th>操作</th></tr></thead>
            <tbody><tr><td><span>待检测</span></td><td>img000000.jpg</td><td><button class="trash-btn">▥</button></td></tr><tr><td><span>待检测</span></td><td>img000001.jpg</td><td><button class="trash-btn">▥</button></td></tr></tbody>
          </table>
          <button class="start-detect-btn" id="startDetect">开始检测</button>
        </aside>
        <main class="file-preview-panel">
          <div class="image-wireframe">
            <div class="image-placeholder-card"><div class="mountain"></div><div class="sun"></div></div>
            <span>显示当前图像结果</span>
          </div>
        </main>
        <aside class="file-result-panel">
          <div class="file-result-card">
            <h2>检测结果</h2>
            <strong>OK/NG<br>/检测异常</strong>
            <p>检测节拍： <b>0.5s</b></p>
            <div>OK项：　N个<br>NG项：　N个</div>
          </div>
          <div class="file-result-card label-card">
            <h2>标签信息</h2>
            <div class="tag-box"></div>
            <div class="tag-input-row"><input placeholder="输入标签后添加" /><button class="btn primary">添加</button></div>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function liveRunPage(tool) {
  const modeLabel = state.currentMode === "capture" ? "采图模式" : state.currentMode === "process" ? "图片处理模式" : "检测模式";
  return `
    <section class="run-page live-run-page">
      <div class="run-head">
        <h1>zkn <span>${modeLabel}</span></h1>
        <div class="actions"><button class="outline-blue" data-page="center">‹ 返回工具列表</button><button class="outline-red" data-page="center">⊗ 退出工具</button></div>
      </div>
      <div class="live-run-layout">
        <aside class="live-side">
          <div class="live-panel image-list-panel">
            <h2>图像列表</h2>
            <button class="live-image-item active">zkn01</button>
            <button class="live-image-item">pic02</button>
          </div>
          <div class="live-panel camera-panel">
            <h2>相机信息</h2>
            <div class="camera-info"><strong>测试相机220</strong><span>参数组 <b>默认参数组1</b></span></div>
            <button class="btn primary">查看相机画面</button>
          </div>
        </aside>
        <main class="live-preview-panel">
          <h2>当前图像</h2>
          <div class="live-image-stage">等待开始${state.currentMode === "capture" ? "采图" : state.currentMode === "process" ? "处理" : "检测"}</div>
        </main>
        <aside class="live-right">
          <div class="live-panel status-panel">
            <h2>运行概况</h2>
            <div class="run-buttons"><button class="outline-blue" id="startDetect">↻ ${state.currentMode === "capture" ? "采图" : "开始"}</button><button class="outline-blue disabled">↻ 重置</button></div>
            <strong class="waiting-text">等待开始</strong>
            <div class="beat-box"><span>本次节拍</span><b>-</b></div>
          </div>
          <div class="live-panel label-panel">
            <h2>标签信息 <em>已添加0/3</em></h2>
            <div class="tag-box"></div>
            <div class="tag-input-row"><input placeholder="输入标签后添加" /><button class="btn primary">添加</button></div>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function records() {
  return `
    <section class="client-page-panel">
      <div class="panel">
        <div class="panel-head">
          <div class="panel-title">检测记录</div>
          <div class="actions">
            <button class="btn soft" id="exportBackflow">导出待回流数据</button>
            <button class="btn primary">多端同步</button>
          </div>
        </div>
        <div class="panel-body">
          <div class="toolbar">
            <div class="filters">
              <input class="input" value="MST-20260626" />
              <select class="select"><option>全部结果</option><option>OK</option><option>NG</option></select>
              <select class="select"><option>全部回流状态</option><option>待回流</option><option>已导出</option></select>
            </div>
            <button class="btn">查询</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>记录编号</th><th>工具名称</th><th>业务结果</th><th>图片数</th><th>OK/NG</th><th>回流状态</th><th>检测时间</th><th>操作</th></tr></thead>
              <tbody>
                ${state.localRecords.map(item => `
                  <tr>
                    <td>${item.id}</td>
                    <td>${item.tool}</td>
                    <td><span class="state ${statusClass(item.result)}">${item.result}</span></td>
                    <td>${item.total}</td>
                    <td>${item.ok}/${item.ng}</td>
                    <td><span class="state ${item.backflow === "待回流" ? "warn" : "ok"}">${item.backflow}</span></td>
                    <td>${item.time}</td>
                    <td><button class="btn soft" data-page="detail">查看详情</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `;
}

function detail() {
  return `
    <section class="mast-client-page">
      <div class="mast-head">
        <div><div class="mast-kicker">检测详情</div><h1>MST-20260626-014</h1></div>
        <div class="actions"><button class="wire-btn" data-page="records">返回记录</button><button class="wire-btn primary" id="markBackflow">标记待回流</button></div>
      </div>
      <div class="detail mast-detail">
        <div class="panel">
          <div class="panel-head"><div class="panel-title">原图与检测渲染结果</div></div>
          <div class="panel-body"><div class="xray-preview ng detail-preview"><div class="xray-plate"></div><span class="defect-box box-a"></span><span class="defect-box box-b"></span><div class="xray-caption">MST-XRAY-240626-001.jpg</div></div></div>
        </div>
        <div class="panel">
          <div class="panel-head"><div class="panel-title">记录摘要</div></div>
          <div class="panel-body kv">
            <div class="kv-row"><span>方案版本</span><strong>${state.planVersion}</strong></div>
            <div class="kv-row"><span>累计图片</span><strong>24</strong></div>
            <div class="kv-row"><span>OK / NG</span><strong>18 / 6</strong></div>
            <div class="kv-row"><span>回流状态</span><strong>${state.marked ? "待回流" : "未标记"}</strong></div>
            <div class="kv-row"><span>本地保存</span><strong>已保存</strong></div>
            <button class="wire-btn primary" id="exportBackflow">导出图片与判定标准</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function plans() {
  const rows = state.schemes.filter(item => {
    return !state.planKeyword || item.name.includes(state.planKeyword) || item.version.includes(state.planKeyword);
  });
  return `
    <section class="client-page-panel">
      <div class="panel">
        <div class="panel-head">
          <div class="panel-title">方案管理</div>
          <div class="actions"><button class="btn soft" id="cloudPlan">从云端下载</button><button class="btn primary" id="importPlan">导入本地方案</button></div>
        </div>
        <div class="panel-body">
          <div class="toolbar">
            <div class="filters"><input class="input" id="planKeyword" placeholder="请输入方案名称/编号" value="${state.planKeyword}" /></div>
            <div class="actions"><button class="btn" id="resetPlanSearch">重置</button><button class="btn primary" id="queryPlan">查询</button></div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>方案名称</th><th>方案描述</th><th>方案版本编号</th><th>来源</th><th>添加时间</th><th>操作</th></tr></thead>
              <tbody>
                ${rows.map((item, index) => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.desc}</td>
                    <td>${item.version}</td>
                    <td><span class="tag">${item.source}</span></td>
                    <td>${item.time}</td>
                    <td><button class="btn soft" data-use-plan="${index}">设为当前</button><button class="btn danger" data-delete-plan="${index}">删除</button></td>
                  </tr>
                `).join("") || `<tr><td colspan="6">暂无匹配方案</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `;
}

function models() {
  return simplePage("模型管理", "客户端展示已同步模型版本与状态；训练、标注、验证统一在平台端完成。当前工作流支持关联上游模型输出作为下游模型输入。");
}

function cameras() {
  return simplePage("相机管理", "马斯特场景以供应商图片上传/图片集为主；当前检测工具图像来源为上传图片时，采图模式配置已隐藏。");
}

function io() {
  return simplePage("IO模块管理", "IO 模块入口保留用于兼容原客户端，图片上传检测方案无需额外配置。");
}

function simplePage(title, text) {
  return `<section class="client-page-panel"><div class="panel"><div class="panel-head"><div class="panel-title">${title}</div></div><div class="panel-body">${text}</div></div></section>`;
}

function planModal() {
  if (!state.modal) return "";
  if (state.modal === "editSource") {
    const isAdd = state.modalMode === "add";
    const sourceLabel = isAdd ? "请选择" : state.imageSourceType === "file" ? "图片/图片集" : state.imageSourceType === "camera" ? "相机" : "接口";
    return `
    <div class="modal-mask show">
      <div class="config-modal source-modal">
        <header><h2>${isAdd ? "新增图像来源" : "编辑图像来源"}</h2><button data-close>×</button></header>
        <div class="config-modal-body source-modal-body">
          <label><b>* 图像名称</b><input class="config-input" ${isAdd ? 'placeholder="请输入图像名称"' : 'value="X光检测"'} /></label>
          <label><b>* 采集方式</b><button class="config-select" data-dropdown="sourceType">${sourceLabel}⌄</button><div class="select-pop ${state.activeDropdown === "sourceType" ? "open" : ""}"><span data-source-type="camera">相机</span><span data-source-type="interface" class="${!isAdd && state.imageSourceType === "interface" ? "selected" : ""}">接口${!isAdd && state.imageSourceType === "interface" ? " ✓" : ""}</span><span data-source-type="file" class="${!isAdd && state.imageSourceType === "file" ? "selected" : ""}">图片/图片集${!isAdd && state.imageSourceType === "file" ? " ✓" : ""}</span></div></label>
          <label><b>* 外部参数</b><input class="config-input" ${isAdd ? 'placeholder="请输入外部参数"' : 'value="1"'} /></label>
          <div class="source-preview-label">示例图像</div>
          <div class="source-preview-actions"><button class="soft-blue">示例图像获取</button><button class="btn primary">本地上传</button></div>
          <div class="source-preview"><div class="xray-thumb large"><span></span></div></div>
        </div>
        <footer><button class="btn" data-close>⊗ 取消</button><button class="btn primary" id="saveToolEdit">◎ 保存</button></footer>
      </div>
    </div>
  `;
  }
  if (state.modal === "processStep") {
    const isAdd = state.modalMode === "add";
    const isManual = state.processMethod === "手动绘制检测区域";
    const isModel = state.processMethod === "模型识别检测区域";
    return `
      <div class="modal-mask show">
        <div class="config-modal process-modal">
          <header><h2>${isAdd ? "新增处理步骤" : "编辑处理步骤"}</h2><button data-close>×</button></header>
          <div class="config-modal-body process-modal-body">
            <label><b>* 处理步骤名称</b><input class="config-input" ${isAdd ? 'placeholder="请输入处理步骤名称"' : 'value="X光图像处理"'} /></label>
            <label><b>* 关联图像</b><button class="config-select">${isAdd ? "请选择" : "X光检测"}⌄</button></label>
            <label class="wide"><b>* 处理方式</b><button class="config-select" data-dropdown="processMethod">${isAdd ? "请选择" : state.processMethod}⌄</button></label>
            <div class="method-menu ${state.activeDropdown === "processMethod" ? "open" : ""}">
              ${["全图处理", "手动绘制检测区域", "模型识别检测区域"].map(item => `<button class="${state.processMethod === item ? "active" : ""}" data-process-method="${item}">${item}${state.processMethod === item ? " ✓" : ""}</button>`).join("")}
            </div>
            ${isManual ? `
              <div class="score-buttons"><button>4等分</button><button>9等分</button><button>16等分</button></div>
              <div class="roi-toolbar"><span>⊖</span><span>⊕</span><span>▣</span><span>✋</span><span>◉</span><span class="active">□</span><span class="muted">↶</span><span class="muted">↷</span><span>▥</span></div>
              <div class="roi-stage"><div class="xray-thumb editor"><span></span></div></div>
            ` : ""}
            ${isModel ? `
              <label class="wide"><b>* 模型</b><span class="model-pick"><input class="config-input" placeholder="请选择模型" /><button class="outline-blue">选择模型</button></span></label>
            ` : ""}
          </div>
          <footer><button class="btn" data-close>⊗ 取消</button><button class="btn primary" id="confirmProcessStep">◎ 创建</button></footer>
        </div>
      </div>
    `;
  }
  if (state.modal === "detectStep") return `
    <div class="modal-mask show">
      <div class="config-modal detect-modal">
        <header><h2>${state.modalMode === "add" ? "新增检测步骤" : "编辑检测步骤"}</h2><button data-close>×</button></header>
        <div class="config-modal-body detect-modal-body">
          <label class="wide"><b>* 检测项名称</b><input class="config-input" ${state.modalMode === "add" ? 'placeholder="请输入检测项名称"' : 'value="检测"'} /></label>
          <div class="result-tree">
            <b>关联处理结果图像</b>
            <div class="tree-box"><strong>X光检测</strong><span>X光图像处理</span><em>零件</em></div>
          </div>
          <label class="wide"><b>* 模型</b><span class="model-pick"><input class="config-input" ${state.modalMode === "add" ? 'placeholder="请选择模型"' : 'value="X光对比测试"'} disabled /><button class="outline-blue">选择模型</button></span></label>
        </div>
        <footer><button class="btn" data-close>⊗ 取消</button><button class="btn primary" id="saveToolEdit">◎ 保存</button></footer>
      </div>
    </div>
  `;
  if (state.modal === "launch") {
    const tool = tools[state.selectedTool] || tools[0];
    const showCapture = state.imageSourceType !== "file";
    return `
      <div class="modal-mask show">
        <div class="client-launch-modal">
          <header><h2>启动检测工具 · ${tool.name}</h2><button data-close>×</button></header>
          <div class="launch-mode-grid">
            ${showCapture ? `<button class="launch-mode-card blue" data-action="modeCapture">
              <strong>采图模式</strong>
              <span>仅采集原始图像。</span>
            </button>` : ""}
            <button class="launch-mode-card orange" data-action="modeProcess">
              <strong>图像处理模式</strong>
              <span>采集图像并输出处理结果。</span>
            </button>
            <button class="launch-mode-card cyan" data-action="launchDetect">
              <strong>检测模式</strong>
              <span>完成检测并给出最终结果。</span>
            </button>
          </div>
          <footer><button class="btn" data-close>取消</button></footer>
        </div>
      </div>
    `;
  }
  if (state.modal === "newTool") {
    return `
      <div class="modal-mask show">
        <div class="wire-modal mast-modal">
          <button class="modal-close" data-close>×</button>
          <h2>新建检测工具</h2>
          <label>检测工具名称<input class="input" value="马斯特来料 X 光图片检测" /></label>
          <label>选择方案<select class="input"><option>MST-XRAY 视觉检测方案 V1.4.2</option><option>MST-HEAT 加热复核方案 V1.2.0</option></select></label>
          <p class="modal-note">导入方案后自动填充图像处理和检测工作流；图片来源为上传图片/图片集时，无需补充相机配置。</p>
          <div class="actions"><button class="btn" data-close>取消</button><button class="btn primary" id="confirmTool">确认</button></div>
        </div>
      </div>
    `;
  }
  if (state.modal === "cloudPlan" || state.modal === "importPlan") {
    return `
      <div class="modal-mask show">
        <div class="wire-modal mast-modal">
          <button class="modal-close" data-close>×</button>
          <h2>${state.modal === "cloudPlan" ? "从云端下载方案" : "导入本地方案"}</h2>
          <div class="cards">
            <div class="card-line"><div><h3>MST-XRAY 视觉检测方案 V1.4.2</h3><p>已发布，可下载至本地检测工具使用。</p><span class="tag">已发布</span></div><button class="btn primary" id="confirmPlanImport">确认</button></div>
          </div>
        </div>
      </div>
    `;
  }
  if (state.modal !== "plan") return "";
  return `
    <div class="modal-mask show">
      <div class="wire-modal mast-modal">
        <button class="modal-close" data-close>×</button>
        <h2>当前检测方案</h2>
        <div class="flow">
          <div class="node active"><div class="node-num">1</div><div class="node-title">图片上传</div><div class="node-text">导入供应商 X 光图片或文件夹。</div></div>
          <div class="node active"><div class="node-num">2</div><div class="node-title">ROI 裁图</div><div class="node-text">按平台方案自动裁剪检测区域。</div></div>
          <div class="node active"><div class="node-num">3</div><div class="node-title">X光初筛</div><div class="node-text">初步剔除明显 NG 产品。</div></div>
          <div class="node"><div class="node-num">4</div><div class="node-title">加热复核</div><div class="node-text">复核剩余产品并补充漏检样本。</div></div>
          <div class="node"><div class="node-num">5</div><div class="node-title">标准回流</div><div class="node-text">导出待回流图片和判断标准。</div></div>
        </div>
      </div>
    </div>
  `;
}

const views = { center, detect, toolEdit, records, detail, plans, models, cameras, io };

function openTool(index) {
  state.selectedTool = index;
  if (state.imageSourceType === "file" && state.currentMode === "capture") state.currentMode = "process";
  state.modal = "launch";
  render();
}

function handleToolAction(event, action, index) {
  event.stopPropagation();
  state.selectedTool = index;
  if (action === "copy") {
    tools.splice(index + 1, 0, { ...tools[index], name: `${tools[index].name} 副本`, status: "idle", tone: "blue" });
    render();
    toast("检测工具已复制");
    return;
  }
  if (action === "io") {
    state.page = "io";
    render();
    toast(`正在配置 ${tools[index].name} 的 IO 模块`);
    return;
  }
  if (action === "edit") {
    state.page = "toolEdit";
    state.toolEditStep = 0;
    render();
  }
}

window.openTool = openTool;
window.handleToolAction = handleToolAction;

function bind() {
  view.onclick = event => {
    const actionButton = event.target.closest("[data-tool-action]");
    if (actionButton && view.contains(actionButton)) {
      event.preventDefault();
      event.stopPropagation();
      handleToolAction(event, actionButton.dataset.toolAction, Number(actionButton.dataset.index));
      return;
    }

    const launchButton = event.target.closest("[data-action]");
    if (launchButton && view.contains(launchButton)) {
      event.preventDefault();
      if (launchButton.dataset.action === "launchDetect") {
        state.currentMode = "detect";
        state.modal = null;
        state.page = "detect";
        render();
        return;
      }
      if (launchButton.dataset.action === "modeProcess") {
        state.currentMode = "process";
        state.modal = null;
        state.page = "detect";
        render();
        toast("已进入图像处理模式");
        return;
      }
      if (launchButton.dataset.action === "modeCapture") {
        state.currentMode = "capture";
        state.modal = null;
        state.page = "detect";
        render();
      }
      return;
    }

    const toolCard = event.target.closest("[data-open-tool]");
    if (toolCard && view.contains(toolCard)) {
      event.preventDefault();
      openTool(Number(toolCard.dataset.openTool));
    }
  };

  view.querySelectorAll("[data-edit-step]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.toolEditStep = Number(btn.dataset.editStep);
      render();
    });
  });

  view.querySelectorAll("[data-process-method]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.processMethod = btn.dataset.processMethod;
      state.activeDropdown = null;
      render();
    });
  });

  view.querySelectorAll("[data-source-type]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.imageSourceType = btn.dataset.sourceType;
      if (state.imageSourceType === "file" && state.currentMode === "capture") state.currentMode = "process";
      state.activeDropdown = null;
      render();
    });
  });

  view.querySelectorAll("[data-dropdown]").forEach(btn => {
    btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      state.activeDropdown = state.activeDropdown === btn.dataset.dropdown ? null : btn.dataset.dropdown;
      render();
    });
  });

  view.querySelectorAll("[data-page]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.page = btn.dataset.page;
      state.modal = null;
      state.activeDropdown = null;
      render();
    });
  });

  view.querySelectorAll("[data-select]").forEach(row => {
    row.addEventListener("click", () => {
      state.selected = Number(row.dataset.select);
      render();
    });
  });

  const syncPlan = document.querySelector("#syncPlan");
  if (syncPlan) syncPlan.addEventListener("click", () => toast("已同步平台端最新发布方案"));

  const newTool = document.querySelector("#newTool");
  if (newTool) newTool.addEventListener("click", () => {
    state.modal = "newTool";
    render();
  });

  view.querySelectorAll("[data-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.currentMode = btn.dataset.mode;
      toast(state.currentMode === "capture" ? "已切换至采图模式" : state.currentMode === "process" ? "已切换至图像处理模式" : "已切换至检测模式");
      render();
    });
  });

  const openPlan = document.querySelector("#openPlan");
  if (openPlan) openPlan.addEventListener("click", () => {
    state.modal = "plan";
    render();
  });

  const uploadImages = document.querySelector("#uploadImages");
  if (uploadImages) uploadImages.addEventListener("click", () => toast("已模拟上传 4 张 X 光图片"));

  const startDetect = document.querySelector("#startDetect");
  if (startDetect) startDetect.addEventListener("click", () => {
    state.detected = true;
    toast("检测完成：OK 2 张，NG 2 张");
    render();
  });

  const markBackflow = document.querySelector("#markBackflow");
  if (markBackflow) markBackflow.addEventListener("click", () => {
    state.marked = !state.marked;
    toast(state.marked ? "已标记为待回流" : "已取消回流标记");
    render();
  });

  const saveRecord = document.querySelector("#saveRecord");
  if (saveRecord) saveRecord.addEventListener("click", () => toast("检测记录已保存到本地"));

  const saveToolEdit = document.querySelector("#saveToolEdit");
  if (saveToolEdit) saveToolEdit.addEventListener("click", () => {
    state.modal = null;
    toast("检测工具配置已保存");
    render();
  });

  const renameTool = document.querySelector("#renameTool");
  if (renameTool) renameTool.addEventListener("click", () => toast("已进入工具名称编辑状态"));

  const deleteTool = document.querySelector("#deleteTool");
  if (deleteTool) deleteTool.addEventListener("click", () => {
    state.page = "center";
    toast("检测工具已删除");
    render();
  });

  const prevToolStep = document.querySelector("#prevToolStep");
  if (prevToolStep) prevToolStep.addEventListener("click", () => {
    state.toolEditStep = Math.max(0, state.toolEditStep - 1);
    render();
  });

  const nextToolStep = document.querySelector("#nextToolStep");
  if (nextToolStep) nextToolStep.addEventListener("click", () => {
    state.toolEditStep = Math.min(3, state.toolEditStep + 1);
    render();
  });

  const finishToolEdit = document.querySelector("#finishToolEdit");
  if (finishToolEdit) finishToolEdit.addEventListener("click", () => {
    state.page = "center";
    toast("检测工具配置已完成");
    render();
  });

  const editImageSource = document.querySelector("#editImageSource");
  const addImageSource = document.querySelector("#addImageSource");
  if (editImageSource) editImageSource.addEventListener("click", () => {
    state.modalMode = "edit";
    state.modal = "editSource";
    render();
  });
  if (addImageSource) addImageSource.addEventListener("click", () => {
    state.modalMode = "add";
    state.modal = "editSource";
    render();
  });

  const addProcessStep = document.querySelector("#addProcessStep");
  const editProcessStep = document.querySelector("#editProcessStep");
  if (editProcessStep) editProcessStep.addEventListener("click", () => {
    state.modalMode = "edit";
    state.modal = "processStep";
    render();
  });
  if (addProcessStep) addProcessStep.addEventListener("click", () => {
    state.modalMode = "add";
    state.modal = "processStep";
    render();
  });

  const addDetectStep = document.querySelector("#addDetectStep");
  const editDetectStep = document.querySelector("#editDetectStep");
  if (editDetectStep) editDetectStep.addEventListener("click", () => {
    state.modalMode = "edit";
    state.modal = "detectStep";
    render();
  });
  if (addDetectStep) addDetectStep.addEventListener("click", () => {
    state.modalMode = "add";
    state.modal = "detectStep";
    render();
  });

  const confirmProcessStep = document.querySelector("#confirmProcessStep");
  if (confirmProcessStep) confirmProcessStep.addEventListener("click", () => {
    state.modal = null;
    toast("处理步骤已创建");
    render();
  });

  const exportBackflow = document.querySelector("#exportBackflow");
  if (exportBackflow) exportBackflow.addEventListener("click", () => toast("已导出待回流图片与检测结果"));

  const cloudPlan = document.querySelector("#cloudPlan");
  if (cloudPlan) cloudPlan.addEventListener("click", () => {
    state.modal = "cloudPlan";
    render();
  });

  const importPlan = document.querySelector("#importPlan");
  if (importPlan) importPlan.addEventListener("click", () => {
    state.modal = "importPlan";
    render();
  });

  const planKeyword = document.querySelector("#planKeyword");
  if (planKeyword) planKeyword.addEventListener("input", () => {
    state.planKeyword = planKeyword.value;
  });

  const queryPlan = document.querySelector("#queryPlan");
  if (queryPlan) queryPlan.addEventListener("click", () => {
    toast("方案查询完成");
    render();
  });

  const resetPlanSearch = document.querySelector("#resetPlanSearch");
  if (resetPlanSearch) resetPlanSearch.addEventListener("click", () => {
    state.planKeyword = "";
    render();
    toast("已重置方案搜索");
  });

  view.querySelectorAll("[data-use-plan]").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = state.schemes[Number(btn.dataset.usePlan)];
      state.planVersion = `${item.name} ${item.version}`;
      toast("已设为当前检测方案");
      render();
    });
  });

  view.querySelectorAll("[data-delete-plan]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.schemes.splice(Number(btn.dataset.deletePlan), 1);
      toast("方案已删除");
      render();
    });
  });

  const confirmTool = document.querySelector("#confirmTool");
  if (confirmTool) confirmTool.addEventListener("click", () => {
    state.modal = null;
    toast("检测工具已创建");
    render();
  });

  const confirmPlanImport = document.querySelector("#confirmPlanImport");
  if (confirmPlanImport) confirmPlanImport.addEventListener("click", () => {
    const modalType = state.modal;
    state.modal = null;
    toast(modalType === "cloudPlan" ? "方案已从云端下载" : "本地方案已导入");
    render();
  });

  view.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.modal = null;
      state.activeDropdown = null;
      render();
    });
  });
}

function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1800);
}

function render() {
  renderShell();
  view.innerHTML = views[state.page]() + planModal();
  bind();
}

document.querySelector("#sync").addEventListener("click", () => toast("已同步平台端最新发布方案"));
render();
