import "./web/src/engine/RegExpSafe.ts";
import "./web/src/engine/ArrayExtensions.ts";
import * as websites from './web/src/engine/websites/_index';
import { CreateStorageController } from "./web/src/engine/StorageController.ts";
import { SettingsManager } from "./web/src/engine/SettingsManager.ts";
import { SetupCustomFetchProvider } from "./web/src/engine/platform/FetchProvider.ts";

SetupCustomFetchProvider(undefined);

const storageController = CreateStorageController();
const settingsManager = new SettingsManager(storageController);

async function main() {
    const values = Object.values(websites);
    for (let index = 0; index < values.length; index++) {
        const website = values[index];
        const scraper = new website();
        const provider = scraper.CreatePlugin(
            storageController,
            settingsManager
        );
        console.log(index, scraper.Identifier);
        const mangas = await scraper.FetchMangas(provider);
        console.log(mangas[0].Identifier);
        const manga = mangas[0];
        //const manga = await scraper.FetchManga(
            //undefined as unknown as MangaPlugin,
            //"https://comic.acgn.cc/manhua-zhanchihongzhitong.htm"
        //);

        const chapters = await scraper.FetchChapters(manga);
        const chapter = chapters[0];
        const pages = await scraper.FetchPages(chapter);
        const blob = await pages[0].Fetch(
            0,
            new AbortController().signal
        );

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = scraper.Identifier;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
}
main();

