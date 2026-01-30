import { Injectable, signal, WritableSignal } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ProfessionService {
  private professions: WritableSignal<Profession[]> = signal([]);
  
  public profession(id: string): Profession|undefined {
    return this.professions().find(profession => profession.id === id);
  }

  constructor() {
    this.fetchProfessions();
  }

  private async fetchProfessions() {
    this.professions.set(
      await ((await fetch('https://api.guildwars2.com/v2/professions?ids=all')).json() ?? [])
    );
  }
}

interface Profession {
  id: string;
  name: string;
  icon: string;
  icon_big: string;
}