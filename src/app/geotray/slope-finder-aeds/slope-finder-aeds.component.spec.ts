import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlopeFinderAEDSComponent } from './slope-finder-aeds.component';

describe('SlopeFinderAEDSComponent', () => {
  let component: SlopeFinderAEDSComponent;
  let fixture: ComponentFixture<SlopeFinderAEDSComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SlopeFinderAEDSComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SlopeFinderAEDSComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
