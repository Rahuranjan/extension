document.addEventListener('DOMContentLoaded', () => {
  // Retrieve the domain and the result from Chrome's storage
  chrome.storage.local.get(['domain', 'isSafe'], (data) => {
    console.log('Retrieved data from storage:', data);

    if (data.domain) {
      document.getElementById('domain').textContent = data.domain;
      if (data.isSafe) {
        document.getElementById('message').textContent = 'URL is safe';
        document.getElementById('message').style.color = 'green';
      } else {
        document.getElementById('message').textContent = 'URL is fake';
        document.getElementById('message').style.color = 'red';
      }
    } else {
      document.getElementById('message').textContent = 'No domain information found';
    }
  });
});

 