import { TestBed } from '@angular/core/testing';

import { MatrixReverseService } from './matrix-reverse.service';

describe('MatrixReverseService', () => {
  let service: MatrixReverseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatrixReverseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
