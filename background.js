
let bankDomains = [];

// Function to load CSV file and parse domains
function loadCSV() {
  fetch(chrome.runtime.getURL('bank_domains.csv'))
    .then(response => response.text())
    .then(data => {
      bankDomains = data.split('\n').slice(1).map(line => line.trim());
      console.log('Bank domains loaded:', bankDomains);
    })
    .catch(error => console.error('Error loading CSV:', error));
}

// Call the function to load CSV on startup
loadCSV();
 
let pendingMessages = {};
let injectedTabs = new Set();
let readyTabs = new Set();

function updateDomain(tabId) {
  readyTabs.delete(tabId)
  chrome.tabs.get(tabId, (current_tab_info) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
      return;
    }

    if (current_tab_info.url) {
      console.log("current tab", current_tab_info.url)
      try {
        let url = new URL(current_tab_info.url);
        let domain = url.hostname;
        console.log('Current tab domain:', domain);

        let isSafe = bankDomains.some(bankDomain => {
          let isMatch = domain.endsWith(bankDomain); 
          console.log(`Checking ${domain} against ${bankDomain}: ${isMatch}`);
          return isMatch;
        });

        console.log('Is safe:', isSafe);

        // Save the result in Chrome's storage
        chrome.storage.local.set({ domain: domain, isSafe: isSafe }, () => {
          console.log('Domain checked and saved:', domain, isSafe ? 'safe' : 'fake');
        });

        // Store the message to be sent later
        pendingMessages[tabId] = {
          action: 'showMessage',
          text: isSafe ? 'URL is safe' : 'URL is fake',
          isError: !isSafe
        };

        // Inject content script if not already injected
        if (!injectedTabs.has(tabId)) {
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
          }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error injecting content script:', chrome.runtime.lastError.message);
            } else {
              console.log('Content script injected successfully');
              injectedTabs.add(tabId);
              // Attempt to send the message immediately
              sendPendingMessage(tabId);
            }
          });
        } else {
          // Attempt to send the message immediately
          sendPendingMessage(tabId);
        }

      } catch (e) {
        console.error("Invalid URL:", current_tab_info.url);
      }
    } else {
      console.error("No URL found for the active tab.");
    }
  });
}

function sendPendingMessage(tabId) {
  if (pendingMessages[tabId]) {
    console.log('Attempting to send message to tab:', tabId);
    chrome.tabs.sendMessage(tabId, pendingMessages[tabId], response => {
      if (chrome.runtime.lastError) {
        console.log('Content script not ready yet:', chrome.runtime.lastError.message);
      } else {
        console.log('Message sent successfully', response);
        delete pendingMessages[tabId];
      }
    });
  }
}

// Listen for content script ready message
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'contentScriptReady') {
    if (!readyTabs.has(sender.tab.id)) {
      console.log('Content script ready in tab:', sender.tab.id);
      readyTabs.add(sender.tab.id);
      sendPendingMessage(sender.tab.id);
    }
  }
  // Note: We're not calling sendResponse here
});

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  updateDomain(activeInfo.tabId);
});

// Listen for tab updates (e.g., when the URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    readyTabs.delete(tabId)
    updateDomain(tabId);
  }
});
