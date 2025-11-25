import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnusedBagCell } from './unused-bag-cell';

describe('UnusedBagCell', () => {
  let component: UnusedBagCell;
  let fixture: ComponentFixture<UnusedBagCell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnusedBagCell]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnusedBagCell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
