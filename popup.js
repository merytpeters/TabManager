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

  groupButton.addEventListener('click', async function () {
    await groupTabs();
  });

  closeInactiveButton.addEventListener('click', async () => {
    const thresholdTime = 2 * 24 * 60 * 60 * 1000;
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
  try {
    const tabs = await chrome.tabs.query ({});
    if (!Array.isArray(tabs)) {
      throw new Error("Failed to retrieve tabs.")
    }

    const filteredTabs = [];
    const lowerCaseKeyword = keyword.toLowerCase();

    for (const tab of tabs) {
      if (tab.title && tab.title.toLowerCase().includes(lowerCaseKeyword)) {
        filteredTabs.push(tab);
      }
    }

    if (filteredTabs.length > 0) {
      let tabOptions = "Tabs found:\n";
      filteredTabs.forEach((tab, index) => {
        tabOptions += `${index + 1}. ${tab.title}\n`;
      });
      tabOptions += `\nType the number of the tab you want to view or type "close" to close all tabs.`;

      const userInput = prompt(tabOptions);

      if (userInput){
        const userChoice = userInput.toLowerCase();
        
        if (userChoice === "close") {
           await closeTabs(filteredTabs);
        } else {
          const selectedIndex = parseInt(userInput, 10) - 1;

          if (selectedIndex >= 0 && selectedIndex < filteredTabs.length) {
            const selectedTab = filteredTabs[selectedIndex];

            await chrome.tabs.update(selectedTab.id, { active: true });
            console.log(`Tab "${selectedTab.title}" aactivated.`);
          } else {
            console.log("Invalid selection.");
          }
        }
      } else {
        console.log("No input [provided");
      }
     } else {
       console.log(`No tabs found with the keyword "${keyword}".`);
     }

    return filteredTabs;

  } catch (error) {
    console.error("An error occurred:", error);
    return [];
  }
}


async function closeTabs(tabsToClose) {
  if (tabsToClose.length > 0) {
    const closeTab = confirm(`Close ${tabsToClose.length} tabs ?`);

    if (closeTab) {
      for (const tab of tabsToClose) {
        await chrome.tabs.remove(tab.id);
      }
      console.log(`${tabsToClose.length} tabs closed`);
    } else {
      console.log("No tabs were closed");
    }
  } else {
    console.log("No inactive tab(s) found");
  }
}

async function closeInactiveTabs(thresholdTime) {
  const tabs = await chrome.tabs.query ({});
  const current_time = Date.now();
  const { tabLastAccessed = {} } = await chrome.storage.local.get('tabLastAccessed');
  const inactiveTabs = [];

  for (const tab of tabs) {
    const last_active = tabLastAccessed[tab.id];

    const lastAccessedTime = last_active !== undefined ? last_active : current_time;

    if (current_time - lastAccessedTime > thresholdTime) {
      inactiveTabs.push(tab);
    }
  }

  if (inactiveTabs.length > 0) {
     const confirmClose = confirm(`Close ${inactiveTabs.length} tab(s) not used in 2 days ?`);
    if (confirmClose) {
      await closeTabs(inactiveTabs);
    }
  } else {
      confirm(`No inactive tabs found`);
  }
}
