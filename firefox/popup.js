(() => {
    const hakunekoUrl = document.querySelector("#hakunekoUrl");
    browser.storage.local.get({
        hakunekoUrl: "https://anenasa.github.io"
    }).then((settings) => {
        hakunekoUrl.value = settings.hakunekoUrl;
    });

    document.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault();
        browser.storage.local.set({
            hakunekoUrl: hakunekoUrl.value
        });
        browser.tabs.create({
            url: hakunekoUrl.value
        });
        window.close();
    });
})();
