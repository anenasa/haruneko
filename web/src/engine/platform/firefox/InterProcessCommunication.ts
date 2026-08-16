import type { IPC, Callback } from '../InterProcessCommunication';

export default class implements IPC<string, string> {

    private callbacksMap = new Map<string, Set<Callback>>();

    constructor() {
        window.addEventListener("message", (event) => {
            if (event.origin !== window.location.origin) return;
            const callbacks = this.callbacksMap.get(event.data.channel);
            if (callbacks === undefined) return;
            for (const callback of callbacks) {
                callback(event.data);
            }
        });
    }

    public Listen(channel: string, callback: Callback): void {
        const callbacks = this.callbacksMap.get(channel);
        if (callbacks === undefined) {
            this.callbacksMap.set(channel, new Set().add(callback));
        } else {
            callbacks.add(callback);
        }
    }

    public async Send<T extends void | JSONElement>(channel: string, ...parameters: JSONArray): Promise<T> {
        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            const timeoutId = setTimeout(() => {
                window.removeEventListener("message", handler);
                console.error(`InterProcessCommunication: ${channel} timed out`);
                reject(new Error(`${channel} timed out`));
            }, 60000);
            function handler(event) {
                if (event.origin !== window.location.origin) return;
                if (event.data?.returnId !== id) return;
                clearTimeout(timeoutId);
                window.removeEventListener("message", handler);
                if (event.data.error !== undefined) {
                    console.error(`InterProcessCommunication: ${channel} failed: ${event.data.error}`);
                    reject(new Error(`${channel} failed: ${event.data.error}`));
                } else {
                    resolve(event.data.result);
                }
            }
            window.addEventListener("message", handler);
            window.postMessage({type: "InterProcessCommunication", channel, id, parameters}, window.location.origin);
        });
    }
}
