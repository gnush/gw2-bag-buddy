import { Routes } from '@angular/router';
import { BagsOverview } from './bags-overview/bags-overview';
import { JadebotOverview } from './jadebot-overview/jadebot-overview';
import { ApiKeySettings } from './api-key-settings/api-key-settings';
import { NavigatableHome } from './navigatable-home/navigatable-home';

export const routes: Routes = [
  {
    path: '',
    component: NavigatableHome,
    title: 'GW2 Character Buddy'
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
