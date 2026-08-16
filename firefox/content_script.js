window.addEventListener("message", async (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data.type !== 'InterProcessCommunication') return;
    const result = await browser.runtime.sendMessage(event.data).catch((error) => {
        return { error: error.message };
    });
    if (result.error === undefined) {
        window.postMessage({
            returnId: event.data.id,
            result: result.result
        }, window.location.origin);
    } else {
        window.postMessage({
            returnId: event.data.id,
            error: result.error
        }, window.location.origin);
    }
});
