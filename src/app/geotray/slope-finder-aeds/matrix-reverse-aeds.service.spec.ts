import { TestBed } from '@angular/core/testing';

import { MatrixReverseAEDSService } from './matrix-reverse-aeds.service';

describe('MatrixReverseAEDSService', () => {
  let service: MatrixReverseAEDSService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatrixReverseAEDSService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
