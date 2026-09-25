import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { HomeComponent } from './home.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';
import { SyncFilesResponse } from '../../models/project.model';
import { ApiService } from '../../services/api.service';
import { LoadingService } from '../../services/loading.service';
import { ProjectService } from '../../services/project.service';
import { SnackbarService } from '../../services/snackbar.service';

describe('MainComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let pullResult$: Subject<SyncFilesResponse>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    const originalWarn = console.warn;
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (!String(args[0]).includes('NG0914')) {
        originalWarn(...args);
      }
    });
    pullResult$ = new Subject<SyncFilesResponse>();

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        ...getCommonTestingProviders(),
        { provide: ApiService, useValue: { environment$: of(null) } },
        { provide: LoadingService, useValue: { loading$: of(false) } },
        {
          provide: ProjectService,
          useValue: {
            fileTree$: new BehaviorSubject(null),
            getCurrentProject: () => 'test-project',
            getGitRepoDetails: () => of({ name: 'repository', branch: 'main' }),
            getProjects: () => of([]),
            pullChangesFromGitRemote: () => pullResult$,
            selectedProject$: of('test-project'),
            setSelectedProject: vi.fn()
          }
        },
        { provide: SnackbarService, useValue: { show: vi.fn() } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('re-enables repository sync after the request completes', async () => {
    const syncButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find(button => button.textContent?.includes('Update local repository'));

    expect(syncButton).toBeDefined();
    syncButton?.click();
    await fixture.whenStable();

    expect(syncButton?.disabled).toBe(true);

    pullResult$.next({ success: true, message: '', data: { changed_files: [] } });
    await fixture.whenStable();

    expect(syncButton?.disabled).toBe(false);
  });
});
