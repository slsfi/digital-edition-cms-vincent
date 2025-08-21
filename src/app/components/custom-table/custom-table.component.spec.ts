import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomTableComponent } from './custom-table.component';

describe('CustomTableComponent', () => {
  let component: CustomTableComponent<any>;
  let fixture: ComponentFixture<CustomTableComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomTableComponent<any>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
