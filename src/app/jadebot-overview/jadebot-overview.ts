import { Component, effect, inject } from "@angular/core";
import { BagsService } from "../bags.service";

@Component({
  selector: 'app-jadebot-overview',
  imports: [],
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