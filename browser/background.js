(async () => {
const settings = await browser.storage.local.get({
    harunekoUrl: "https://anenasa.github.io"
});
const harunekoUrl = settings.harunekoUrl;
const extensionUrl = browser.runtime.getURL("");

// Fix request headers
browser.webRequest.onBeforeSendHeaders.addListener((details) => {
    if (!details.documentUrl?.includes(harunekoUrl) && !details.documentUrl?.includes(extensionUrl))
        return {};
    if (details.url.includes(harunekoUrl)) return {};
    const fetchApiSupportedPrefix = 'X-FetchAPI-'.toLowerCase();
    const oldHeaders = details.requestHeaders || [];
    const newHeaders = [];
    const removeList = [];
    for (const header of oldHeaders) {
        // Avoid duplicated header entries
        if (header.name.toLowerCase().startsWith(fetchApiSupportedPrefix)) {
            removeList.push(header.name.toLowerCase().substring(fetchApiSupportedPrefix.length));
        }
        // Avoid harunekoUrl in referer/origin
        if (header.value.includes(harunekoUrl)) {
            removeList.push(header.name.toLowerCase());
        }
        if (header.name.toLowerCase() == "sec-fetch-dest" && header.value == "iframe") {
            header.value = "document";
        }
        if (header.name.toLowerCase() == "sec-fetch-site" && header.value == "cross-site") {
            header.value = "none";
        }
    }
    for (const header of oldHeaders) {
        if (header.name.toLowerCase().startsWith(fetchApiSupportedPrefix)) {
            const newName = header.name.substring(fetchApiSupportedPrefix.length);
            newHeaders.push({name: newName, value: header.value});
        }
        else {
            if (!removeList.includes(header.name.toLowerCase())) {
                newHeaders.push(header);
            }
        }
    }
    return { requestHeaders: newHeaders };
}, { urls: ["<all_urls>"] },  ["blocking", "requestHeaders"]);


function setHeader(headers, name, value) {
  const existing = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.value = value;
  } else {
    headers.push({ name, value });
  }
}

// Enable CORS
browser.webRequest.onHeadersReceived.addListener((details) => {
    if(!details.documentUrl?.includes(harunekoUrl)) return {};
    const headers = details.responseHeaders || [];
    setHeader(headers, "Access-Control-Allow-Origin", "*");
    setHeader(headers, "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    setHeader(headers, "Access-Control-Allow-Headers", "*");
    setHeader(headers, "Access-Control-Max-Age", "7200");
    return { responseHeaders: headers };
}, { urls: ["<all_urls>"] }, [ "blocking", "responseHeaders" ]);

// Inject content_script to haruneko, including iframe
browser.webNavigation.onCommitted.addListener(async (details) => {
    if (details.url == "about:blank") return;
    const mainFrame = await browser.webNavigation.getFrame({
      tabId: details.tabId,
      frameId: 0
    }).catch(() => null);
    if (!mainFrame) return;
    if (!mainFrame.url.includes(harunekoUrl)) return;
    browser.tabs.executeScript(details.tabId, {
        file: "content_script.js",
        frameId: details.frameId
    }).catch(error => {
        console.error('inject error', error);
    });
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'forwardFetch' && message.fetchRequestId !== undefined) {
        handleForwardFetch(message.serialized).then(sendResponse);
        return true;
    }
    if (message.type === 'forwardDownload' && message.downloadId !== undefined) {
        handleForwardDownload(message.blob, message.filename).then(sendResponse);
        return true;
    }
});

// Calling fetch from extension
async function handleForwardFetch(serialized) {
    try {
        const { url, method, mode, headers, bodyUsed, body, credentials } = serialized;
        const request = new Request(url, {
            method,
            headers: new Headers(headers),
            body: bodyUsed ? body : undefined,
            credentials
        });
        const response = await fetch(request);
        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers),
            body: await response.arrayBuffer()
        };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

// Calling download from extension
async function handleForwardDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    let id;
    try {
        id = await browser.downloads.download({
            url,
            filename,
            saveAs: false
        });
    } catch (error) {
        URL.revokeObjectURL(url);
        return {success: false, error: error.message};
    }
    const result = await new Promise((resolve) => {
        let settled = false;
        const finish = (result) => {
            if (settled) return;
            settled = true;
            browser.downloads.onChanged.removeListener(listener);
            URL.revokeObjectURL(url);
            resolve(result);
        };
        const listener = (delta) => {
            if (delta.id !== id) return;
            if (delta.state?.current === "complete") {
                finish({success: true});
            }
            if (delta.state?.current === "interrupted") {
                finish({success: false, error: "interrupted"});
            }
        };

        browser.downloads.onChanged.addListener(listener);
        browser.downloads.search({id}).then((downloads) => {
            if (downloads[0]?.state === "complete") {
                finish({success: true});
            } else if (downloads[0]?.state === "interrupted") {
                finish({success: false, error: "interrupted"});
            }
        }).catch((error) => {
            finish({success: false, error: error.message});
        });
    });
    return result;
}
})();
