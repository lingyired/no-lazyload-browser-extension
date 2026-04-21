// settings/app.js

import { STRATEGIES, DEFAULT_SCROLL_CONFIG } from '../shared/constants.js';

const MESSAGE_TYPES = {
  GET_ALL_CONFIGS: 'GET_ALL_CONFIGS',
  SET_SITE_CONFIG: 'SET_SITE_CONFIG',
  REMOVE_SITE_CONFIG: 'REMOVE_SITE_CONFIG',
  GET_GLOBAL_CONFIG: 'GET_GLOBAL_CONFIG',
  SET_GLOBAL_CONFIG: 'SET_GLOBAL_CONFIG'
};

// 获取运行时 API
const runtime = typeof browser !== 'undefined'
  ? browser.runtime
  : chrome.runtime;

const tabs = typeof browser !== 'undefined'
  ? browser.tabs
  : chrome.tabs;

/**
 * 发送消息到 background
 */
async function sendMessage(type, data = {}) {
  return new Promise((resolve) => {
    runtime.sendMessage({ type, ...data }, (response) => {
      resolve(response);
    });
  });
}

/**
 * 显示 Toast 提示
 */
function showToast(message, duration = 2000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}

/**
 * 获取策略显示文本
 */
function getStrategyText(strategy) {
  const map = {
    [STRATEGIES.TECH_BLOCK]: '技术拦截',
    [STRATEGIES.SCROLL_FALLBACK]: '自动滚动',
    [STRATEGIES.DISABLED]: '禁用扩展'
  };
  return map[strategy] || strategy;
}

/**
 * 加载并显示网站列表
 */
async function loadSiteList() {
  const response = await sendMessage(MESSAGE_TYPES.GET_ALL_CONFIGS);
  const configs = response?.data || {};
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();

  const siteList = document.getElementById('siteList');
  const emptyState = document.getElementById('emptyState');

  // 清空列表
  siteList.innerHTML = '';

  // 过滤并排序
  const entries = Object.entries(configs)
    .filter(([domain]) => domain.toLowerCase().includes(searchTerm))
    .sort((a, b) => b[1].addedAt - a[1].addedAt);

  if (entries.length === 0) {
    siteList.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }

  siteList.classList.remove('hidden');
  emptyState.classList.add('hidden');

  // 渲染列表
  entries.forEach(([domain, config]) => {
    const item = document.createElement('div');
    item.className = 'site-item';
    item.innerHTML = `
      <div class="site-info">
        <div class="site-domain">${escapeHtml(domain)}</div>
        <div class="site-strategy">${getStrategyText(config.strategy)}</div>
      </div>
      <div class="site-actions">
        <select data-domain="${escapeHtml(domain)}">
          <option value="${STRATEGIES.TECH_BLOCK}" ${config.strategy === STRATEGIES.TECH_BLOCK ? 'selected' : ''}>技术拦截</option>
          <option value="${STRATEGIES.SCROLL_FALLBACK}" ${config.strategy === STRATEGIES.SCROLL_FALLBACK ? 'selected' : ''}>自动滚动</option>
          <option value="${STRATEGIES.DISABLED}" ${config.strategy === STRATEGIES.DISABLED ? 'selected' : ''}>禁用扩展</option>
        </select>
        <button class="btn btn-danger" data-domain="${escapeHtml(domain)}">删除</button>
      </div>
    `;
    siteList.appendChild(item);
  });

  // 绑定事件
  siteList.querySelectorAll('select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const domain = e.target.dataset.domain;
      await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
        domain,
        strategy: e.target.value
      });
      showToast('已更新');
    });
  });

  siteList.querySelectorAll('.btn-danger').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const domain = e.target.dataset.domain;
      if (confirm(`确定要删除 ${domain} 的配置吗？`)) {
        await sendMessage(MESSAGE_TYPES.REMOVE_SITE_CONFIG, { domain });
        loadSiteList();
        showToast('已删除');
      }
    });
  });
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 添加网站
 */
