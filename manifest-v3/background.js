var browser = browser || chrome;

function start() {
  browser.storage.local.get(["database", "state"], v => {
    if (!v.database) {
      if (!v.state) {
        // First time setup
        browser.tabs.create({
          url: getURL('start.html')
        });
      } else {
        // Logged in but not database
        browser.tabs.create({
          url: getURL('start.html?download=1')
        });
      }
    }

    if (v.state) {
      handleFetch("https://api.beth.lgbt/moderation/is-moderator?state=" + v.state, response => {
        if (response["text"] == "1") {
          browser.storage.local.set({
            "is_moderator": true
          });
          browser.contextMenus.create({
            id: "moderate",
            title: browser.i18n.getMessage("actionModerateReports"),
            contexts: ["page"]
          });
        }
      });
    }
  });

  if (!browser.menus) {
    browser.menus = browser.contextMenus;
  }

  browser.contextMenus.create({
    id: "report-transphobe",
    title: browser.i18n.getMessage("actionReportTransphobe"),
    contexts: ["link"],
    targetUrlPatterns: ["*://*.twitter.com/*"]
  });
  browser.contextMenus.create({
    id: "appeal-label",
    title: browser.i18n.getMessage("actionAppealLabel"),
    contexts: ["link"],
    targetUrlPatterns: ["*://*.twitter.com/*"]
  });
  browser.contextMenus.create({
    id: "search-tweets",
    title: browser.i18n.getMessage("searchTweets"),
    contexts: ["link"],
    targetUrlPatterns: ["*://*.twitter.com/*"]
  });
  browser.menus.create({
    id: "run-setup",
    title: browser.i18n.getMessage("actionRerunSetup"),
    contexts: ["page"]
  });
  browser.menus.create({
    id: "update-database",
    title: browser.i18n.getMessage("actionUpdateDatabase"),
    contexts: ["page"]
  });
  browser.menus.create({
    id: "options",
    title: browser.i18n.getMessage("actionOptions"),
    contexts: ["page"]
  });

  browser.contextMenus.onClicked.addListener(function (info, tab) {
    var action = info.menuItemId;
    if (action == "appeal-label") {
      browser.tabs.sendMessage(tab.id, {
        "action": "appeal-label",
        "url": info.linkUrl
      }).then((response) => {
        // ?
      });
    } else if (action == "report-transphobe") {
      browser.tabs.sendMessage(tab.id, {
        "action": "report-transphobe",
        "url": info.linkUrl
      }).then((response) => {
        // ?
      });
    } else if (action == "search-tweets") {
      browser.tabs.sendMessage(tab.id, {
        "action": "search-tweets",
        "url": info.linkUrl
      }).then((response) => {
        if (response) {
          browser.tabs.create({
            url: "https://twitter.com/search?q=from%3A" + response + "%20(trans%20OR%20transgender%20OR%20gender%20OR%20TERF%20OR%20cis)&src=typed_query&f=top"
          });
        }
      });
    } else if (action == "run-setup") {
      browser.tabs.create({
        url: getURL('start.html')
      });
    } else if (action == "update-database") {
      browser.tabs.sendMessage(tab.id, {
        "action": "update-database"
      }).then((response) => {
        // ?
      });
    } else if (action == "options") {
      browser.tabs.create({
        url: getURL('options.html')
      });
    }else if (action == "moderate") {
      browser.tabs.create({
        url: getURL('moderation.html')
      });
    }
  });
}

function getURL(path) {
  return chrome.runtime.getURL(path);
}

const handleFetch = async (url, sendResponse) => {
  const response = await fetch(url);
  var json = "";
  try {
    json = await response.clone().json();
  } catch (error) {

  }
  const text = await response.text();
  sendResponse({"status": response.status, "text": text, "json": json});
};

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action == "fetch") {
    handleFetch(message.url, sendResponse);
    return true;
  }
  return false;
});

start();