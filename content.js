console.log('Content script loaded');

function showMessage(text, isError) {
  console.log('Showing message:', text, 'isError:', isError);
  const messageElement = document.createElement('div');
  messageElement.textContent = text;
  messageElement.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    background-color: ${isError ? 'red' : 'green'};
    color: white;
    font-size: 16px;
    font-weight: bold;
    border-radius: 5px;
    z-index: 2147483647;
    transition: opacity 0.5s;
  `;

  document.body.appendChild(messageElement);

  setTimeout(() => {
    messageElement.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(messageElement);
    }, 500);
  }, 2000);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in content script:', message);
  if (message.action === 'showMessage') {
    showMessage(message.text, message.isError);
    sendResponse({status: 'Message displayed'});
  }
  return true;  // Indicates that sendResponse will be called asynchronously
});

// Notify the background script that the content script is ready
function notifyBackgroundScript() {
  chrome.runtime.sendMessage({action: 'contentScriptReady'}, response => {
    if (chrome.runtime.lastError) {
      // If there's an error, try again after a short delay
      setTimeout(notifyBackgroundScript, 100);
    }
  });
}

// Start trying to notify the background script
notifyBackgroundScript();
