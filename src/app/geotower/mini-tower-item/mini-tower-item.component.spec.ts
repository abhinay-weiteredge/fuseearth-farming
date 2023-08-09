import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniTowerItemComponent } from './mini-tower-item.component';

describe('MiniTowerItemComponent', () => {
  let component: MiniTowerItemComponent;
  let fixture: ComponentFixture<MiniTowerItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MiniTowerItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MiniTowerItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
