const menus = [
  { id: "home", title: "首页" },
  { id: "plans", title: "方案管理" },
  { id: "models", title: "模型管理" },
  { id: "images", title: "图像库" },
  { id: "clients", title: "客户端管理" }
];

const state = {
  page: "home",
  modal: "",
  viewMode: "table",
  planTab: "versions",
  selectedSchemeIndex: 0,
  selectedVersionIndex: 0,
  schemeKeyword: "马斯特",
  schemeStatus: "全部状态",
  versionKeyword: "",
  versionStatus: "全部状态",
  selectedFolderIndex: null,
  selectedImageIndex: 0,
  selectedModelIndex: 0,
  selectedModelVersionIndex: 0,
  modelTestProcessed: false,
  cropMode: false,
  cropRect: null,
  cropApplied: false,
  workflowFlows: [
    { id: 1, type: "instance", name: "图像获取实例", input: "客户端上传" },
    { id: 2, type: "process", name: "X光图像处理", method: "手动绘制检测区域", prev: 1 },
    { id: 3, type: "detect", name: "检测", prev: 2 },
    { id: 4, type: "judge", name: "规则判断", prev: 3 }
  ],
  pendingDelete: null
};

const view = document.querySelector("#view");
const nav = document.querySelector("#nav");

const schemes = [
  { name: "马斯特来料 X 光初筛方案", code: "MST-XRAY", desc: "来料 X 光图像初筛、ROI 裁图与缺陷判定", version: "V1.4.2", status: "已发布", create: "2026-06-22 09:18", update: "2026-07-03 10:26" },
  { name: "马斯特加热复核方案", code: "MST-HEAT", desc: "初筛 NG 后进入加热复核模型二次判断", version: "V1.2.0", status: "待发布", create: "2026-06-25 14:06", update: "2026-07-02 16:18" },
  { name: "供应商 A 批次校验方案", code: "MST-SUP-A", desc: "供应商 A 批量来料检测参数校验", version: "V0.9.6", status: "草稿", create: "2026-06-28 10:44", update: "2026-07-01 09:32" }
];

const versions = [
  { no: "V1.4.2", code: "MST-XRAY-20260703", desc: "新增回流样本补充判定标准", status: "已发布", create: "2026-07-03 10:26", update: "2026-07-03 10:26", clients: 3 },
  { no: "V1.4.1", code: "MST-XRAY-20260702", desc: "ROI 裁图参数优化", status: "待发布", create: "2026-07-02 16:42", update: "2026-07-02 17:18", clients: 0 },
  { no: "V1.3.8", code: "MST-XRAY-20260628", desc: "供应商 A 批次初筛模型", status: "已归档", create: "2026-06-28 11:10", update: "2026-06-29 09:35", clients: 2 }
];

const imageFolders = [
  { name: "供应商A_X光原图", count: 428, type: "原图", update: "2026-07-03 09:48" },
  { name: "ROI裁图_初筛训练集", count: 386, type: "ROI裁图", update: "2026-07-03 10:12" },
  { name: "缺陷样本_复核训练集", count: 34, type: "训练样本", update: "2026-07-02 18:40" }
];

const models = [
  { name: "X光缺陷初筛模型", scene: "缺陷检测", source: "ROI裁图_初筛训练集", status: "已验证", score: "98.6%" },
  { name: "加热复核分类模型", scene: "分类", source: "初筛模型输出", status: "训练中", score: "92.4%" },
  { name: "漏检补充判定模型", scene: "缺陷检测", source: "待回流_漏检样本", status: "待训练", score: "-" }
];

const modelVersions = [
  { code: "2026070355195", create: "2026-07-03 13:27:55", status: "待训练", done: "-", spend: "-" },
  { code: "2026070306408", create: "2026-07-03 11:22:06", status: "训练完成", done: "2026-07-03 11:32:32", spend: "2分钟51秒" },
  { code: "2026070354516", create: "2026-07-03 11:15:54", status: "训练完成", done: "2026-07-03 11:19:07", spend: "3分钟8秒" },
  { code: "2026070336923", create: "2026-07-03 10:27:36", status: "训练完成", done: "2026-07-03 11:01:46", spend: "6分钟9秒" },
  { code: "2026070316551", create: "2026-07-03 10:09:16", status: "待训练", done: "-", spend: "-" }
];

function statusClass(status) {
  if (["已发布", "已验证", "在线", "已入库", "已归档"].includes(status)) return "ok";
  if (["待发布", "训练中", "待回流", "待复核"].includes(status)) return "warn";
  return "bad";
}

function nowText() {
  return "2026-07-05 19:30";
}

function selectedScheme() {
  return schemes[state.selectedSchemeIndex] || schemes[0];
}

function selectedFolder() {
  return imageFolders[state.selectedFolderIndex] || imageFolders[0];
}

function folderFiles(folder = selectedFolder()) {
  return Array.from({ length: Math.min(folder.count, 10) }, (_, index) => ({
    name: `20260702_101${index + 5}15843_1${index % 2 ? "" : " - 副本"}.jpg`,
    size: "3072 × 2048",
    device: "MV-CS060-10GM",
    tag: index % 3 === 0 ? "缺陷" : "",
    update: `2026-07-02 10:${String(15 + index).padStart(2, "0")}:51`
  }));
}

function visibleSchemes() {
  return schemes.filter(item => {
    const keywordHit = !state.schemeKeyword || item.name.includes(state.schemeKeyword) || item.code.includes(state.schemeKeyword);
    const statusHit = state.schemeStatus === "全部状态" || item.status === state.schemeStatus;
    return keywordHit && statusHit;
  });
}

function visibleVersions() {
  return versions.filter(item => {
    const keywordHit = !state.versionKeyword || item.no.includes(state.versionKeyword) || item.code.includes(state.versionKeyword) || item.desc.includes(state.versionKeyword);
    const statusHit = state.versionStatus === "全部状态" || item.status === state.versionStatus;
    return keywordHit && statusHit;
  });
}

function renderShell() {
  nav.innerHTML = menus.map(item => `
    <button class="${state.page === item.id ? "active" : ""}" data-page="${item.id}">${item.title}</button>
  `).join("");

  nav.querySelectorAll("[data-page]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.page = btn.dataset.page;
      if (state.page !== "images") state.selectedFolderIndex = null;
      render();
    });
  });
}

function pageFrame(title, crumb, body, actions = "") {
  return `
    <section class="matrix-page">
      <div class="matrix-breadcrumb">${crumb}</div>
      <div class="matrix-page-head">
        <h1>${title}</h1>
        <div class="actions">${actions}</div>
      </div>
      ${body}
    </section>
  `;
}

