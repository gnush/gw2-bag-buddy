import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyBagSlot } from './empty-bag-slot';

describe('EmptyBagSlot', () => {
  let component: EmptyBagSlot;
  let fixture: ComponentFixture<EmptyBagSlot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyBagSlot]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmptyBagSlot);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
