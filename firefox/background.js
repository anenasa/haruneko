(async () => {
    let hakunekoUrl = (await browser.storage.local.get({
        hakunekoUrl: "https://anenasa.github.io"
    })).hakunekoUrl;
    browser.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes.hakunekoUrl) {
            hakunekoUrl = changes.hakunekoUrl.newValue;
        }
    });

    const hakunekoTabs = new Map();
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

    // Inject content_script to hakuneko
    browser.webNavigation.onCommitted.addListener(async (details) => {
        if (details.url !== `${hakunekoUrl}/`) return;
        browser.tabs.executeScript(details.tabId, {
            file: "content_script.js",
        }).catch(error => {
            console.error('inject error', error);
        });
    });

    browser.webNavigation.onDOMContentLoaded.addListener((details) => {
        if (details.frameId !== 0) return;
        const tabId = details.tabId;
        const senderId = hakunekoTabs.get(tabId);
        if (senderId === undefined) return;
        browser.tabs.executeScript(senderId, {
            code: `window.postMessage({
                channel: "RemoteBrowserWindow.OnDomReady",
                tabId: ${tabId}
            })`
        }).catch((error) => {
            console.error(error.message);
        });
    });

    browser.webNavigation.onBeforeNavigate.addListener((details) => {
        const { frameId, tabId, url } = details;
        const senderId = hakunekoTabs.get(tabId);
        if (senderId === undefined) return;
        const isMainFrame = frameId === 0;
        browser.tabs.executeScript(senderId, {
            code: `window.postMessage({
                channel: "RemoteBrowserWindow.OnBeforeNavigate",
                tabId: ${tabId},
                url: ${JSON.stringify(url)},
                isMainFrame: ${isMainFrame}
            })`
        }).catch((error) => {
            console.error(error.message);
        });
    });

    browser.tabs.onRemoved.addListener((tabId) => {
        hakunekoTabs.delete(tabId);
    });

    function requireHakunekoTab(tabId) {
        if (!hakunekoTabs.has(tabId)) {
            throw new Error("This tab is not created by Hakuneko");
        }
    }

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (sender.origin !== hakunekoUrl) return;
        if (message.type !== 'InterProcessCommunication') return;
        if (message.channel === "RemoteBrowserWindow.Open") {
            openTab(message.parameters, sender.tab.id).then(sendResponse);
            return true;
        }
        if (message.channel === "RemoteBrowserWindow.Close") {
            closeTab(message.parameters).then(sendResponse);
            return true;
        }
        if (message.channel === "RemoteBrowserWindow.Show") {
            showTab(message.parameters).then(sendResponse);
            return true;
        }
        if (message.channel === "RemoteBrowserWindow.Hide") {
            // Firefox for Android does not support tabs.hide, show hakuneko instead
            showHakuneko(sender.tab.id).then(sendResponse);
            return true;
        }
        if (message.channel === "RemoteBrowserWindow.ExecuteScript") {
            executeScript(message.parameters).then(sendResponse);
            return true;
        }
        if (message.channel === "FetchProvider.Fetch") {
            fetchProviderFetch(message.parameters).then(sendResponse);
            return true;
        }
        if (message.channel === "FileSystem.close") {
            downloadFile(message.parameters).then(sendResponse);
            return true;
        }
    });

    async function openTab(parameters, senderId) {
        const [url, show] = parameters;
        try {
            const tab = await browser.tabs.create({
                url,
                active: show
            });
            hakunekoTabs.set(tab.id, senderId);
            return {
                result: tab.id
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }

    async function closeTab(parameters) {
        const tabId = parameters[0];
        try {
            requireHakunekoTab(tabId);
            const result = await browser.tabs.remove(tabId);
            return {
                result: true
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }

    async function showTab(parameters) {
        const tabId = parameters[0];
        try {
            requireHakunekoTab(tabId);
            const result = await browser.tabs.update(tabId, {
                active: true
            });
            return {
                result: true
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }

    async function showHakuneko(senderTabId) {
        try {
            const result = await browser.tabs.update(senderTabId, {
                active: true
            });
            return {
                result: true
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }

    async function executeScript(parameters) {
        const [tabId, script] = parameters;
        try {
            requireHakunekoTab(tabId);
            const result = await browser.tabs.executeScript(tabId, {
                code: `window.eval(${JSON.stringify(script)})`
            });
            return {
                result: result[0]
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }

    // Calling fetch from extension
    async function fetchProviderFetch(parameters) {
        try {
            const { url, method, headers, bodyUsed, body, credentials } = parameters[0];
            const request = new Request(url, {
                method,
                headers: new Headers(headers),
                body: bodyUsed ? body : undefined,
                credentials
            });
            const response = await fetch(request);
            return {
                result: {
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers),
                    body: await response.arrayBuffer()
                }
            };
        } catch (error) {
            return {
                error: error.message
            };
        }
    }

    // Calling download from extension
    async function downloadFile(parameters) {
        const [blob, filename] = parameters;
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
            return { error: error.message };
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
                    finish({ result: true });
                }
                if (delta.state?.current === "interrupted") {
                    finish({ error: "interrupted" });
                }
            };

            browser.downloads.onChanged.addListener(listener);
            browser.downloads.search({id}).then((downloads) => {
                if (downloads[0]?.state === "complete") {
                    finish({success: true});
                } else if (downloads[0]?.state === "interrupted") {
                    finish({ error: "interrupted" });
                }
            }).catch((error) => {
                finish({ error: error.message });
            });
        });
        return result;
    }
})();