function home() {
  return `
    <section class="matrix-home">
      <div class="matrix-hero">
        <div>
          <h1>点击开启 AI 智能检测之旅</h1>
          <p>更准确，更高效，更适合马斯特来料 X 光质检的检测方案配置方式</p>
        </div>
        <button class="matrix-scene-card" data-page="plans">
          <span class="scene-icon">AI</span>
          <strong>马斯特场景</strong>
          <em>工作流配置、模型训练、方案发布一体化</em>
        </button>
      </div>

      <div class="matrix-dashboard">
        <div class="matrix-section">
          <h2>我的终端</h2>
          <div class="summary-strip"><b>6</b><span>个</span><strong>终端</strong></div>
          <div class="terminal-grid">
            ${["xxma", "Ww", "客户A03", "供应商复检线", "MST-Lab", "Demo-PC"].map((name, index) => `
              <button class="matrix-terminal" data-page="clients">
                <span><strong>${name}</strong><small>绑定时间：2026-07-0${Math.min(index + 1, 3)} 15:19:07</small></span>
                <em class="${index === 2 ? "online" : ""}">${index === 2 ? "在线" : "离线"}</em>
              </button>
            `).join("")}
          </div>
        </div>

        <div class="matrix-section">
          <h2>我的图像库</h2>
          <div class="summary-strip"><b>33</b><span>个图片集</span><i></i><b>1300</b><span>张图像</span></div>
          <div class="matrix-folder-grid">
            ${imageFolders.map((folder, index) => folderCard(folder, index)).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function folderCard(folder, index) {
  return `
    <button class="matrix-folder-card" data-action="openFolder" data-index="${index}">
      <strong>${folder.name}</strong>
      <span>${folder.count} 张图片</span>
      <div class="folder-preview ${folder.type === "ROI裁图" ? "crop" : ""}"></div>
    </button>
  `;
}

function plans() {
  const rows = visibleSchemes().map((item, index) => {
    const realIndex = schemes.indexOf(item);
    return `
    <tr>
      <td>${index + 1}</td>
      <td>${item.name}</td>
      <td>${item.desc}</td>
      <td>${item.create}</td>
      <td>${item.update}</td>
      <td>
        <button class="link-btn" data-action="editScheme" data-index="${realIndex}">编辑</button>
        <button class="link-btn" data-action="openScheme" data-index="${realIndex}">编辑查看</button>
        <button class="link-btn danger" data-action="askDeleteScheme" data-index="${realIndex}">删除</button>
      </td>
    </tr>
  `;
  }).join("") || `<tr><td colspan="6">暂无匹配方案</td></tr>`;

  return pageFrame("方案管理", "首页 / 方案管理", `
    <div class="matrix-toolbar">
      <div class="filters">
        <input class="matrix-input" data-field="schemeKeyword" placeholder="请输入方案名称" value="${state.schemeKeyword}" />
      </div>
      <div class="actions">
        <button class="matrix-btn" data-action="resetSchemes">重置</button>
        <button class="matrix-btn primary" data-action="querySchemes">查询</button>
        <button class="matrix-btn primary" data-action="newScheme">新建方案</button>
      </div>
    </div>
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead><tr><th>序号</th><th>方案名称</th><th>方案描述</th><th>创建时间</th><th>修改时间</th><th>操作</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${pagination(visibleSchemes().length)}
  `);
}

function planDetail() {
  const scheme = selectedScheme();
  return pageFrame(scheme.name, `方案管理 ＞ ${scheme.name}`, `
    ${versionTable()}
  `, `
    <button class="matrix-btn" data-page="plans">返回</button>
  `);
}

function versionTable() {
  const rows = visibleVersions().map((item, index) => {
    const realIndex = versions.indexOf(item);
    return `
      <tr>
        <td>${index + 1}</td>
        <td>${item.code}</td>
        <td>${item.desc}</td>
        <td><span class="state ${statusClass(item.status)}">${item.status}</span></td>
        <td>${item.create}</td>
        <td>${item.update}</td>
        <td>
          <button class="link-btn" data-action="openWorkflow" data-index="${realIndex}">编辑查看</button>
          ${item.status !== "已发布" ? `<button class="link-btn" data-action="publishVersion" data-index="${realIndex}">发布</button>` : ""}
          <button class="link-btn" data-action="downloadVersion" data-index="${realIndex}">下载</button>
          <button class="link-btn danger" data-action="askDeleteVersion" data-index="${realIndex}">删除</button>
        </td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="7">暂无匹配版本</td></tr>`;

  return `
    <div class="matrix-toolbar">
      <div class="filters">
        <input class="matrix-input" data-field="versionKeyword" placeholder="请输入版本编号/描述" value="${state.versionKeyword}" />
        <select class="matrix-input" data-field="versionStatus">
          ${["全部状态", "已发布", "待发布", "已归档"].map(item => `<option ${state.versionStatus === item ? "selected" : ""}>${item}</option>`).join("")}
        </select>
      </div>
      <div class="actions">
        <button class="matrix-btn" data-action="resetVersions">重置</button>
        <button class="matrix-btn primary" data-action="queryVersions">查询</button>
        <button class="matrix-btn primary" data-action="newVersion">新建版本</button>
      </div>
    </div>
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead><tr><th>序号</th><th>方案编号</th><th>版本描述</th><th>方案状态</th><th>创建时间</th><th>修改时间</th><th>操作</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${pagination(visibleVersions().length)}
  `;
}

function workflowDetail() {
  const scheme = selectedScheme();
  const version = versions[state.selectedVersionIndex] || versions[0];
  return pageFrame(`${scheme.name} · ${version.no}`, `方案管理 ＞ ${scheme.name} ＞ ${version.code} ＞ 工作流编辑`, `
    <div class="workflow-iconbar">
      <button title="退出" data-action="exitWorkflow"><span>⇱</span>退出</button>
      <button title="保存" data-action="saveWorkflow"><span>▣</span>保存</button>
      <button title="发布" data-action="publishCurrentVersion"><span>◢</span>发布</button>
    </div>
    ${workflowDesigner()}
  `);
}

function workflowDesigner() {
  const scheme = selectedScheme();
  const version = versions[state.selectedVersionIndex] || versions[0];
  return `
    <div class="workflow-detail">
      <div class="workflow-summary">
        <div class="summary-fields">
          <span>方案名称</span><strong>${scheme.name}</strong>
          <span>版本编号</span><strong>${version.code}</strong>
          <span>创建时间</span><strong>${version.create}</strong>
          <span>修改时间</span><strong>${version.update}</strong>
          <span>方案描述</span><input class="matrix-input wide" value="${scheme.desc}" />
        </div>
        <div class="summary-actions">
          <span class="state ${statusClass(version.status)}">${version.status === "已发布" ? "已发布" : "未发布"}</span>
          <button class="matrix-btn primary" data-modal="flowType">新增流程</button>
        </div>
      </div>

      ${state.workflowFlows.map(flow => workflowFlowCard(flow)).join("")}
    </div>
  `;
}

function flowOptions(type) {
  const list = state.workflowFlows.filter(flow => flow.type === type);
  return list.map(flow => `<option>${flow.name}</option>`).join("") || `<option>暂无可选前置流程</option>`;
}

function workflowFlowCard(flow) {
  if (flow.type === "instance") return `
    <section class="workflow-section active-flow" data-flow-id="${flow.id}">
      <div class="workflow-card-actions"><button>编辑</button><button data-action="deleteFlow" data-index="${flow.id}">删除</button></div>
      <div class="flow-basic">
        <label>流程名称<input class="matrix-input" value="${flow.name}" /></label>
        <label>实例名称<input class="matrix-input" value="X光检测" /></label>
        <label>实例采集方式<select class="matrix-input"><option>${flow.input}</option><option>图像库选择</option><option>接口</option><option>相机</option></select></label>
      </div>
    </section>
  `;
  if (flow.type === "process") return processFlowCard(flow);
  if (flow.type === "detect") return detectFlowCard(flow);
  return judgeFlowCard(flow);
}

function processFlowCard(flow) {
  const isManual = flow.method === "手动绘制检测区域";
  const hasInstancePrev = state.workflowFlows.some(item => item.type === "instance");
  return `
    <section class="workflow-card active-flow ${isManual ? "manual" : "model"}" data-flow-id="${flow.id}">
      <div class="workflow-card-actions"><button>编辑</button><button data-action="deleteFlow" data-index="${flow.id}">删除</button></div>
      <div class="workflow-form-grid">
        <label>处理流程名称<input class="matrix-input" value="${flow.name}" /></label>
        <label>前置流程<select class="matrix-input">${flowOptions("instance")}</select></label>
        ${hasInstancePrev ? `<label>选择图像实例<select class="matrix-input"><option>X光检测</option><option>客户端上传实例</option></select></label>` : ""}
        ${isManual ? `<div class="score-buttons"><button>4等分</button><button>6等分</button><button>8等分</button></div>` : ""}
        <label>处理方式<select class="matrix-input" data-action="toggleProcessMethod" data-index="${flow.id}"><option>${flow.method}</option><option>${isManual ? "模型识别检测区域" : "手动绘制检测区域"}</option></select></label>
        ${!isManual ? `<label>模型<input class="matrix-input" placeholder="请选择模型" /></label><button class="matrix-btn model-pick">选择模型</button>` : ""}
      </div>
      ${isManual ? workflowCanvas() : ""}
    </section>
  `;
}

function detectFlowCard(flow) {
  return `
    <section class="workflow-card compact active-flow" data-flow-id="${flow.id}">
      <div class="workflow-card-actions"><button>编辑</button><button data-action="deleteFlow" data-index="${flow.id}">删除</button></div>
      <div class="workflow-form-grid">
        <label>检测项名称<input class="matrix-input" value="${flow.name}" /></label>
        <label>前置流程<select class="matrix-input">${flowOptions("process")}</select></label>
        <label class="target-tabs">选择检测对象<span><button>对象A</button><button>对象B</button></span></label>
        <label>模型<input class="matrix-input" placeholder="请选择模型" /></label>
        <button class="matrix-btn model-pick">选择模型</button>
      </div>
    </section>
  `;
}

function judgeFlowCard(flow) {
  return `
    <section class="workflow-card active-flow judge-flow" data-flow-id="${flow.id}">
      <div class="workflow-card-actions"><button>编辑</button><button data-action="deleteFlow" data-index="${flow.id}">删除</button></div>
      <div class="workflow-form-grid">
        <label>判断流程名称<input class="matrix-input" value="${flow.name}" /></label>
        <label>前置流程<select class="matrix-input">${flowOptions("detect")}</select></label>
        <label class="target-tabs">检测项<span><button>检测项A</button><button>检测项B</button></span></label>
      </div>

      <div class="rules-panel">
        <div class="rule-group">
          <div class="rule-title"><strong>检测项A</strong><span class="tag">缺陷</span><select class="matrix-input small"><option>任一满足</option></select></div>
          <p>OK判定条件</p>
          <div class="rule-line"><select class="matrix-input"><option>缺陷</option></select><select class="matrix-input"><option>数量=</option></select><button>-</button><span>0</span><button>+</button></div>
        </div>
        <div class="rule-group">
          <div class="rule-title"><strong>检测项B</strong><span class="tag">分类</span><button class="matrix-btn">新增条件</button></div>
          <p>OK判定条件</p>
          <div class="rule-line"><select class="matrix-input"><option>类别1</option></select><select class="matrix-input"><option>数量=</option></select><button>-</button><span>0</span><button>+</button><button class="link-btn danger">删除</button></div>
          <div class="rule-line"><select class="matrix-input"><option>类别2</option></select><select class="matrix-input"><option>数量=</option></select><button>-</button><span>0</span><button>+</button><button class="link-btn danger">删除</button></div>
        </div>
        <div class="rule-group">
          <div class="rule-title"><strong>检测项C</strong><span class="tag">尺寸</span><select class="matrix-input small"><option>全部满足</option></select></div>
          <p>OK判定条件</p>
          <div class="size-line"><span>尺寸项</span><input class="matrix-input" value="尺寸项A" /><span>下限</span><input class="matrix-input" value="0" /><span>上限</span><input class="matrix-input" value="99" /></div>
          <div class="size-line"><span>尺寸项</span><input class="matrix-input" value="尺寸项B" /><span>下限</span><input class="matrix-input" value="0" /><span>上限</span><input class="matrix-input" value="99" /></div>
        </div>
      </div>
    </section>
  `;
}

function workflowCanvas() {
  return `
    <div class="region-editor">
      <div class="editor-tools">
        <button>＋</button><button>－</button><button>▣</button><button>拖拽</button><button>显示</button><button>框选</button><button>撤销</button><button>重做</button>
      </div>
      <div class="region-legend"><span class="green"></span>检测区域 <span class="red"></span>不检测区域</div>
      <div class="image-stage">
        <div class="image-placeholder">
          <div class="mountain"></div>
          <div class="sun"></div>
        </div>
      </div>
    </div>
  `;
}

function images() {
  if (state.selectedFolderIndex !== null) return imageFolderDetail();
  return pageFrame("图像库", "首页 / 图像库", `
    <div class="matrix-toolbar">
      <div class="view-switch">
        <button class="${state.viewMode === "table" ? "active" : ""}" data-view="table">列表</button>
        <button class="${state.viewMode === "grid" ? "active" : ""}" data-view="grid">网格</button>
      </div>
      <div class="actions">
        <button class="matrix-btn primary" data-modal="folder">新建文件夹</button>
      </div>
    </div>
    ${state.viewMode === "grid" ? `<div class="matrix-folder-grid wide">${imageFolders.map((folder, index) => folderCard(folder, index)).join("")}</div>` : imageTable()}
  `);
}

function imageTable() {
  return `
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead><tr><th>名称</th><th>图像类型</th><th>图像数量</th><th>更新时间</th><th>操作</th></tr></thead>
        <tbody>
          ${imageFolders.map((folder, index) => `
            <tr>
              <td><button class="link-btn strong" data-action="openFolder" data-index="${index}">${folder.name}</button></td>
              <td>${folder.type}</td>
              <td>${folder.count}</td>
              <td>${folder.update}</td>
              <td>
                <button class="link-btn" data-action="openFolder" data-index="${index}">打开</button>
                <button class="link-btn" data-action="editFolder" data-index="${index}">修改</button>
                <button class="link-btn" data-action="exportFolder" data-index="${index}">导出</button>
                <button class="link-btn danger" data-action="deleteFolder" data-index="${index}">删除</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    ${pagination()}
  `;
}

function imageFolderDetail() {
  const folder = selectedFolder();
  const files = folderFiles(folder);

  return pageFrame(folder.name, `首页 / 图像库 / ${folder.name}`, `
    <div class="folder-detail-head">
      <button class="back-icon" data-action="backToImageRoot">‹</button>
      <h2>${folder.name}</h2>
    </div>
    <div class="folder-detail-toolbar">
      <div class="view-switch compact">
        <button class="active">☷</button><button>▦</button>
      </div>
      <button class="matrix-btn">☑ 批量处理</button>
      <select class="matrix-input"><option></option><option>全部设备</option><option>MV-CS060-10GM</option></select>
      <select class="matrix-input"><option>请选择标签</option><option>缺陷</option><option>OK</option></select>
      <button class="matrix-btn">◇ 标签库</button>
      <button class="matrix-btn primary" data-modal="upload">⊕ 上传图像</button>
    </div>
    <div class="matrix-table-wrap">
      <table class="matrix-table image-file-table">
        <thead><tr><th>名称</th><th>图像尺寸</th><th>采集时间</th><th>采集设备</th><th>标签</th><th>操作</th></tr></thead>
        <tbody>
          ${files.map((file, index) => `
            <tr>
              <td><span class="thumb-mini"></span><button class="link-btn strong" data-action="viewImageDetail" data-index="${index}">${file.name}</button></td>
              <td>${file.size}</td>
              <td>${file.update}</td>
              <td>${file.device}</td>
              <td>${file.tag}</td>
              <td><button class="link-btn danger">删除</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    ${pagination(files.length)}
  `);
}

function modelsPage() {
  return pageFrame("模型管理", "首页 / 模型管理 / 快捷模型", `
    <div class="model-layout-matrix">
      <aside class="matrix-submenu">
        <h3>模型管理</h3>
        <button class="active">快捷模型</button>
        <button>训练记录</button>
      </aside>
      <main>
        <div class="matrix-toolbar">
          <div class="filters">
            <select class="matrix-input"><option>全部场景类型</option><option>缺陷检测</option><option>分类</option></select>
            <input class="matrix-input" placeholder="请输入模型名称" />
          </div>
          <div class="actions">
            <button class="matrix-btn">重置</button>
            <button class="matrix-btn primary">查询</button>
            <button class="matrix-btn primary" data-modal="model">新建模型</button>
          </div>
        </div>
        <div class="matrix-table-wrap">
          <table class="matrix-table">
            <thead><tr><th>序号</th><th>模型名称</th><th>场景类型</th><th>训练图像源</th><th>状态</th><th>准确率</th><th>操作</th></tr></thead>
            <tbody>
              ${models.map((model, index) => `
                <tr><td>${index + 1}</td><td>${model.name}</td><td>${model.scene}</td><td>${model.source}</td><td><span class="state ${statusClass(model.status)}">${model.status}</span></td><td>${model.score}</td><td><button class="link-btn" data-action="openModelVersions" data-index="${index}">训练记录</button><button class="link-btn danger" data-action="deleteModel" data-index="${index}">删除</button></td></tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        ${pagination()}
      </main>
    </div>
  `);
}

function modelVersionsPage() {
  const model = models[state.selectedModelIndex] || models[0];
  return pageFrame(model.name, `模型管理 ＞ 快捷模型 ＞ ${model.name}`, `
    <div class="matrix-toolbar">
      <button class="matrix-btn" data-page="models">‹ 返回</button>
      <div class="actions"><button class="matrix-btn primary" data-action="createModelTraining">⊕ 新建训练</button></div>
    </div>
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead><tr><th>序号</th><th>模型编号</th><th>创建时间</th><th>状态</th><th>完成信息</th><th>操作</th></tr></thead>
        <tbody>
          ${modelVersions.map((item, index) => `
            <tr>
              <td>${index + 1}</td><td>${item.code}</td><td>${item.create}</td>
              <td><span class="state ${item.status === "训练完成" ? "ok" : "warn"}">${item.status}</span></td>
              <td>${item.done === "-" ? "-" : `完成时间：${item.done}　训练耗时：${item.spend}`}</td>
              <td><button class="link-btn" data-action="openTrain" data-index="${index}">查看</button><button class="link-btn" data-action="openModelTest" data-index="${index}">测试</button><button class="link-btn" data-action="downloadModelVersion" data-index="${index}">下载</button><button class="link-btn" data-action="moreModelVersion" data-index="${index}">更多</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    ${pagination(modelVersions.length)}
  `);
}

function train() {
  return pageFrame("训练", "模型管理 ＞ 快捷模型 ＞ kakou ＞ 训练", `
    <div class="model-workbench-head"><button class="matrix-btn" data-page="modelVersions">⇱ 退出训练</button><span class="tip">ⓘ 在每张图像上把检测目标标注出来~</span><button class="matrix-btn primary" data-modal="modelSource">关联模型</button><button class="matrix-btn primary" data-modal="upload">添加图像</button><button class="matrix-btn primary" data-action="startTraining">开始训练</button></div>
    ${modelWorkbench(false)}
  `);
}

function modelTest() {
  return pageFrame("测试", "模型管理 ＞ 快捷模型 ＞ X光 ＞ 测试", `
    <div class="model-workbench-head"><button class="matrix-btn" data-page="modelVersions">⇱ 退出测试</button><span class="tip">ⓘ 请选择测试图像开始测试，测试完成后，可批量下载结果图像。</span><button class="matrix-btn primary" data-modal="upload">添加图像</button><button class="matrix-btn primary" data-action="batchModelTest">开始测试</button></div>
    ${modelWorkbench(true)}
  `);
}

function modelWorkbench(withResult) {
  const rows = Array.from({ length: 12 }, (_, index) => `
    <tr>${withResult ? `<td><input type="checkbox" /></td>` : ""}<td>No.${index + 1}</td><td>${withResult ? `${index + 11}.jpg` : `Image_20260501${index}.jpg`}</td>${withResult ? `<td><span class="state ${state.modelTestProcessed ? "ok" : "warn"}">${state.modelTestProcessed ? "检测完成" : "待测试"}</span></td>` : ""}<td><button class="link-btn danger">▥</button></td></tr>
  `).join("");
  return `
    <div class="model-workbench">
      <aside class="model-image-list">
        <div class="model-tabs ${withResult ? "single" : ""}"><button class="active">${withResult ? "测试图像 (25)" : "待处理 (80)"}</button>${withResult ? "" : "<button>已完成 (0)</button>"}</div>
        <table class="matrix-table"><thead><tr>${withResult ? "<th><input type=\"checkbox\" /></th>" : ""}<th>序号</th><th>名称</th>${withResult ? "<th>结果</th>" : ""}<th>操作</th></tr></thead><tbody>${rows}</tbody></table>
        ${withResult ? `
          <div class="model-test-actions">
            <button class="link-btn danger">删除（0）</button>
            <button class="link-btn" data-page="modelVersions">退出</button>
            <button class="matrix-btn primary soft-wide" data-action="batchModelTest">点击批量处理</button>
            <button class="matrix-btn primary soft-wide" data-action="exportTestResult">导出测试结果</button>
            <button class="matrix-btn primary soft-wide" data-action="saveTestToLibrary">保存测试结果至图像库</button>
          </div>
        ` : `<button class="link-btn strong">批量处理</button>`}
      </aside>
      <main class="model-preview-stage">
        <div class="editor-tools floating"><button>⊖</button><button>⊕</button><button>▣</button><button>拖拽</button><button>显示</button><button>框选</button><button>撤销</button><button>重做</button></div>
        <div class="xray-sample ${withResult ? "test" : "train"}">${withResult && state.modelTestProcessed ? `<div class="det-box a">零件-1.00</div><div class="det-box b">零件-1.00</div><div class="det-box c">零件-1.00</div><div class="det-box d">零件-1.00</div>` : ""}</div>
        ${withResult ? "" : `<button class="finish-mark">✓ 完成<span>点击按钮保存</span></button>`}
      </main>
    </div>
  `;
}


function clients() {
  return pageFrame("客户端管理", "首页 / 客户端管理", `
    <div class="matrix-table-wrap">
      <table class="matrix-table">
        <thead><tr><th>终端名称</th><th>绑定时间</th><th>当前方案</th><th>同步状态</th><th>在线状态</th><th>操作</th></tr></thead>
        <tbody>
          <tr><td>客户A03</td><td>2026-07-03 08:12</td><td>MST-XRAY V1.4.2</td><td><span class="state ok">已同步</span></td><td><span class="state ok">在线</span></td><td><button class="link-btn">同步方案</button><button class="link-btn">查看记录</button></td></tr>
          <tr><td>xxma</td><td>2026-06-22 15:19</td><td>MST-XRAY V1.3.8</td><td><span class="state warn">待同步</span></td><td><span class="state warn">离线</span></td><td><button class="link-btn">同步方案</button></td></tr>
          <tr><td>供应商复检线</td><td>2026-06-28 13:40</td><td>MST-HEAT V1.2.0</td><td><span class="state ok">已同步</span></td><td><span class="state warn">离线</span></td><td><button class="link-btn">查看记录</button></td></tr>
        </tbody>
      </table>
    </div>
  `, `<button class="matrix-btn primary">绑定终端</button>`);
}

function pagination(total = 15) {
  return `<div class="matrix-pagination"><span>共 ${total} 条</span><button>‹</button><button class="active">1</button><button>2</button><button>›</button></div>`;
}

function modal() {
  if (!state.modal) return "";
  const titles = {
    schemeCreate: "新建方案",
    schemeEdit: "编辑方案",
    versionCreate: "新建版本",
    versionEdit: "编辑查看版本",
    deleteScheme: "删除方案",
    deleteVersion: "删除版本",
    publish: "发布方案",
    folder: "新建文件夹",
    folderEdit: "修改文件夹",
    flowType: "新增流程",
    upload: "上传图片",
    uploadProcess: "图像列表",
    crop: "ROI 裁图",
    imageDetail: "图片详情",
    model: "新建模型",
    modelSource: "选择训练图像源"
  };

  const scheme = selectedScheme();
  const version = versions[state.selectedVersionIndex] || versions[0];

  let confirmAction = "";
  let confirmText = "确认";
  const files = folderFiles();
  const imageDetail = files[state.selectedImageIndex] || files[0];
  const cropStyle = state.cropRect ? `left:${state.cropRect.x}%;top:${state.cropRect.y}%;width:${state.cropRect.w}%;height:${state.cropRect.h}%;` : "";
  let body = state.modal === "flowType" ? `
    <div class="flow-type-grid">
      <button data-action="addFlow" data-type="instance">新增实例流程<span>无前置流程，作为工作流输入</span></button>
      <button data-action="addFlow" data-type="process">处理流程<span>前置流程仅可选择实例流程</span></button>
      <button data-action="addFlow" data-type="detect">检测流程<span>前置流程仅可选择处理流程</span></button>
      <button data-action="addFlow" data-type="judge">规则判断流程<span>前置流程仅可选择检测流程</span></button>
    </div>
  ` : state.modal === "crop" ? `
    <div class="xray-editor modal-preview"><div class="roi-box"></div><div class="defect-box box-a"></div></div>
    <p class="modal-note">保留原图，裁剪结果保存到指定图像库文件夹，可作为模型训练输入。</p>
  ` : state.modal === "upload" ? `
    <div class="upload-select-modal">
      <button class="upload-drop-zone" data-action="confirmUploadSelect">
        <span>▧</span>
        <strong>点击上传图像</strong>
        <em>或拖拽文件到此处</em>
      </button>
      <button class="upload-drop-zone" data-action="confirmUploadSelect">
        <span>▤</span>
        <strong>点击上传压缩包</strong>
        <em>或拖拽文件到此处</em>
      </button>
    </div>
  ` : state.modal === "uploadProcess" ? `
    <div class="upload-process-modal">
      <aside>
        <strong>图像列表</strong>
        <table class="matrix-table"><thead><tr><th></th><th>图片名称</th><th>状态</th><th>操作</th></tr></thead><tbody><tr><td><input type="checkbox" checked /></td><td>00000.jpg</td><td>${state.cropApplied ? '<span class="crop-result-badge">已裁图</span>' : '-'}</td><td><button class="link-btn danger">删除</button></td></tr><tr><td><input type="checkbox" checked /></td><td>00001.jpg</td><td>${state.cropApplied ? '<span class="crop-result-badge">已裁图</span>' : '-'}</td><td><button class="link-btn danger">删除</button></td></tr><tr><td><input type="checkbox" checked /></td><td>00002.jpg</td><td>${state.cropApplied ? '<span class="crop-result-badge">已裁图</span>' : '-'}</td><td><button class="link-btn danger">删除</button></td></tr></tbody></table>
        <button class="matrix-btn" data-action="toggleCropMode">${state.cropMode ? "退出裁图" : "裁图"}</button>
        <button class="matrix-btn" data-action="applyCropToAll" ${state.cropRect ? "" : "disabled"}>同步至全部图片</button>
        <button class="matrix-btn" data-action="clearCrop">重置裁图</button>
      </aside>
      <main>
        <div class="upload-preview-tools"><button data-action="toggleCropMode">✂</button><button data-action="clearCrop">▣</button><button data-action="applyCropToAll">☑</button></div>
        <div class="image-stage upload-preview-stage">
          <div class="image-placeholder">
            <div class="mountain"></div>
            <div class="sun"></div>
          </div>
          <div id="crop-overlay" class="crop-overlay ${state.cropMode ? "active" : ""}">
            ${state.cropRect ? `<div id="crop-selection" class="crop-selection" style="${cropStyle}"></div>` : ""}
          </div>
          <span>此处显示左侧列表选中图片</span>
        </div>
        <div class="upload-process-actions">
          <button class="matrix-btn" data-close>取消添加</button>
          <button class="matrix-btn primary" data-action="confirmUploadProcess">确定添加</button>
        </div>
      </main>
    </div>
  ` : state.modal === "imageDetail" ? `
    <div class="image-detail-body">
      <div class="image-stage">
        <div class="image-placeholder">
          <div class="mountain"></div>
          <div class="sun"></div>
        </div>
      </div>
      <aside class="image-detail-info">
        <h3>${imageDetail?.name || "图片"}</h3>
        <p><span>图片尺寸</span><strong>${imageDetail?.size || "-"}</strong></p>
        <p><span>采集时间</span><strong>${imageDetail?.update || "-"}</strong></p>
        <p><span>采集设备</span><strong>${imageDetail?.device || "-"}</strong></p>
        <p><span>标签</span><strong>${imageDetail?.tag || "未标注"}</strong></p>
        <p><span>所在文件夹</span><strong>${selectedFolder().name}</strong></p>
      </aside>
    </div>
  ` : state.modal === "folderEdit" ? `
    <label>文件夹名称<input class="matrix-input" value="${selectedFolder().name}" /></label>
    <label>图像类型<select class="matrix-input"><option>${selectedFolder().type}</option><option>原图</option><option>ROI裁图</option><option>训练样本</option></select></label>
    <label>描述<textarea class="matrix-input" rows="4">用于马斯特 X 光检测流程的图像文件夹。</textarea></label>
  ` : state.modal === "modelSource" ? `
    <label>模型<select class="matrix-input"><option>X光缺陷初筛模型 · 已完成</option><option>加热复核分类模型 · 已完成</option></select></label>
    <label>关联图片<select class="matrix-input"><option>NG 缺陷样本</option><option>OK 正常样本</option><option>全部标签类别</option></select></label>
    <label>保存到<input class="matrix-input" value="ROI裁图_初筛训练集" /></label>
    <label class="check-line"><input type="checkbox" /> 保存至图像库</label>
    <p class="modal-note">可关联已完成模型的标签类别或处理结果图片，导入后作为当前模型训练数据。</p>
  ` : state.modal === "model" ? `
    <label>模型名称<input id="modelName" class="matrix-input" value="马斯特新建检测模型" /></label>
    <label>场景类型<select id="modelScene" class="matrix-input"><option>缺陷检测</option><option>分类</option><option>尺寸检测</option></select></label>
    <label>训练图像源<input id="modelSourceInput" class="matrix-input" value="ROI裁图_初筛训练集" /></label>
    <label>描述<textarea id="modelDesc" class="matrix-input" rows="4">用于马斯特场景的新建模型。</textarea></label>
  ` : state.modal === "schemeCreate" ? `
    <label>方案名称<input class="matrix-input" value="马斯特新检测方案" /></label>
    <label>方案描述<textarea class="matrix-input" rows="4">用于马斯特场景的新增检测方案，可继续进入详情配置版本。</textarea></label>
    <label>方案状态<select class="matrix-input"><option>草稿</option><option>待发布</option></select></label>
  ` : state.modal === "schemeEdit" ? `
    <label>方案名称<input class="matrix-input" value="${scheme.name}" /></label>
    <label>方案描述<textarea class="matrix-input" rows="4">${scheme.desc}</textarea></label>
    <label>方案状态<select class="matrix-input"><option ${scheme.status === "草稿" ? "selected" : ""}>草稿</option><option ${scheme.status === "待发布" ? "selected" : ""}>待发布</option><option ${scheme.status === "已发布" ? "selected" : ""}>已发布</option></select></label>
  ` : state.modal === "versionCreate" ? `
    <label>版本描述<textarea class="matrix-input" rows="4">基于当前工作流新建一个待发布版本。</textarea></label>
    <label>关联版本<select class="matrix-input"><option>${versions[0]?.no || "V1.0.0"}</option><option>空白版本</option></select></label>
    <label class="check-line"><input type="checkbox" checked /> 同步当前工作流配置</label>
  ` : state.modal === "versionEdit" ? `
    <label>方案编号<input class="matrix-input" value="${version.code}" /></label>
    <label>版本描述<textarea class="matrix-input" rows="4">${version.desc}</textarea></label>
    <label>方案状态<select class="matrix-input"><option ${version.status === "待发布" ? "selected" : ""}>待发布</option><option ${version.status === "已发布" ? "selected" : ""}>已发布</option><option ${version.status === "已归档" ? "selected" : ""}>已归档</option></select></label>
  ` : state.modal === "deleteScheme" ? `
    <p class="modal-note">确认删除“${scheme.name}”？删除后列表中将不再显示该方案。</p>
  ` : state.modal === "deleteVersion" ? `
    <p class="modal-note">确认删除版本“${version.no}”？已发布版本建议先下载归档后再删除。</p>
  ` : state.modal === "publish" ? `
    <label>发布版本<select class="matrix-input"><option>${version.no} ${version.desc}</option><option>${versions[0]?.no || "V1.0.0"} ${versions[0]?.desc || ""}</option></select></label>
    <label>发布说明<textarea class="matrix-input" rows="4">发布后客户端可在同步方案时获取该版本。</textarea></label>
  ` : `
    <label>名称<input class="matrix-input" placeholder="请输入名称" /></label>
    <label>描述<textarea class="matrix-input" rows="4" placeholder="请输入描述"></textarea></label>
  `;

  if (state.modal === "schemeCreate") confirmAction = "confirmCreateScheme";
  if (state.modal === "schemeEdit") confirmAction = "confirmEditScheme";
  if (state.modal === "versionCreate") confirmAction = "confirmCreateVersion";
  if (state.modal === "versionEdit") confirmAction = "confirmEditVersion";
  if (state.modal === "folder") confirmAction = "confirmCreateFolder";
  if (state.modal === "folderEdit") confirmAction = "confirmEditFolder";
  if (state.modal === "model") confirmAction = "confirmCreateModel";
  if (state.modal === "upload") confirmAction = "confirmUploadSelect";
  if (state.modal === "uploadProcess") confirmAction = "confirmUploadProcess";
  if (state.modal === "deleteScheme" || state.modal === "deleteVersion") {
    confirmAction = "confirmDelete";
    confirmText = "删除";
  }
  if (state.modal === "publish") confirmAction = "confirmPublish";

  return `
    <div class="modal-mask show">
      <div class="matrix-modal">
        <header><h2>${titles[state.modal]}</h2><button data-close>×</button></header>
        <div class="matrix-modal-body">${body}</div>
        <footer>
          <button class="matrix-btn" data-close>取消</button>
          <button class="matrix-btn primary ${confirmText === "删除" ? "danger" : ""}" ${confirmAction ? `data-action="${confirmAction}"` : "data-close"}>${confirmText}</button>
        </footer>
      </div>
    </div>
  `;
}

const views = { home, plans, planDetail, workflowDetail, images, models: modelsPage, modelVersions: modelVersionsPage, train, modelTest, clients };

function bind() {
  view.querySelectorAll("[data-field]").forEach(el => {
    el.addEventListener("input", () => {
      state[el.dataset.field] = el.value;
    });
    el.addEventListener("change", () => {
      state[el.dataset.field] = el.value;
      render();
    });
  });
  view.querySelectorAll("[data-page]").forEach(el => {
    el.addEventListener("click", () => {
      state.page = el.dataset.page;
      if (state.page !== "images") state.selectedFolderIndex = null;
      render();
    });
  });
  view.querySelectorAll("[data-tab]").forEach(el => {
    el.addEventListener("click", () => {
      state.planTab = el.dataset.tab;
      state.page = el.dataset.tab === "workflow" ? "workflowDetail" : "planDetail";
      render();
    });
  });
  view.querySelectorAll("[data-view]").forEach(el => {
    el.addEventListener("click", () => {
      state.viewMode = el.dataset.view;
      render();
    });
  });
  view.querySelectorAll("[data-modal]").forEach(el => {
    el.addEventListener("click", () => {
      state.modal = el.dataset.modal;
      render();
    });
  });
  view.querySelectorAll("[data-action]").forEach(el => {
    el.addEventListener("click", () => {
      handleAction(el.dataset.action, el);
    });
  });
  view.querySelectorAll("[data-close]").forEach(el => {
    el.addEventListener("click", () => {
      state.modal = "";
      render();
    });
  });
  view.querySelectorAll("button").forEach(el => {
    const handled = ["action", "page", "modal", "close", "field", "tab", "view"].some(key => el.dataset[key] !== undefined);
    if (handled) return;
    el.addEventListener("click", event => {
      event.preventDefault();
      handlePassiveButton(el);
    });
  });
}

function handlePassiveButton(el) {
  const text = el.textContent.replace(/\s+/g, " ").trim();
  if (!text) {
    toast("操作已触发");
    return;
  }
  if (text.includes("删除")) {
    toast("删除操作已触发，演示数据未做持久删除");
    return;
  }
  if (text.includes("下载")) {
    toast("下载任务已创建");
    return;
  }
  if (text.includes("更多")) {
    toast("更多操作菜单已打开");
    return;
  }
  if (text.includes("选择模型")) {
    toast("已选择示例模型");
    return;
  }
  if (text.includes("开始训练")) {
    toast("训练任务已启动");
    return;
  }
  if (text.includes("完成")) {
    toast("当前图片标注已保存");
    return;
  }
  if (["＋", "⊕", "+", "−", "-", "⊖", "‹", "›", "1", "2"].includes(text)) {
    toast(`已触发 ${text} 操作`);
    return;
  }
  toast(`${text} 已触发`);
}

function handleAction(action, el) {
  const index = Number(el.dataset.index);

  if (action === "openFolder") {
    state.selectedFolderIndex = index;
    state.page = "images";
    render();
    return;
  }
  if (action === "backToImageRoot") {
    state.selectedFolderIndex = null;
    state.page = "images";
    render();
    return;
  }
  if (action === "editFolder") {
    state.selectedFolderIndex = index;
    state.modal = "folderEdit";
    render();
    return;
  }
  if (action === "editCurrentFolder") {
    state.modal = "folderEdit";
    render();
    return;
  }
  if (action === "exportFolder" || action === "exportCurrentFolder") {
    const folder = action === "exportFolder" ? imageFolders[index] : selectedFolder();
    toast(`${folder.name} 导出任务已创建`);
    return;
  }
  if (action === "deleteFolder" || action === "deleteCurrentFolder") {
    const targetIndex = action === "deleteFolder" ? index : state.selectedFolderIndex;
    const folder = imageFolders[targetIndex];
    if (folder) {
      imageFolders.splice(targetIndex, 1);
      state.selectedFolderIndex = null;
      state.page = "images";
      render();
      toast(`${folder.name} 已删除`);
    }
    return;
  }
  if (action === "confirmCreateFolder") {
    imageFolders.unshift({ name: "新建图像文件夹", count: 0, type: "原图", update: nowText() });
    state.selectedFolderIndex = 0;
    state.modal = "";
    render();
    toast("文件夹已创建");
    return;
  }
  if (action === "confirmEditFolder") {
    selectedFolder().update = nowText();
    state.modal = "";
    render();
    toast("文件夹已修改");
    return;
  }
  if (action === "confirmCreateModel") {
    const name = document.querySelector("#modelName")?.value.trim() || "马斯特新建检测模型";
    const scene = document.querySelector("#modelScene")?.value || "缺陷检测";
    const source = document.querySelector("#modelSourceInput")?.value.trim() || "ROI裁图_初筛训练集";
    models.unshift({ name, scene, source, status: "待训练", score: "-" });
    state.selectedModelIndex = 0;
    state.modal = "";
    render();
    toast("新建模型成功");
    return;
  }
  if (action === "confirmUploadSelect") {
    state.cropMode = false;
    state.cropRect = null;
    state.cropApplied = false;
    state.modal = "uploadProcess";
    render();
    return;
  }
  if (action === "confirmUploadProcess") {
    selectedFolder().count += 3;
    if (state.cropApplied) selectedFolder().type = "ROI裁图";
    selectedFolder().update = nowText();
    state.modal = "";
    render();
    toast(state.cropApplied ? "图片已按裁图结果添加" : "图片已添加");
    return;
  }
  if (action === "confirmUploadImages") {
    selectedFolder().count += 3;
    selectedFolder().update = nowText();
    state.modal = "";
    render();
    toast("图片已上传至当前文件夹");
    return;
  }
  if (action === "viewImageDetail") {
    state.selectedImageIndex = Number.isNaN(index) ? 0 : index;
    state.modal = "imageDetail";
    render();
    return;
  }
  if (action === "toggleCropMode") {
    state.cropMode = !state.cropMode;
    render();
    toast(state.cropMode ? "请在图片区域拖拽框选裁图范围" : "已退出裁图模式");
    return;
  }
  if (action === "applyCropToAll") {
    if (!state.cropRect) {
      toast("请先拖拽框选裁图范围");
      return;
    }
    state.cropApplied = true;
    state.cropMode = false;
    render();
    toast("裁图范围已同步至当前上传列表全部图片");
    return;
  }
  if (action === "clearCrop") {
    state.cropRect = null;
    state.cropApplied = false;
    state.cropMode = false;
    render();
    toast("裁图已重置");
    return;
  }
  if (action === "addFlow") {
    const type = el.dataset.type;
    const names = { instance: "图像获取实例", process: "处理流程", detect: "检测流程", judge: "规则判断流程" };
    const requiredPrev = { process: "instance", detect: "process", judge: "detect" }[type];
    if (requiredPrev && !state.workflowFlows.some(flow => flow.type === requiredPrev)) {
      const prevNames = { instance: "图像获取实例", process: "处理流程", detect: "检测流程" };
      toast(`请先新增${prevNames[requiredPrev]}`);
      return;
    }
    const nextId = Math.max(0, ...state.workflowFlows.map(flow => flow.id)) + 1;
    state.workflowFlows.push({
      id: nextId,
      type,
      name: `${names[type]}${nextId}`,
      input: "客户端上传",
      method: type === "process" ? "手动绘制检测区域" : undefined
    });
    state.modal = "";
    render();
    toast("流程已新增");
    return;
  }
  if (action === "deleteFlow") {
    const target = state.workflowFlows.find(flow => flow.id === index);
    const dependMap = { instance: "process", process: "detect", detect: "judge" };
    if (target && state.workflowFlows.some(flow => flow.type === dependMap[target.type])) {
      toast("该流程存在下游流程，请先删除下游流程");
      return;
    }
    state.workflowFlows = state.workflowFlows.filter(flow => flow.id !== index);
    render();
    toast("流程已删除");
    return;
  }
  if (action === "toggleProcessMethod") {
    const flow = state.workflowFlows.find(item => item.id === index);
    if (flow) flow.method = flow.method === "手动绘制检测区域" ? "模型识别检测区域" : "手动绘制检测区域";
    render();
    return;
  }
  if (action === "openModelVersions") {
    state.selectedModelIndex = index;
    state.page = "modelVersions";
    render();
    return;
  }
  if (action === "deleteModel") {
    const model = models[index];
    if (model) {
      models.splice(index, 1);
      state.selectedModelIndex = Math.max(0, Math.min(state.selectedModelIndex, models.length - 1));
      render();
      toast(`${model.name} 已删除`);
    }
    return;
  }
  if (action === "createModelTraining") {
    modelVersions.unshift({ code: String(Date.now()).slice(-13), create: nowText(), status: "待训练", done: "-", spend: "-" });
    state.selectedModelVersionIndex = 0;
    render();
    toast("新建训练记录成功");
    return;
  }
  if (action === "openTrain") {
    state.selectedModelVersionIndex = index;
    state.page = "train";
    render();
    return;
  }
  if (action === "openModelTest") {
    state.selectedModelVersionIndex = Number.isNaN(index) ? 0 : index;
    state.modelTestProcessed = false;
    state.page = "modelTest";
    render();
    return;
  }
  if (action === "batchModelTest") {
    state.modelTestProcessed = true;
    render();
    toast("测试批量处理完成");
    return;
  }
  if (action === "downloadModelVersion") {
    const item = modelVersions[index];
    toast(item ? `${item.code} 下载任务已创建` : "下载任务已创建");
    return;
  }
  if (action === "moreModelVersion") {
    toast("已打开训练记录更多操作");
    return;
  }
  if (action === "startTraining") {
    const item = modelVersions[state.selectedModelVersionIndex] || modelVersions[0];
    if (item) {
      item.status = "训练完成";
      item.done = nowText();
      item.spend = "2分钟51秒";
    }
    render();
    toast("训练完成，记录状态已更新");
    return;
  }
  if (action === "exportTestResult") {
    toast(state.modelTestProcessed ? "测试结果已导出" : "请先点击批量处理完成测试");
    return;
  }
  if (action === "saveTestToLibrary") {
    toast(state.modelTestProcessed ? "测试图片已保存至图像库" : "请先点击批量处理完成测试");
    return;
  }

  if (action === "saveWorkflow") {
    toast("工作流已保存");
    return;
  }
  if (action === "exitWorkflow") {
    state.page = "planDetail";
    render();
    return;
  }
  if (action === "publishCurrentVersion") {
    if (!state.workflowFlows.some(flow => flow.type === "instance") || !state.workflowFlows.some(flow => flow.type === "process") || !state.workflowFlows.some(flow => flow.type === "detect") || !state.workflowFlows.some(flow => flow.type === "judge")) {
      toast("工作流不完整，请补齐实例、处理、检测和规则流程");
      return;
    }
    const version = versions[state.selectedVersionIndex] || versions[0];
    version.status = "已发布";
    version.update = nowText();
    selectedScheme().status = "已发布";
    selectedScheme().version = version.no;
    selectedScheme().update = nowText();
    render();
    toast("当前版本已发布");
    return;
  }
  if (action === "newFlow") {
    toast("已新增流程配置区");
    return;
  }
  if (action === "resetSchemes") {
    state.schemeKeyword = "";
    state.schemeStatus = "全部状态";
    render();
    toast("筛选条件已重置");
    return;
  }
  if (action === "querySchemes") {
    render();
    toast(`查询到 ${visibleSchemes().length} 条方案`);
    return;
  }
  if (action === "newScheme") {
    state.modal = "schemeCreate";
    render();
    return;
  }
  if (action === "editScheme") {
    state.selectedSchemeIndex = index;
    state.modal = "schemeEdit";
    render();
    return;
  }
  if (action === "openScheme") {
    state.selectedSchemeIndex = index;
    state.planTab = "versions";
    state.page = "planDetail";
    render();
    return;
  }
  if (action === "askDeleteScheme") {
    state.selectedSchemeIndex = index;
    state.pendingDelete = { type: "scheme", index };
    state.modal = "deleteScheme";
    render();
    return;
  }
  if (action === "confirmCreateScheme") {
    schemes.unshift({
      name: "马斯特新检测方案",
      code: `MST-NEW-${schemes.length + 1}`,
      desc: "用于马斯特场景的新增检测方案，可继续进入详情配置版本。",
      version: "V1.0.0",
      status: "草稿",
      create: nowText(),
      update: nowText()
    });
    state.selectedSchemeIndex = 0;
    state.modal = "";
    render();
    toast("新建方案成功");
    return;
  }
  if (action === "confirmEditScheme") {
    const scheme = selectedScheme();
    scheme.desc = "已更新方案描述，可继续进入详情配置版本与工作流。";
    scheme.update = nowText();
    state.modal = "";
    render();
    toast("方案已保存");
    return;
  }

  if (action === "resetVersions") {
    state.versionKeyword = "";
    state.versionStatus = "全部状态";
    render();
    toast("版本筛选条件已重置");
    return;
  }
  if (action === "queryVersions") {
    render();
    toast(`查询到 ${visibleVersions().length} 条版本`);
    return;
  }
  if (action === "newVersion") {
    state.modal = "versionCreate";
    render();
    return;
  }
  if (action === "openWorkflow") {
    state.selectedVersionIndex = index;
    state.page = "workflowDetail";
    render();
    return;
  }
  if (action === "editVersion") {
    state.selectedVersionIndex = index;
    state.modal = "versionEdit";
    render();
    return;
  }
  if (action === "askDeleteVersion") {
    state.selectedVersionIndex = index;
    state.pendingDelete = { type: "version", index };
    state.modal = "deleteVersion";
    render();
    return;
  }
  if (action === "downloadVersion") {
    toast(`${versions[index].no} 下载任务已创建`);
    return;
  }
  if (action === "publishVersion") {
    state.selectedVersionIndex = index;
    state.modal = "publish";
    render();
    return;
  }
  if (action === "confirmCreateVersion") {
    const scheme = selectedScheme();
    versions.unshift({
      no: `V1.${versions.length + 2}.0`,
      code: `${scheme.code}-${nowText().slice(0, 10).replaceAll("-", "")}`,
      desc: "基于当前工作流新建的待发布版本",
      status: "待发布",
      create: nowText(),
      update: nowText(),
      clients: 0
    });
    scheme.version = versions[0].no;
    scheme.status = "待发布";
    scheme.update = nowText();
    state.selectedVersionIndex = 0;
    state.modal = "";
    render();
    toast("新建版本成功");
    return;
  }
  if (action === "confirmEditVersion") {
    versions[state.selectedVersionIndex].desc = "已更新版本描述，工作流配置可继续编辑查看";
    versions[state.selectedVersionIndex].update = nowText();
    state.modal = "";
    render();
    toast("版本已保存");
    return;
  }
  if (action === "confirmPublish") {
    if (!state.workflowFlows.some(flow => flow.type === "instance") || !state.workflowFlows.some(flow => flow.type === "process") || !state.workflowFlows.some(flow => flow.type === "detect") || !state.workflowFlows.some(flow => flow.type === "judge")) {
      state.modal = "";
      render();
      toast("工作流不完整，请补齐实例、处理、检测和规则流程");
      return;
    }
    const version = versions[state.selectedVersionIndex] || versions[0];
    version.status = "已发布";
    version.update = nowText();
    const scheme = selectedScheme();
    scheme.status = "已发布";
    scheme.version = version.no;
    scheme.update = nowText();
    state.modal = "";
    render();
    toast("方案已发布");
    return;
  }
  if (action === "confirmDelete") {
    if (state.pendingDelete?.type === "scheme") {
      schemes.splice(state.pendingDelete.index, 1);
      state.selectedSchemeIndex = 0;
      toast("方案已删除");
    }
    if (state.pendingDelete?.type === "version") {
      versions.splice(state.pendingDelete.index, 1);
      state.selectedVersionIndex = 0;
      toast("版本已删除");
    }
    state.pendingDelete = null;
    state.modal = "";
    render();
  }
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
  setTimeout(() => el.classList.remove("show"), 1600);
}

function initCropInteraction() {
  const overlay = document.querySelector("#crop-overlay");
  if (!overlay || !state.cropMode) return;
  let drawing = false;
  let start = null;

  const toPercent = event => {
    const rect = overlay.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
    };
  };

  overlay.addEventListener("mousedown", event => {
    drawing = true;
    start = toPercent(event);
    state.cropRect = { x: start.x, y: start.y, w: 0, h: 0 };
    if (!document.querySelector("#crop-selection")) {
      const selection = document.createElement("div");
      selection.id = "crop-selection";
      selection.className = "crop-selection";
      overlay.appendChild(selection);
    }
  }, { once: true });

  overlay.addEventListener("mousemove", event => {
    if (!drawing || !start) return;
    const point = toPercent(event);
    state.cropRect = {
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      w: Math.abs(point.x - start.x),
      h: Math.abs(point.y - start.y)
    };
    const selection = document.querySelector("#crop-selection");
    if (selection) {
      selection.style.left = `${state.cropRect.x}%`;
      selection.style.top = `${state.cropRect.y}%`;
      selection.style.width = `${state.cropRect.w}%`;
      selection.style.height = `${state.cropRect.h}%`;
    }
  });

  window.addEventListener("mouseup", () => {
    if (!drawing) return;
    drawing = false;
    state.cropApplied = false;
    if (!state.cropRect || state.cropRect.w < 2 || state.cropRect.h < 2) state.cropRect = null;
    render();
  }, { once: true });
}

function render() {
  renderShell();
  view.innerHTML = views[state.page]() + modal();
  bind();
  initCropInteraction();
}

render();
