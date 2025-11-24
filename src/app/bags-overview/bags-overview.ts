import { Component, inject, signal, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BagsService } from '../bags.service';

@Component({
  selector: 'app-bags-overview',
  imports: [ReactiveFormsModule],
  templateUrl: './bags-overview.html',
  styleUrl: './bags-overview.css',
})
export class BagsOverview {
  showApiKeyInfo = false;

  apiKeyForm = new FormGroup({
    apiKey: new FormControl('', Validators.required)
  });

  bagsService = inject(BagsService);

  tokenInfo: WritableSignal<string> = signal('');

  constructor() {
    this.apiKeyForm.setValue({apiKey: localStorage.getItem('apiKey') ?? ''});
    this.applyApiKey();
  }

  applyApiKey() {
    this.bagsService.setApiKey(this.apiKeyForm.value.apiKey ?? '').then(permissions => {
      if (permissions.length !== 0)
        this.tokenInfo.set(`missing '${permissions}'`);
      else
        this.tokenInfo.set(`api key valid`);
    });
  }

  toggleApiKeyInfo() {
    this.showApiKeyInfo = !this.showApiKeyInfo;
  }
}
