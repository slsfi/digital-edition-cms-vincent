import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationBundleComponent } from './publication-bundle.component';

describe('PublicationBundleComponent', () => {
  let component: PublicationBundleComponent;
  let fixture: ComponentFixture<PublicationBundleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationBundleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicationBundleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
