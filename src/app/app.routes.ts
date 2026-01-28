import { Routes } from '@angular/router';
import { BagsOverview } from './bags-overview/bags-overview';
import { JadebotOverview } from './jadebot-overview/jadebot-overview';

export const routes: Routes = [
  {
    path: '',
    component: BagsOverview,
    title: 'Equipped Bags'
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
