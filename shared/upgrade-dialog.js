// shared/upgrade-dialog.js
// 可复用的升级提示弹窗（纯 DOM，无浏览器 API 依赖）
// popup.js / settings/app.js 是经典脚本，会将本文件内容内联（参考 MESSAGE_TYPES 重复模式）
//
// 用法：
//   const upgrade = await showUpgradeDialog({ t });
//   if (upgrade) { /* 用户点击 Upgrade，发起购买 */ }
//
// t(key) 为 i18n 翻译函数，需返回字符串。缺省 key 时使用英文 fallback。

/**
 * 显示升级提示弹窗
 * @param {{ t: (key: string, replacements?: object) => string }} options
 * @returns {Promise<boolean>} true=用户点击 Upgrade，false=用户点击 Cancel
 */
function showUpgradeDialog({ t } = {}) {
  // i18n fallback：t 缺失或返回空时使用英文
  const tr = (key, replacements) => {
    if (typeof t === 'function') {
      const v = t(key, replacements);
      if (v) return v;
    }
    const fallbacks = {
      upgradeTitle: 'Unlock Pro',
      upgradeBody: 'Free version supports up to 3 websites. Upgrade to unlock unlimited websites and future premium features.',
      upgradeButton: 'Upgrade',
      cancelUpgrade: 'Cancel',
    };
    return fallbacks[key] || key;
  };

  return new Promise((resolve) => {
    // 复用已有容器（避免重复弹窗叠加）
    const existing = document.getElementById('upgradeDialogOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'upgradeDialogOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'upgradeDialogTitle');

    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(0,0,0,0.5)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'z-index:2147483647',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
    ].join(';');

    const dialog = document.createElement('div');
    dialog.style.cssText = [
      'background:#fff',
      'color:#1d1d1f',
      'border-radius:12px',
      'padding:24px',
      'max-width:360px',
      'width:calc(100% - 48px)',
      'box-shadow:0 8px 32px rgba(0,0,0,0.2)',
      'text-align:center',
    ].join(';');

    const title = document.createElement('h2');
    title.id = 'upgradeDialogTitle';
    title.textContent = tr('upgradeTitle');
    title.style.cssText = 'margin:0 0 12px;font-size:20px;font-weight:600';

    const body = document.createElement('p');
    body.textContent = tr('upgradeBody');
    body.style.cssText = 'margin:0 0 20px;font-size:14px;line-height:1.5;color:#424245';

    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display:flex;gap:10px;justify-content:center';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = tr('cancelUpgrade');
    cancelBtn.style.cssText = [
      'flex:1',
      'padding:10px 16px',
      'border:1px solid #d2d2d7',
      'background:#fff',
      'color:#1d1d1f',
      'border-radius:8px',
      'font-size:14px',
      'font-weight:500',
      'cursor:pointer',
    ].join(';');

    const upgradeBtn = document.createElement('button');
    upgradeBtn.textContent = tr('upgradeButton');
    upgradeBtn.style.cssText = [
      'flex:1',
      'padding:10px 16px',
      'border:none',
      'background:#007aff',
      'color:#fff',
      'border-radius:8px',
      'font-size:14px',
      'font-weight:600',
      'cursor:pointer',
    ].join(';');

    buttonRow.appendChild(cancelBtn);
    buttonRow.appendChild(upgradeBtn);
    dialog.appendChild(title);
    dialog.appendChild(body);
    dialog.appendChild(buttonRow);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const close = (result) => {
      overlay.remove();
      // 清理已绑定的事件监听（防止 dialog 已移除后仍触发）
      cancelBtn.onclick = null;
      upgradeBtn.onclick = null;
      overlay.onclick = null;
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };

    cancelBtn.onclick = () => close(false);
    upgradeBtn.onclick = () => close(true);

    // 点击遮罩关闭 = 取消
    overlay.onclick = (e) => {
      if (e.target === overlay) close(false);
    };

    const onKey = (e) => {
      if (e.key === 'Escape') close(false);
    };
    document.addEventListener('keydown', onKey);

    // 自动聚焦 Upgrade 按钮（鼓励转化）
    upgradeBtn.focus();
  });
}

// 导出（供 ES module 使用；经典脚本内联时由 popup.js/settings.app.js 自行处理）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { showUpgradeDialog };
}
if (typeof window !== 'undefined') {
  window.showUpgradeDialog = showUpgradeDialog;
}
