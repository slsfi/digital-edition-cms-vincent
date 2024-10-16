import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationCollectionsComponent } from './publication-collections.component';

describe('PublicationCollectionsComponent', () => {
  let component: PublicationCollectionsComponent;
  let fixture: ComponentFixture<PublicationCollectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationCollectionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicationCollectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
