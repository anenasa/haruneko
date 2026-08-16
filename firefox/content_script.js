window.addEventListener("message", async (event) => {
    const settings = await browser.storage.local.get({
        hakunekoUrl: "https://anenasa.github.io"
    });
    if (event.origin != settings.hakunekoUrl) return;
    const type = event.data.type;
    if (type === 'executeScript') handleExecuteScript(event);
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
