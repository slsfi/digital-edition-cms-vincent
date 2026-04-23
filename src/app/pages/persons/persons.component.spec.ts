import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PersonsComponent } from './persons.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';
import { SubjectService } from '../../services/subject.service';

describe('PersonsComponent', () => {
  let component: PersonsComponent;
  let fixture: ComponentFixture<PersonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonsComponent],
      providers: [
        ...getCommonTestingProviders(),
        {
          provide: SubjectService,
          useValue: {
            selectedProject$: of('test-project'),
            getSubjects: () => of([])
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
