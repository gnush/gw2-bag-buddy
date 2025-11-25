import { Component, input } from '@angular/core';
import { InventoryBag } from '../inventoryBag';

@Component({
  selector: 'app-bag-cell',
  imports: [],
  templateUrl: './bag-cell.html',
  styleUrl: './bag-cell.css',
})
export class BagCell {
  readonly bag = input.required<InventoryBag>();
}
