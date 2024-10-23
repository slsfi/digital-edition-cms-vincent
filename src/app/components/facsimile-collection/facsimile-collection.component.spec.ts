import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacsimileCollectionComponent } from './facsimile-collection.component';

describe('FacsimileCollectionComponent', () => {
  let component: FacsimileCollectionComponent;
  let fixture: ComponentFixture<FacsimileCollectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacsimileCollectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacsimileCollectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
