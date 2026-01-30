import { Component, effect, inject } from "@angular/core";
import { BagsService } from "../bags.service";
import { ItemDisplay } from "../item-display/item-display";
import { EmptyItemDisplay } from "../empty-item-display/empty-item-display";
import { CharacterDisplay } from "../character-display/character-display";

@Component({
  selector: 'app-jadebot-overview',
  imports: [ItemDisplay, EmptyItemDisplay, CharacterDisplay],
  templateUrl: './jadebot-overview.html',
  styleUrl: './jadebot-overview.css'
})
export class JadebotOverview {
  characterService = inject(BagsService);
  constructor() {
    effect(() => this.characterService.repopulateEquippedBagsAndJadebotComponents());
  }
}