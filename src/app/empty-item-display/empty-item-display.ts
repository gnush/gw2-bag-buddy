import { Component, input } from "@angular/core";

@Component({
  selector: 'app-empty-item-display',
  imports: [],
  templateUrl: './empty-item-display.html',
  styleUrl: './empty-item-display.css',
})
export class EmptyItemDisplay {
  iconSizePx = input.required<number>();
}
