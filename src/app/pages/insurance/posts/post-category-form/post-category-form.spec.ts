import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostCategoryForm } from './post-category-form';

describe('PostCategoryForm', () => {
  let component: PostCategoryForm;
  let fixture: ComponentFixture<PostCategoryForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostCategoryForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostCategoryForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
