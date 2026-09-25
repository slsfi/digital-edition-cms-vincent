import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Params, provideRouter } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { CustomTableComponent } from './custom-table.component';
import { Column } from '../../models/common.model';
import { LoadingService } from '../../services/loading.service';
import { QueryParamsService } from '../../services/query-params.service';

interface TestRow {
  id: number;
  name: string;
}

describe('CustomTableComponent', () => {
  let component: CustomTableComponent<TestRow>;
  let fixture: ComponentFixture<CustomTableComponent<TestRow>>;
  let data$: Subject<TestRow[]>;
  let queryParams$: BehaviorSubject<Params>;

  beforeEach(async () => {
    data$ = new Subject<TestRow[]>();
    queryParams$ = new BehaviorSubject<Params>({});

    await TestBed.configureTestingModule({
      imports: [CustomTableComponent],
      providers: [
        provideRouter([]),
        {
          provide: QueryParamsService,
          useValue: {
            queryParams$,
            pageParams$: of([]),
            getPageNumber: () => '1',
            addQueryParams: vi.fn()
          }
        },
        { provide: LoadingService, useValue: { loading$: of(false) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomTableComponent<TestRow>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', [
      {
        field: 'name',
        header: 'Name',
        filterable: true,
        filterType: 'contains',
        type: 'text'
      } satisfies Column
    ]);
    fixture.componentRef.setInput('data$', data$);
    fixture.componentRef.setInput('showIndex', false);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('renders delayed data and query sorting, and wires the paginator', async () => {
    data$.next([
      { id: 2, name: 'Beta' },
      { id: 1, name: 'Alpha' }
    ]);
    await fixture.whenStable();

    expect(component.tableDataSource.paginator).toBe(component.paginator);
    expect(component.originalCount()).toBe(2);
    expect(component.filteredCount()).toBe(2);
    expect(tableTitle()).toContain('(2)');
    expect(renderedNames()).toEqual(['Beta', 'Alpha']);

    queryParams$.next({ sort: 'name', direction: 'asc' });
    await fixture.whenStable();

    expect(component.filteredCount()).toBe(2);
    expect(tableTitle()).toContain('(2)');
    expect(renderedNames()).toEqual(['Alpha', 'Beta']);
  });

  it('renders query-filtered rows and counts without a forced refresh', async () => {
    data$.next([
      { id: 2, name: 'Beta' },
      { id: 1, name: 'Alpha' }
    ]);
    await fixture.whenStable();

    queryParams$.next({ name: 'alpha' });
    await fixture.whenStable();

    expect(component.filteredCount()).toBe(1);
    expect(tableTitle()).toContain('(1 / 2)');
    expect(renderedNames()).toEqual(['Alpha']);
  });

  function tableTitle(): string {
    return fixture.nativeElement.querySelector('.table-title')?.textContent ?? '';
  }

  function renderedNames(): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('tr.mat-mdc-row td') as NodeListOf<HTMLElement>
    ).map(cell => cell.textContent?.trim() ?? '');
  }
});
