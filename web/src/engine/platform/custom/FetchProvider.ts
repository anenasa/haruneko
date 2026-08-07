import { FetchProvider } from '../FetchProviderCommon';

export default class CustomFetchProvider extends FetchProvider {

    public override async Fetch(request: Request): Promise<Response> {
        return fetch(request);
    }
}