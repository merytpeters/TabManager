const tabLastAccessed = {};

chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo.tabId;
  const timestamp = Date.now();

  tabLastAccessed[tabId] = timestamp;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const timestamp = Date.now();

    tabLastAccessed[tabId] = timestamp;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabLastAccessed[tabId];
});

function getLastAccessed(tabId) {
  return tabLastAccessed[tabId] || null;
}