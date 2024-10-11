import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPublicationCollectionComponent } from './edit-publication-collection.component';

describe('EditPublicationCollectionComponent', () => {
  let component: EditPublicationCollectionComponent;
  let fixture: ComponentFixture<EditPublicationCollectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPublicationCollectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditPublicationCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
