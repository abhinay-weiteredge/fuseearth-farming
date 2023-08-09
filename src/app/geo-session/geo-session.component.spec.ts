import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeoSessionComponent } from './geo-session.component';

describe('GeoSessionComponent', () => {
  let component: GeoSessionComponent;
  let fixture: ComponentFixture<GeoSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeoSessionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GeoSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
