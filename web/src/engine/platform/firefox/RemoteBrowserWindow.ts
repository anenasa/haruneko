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
        console.warn('OnBeforeNavigate not implemented');
        this.ipc.Listen("RemoteBrowserWindow.OnDomReady", this.OnDomReady);
    }

    private OnDomReady = (data): Promise<void> => {
        if(data.tabId === this.tabId) {
            this.domReady.Dispatch();
        }
    }

    public async Open(request: Request, show: boolean = false, preload: string = '') {
        console.warn('referrer, headers, preload not implemented');
        this.tabId = await this.ipc.Send<number>("RemoteBrowserWindow.Open", request.url, show);
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