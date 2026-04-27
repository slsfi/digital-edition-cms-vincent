import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomTableComponent } from './custom-table.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';

describe('CustomTableComponent', () => {
  let component: CustomTableComponent<unknown>;
  let fixture: ComponentFixture<CustomTableComponent<unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomTableComponent],
      providers: getCommonTestingProviders()
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomTableComponent<unknown>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
