import { Component, inject, input } from "@angular/core";
import { IconDisplay } from "../icon-display/icon-display";
import { ProfessionService } from "../profession.service";

// TODO: instead of profession icon, the current elite spec icon?
@Component({
  selector: 'app-character-display',
  imports: [IconDisplay],
  templateUrl: './character-display.html',
  styleUrl: './character-display.css',
})
export class CharacterDisplay {
  professionService = inject(ProfessionService);

  name = input.required<string>();
  race = input.required<string>();
  level = input.required<number>();
  profession = input.required<string>();

  protected icon(): string {
    return this.professionService.profession(this.profession())?.icon ?? '';
  }
}