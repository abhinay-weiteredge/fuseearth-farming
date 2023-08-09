import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeoNotepadComponent } from './geo-notepad.component';

describe('GeoNotepadComponent', () => {
  let component: GeoNotepadComponent;
  let fixture: ComponentFixture<GeoNotepadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeoNotepadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeoNotepadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
