(async () => {
    const harunekoUrl = document.querySelector("#harunekoUrl");
    const save = document.querySelector("#save");

    const settings = await browser.storage.local.get({
        harunekoUrl: "https://anenasa.github.io"
    });
    harunekoUrl.value = settings.harunekoUrl;

    save.addEventListener("click", async () => {
      await browser.storage.local.set({
        harunekoUrl: harunekoUrl.value
      });
      alert("Settings saved!");
    });
})();
