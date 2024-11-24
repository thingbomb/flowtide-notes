chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ windowId: tab.windowId });
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'openNotes',
        title: 'Open Flowtide Notes',
        contexts: ['all']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'openNotes') {
        chrome.sidePanel.open({ windowId: tab.windowId });
    }
});
