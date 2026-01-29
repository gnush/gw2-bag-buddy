import { Routes } from '@angular/router';
import { BagsOverview } from './bags-overview/bags-overview';
import { JadebotOverview } from './jadebot-overview/jadebot-overview';
import { ApiKeySettings } from './api-key-settings/api-key-settings';

export const routes: Routes = [
  {
    path: '',
    component: BagsOverview,
    title: 'Equipped Bags'
  },
  {
    path: 'apikey',
    component: ApiKeySettings,
    title: 'GW2 Api Key Settings'
  },
  {
    path: 'bags',
    component: BagsOverview,
    title: 'Equipped Bags'
  },
  {
    path: 'jadebot',
    component: JadebotOverview,
    title: 'Equipped Jadebot Components'
  }
];
