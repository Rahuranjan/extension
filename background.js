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

// Function to update domain and check against bank domains
function updateDomain(tabId) {
  chrome.tabs.get(tabId, (current_tab_info) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
      return;
    }

    if (current_tab_info.url) {
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
      } catch (e) {
        console.error("Invalid URL:", current_tab_info.url);
      }
    } else {
      console.error("No URL found for the active tab.");
    }
  });
}

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  updateDomain(activeInfo.tabId);
});

// Listen for tab updates (e.g., when the URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    updateDomain(tabId);
  }
});


// let bankDomains = [];

// // Function to load CSV file and parse domains
// function loadCSV() {
//   fetch(chrome.runtime.getURL('bank_domains.csv'))
//     .then(response => response.text())
//     .then(data => {
//       bankDomains = data.split('\n').slice(1).map(line => line.trim());
//       console.log('Bank domains loaded:', bankDomains);
//     })
//     .catch(error => console.error('Error loading CSV:', error));
// }

// // Call the function to load CSV on startup
// loadCSV();

// let pendingMessages = {};

// function updateDomain(tabId) {
//   chrome.tabs.get(tabId, (current_tab_info) => {
//     if (chrome.runtime.lastError) {
//       console.error(chrome.runtime.lastError.message);
//       return;
//     }

//     if (current_tab_info.url) {
//       try {
//         let url = new URL(current_tab_info.url);
//         let domain = url.hostname;
//         console.log('Current tab domain:', domain);

//         let isSafe = bankDomains.some(bankDomain => {
//           let isMatch = domain.endsWith(bankDomain);
//           console.log(`Checking ${domain} against ${bankDomain}: ${isMatch}`);
//           return isMatch;
//         });

//         console.log('Is safe:', isSafe);

//         // Save the result in Chrome's storage
//         chrome.storage.local.set({ domain: domain, isSafe: isSafe }, () => {
//           console.log('Domain checked and saved:', domain, isSafe ? 'safe' : 'fake');
//         });

//         // Store the message to be sent later
//         pendingMessages[tabId] = {
//           action: 'showMessage',
//           text: isSafe ? 'URL is safe' : 'URL is fake',
//           isError: !isSafe
//         };

//         // Attempt to send the message immediately
//         sendPendingMessage(tabId);

//       } catch (e) {
//         console.error("Invalid URL:", current_tab_info.url);
//       }
//     } else {
//       console.error("No URL found for the active tab.");
//     }
//   });
// }

// function sendPendingMessage(tabId) {
//   if (pendingMessages[tabId]) {
//     console.log('Attempting to send message to tab:', tabId);
//     chrome.tabs.sendMessage(tabId, pendingMessages[tabId], response => {
//       if (chrome.runtime.lastError) {
//         console.log('Content script not ready yet:', chrome.runtime.lastError.message);
//       } else {
//         console.log('Message sent successfully', response);
//         delete pendingMessages[tabId];
//       }
//     });
//   }
// }

// // Listen for content script ready message
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === 'contentScriptReady') {
//     console.log('Content script ready in tab:', sender.tab.id);
//     sendPendingMessage(sender.tab.id);
//   }
// });

// // Listen for tab activation
// chrome.tabs.onActivated.addListener((activeInfo) => {
//   updateDomain(activeInfo.tabId);
// });

// // Listen for tab updates (e.g., when the URL changes)
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.url) {
//     updateDomain(tabId);
//   }
// });
