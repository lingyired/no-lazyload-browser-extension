// tests/helpers/chrome-stub.mjs
// 极简 chrome/browser storage + runtime 替身，供 background 模块的单元测试使用。

export function installChromeStub(initial = {}) {
  const store = { ...initial };
  const listeners = [];

  const local = {
    async get(keys) {
      if (keys == null) return { ...store };
      const list = Array.isArray(keys) ? keys : [keys];
      const out = {};
      for (const k of list) if (k in store) out[k] = store[k];
      return out;
    },
    async set(obj) {
      Object.assign(store, obj);
    },
    async remove(key) {
      delete store[key];
    },
  };

  globalThis.chrome = {
    storage: { local },
    runtime: {
      onMessage: { addListener: (fn) => listeners.push(fn) },
      sendMessage: async () => ({ success: true }),
    },
    tabs: {},
    action: { setBadgeText() {}, setBadgeBackgroundColor() {} },
    windows: undefined,
  };
  globalThis.browser = undefined;

  return {
    store,
    listeners,
    reset() {
      for (const k of Object.keys(store)) delete store[k];
      Object.assign(store, initial);
    },
    /** 直接调用 background 的 onMessage 监听器，返回 sendResponse 的内容 */
    dispatch(request) {
      return new Promise((resolve) => {
        const listener = listeners[0];
        listener(request, {}, (response) => resolve(response));
      });
    },
  };
}
