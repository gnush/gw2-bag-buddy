import { Component, effect, inject } from "@angular/core";
import { BagsService } from "../bags.service";
import { ItemDisplay } from "../item-display/item-display";
import { EmptyItemDisplay } from "../empty-item-display/empty-item-display";

@Component({
  selector: 'app-jadebot-overview',
  imports: [ItemDisplay, EmptyItemDisplay],
  templateUrl: './jadebot-overview.html',
  styleUrl: './jadebot-overview.css'
})
export class JadebotOverview {
  characterService = inject(BagsService);
  constructor() {
    // TODO: apply this to bags overview as well (after moving the api key form)
    effect(() => this.characterService.repopulateEquippedBagsAndJadebotComponents());
  }
}