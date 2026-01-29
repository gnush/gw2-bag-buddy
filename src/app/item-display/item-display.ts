import { Component, input } from "@angular/core";
import { DisplaybeItem } from "../displayableItem";

@Component({
    selector: 'app-item-display',
    imports: [],
    templateUrl: './item-display.html',
    styleUrl: './item-display.css',
})
export class ItemDisplay {
    readonly item = input.required<DisplaybeItem>();
    iconSizePx = input.required<number>();
}