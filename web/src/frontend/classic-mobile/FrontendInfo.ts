import type { IFrontendInfo } from '../IFrontend';
import { FrontendResourceKey as R } from '../../i18n/ILocale';

export const Info: IFrontendInfo = {
    ID: 'classic-mobile',
    Label: R.Frontend_ClassicMobile_Label,
    Description: R.Frontend_ClassicMobile_Description,
    Screenshots: [],
    LoadModule: async () => (await import('./FrontendClassic')).default
};