import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuItemForm } from './menu-item-form';

describe('MenuItemForm', () => {
  let component: MenuItemForm;
  let fixture: ComponentFixture<MenuItemForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuItemForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuItemForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
