import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeorefComponent } from './georef.component';

describe('GeorefComponent', () => {
  let component: GeorefComponent;
  let fixture: ComponentFixture<GeorefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GeorefComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GeorefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
