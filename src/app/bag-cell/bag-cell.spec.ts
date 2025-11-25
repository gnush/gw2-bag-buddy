import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BagCell } from './bag-cell';

describe('BagCell', () => {
  let component: BagCell;
  let fixture: ComponentFixture<BagCell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BagCell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BagCell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
