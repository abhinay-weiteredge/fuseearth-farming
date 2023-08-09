import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenanceScreenComponent } from './maintenance-screen.component';

describe('MaintenanceScreenComponent', () => {
  let component: MaintenanceScreenComponent;
  let fixture: ComponentFixture<MaintenanceScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MaintenanceScreenComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MaintenanceScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
