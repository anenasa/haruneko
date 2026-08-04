import { FetchProvider } from '../FetchProviderCommon';
import { DOMParser } from "linkedom";

export default class NodeFetchProvider extends FetchProvider {

    public override async Fetch(request: Request): Promise<Response> {
        return fetch(request);
    }

    public override Initialize(featureFlags) {
        super.Initialize(featureFlags);

        if (!globalThis.DOMParser) {
            globalThis.DOMParser = DOMParser;
        }
    }
}