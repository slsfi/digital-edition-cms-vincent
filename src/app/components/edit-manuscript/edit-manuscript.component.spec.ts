import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditManuscriptComponent } from './edit-manuscript.component';

describe('EditManuscriptComponent', () => {
  let component: EditManuscriptComponent;
  let fixture: ComponentFixture<EditManuscriptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditManuscriptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditManuscriptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
