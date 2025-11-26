import { Component, input } from '@angular/core';
import { InventoryBag } from '../inventoryBag';

@Component({
  selector: 'app-unused-bag',
  imports: [],
  templateUrl: './unused-bag.html',
  styleUrl: './unused-bag.css',
})
export class UnusedBag {
  readonly bag = input.required<{bag: InventoryBag; location: string}>();
}
