import type { IPC } from '../InterProcessCommunication';
import type { IAppWindow } from '../AppWindow';
import { ApplicationWindow as Channels } from '../../../../../app/src/ipc/Channels';

export default class implements IAppWindow {

    constructor(private readonly ipc: IPC<Channels.App, Channels.Web>, private readonly splashURL: string) {}

    public async ShowSplash(): Promise<void> {}

    public async HideSplash(): Promise<void> {}

    public get HasControls() {
        return false;
    }

    public get Maximized(): IObservable<boolean, IAppWindow> {
        return true;
    }

    public Minimize(): void {}

    public Maximize(): void {}

    public Restore(): void {}

    public Close(): void {}
}