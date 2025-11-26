import { Component, input } from '@angular/core';
import { InventoryBag } from '../inventoryBag';

@Component({
  selector: 'app-equipped-bag',
  imports: [],
  templateUrl: './equipped-bag.html',
  styleUrl: './equipped-bag.css',
})
export class EquippedBag {
  readonly bag = input.required<InventoryBag>();
}
