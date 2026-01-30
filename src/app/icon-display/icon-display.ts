import { Component, input } from "@angular/core";

@Component({
  selector: 'app-icon-display',
  imports: [],
  templateUrl: './icon-display.html',
  styleUrl: './icon-display.css'
})
export class IconDisplay {
  icon = input.required<string>();
  displaySizePx = input.required<number>();
  altText = input.required<string>();
}