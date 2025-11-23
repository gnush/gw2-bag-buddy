import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BagsOverview } from './bags-overview';

describe('BagsOverview', () => {
  let component: BagsOverview;
  let fixture: ComponentFixture<BagsOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BagsOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BagsOverview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