async function addSite() {
  const domainInput = document.getElementById('domainInput');
  const strategySelect = document.getElementById('strategySelect');

  let domain = domainInput.value.trim().toLowerCase();
  if (!domain) {
    showToast('请输入域名');
    return;
  }

  // 从 URL 中提取域名
  if (domain.includes('://')) {
    try {
      domain = new URL(domain).hostname;
    } catch {
      showToast('域名格式不正确');
      return;
    }
  }

  // 移除 www. 前缀
  domain = domain.replace(/^www\./, '');

  if (!domain || !domain.includes('.')) {
    showToast('请输入有效的域名');
    return;
  }

  await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
    domain,
    strategy: strategySelect.value
  });

  domainInput.value = '';
  loadSiteList();
  showToast('添加成功');
}

/**
 * 添加当前网站
 */
async function addCurrentSite() {
  const [tab] = await tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    showToast('无法获取当前页面');
    return;
  }

  try {
    const url = new URL(tab.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      showToast('只能添加 http/https 网站');
      return;
    }

    const domain = url.hostname.replace(/^www\./, '');
    const strategySelect = document.getElementById('strategySelect');

    await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
      domain,
      strategy: strategySelect.value
    });

    loadSiteList();
    showToast(`已添加 ${domain}`);
  } catch {
    showToast('无法解析当前页面 URL');
  }
}

/**
 * 加载全局设置
 */
async function loadGlobalSettings() {
  const response = await sendMessage(MESSAGE_TYPES.GET_GLOBAL_CONFIG);
  const config = response?.data || {};

  document.getElementById('defaultStrategy').value =
    config.defaultStrategy || STRATEGIES.DISABLED;

  const scrollConfig = { ...DEFAULT_SCROLL_CONFIG, ...config.scrollConfig };
  document.getElementById('scrollSpeed').value = scrollConfig.scrollSpeed;
  document.getElementById('stayDuration').value = scrollConfig.stayDuration;
  document.getElementById('returnToTop').checked = scrollConfig.returnToTop;
  document.getElementById('showNotification').checked = scrollConfig.showNotification;
}

/**
 * 保存全局设置
 */
async function saveGlobalSettings() {
  const config = {
    defaultStrategy: document.getElementById('defaultStrategy').value,
    scrollConfig: {
      scrollSpeed: parseInt(document.getElementById('scrollSpeed').value, 10) || 800,
      stayDuration: parseInt(document.getElementById('stayDuration').value, 10) || 2000,
      returnToTop: document.getElementById('returnToTop').checked,
      showNotification: document.getElementById('showNotification').checked
    }
  };

  await sendMessage(MESSAGE_TYPES.SET_GLOBAL_CONFIG, { config });
  showToast('全局设置已保存');
}

/**
 * 导出配置
 */
async function exportConfig() {
  const configsResponse = await sendMessage(MESSAGE_TYPES.GET_ALL_CONFIGS);
  const globalResponse = await sendMessage(MESSAGE_TYPES.GET_GLOBAL_CONFIG);

  const exportData = {
    siteConfigs: configsResponse?.data || {},
    globalConfig: globalResponse?.data || {},
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `lazy-load-blocker-config-${new Date().toISOString().split('T')[0]}.json`;
  a.click();

  URL.revokeObjectURL(url);
  showToast('配置已导出');
}

/**
 * 导入配置
 */
async function importConfig(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.siteConfigs || !data.globalConfig) {
      showToast('配置文件格式不正确');
      return;
    }

    // 导入网站配置
    for (const [domain, config] of Object.entries(data.siteConfigs)) {
      await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
        domain,
        strategy: config.strategy
      });
    }

    // 导入全局配置
    await sendMessage(MESSAGE_TYPES.SET_GLOBAL_CONFIG, {
      config: data.globalConfig
    });

    loadSiteList();
    loadGlobalSettings();
    showToast('配置已导入');
  } catch (error) {
    showToast('导入失败：' + error.message);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 加载数据
  loadSiteList();
  loadGlobalSettings();

  // 绑定事件
  document.getElementById('addBtn').addEventListener('click', addSite);
  document.getElementById('addCurrentBtn').addEventListener('click', addCurrentSite);
  document.getElementById('domainInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSite();
  });
  document.getElementById('searchInput').addEventListener('input', loadSiteList);
  document.getElementById('saveGlobalBtn').addEventListener('click', saveGlobalSettings);
  document.getElementById('exportBtn').addEventListener('click', exportConfig);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', (e) => {
    if (e.target.files?.[0]) {
      importConfig(e.target.files[0]);
      e.target.value = ''; // 重置
    }
  });
});
