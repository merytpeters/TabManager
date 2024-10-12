const tabLastAccessed = {};

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tabId = activeInfo.tabId;
  const timestamp = Date.now();

  tabLastAccessed[tabId] = timestamp;
  await chrome.storage.local.set({tabLastAccessed});
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    const timestamp = Date.now();

    tabLastAccessed[tabId] = timestamp;
    chrome.storage.local.set({ tabLastAccessed });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabLastAccessed[tabId];
});

async function initialize() {
  const { tabLastAccessed: storedData = {} } = await chrome.storage.local.get('tabLastAccessed');
  Object.assign(tabLastAccessed, storedData);
}

initialize();

async function getLastAccessed(tabId) {
  return tabLastAccessed[tabId] || null;
}
