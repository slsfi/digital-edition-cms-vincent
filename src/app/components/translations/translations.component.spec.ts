import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslationsComponent } from './translations.component';

describe('TranslationsComponent', () => {
  let component: TranslationsComponent;
  let fixture: ComponentFixture<TranslationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TranslationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
