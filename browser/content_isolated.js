window.addEventListener("message", async (event) => {
    if (event.origin != "https://localhost:5000") return;
    const type = event.data.type;
    if (type === 'fetch') handleFetch(event);
});

async function handleFetch(event) {
    const { fetchRequestId, serialized } = event.data;
    if (!fetchRequestId) return;
    const result = await browser.runtime.sendMessage({type: "forwardFetch", fetchRequestId, serialized});
    window.postMessage({fetchResponseId: fetchRequestId, result}, "*");
}
