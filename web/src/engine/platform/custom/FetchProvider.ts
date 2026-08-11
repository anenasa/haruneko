import { FetchProvider } from '../FetchProviderCommon';
import type { FeatureFlags } from '../../FeatureFlags';
import type { IPC } from '../InterProcessCommunication';
import { FetchProvider as Channels } from '../../../../../app/src/ipc/Channels';

// See: https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name
const fetchApiSupportedPrefix = 'X-FetchAPI-';
const fetchApiForbiddenHeaders = [
    'User-Agent',
    'Referer',
    'Cookie',
    'Origin',
    'Host',
    'Sec-Fetch-Mode',
    'Sec-Fetch-Dest',
    'Sec-Fetch-Site',
];

function ConcealHeaders(init: HeadersInit): Headers {
    const headers = new Headers(init);
    for(const name of fetchApiForbiddenHeaders) {
        if(headers.has(name)) {
            headers.set(fetchApiSupportedPrefix + name, headers.get(name));
            headers.delete(name);
        }
    }
    return headers;
}

class FetchRequest extends Request {
    readonly #referrer: string = undefined;
    public override get referrer() { return this.#referrer; }
    constructor(input: URL | RequestInfo, init?: RequestInit) {
        if(init?.headers) init.headers = ConcealHeaders(init.headers);
        super(input, init);
        if(init?.referrer) this.#referrer = init.referrer;
    }
}

export default class extends FetchProvider {

    constructor(private readonly ipc: IPC<Channels.App, Channels.Web>) {
        super();
    }

    public Initialize(featureFlags: FeatureFlags): void {

        super.Initialize(featureFlags);

        // Abuse the global Request type to check if system is already initialized
        if(globalThis.Request === FetchRequest) {
            return;
        }

        // NOTE: Monkey patching of the browser's native functionality to allow forbidden headers
        globalThis.Request = FetchRequest;
    }

    async Fetch(request: Request): Promise<Response> {
        // Serialize request and send to helper extension to avoid CORS preflight request
        const serialized = {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers),
            body: await request.arrayBuffer(),
            bodyUsed: request.bodyUsed,
            credentials: request.credentials,
        }
        const result = await new Promise((resolve, reject) => {
            const fetchRequestId = crypto.randomUUID();
            function handler(event) {
                if (event.data?.fetchResponseId !== fetchRequestId) return;
                window.removeEventListener("message", handler);
                const result = event.data.result;
                if (result.error) {
                    reject(new Error(result.error));
                }
                else {
                    resolve(result);
                }
            }
            window.addEventListener("message", handler);
            window.postMessage({type: "fetch", fetchRequestId, serialized}, "*");
        });
        const response = new Response(new Uint8Array(result.body) || null, {
            status: result.status || 200,
            statusText: result.statusText || 'OK',
            headers: new Headers(result.headers)
        });
        await super.ValidateResponse(response);
        return response;
    }
}
