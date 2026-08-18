(async () => {
    const settings = await browser.storage.local.get({
        hakunekoUrl: "https://anenasa.github.io"
    });
    const hakunekoUrl = settings.hakunekoUrl;
    const extensionUrl = browser.runtime.getURL("");

    // Fix request headers
    browser.webRequest.onBeforeSendHeaders.addListener((details) => {
        if (details.documentUrl !== `${hakunekoUrl}/` && !details.documentUrl?.startsWith(extensionUrl))
            return {};
        if (details.url.startsWith(hakunekoUrl)) return {};
        const fetchApiSupportedPrefix = 'X-FetchAPI-'.toLowerCase();
        const oldHeaders = details.requestHeaders || [];
        const newHeaders = [];
        const removeSet = new Set();
        for (const header of oldHeaders) {
            // Avoid duplicated header entries
            if (header.name.toLowerCase().startsWith(fetchApiSupportedPrefix)) {
                removeSet.add(header.name.toLowerCase().substring(fetchApiSupportedPrefix.length));
            }
        }
        for (const header of oldHeaders) {
            if (header.name.toLowerCase().startsWith(fetchApiSupportedPrefix)) {
                const newName = header.name.substring(fetchApiSupportedPrefix.length);
                newHeaders.push({name: newName, value: header.value});
            }
            else {
                if (!removeSet.has(header.name.toLowerCase())) {
                    newHeaders.push(header);
                }
            }
        }
        return { requestHeaders: newHeaders };
    }, { urls: ["<all_urls>"] },  ["blocking", "requestHeaders"]);

    browser.webRequest.onHeadersReceived.addListener((details) => {
        function setHeader(headers, name, value) {
            const existing = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
            if (existing) {
                existing.value = value;
            } else {
                headers.push({ name, value });
            }
        }

        if(details.documentUrl !== `${hakunekoUrl}/`) return {};

        // Fix NS_ERROR_XFO_VIOLATION
        const headers = details.responseHeaders?.filter(
            h => h.name.toLowerCase() !== "x-frame-options"
        ) || [];

        // Enable CORS
        setHeader(headers, "Access-Control-Allow-Origin", "*");
        setHeader(headers, "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        setHeader(headers, "Access-Control-Allow-Headers", "*");
        setHeader(headers, "Access-Control-Max-Age", "7200");
        return { responseHeaders: headers };
    }, { urls: ["<all_urls>"] }, [ "blocking", "responseHeaders" ]);

    // Inject content_script to hakuneko, including iframe
    browser.webNavigation.onCommitted.addListener(async (details) => {
        if (details.url == "about:blank") return;
        const mainFrame = await browser.webNavigation.getFrame({
          tabId: details.tabId,
          frameId: 0
        }).catch(() => null);
        if (!mainFrame) return;
        if (mainFrame.url !== `${hakunekoUrl}/`) return;
        browser.tabs.executeScript(details.tabId, {
            file: "content_script.js",
            frameId: details.frameId
        }).catch(error => {
            console.error('inject error', error);
        });
    });

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (sender.origin !== hakunekoUrl) return;
        if (message.type === 'forwardFetch' && message.fetchRequestId !== undefined) {
            handleForwardFetch(message.serialized).then(sendResponse);
            return true;
        }
    });

    // Calling fetch from extension
    async function handleForwardFetch(serialized) {
        try {
            const { url, method, headers, bodyUsed, body, credentials } = serialized;
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
})();
