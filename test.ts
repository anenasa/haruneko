import fs from 'node:fs';
import "./web/src/engine/RegExpSafe.ts";
import "./web/src/engine/ArrayExtensions.ts";
import * as websites from './web/src/engine/websites/_index';
//import { CreateStorageController } from "./web/src/engine/StorageController.ts";
//import { SettingsManager } from "./web/src/engine/SettingsManager.ts";
import { SetupFetchProvider } from "./web/src/engine/platform/FetchProvider.ts";

SetupFetchProvider(undefined);

//const storageController = CreateStorageController();
//const settingsManager = new SettingsManager(storageController);
//const provider = scraper.CreatePlugin(
    //storageController,
    //settingsManager
//);

const fakeProvider = {
    Initialize() {},
    CreateEntry(identifier: string, title: string) {
        return { identifier, title };
    }
} as any;

async function main() {
    const values = Object.values(websites);
    for (let index = 0; index < values.length; index++) {
        const website = values[index];
        const scraper = new website();
        console.log(index, scraper.Identifier);
        const mangas = await scraper.FetchMangas(fakeProvider);
        //const manga = await scraper.FetchManga(
            //undefined as unknown as MangaPlugin,
            //"https://comic.acgn.cc/manhua-zhanchihongzhitong.htm"
        //);

        console.log(mangas[0].Identifier);
        const chapters = await scraper.FetchChapters(mangas[0]);
        const chapter = chapters[0];
        await chapter.Update();
        const pages = chapter.Entries.Value;
        const blob = await pages[0].Fetch(
            0,
            new AbortController().signal
        );
        const buffer = Buffer.from(await blob.arrayBuffer());
        await fs.promises.writeFile(scraper.Identifier, buffer);
    }
}
main();

