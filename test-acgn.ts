import fs from 'node:fs';
import "./web/src/engine/RegExpSafe.ts";
import "./web/src/engine/ArrayExtensions.ts";
//import { CreateStorageController } from "./web/src/engine/StorageController.ts";
//import { SettingsManager } from "./web/src/engine/SettingsManager.ts";
import { SetupNodeFetchProvider } from "./web/src/engine/platform/FetchProvider.ts";
import { parseHTML } from "linkedom";

const { window } = parseHTML("<html></html>");

Object.assign(globalThis, {
    window,
    document: window.document,
    HTMLElement: window.HTMLElement,
    HTMLMetaElement: window.HTMLMetaElement,
    HTMLAnchorElement: window.HTMLAnchorElement,
});
SetupNodeFetchProvider();
import ACGN from "./web/src/engine/websites/ACGN.ts";

const scraper = new ACGN();

//const storageController = CreateStorageController();
//const settingsManager = new SettingsManager(storageController);
//const provider = scraper.CreatePlugin(
    //storageController,
    //settingsManager
//);

const fakeProvider = {
    CreateEntry(identifier: string, title: string) {
        return { identifier, title };
    }
} as any;
//const list = await scraper.FetchMangas(fakeProvider);
const manga = await scraper.FetchManga(
    undefined as unknown as MangaPlugin,
    "https://comic.acgn.cc/manhua-zhanchihongzhitong.htm"
);

console.log(manga.Identifier);
console.log(manga.Title);
const chapters = await scraper.FetchChapters(manga);
const chapter = chapters[0];
await chapter.Update();
const pages = chapter.Entries.Value;
const blob = await pages[0].Fetch(
    0,
    new AbortController().signal
);
const buffer = Buffer.from(await blob.arrayBuffer());
await fs.promises.writeFile("page.jpg", buffer);