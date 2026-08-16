(async () => {
    const settings = await browser.storage.local.get({
        hakunekoUrl: "https://anenasa.github.io"
    });
    const hakunekoUrl = settings.hakunekoUrl;

    // Enable CORS
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
        const headers = details.responseHeaders || [];
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
})();
