import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BufferToolComponent } from './buffer-tool.component';

describe('BufferToolComponent', () => {
  let component: BufferToolComponent;
  let fixture: ComponentFixture<BufferToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BufferToolComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BufferToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
