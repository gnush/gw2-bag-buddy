import { Component, effect, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ApiKeyService } from "../apiKey.service";

@Component({
  selector: 'app-api-key-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './api-key-settings.html',
  styleUrl: './api-key-settings.css'
})
export class ApiKeySettings {
  apiKeyForm = new FormGroup({
    apiKey: new FormControl('', Validators.required)
  });

  apiKeyService = inject(ApiKeyService);

  constructor() {
    effect(() => this.apiKeyForm.setValue({apiKey: this.apiKeyService.apiAccessToken()}));
  }

  applyApiKey() {
    this.apiKeyService.setGW2ApiAccessToken(this.apiKeyForm.value.apiKey ?? '')
  }
}