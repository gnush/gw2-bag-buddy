import { TestBed } from '@angular/core/testing';

import { Bags } from './bags.service';

describe('Bags', () => {
  let service: Bags;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Bags);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
