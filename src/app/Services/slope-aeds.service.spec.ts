import { TestBed } from '@angular/core/testing';

import { SlopeAEDSService } from './slope-aeds.service';

describe('SlopeAEDSService', () => {
  let service: SlopeAEDSService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SlopeAEDSService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
