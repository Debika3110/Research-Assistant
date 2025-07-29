chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: 'index.html', 
    enabled: true
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});
