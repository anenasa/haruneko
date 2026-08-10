import type { BrowserWindowConstructorOptions, LoadURLOptions } from 'electron';
import { Observable, type IObservable } from '../../Observable';
import type { IRemoteBrowserWindow } from '../RemoteBrowserWindow';
import type { IPC } from '../InterProcessCommunication';
import { RemoteBrowserWindowController as Channels } from '../../../../../app/src/ipc/Channels';

export default class RemoteBrowserWindow implements IRemoteBrowserWindow {

    private iframe;

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
    }

    public async Open(request: Request, show: boolean = false, preload: string = '') {
        console.warn('referrer, headers, preload not implemented');
        this.iframe = document.createElement("iframe");
        this.iframe.src = request.url;
        Object.assign(this.iframe.style, {
            position: "fixed",
            inset: "0",
            width: "100vw",
            height: "100vh",
            border: "0",
            zIndex: "999999"
        });
        if (!show) {
            this.iframe.style.visibility = "hidden";
        }
        this.iframe.addEventListener('load', () => {
            this.domReady.Dispatch();
        });
        document.body.appendChild(this.iframe);
    }

    public async Close(): Promise<void> {
        this.iframe.remove();
    }

    public async Show(): Promise<void> {
        this.iframe.style.visibility = 'visible';
    }

    public async Hide(): Promise<void> {
        this.iframe.style.visibility = "hidden";
    }

    public async ExecuteScript<T extends void | JSONElement>(script: string = ''): Promise<T> {
        return new Promise((resolve, reject) => {
            const executeScriptId = crypto.randomUUID();
            function handler(event) {
                if (event.data?.executeScriptReturnId !== executeScriptId) return;
                window.removeEventListener("message", handler);
                resolve(event.data.result);
            }
            window.addEventListener("message", handler);
            this.iframe.contentWindow.postMessage({executeScriptId, script}, "*");
        })
    }

    public async SendDebugCommand<T extends void | JSONElement>(method: string, parameters?: JSONObject): Promise<T> {
        console.warn(`SendDebugCommand not implemented`);
        return undefined as T;
    }
}