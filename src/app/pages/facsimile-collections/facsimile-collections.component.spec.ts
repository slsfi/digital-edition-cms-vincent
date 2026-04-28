import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacsimileCollectionsComponent } from './facsimile-collections.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';

describe('FacsimileCollectionsComponent', () => {
  let component: FacsimileCollectionsComponent;
  let fixture: ComponentFixture<FacsimileCollectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacsimileCollectionsComponent],
      providers: getCommonTestingProviders()
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacsimileCollectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
