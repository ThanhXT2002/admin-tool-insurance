import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostCategories } from './post-categories';

describe('PostCategories', () => {
  let component: PostCategories;
  let fixture: ComponentFixture<PostCategories>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostCategories]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostCategories);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
