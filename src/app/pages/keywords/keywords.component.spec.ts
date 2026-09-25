import { provideCheckNoChangesConfig } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, defer, NEVER } from 'rxjs';

import { KeywordsComponent } from './keywords.component';
import { KeywordService } from '../../services/keyword.service';
import { LoadingService } from '../../services/loading.service';
import { ProjectService } from '../../services/project.service';
import { QueryParamsService } from '../../services/query-params.service';
import { SnackbarService } from '../../services/snackbar.service';

describe('KeywordsComponent', () => {
  let fixture: ComponentFixture<KeywordsComponent>;
  let loadingService: LoadingService;
  let keywordService: {
    getKeywords: ReturnType<typeof vi.fn>;
    extractCategoriesFromKeywords: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    keywordService = {
      getKeywords: vi.fn(),
      extractCategoriesFromKeywords: vi.fn().mockReturnValue([])
    };

    await TestBed.configureTestingModule({
      imports: [KeywordsComponent],
      providers: [
        provideCheckNoChangesConfig({ exhaustive: true, interval: 1000 }),
        provideRouter([]),
        { provide: KeywordService, useValue: keywordService },
        { provide: ProjectService, useValue: { getCurrentProject: () => 'test-project' } },
        {
          provide: QueryParamsService,
          useValue: {
            queryParams$: new BehaviorSubject({}),
            pageParams$: new BehaviorSubject({}),
            clearQueryParams: vi.fn(),
            getPageNumber: () => null,
            addQueryParams: vi.fn()
          }
        },
        { provide: MatDialog, useValue: { open: vi.fn() } },
        { provide: SnackbarService, useValue: { show: vi.fn() } }
      ]
    })
    .overrideProvider(MatDialog, { useValue: { open: vi.fn() } })
    .compileComponents();

    loadingService = TestBed.inject(LoadingService);
    keywordService.getKeywords.mockReturnValue(defer(() => {
      loadingService.loadingOn();
      return NEVER;
    }));
    fixture = TestBed.createComponent(KeywordsComponent);
  });

  it('renders synchronous request loading without changing a checked binding', () => {
    expect(() => fixture.detectChanges()).not.toThrow();

    const addButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find(button => button.textContent?.includes('Add'))!;
    expect(addButton.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('loading-spinner')).not.toBeNull();
  });
});
