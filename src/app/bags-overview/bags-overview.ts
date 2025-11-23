import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

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
    apiKey: new FormControl('')
  });

  applyApiKey(key: string) {
    alert('not yet implemented');
    console.log(key);
  }

  toggleApiKeyInfo() {
    this.showApiKeyInfo = !this.showApiKeyInfo;
  }
}
