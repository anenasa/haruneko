import { Observable, type IObservable } from '../../Observable';
import type { IRemoteBrowserWindow } from '../RemoteBrowserWindow';
import type { IPC } from '../InterProcessCommunication';
import { RemoteBrowserWindowController as Channels } from '../../../../../app/src/ipc/Channels';

export default class RemoteBrowserWindow implements IRemoteBrowserWindow {

    private tabId = Number.NaN;

    private readonly domReady = new Observable<void, RemoteBrowserWindow>(null, this);
    public get DOMReady(): IObservable<void, RemoteBrowserWindow> {
        return this.domReady;
    };

    private readonly beforeWindowNavigate = new Observable<URL, RemoteBrowserWindow>(null, this);
    public get BeforeWindowNavigate(): IObservable<URL, RemoteBrowserWindow> {
        return this.beforeWindowNavigate;
    };

    private readonly beforeFrameNavigate = new Observable<URL, RemoteBrowserWindow>(null, this);
    public get BeforeFrameNavigate(): IObservable<URL, RemoteBrowserWindow> {
        return this.beforeFrameNavigate;
    };

    constructor(private readonly ipc: IPC<Channels.App, Channels.Web>) {
        this.ipc.Listen("RemoteBrowserWindow.OnDomReady", this.OnDomReady);
        this.ipc.Listen("RemoteBrowserWindow.OnBeforeNavigate", this.OnBeforeNavigate);
    }

    private OnDomReady = (data): Promise<void> => {
        if(data.tabId === this.tabId) {
            this.domReady.Dispatch();
        }
    }

    private OnBeforeNavigate = (data): Promise<void> => {
        const { tabId, url, isMainFrame } = data;
        if(tabId !== this.tabId || !url.startsWith('http')) return;
        if(isMainFrame) {
            this.beforeWindowNavigate.Value = new URL(url);
        } else {
            this.beforeFrameNavigate.Value = new URL(url);
        }
    }

    public async Open(request: Request, show: boolean = false, preload: string = '') {
        this.tabId = await this.ipc.Send<number>("RemoteBrowserWindow.OpenTab", show);
        const headers = Object.fromEntries(request.headers);
        await this.ipc.Send<number>("RemoteBrowserWindow.LoadUrl", this.tabId, request.url, headers, preload);
    }

    public async Close(): Promise<void> {
        await this.ipc.Send<void>("RemoteBrowserWindow.Close", this.tabId);
    }

    public async Show(): Promise<void> {
        await this.ipc.Send<void>("RemoteBrowserWindow.Show", this.tabId);
    }

    public async Hide(): Promise<void> {
        await this.ipc.Send<void>("RemoteBrowserWindow.Hide", this.tabId);
    }

    public async ExecuteScript<T extends void | JSONElement>(script: string = ''): Promise<T> {
        return this.ipc.Send<T>("RemoteBrowserWindow.ExecuteScript", this.tabId, script);
    }

    public async SendDebugCommand<T extends void | JSONElement>(method: string, parameters?: JSONObject): Promise<T> {
        console.warn(`SendDebugCommand not implemented`);
        return undefined as T;
    }
}