import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlopeFinderComponent } from './slope-finder.component';

describe('SlopeFinderComponent', () => {
  let component: SlopeFinderComponent;
  let fixture: ComponentFixture<SlopeFinderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SlopeFinderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SlopeFinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
