import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnusedBag } from './unused-bag';

describe('UnusedBag', () => {
  let component: UnusedBag;
  let fixture: ComponentFixture<UnusedBag>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnusedBag]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnusedBag);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
