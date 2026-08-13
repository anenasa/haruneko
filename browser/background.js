const haruneko_domain = "localhost:5000";
const extension_url = browser.runtime.getURL("");

// Fix request headers
browser.webRequest.onBeforeSendHeaders.addListener((details) => {
    if (!details.documentUrl?.includes(haruneko_domain) && !details.documentUrl?.includes(extension_url))
        return {};
    if (details.url.includes(haruneko_domain)) return {};
    const fetchApiSupportedPrefix = 'X-FetchAPI-'.toLowerCase();
    const oldHeaders = details.requestHeaders || [];
    const newHeaders = [];
    const removeList = [];
    for (const header of oldHeaders) {
        // Avoid duplicated header entries
        if (header.name.toLowerCase().startsWith(fetchApiSupportedPrefix)) {
            removeList.push(header.name.toLowerCase().substring(fetchApiSupportedPrefix.length));
        }
        // Avoid haruneko_domain in referer/origin
        if (header.value.includes(haruneko_domain)) {
            removeList.push(header.name.toLowerCase());
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
    if(!details.documentUrl?.includes(haruneko_domain)) return {};
    const headers = details.responseHeaders || [];
    setHeader(headers, "Access-Control-Allow-Origin", "*");
    setHeader(headers, "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    setHeader(headers, "Access-Control-Allow-Headers", "*");
    setHeader(headers, "Access-Control-Max-Age", "7200");
    return { responseHeaders: headers };
}, { urls: ["<all_urls>"] }, [ "blocking", "responseHeaders" ]);

// Inject content_script to haruneko, including iframe
browser.webNavigation.onCommitted.addListener(async (details) => {
    const mainFrame = await browser.webNavigation.getFrame({
      tabId: details.tabId,
      frameId: 0
    }).catch(() => null);
    if (!mainFrame) return;
    if (!mainFrame.url.includes(haruneko_domain)) return;
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
