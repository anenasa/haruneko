import { FetchProvider } from '../FetchProviderCommon';

export default class extends FetchProvider {

    async Fetch(request: Request): Promise<Response> {
        const response = await fetch(request);
        await super.ValidateResponse(response);
        return response;
    }
}