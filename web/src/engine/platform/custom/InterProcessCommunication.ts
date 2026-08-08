import type { IPC, Callback } from '../InterProcessCommunication';

export default class implements IPC<string, string> {

    public Listen(channel: string, callback: Callback): void {
        console.warn(`IPC.Listen not implemented`);
    }

    public async Send<T extends void | JSONElement>(channel: string, ...parameters: JSONArray): Promise<T> {
        console.warn(`IPC.Listen not implemented`);
        return undefined as T;
    }
}