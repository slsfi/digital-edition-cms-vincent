import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFacsimileComponent } from './edit-facsimile.component';

describe('EditFacsimileComponent', () => {
  let component: EditFacsimileComponent;
  let fixture: ComponentFixture<EditFacsimileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditFacsimileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditFacsimileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
