(() => {
    const harunekoUrl = document.querySelector("#harunekoUrl");
    browser.storage.local.get({
        harunekoUrl: "https://anenasa.github.io"
    }).then((settings) => {
        harunekoUrl.value = settings.harunekoUrl;
    });

    document.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault();
        browser.storage.local.set({
            harunekoUrl: harunekoUrl.value
        });
        browser.tabs.create({
            url: harunekoUrl.value
        });
        window.close();
    });
})();
