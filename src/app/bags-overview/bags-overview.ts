import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CharacterInfo, MyCharacterInfo } from '../characterInfo';
import { BagsService } from '../bags.service';

@Component({
  selector: 'app-bags-overview',
  imports: [ReactiveFormsModule],
  templateUrl: './bags-overview.html',
  styleUrl: './bags-overview.css',
})
export class BagsOverview {
  showApiKeyInfo = false;

  // https://wiki.guildwars2.com/wiki/API:Main
  apiKeyPermissions = ['account','characters', 'inventories'];

  apiKeyForm = new FormGroup({
    apiKey: new FormControl('', Validators.required)
  });

  bagsService = inject(BagsService);

  applyApiKey() {
    alert('not yet implemented');
    console.log(`Entered api key: '${this.apiKeyForm.value.apiKey}'`);
  }

  toggleApiKeyInfo() {
    this.showApiKeyInfo = !this.showApiKeyInfo;
  }
}
