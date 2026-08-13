window.addEventListener("message", async (event) => {
    const settings = await browser.storage.local.get({
        harunekoUrl: "https://anenasa.github.io"
    });
    if (event.origin != settings.harunekoUrl) return;
    const type = event.data.type;
    if (type === 'executeScript') handleExecuteScript(event);
    if (type === 'fetch') handleFetch(event);
});

async function handleExecuteScript(event) {
    const { executeScriptId, script } = event.data;
    if (!executeScriptId) return;
    const result = await window.eval(script);
    window.parent.postMessage({executeScriptReturnId: executeScriptId, result}, "*");
}

async function handleFetch(event) {
    const { fetchRequestId, serialized } = event.data;
    if (!fetchRequestId) return;
    const result = await browser.runtime.sendMessage({type: "forwardFetch", fetchRequestId, serialized});
    window.postMessage({fetchResponseId: fetchRequestId, result}, "*");
}
