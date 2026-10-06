// shared/upgrade-dialog.js
// 升级提示弹窗的唯一实现（纯 DOM，不依赖任何浏览器 API）。
//
// 样式来自 ui/components.css 的 .nl-* 类，这里只负责结构与交互：
//  · Escape 关闭、焦点困在弹窗内、关闭后焦点回到触发控件
//  · 文案全部走调用方传入的 t()，取不到真实价格时绝不显示硬编码价格
//
// 用法：
//   const upgraded = await showUpgradeDialog({ t, price: '$2.99' });
//   if (upgraded) { /* 唤起 Host App */ }

function showUpgradeDialog({ t, price } = {}) {
  const tr = (key, replacements) => {
    if (typeof t === 'function') {
      const value = t(key, replacements);
      if (value) return value;
    }
    const fallbacks = {
      upgradeTitle: 'Unlock No Lazyload Pro',
      upgradeBodyLimit: "You're using all 3 free websites. Upgrade once to enable No Lazyload on unlimited websites.",
      upgradePrice: 'One-time purchase',
      oneTimePurchase: 'One-time purchase',
      noSubscription: 'No subscription',
      upgradeToPro: 'Upgrade to Pro',
      notNow: 'Not Now',
    };
    return fallbacks[key] || key;
  };

  return new Promise((resolve) => {
    const existing = document.getElementById('upgradeDialogOverlay');
    if (existing) existing.remove();

    const previouslyFocused = document.activeElement;

    const overlay = document.createElement('div');
    overlay.id = 'upgradeDialogOverlay';
    overlay.className = 'nl-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'upgradeDialogTitle');

    const dialog = document.createElement('div');
    dialog.className = 'nl-dialog';

    const title = document.createElement('h2');
    title.id = 'upgradeDialogTitle';
    title.className = 'nl-dialog-title';
    title.textContent = tr('upgradeTitle');

    const body = document.createElement('p');
    body.className = 'nl-dialog-body';
    body.textContent = tr('upgradeBodyLimit');

    const priceLine = document.createElement('p');
    priceLine.className = 'nl-dialog-body';
    priceLine.textContent = price ? price + ' · ' + tr('oneTimePurchase') : tr('upgradePrice');

    const subline = document.createElement('p');
    subline.className = 'nl-dialog-body';
    subline.textContent = tr('noSubscription');

    const actions = document.createElement('div');
    actions.className = 'nl-dialog-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'nl-btn';
    cancelBtn.textContent = tr('notNow');

    const upgradeBtn = document.createElement('button');
    upgradeBtn.type = 'button';
    upgradeBtn.className = 'nl-btn nl-btn-primary';
    upgradeBtn.textContent = tr('upgradeToPro');

    actions.append(cancelBtn, upgradeBtn);
    dialog.append(title, body, priceLine, subline, actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const close = (result) => {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
      resolve(result);
    };

    // Escape 关闭 + Tab 焦点困在弹窗内（plan Task F1）
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(false);
        return;
      }
      if (e.key === 'Tab') {
        const focusables = [cancelBtn, upgradeBtn];
        const index = focusables.indexOf(document.activeElement);
        const next = e.shiftKey
          ? focusables[(index - 1 + focusables.length) % focusables.length]
          : focusables[(index + 1) % focusables.length];
        e.preventDefault();
        next.focus();
      }
    };

    cancelBtn.addEventListener('click', () => close(false));
    upgradeBtn.addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', onKey);

    cancelBtn.focus();
  });
}

export { showUpgradeDialog };
