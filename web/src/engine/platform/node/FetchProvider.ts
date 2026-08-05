import { FetchProvider } from '../FetchProviderCommon';

export default class NodeFetchProvider extends FetchProvider {
    public override async Fetch(request: Request): Promise<Response> {
        return fetch(request);
    }
}
