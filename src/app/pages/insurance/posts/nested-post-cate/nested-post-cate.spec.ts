import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NestedPostCate } from './nested-post-cate';

describe('NestedPostCate', () => {
  let component: NestedPostCate;
  let fixture: ComponentFixture<NestedPostCate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NestedPostCate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NestedPostCate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
