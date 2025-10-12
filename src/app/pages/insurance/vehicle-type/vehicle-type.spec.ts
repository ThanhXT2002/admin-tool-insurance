import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleType } from './vehicle-type';

describe('VehicleType', () => {
  let component: VehicleType;
  let fixture: ComponentFixture<VehicleType>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleType]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleType);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
