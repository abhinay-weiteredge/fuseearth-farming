import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintToolComponent } from './print-tool.component';

describe('PrintToolComponent', () => {
  let component: PrintToolComponent;
  let fixture: ComponentFixture<PrintToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrintToolComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PrintToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
