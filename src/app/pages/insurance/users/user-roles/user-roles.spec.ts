import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRoles } from './user-roles';

describe('UserRoles', () => {
  let component: UserRoles;
  let fixture: ComponentFixture<UserRoles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserRoles]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserRoles);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
