import { TestBed } from '@angular/core/testing';

import { MatrixPathAEDSService } from './matrix-path-aeds.service';

describe('MatrixPathAEDSService', () => {
  let service: MatrixPathAEDSService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatrixPathAEDSService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
