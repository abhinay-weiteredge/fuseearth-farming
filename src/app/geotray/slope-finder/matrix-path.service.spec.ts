import { TestBed } from '@angular/core/testing';

import { MatrixPathService } from './matrix-path.service';

describe('MatrixPathService', () => {
  let service: MatrixPathService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatrixPathService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
