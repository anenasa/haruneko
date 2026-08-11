const haruneko_domain = "localhost:5000";

// Inject content_script to haruneko, including iframe
browser.webNavigation.onCommitted.addListener(async (details) => {
    const mainFrame = await browser.webNavigation.getFrame({
      tabId: details.tabId,
      frameId: 0
    }).catch(() => null);
    if (!mainFrame) return;
    if (!mainFrame.url.includes(haruneko_domain)) return;
    browser.scripting.executeScript({
        target: {
            tabId: details.tabId,
            frameIds: [details.frameId]
        },
        files: ["content_isolated.js"]
    });
    browser.scripting.executeScript({
        target: {
            tabId: details.tabId,
            frameIds: [details.frameId]
        },
        files: ["content_main.js"],
        world: "MAIN"
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
        const fetchApiSupportedPrefix = 'X-FetchAPI-'.toLowerCase();
        const { url, method, headers, bodyUsed, body, credentials } = serialized;
        for (const key in headers) {
            if (key.startsWith(fetchApiSupportedPrefix)) {
                const newKey = key.substring(fetchApiSupportedPrefix.length);
                headers[newKey] = headers[key]
                delete headers[key]
            }
        }
        const response = await fetch(url, {
            method,
            headers,
            body: bodyUsed ? body : undefined,
            credentials
        });
        const bytes = await response.bytes()
        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers),
            body: Array.from(bytes)
        };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}
