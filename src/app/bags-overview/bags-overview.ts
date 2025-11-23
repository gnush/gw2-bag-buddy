import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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

  applyApiKey() {
    alert('not yet implemented');
    console.log(`Entered api key: '${this.apiKeyForm.value.apiKey}'`);
  }

  toggleApiKeyInfo() {
    this.showApiKeyInfo = !this.showApiKeyInfo;
  }
}
