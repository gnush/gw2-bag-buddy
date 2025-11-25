import { Component, input } from '@angular/core';
import { InventoryBag } from '../inventoryBag';

@Component({
  selector: 'app-unused-bag-cell',
  imports: [],
  templateUrl: './unused-bag-cell.html',
  styleUrl: './unused-bag-cell.css',
})
export class UnusedBagCell {
  readonly bag = input.required<{bag: InventoryBag; location: string}>();
}
