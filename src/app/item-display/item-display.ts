import { Component, input } from "@angular/core";
import { DisplaybeItem } from "../displayableItem";
import { IconDisplay } from "../icon-display/icon-display";

@Component({
  selector: 'app-item-display',
  imports: [IconDisplay],
  templateUrl: './item-display.html',
  styleUrl: './item-display.css',
})
export class ItemDisplay {
  readonly item = input.required<DisplaybeItem>();
  iconSizePx = input.required<number>();
}