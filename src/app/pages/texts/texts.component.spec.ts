import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextsComponent } from './texts.component';

describe('TextsComponent', () => {
  let component: TextsComponent;
  let fixture: ComponentFixture<TextsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
