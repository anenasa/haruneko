window.addEventListener("message", async (event) => {
    const settings = await browser.storage.local.get({
        hakunekoUrl: "https://anenasa.github.io"
    });
    if (event.origin != settings.hakunekoUrl) return;
    const type = event.data.type;
    if (type === 'executeScript') handleExecuteScript(event);
    else if (type === 'fetch') handleFetch(event);
    else if (type === 'download') handleDownload(event);
    else if (type === 'iframeHeader') handleIframeHeader(event);
});

async function handleExecuteScript(event) {
    const { executeScriptId, script } = event.data;
    if (executeScriptId === undefined) return;
    try {
        const result = await window.eval(script);
        window.parent.postMessage({
            executeScriptReturnId: executeScriptId,
            result
        }, "*");
    } catch (error) {
        window.parent.postMessage({
            executeScriptReturnId: executeScriptId,
            error: error.message
        }, "*");
    }
}

async function handleFetch(event) {
    const { fetchRequestId, serialized } = event.data;
    if (fetchRequestId === undefined) return;
    const result = await browser.runtime.sendMessage({type: "forwardFetch", fetchRequestId, serialized});
    window.postMessage({fetchResponseId: fetchRequestId, result}, "*");
}

async function handleDownload(event) {
    const { downloadId, blob, filename } = event.data;
    if (downloadId === undefined) return;
    const result = await browser.runtime.sendMessage({
        type: "forwardDownload", downloadId, blob, filename
    });
    window.postMessage({downloadReturnId: downloadId, result}, "*");
}

async function handleIframeHeader(event) {
    const { iframeHeaderId, serialized } = event.data;
    if (iframeHeaderId === undefined) return;
    await browser.runtime.sendMessage({type: "forwardIframeHeader", serialized});
    window.postMessage({iframeHeaderReturnId: iframeHeaderId}, "*");
}
