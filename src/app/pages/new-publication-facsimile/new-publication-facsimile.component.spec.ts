import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPublicationFacsimileComponent } from './new-publication-facsimile.component';

describe('NewPublicationFacsimileComponent', () => {
  let component: NewPublicationFacsimileComponent;
  let fixture: ComponentFixture<NewPublicationFacsimileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewPublicationFacsimileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewPublicationFacsimileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
