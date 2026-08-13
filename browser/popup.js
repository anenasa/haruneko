document.querySelector("#settings").addEventListener("click", () => {
    browser.runtime.openOptionsPage();
});
document.querySelector("#haruneko").addEventListener("click", async () => {
    const settings = await browser.storage.local.get({
        harunekoUrl: "https://anenasa.github.io"
    });
    await browser.tabs.create({
        url: settings.harunekoUrl
    });
});
