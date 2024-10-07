document.addEventListener('DOMContentLoaded', function() {
  const filterButton = document.getElementById('filter-btn');
  const keywordInput = document.getElementById('keyword');
  const groupButton = document.getElementById('group-btn');
  const closeInactiveButton = document.getElementById('close-inactive-btn');

  filterButton.addEventListener('click', async () => {
    const keyword = keywordInput.value.trim();

    if (keyword) {
      const filteredTabs = await filterTabs(keyword);
      if (filteredTabs.length > 0) {
        displayTabs(filteredTabs);
      } else {
        displayTabs([]);
      }
    }
  });

  groupButton.addEventListener('click', async () => {
    await groupTabs();
  });

  closeInactiveButton.addEventListener('click', async () => {
    const thresholdTime = 7 * 24 * 60 * 60 * 1000;
    await closeInactiveTabs(thresholdTime);
  });
});

function displayTabs(tabs) {
  const tabsList = document.getElementById('tabs-list');
  tabsList.innerHTML = '';

  tabs.forEach(tab => {
    const tabItem = document.createElement('div');
    tabItem.textContent = tab.title;
    tabsList.appendChild(tabItem);
  });
}

function displayGroupedTabs(tabGroups) {
  const tabsList = document.getElementById('tabs-list');
  tabsList.innerHTML = '';

  for (const domain in tabGroups) {
    const domainHeader = document.createElement('h2');
    domainHeader.textContent = domain;
    tabsList.appendChild(domainHeader);

    tabGroups[domain].forEach(tab => {
        const tabItem = document.createElement('div');
        tabItem.textContent = tab.title;
        tabsList.appendChild(tabItem);
    });
  }
}

async function groupTabs() {
  const tabs = await chrome.tabs.query ({});
  const  tabGroups = {};

  for (const tab of tabs) {
    const domain = new URL(tab.url).hostname;

    if (tabGroups[domain]) {
      tabGroups[domain].push(tab);
    } else {
      tabGroups[domain] = [tab];
    }
  }

  displayGroupedTabs(tabGroups);
}

async function filterTabs(keyword) {
  const tabs = await chrome.tabs.query ({});
  const filteredTabs = [];

  const lowerCaseKeyword = keyword.toLowerCase();

  for (const tab of tabs) {
    if (tab.title.toLowerCase().includes(lowerCaseKeyword)) {
      filteredTabs.push(tab);
    }
  }

  return filteredTabs;
}

async function closeInactiveTabs(thresholdTime) {
  const tabs = await chrome.tabs.query ({});
  current_time = Date.now();

  for (const tab of tabs) {
    const last_active = tabLastAccessed[tab.id] || current_time;

    if (current_time - last_active > thresholdTime) {
      const closeTab = confirm(`Close tabs not used recently?`);
        if (closeTab) {
            chrome.tabs.remove(tab.id);
        }
    }
  }
}
