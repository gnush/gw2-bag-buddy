import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquippedBag } from './equipped-bag';

describe('EquippedBag', () => {
  let component: EquippedBag;
  let fixture: ComponentFixture<EquippedBag>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquippedBag]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquippedBag);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
