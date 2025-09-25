import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DragDropImgList } from './drag-drop-img-list';

describe('DragDropImgList', () => {
  let component: DragDropImgList;
  let fixture: ComponentFixture<DragDropImgList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DragDropImgList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DragDropImgList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
