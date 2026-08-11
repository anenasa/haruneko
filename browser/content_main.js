window.addEventListener("message", async (event) => {
    if (event.origin != "https://localhost:5000") return;
    const type = event.data.type;
    if (type === 'executeScript') handleExecuteScript(event);
});

async function handleExecuteScript(event) {
    const { executeScriptId, script } = event.data;
    if (!executeScriptId) return;
    const result = await eval(script);
    window.parent.postMessage({executeScriptReturnId: executeScriptId, result}, "*");
}
