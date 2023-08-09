import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptureNotesComponent } from './capture-notes.component';

describe('CaptureNotesComponent', () => {
  let component: CaptureNotesComponent;
  let fixture: ComponentFixture<CaptureNotesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CaptureNotesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CaptureNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
