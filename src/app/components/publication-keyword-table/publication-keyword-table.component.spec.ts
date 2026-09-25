import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicationKeywordTableComponent } from './publication-keyword-table.component';
import { Deleted, Published } from '../../models/common.model';
import { Publication } from '../../models/publication.model';

describe('PublicationKeywordTableComponent', () => {
  let component: PublicationKeywordTableComponent;
  let fixture: ComponentFixture<PublicationKeywordTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicationKeywordTableComponent],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicationKeywordTableComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders input data and wires sorting and pagination after the view queries resolve', async () => {
    fixture.componentRef.setInput('publications', [
      publication(2, 'Beta'),
      publication(1, 'Alpha')
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.dataSource.paginator).toBe(component.matPaginator());
    expect(component.dataSource.sort).toBe(component.matSort());
    expect(component.totalCount()).toBe(2);
    expect(component.filteredCount()).toBe(2);
    expect(heading()).toContain('Publications (2)');
    expect(renderedNames()).toEqual(['Beta', 'Alpha']);

    const nameSortHeader = fixture.nativeElement.querySelectorAll(
      'th.mat-sort-header'
    )[1] as HTMLElement;
    nameSortHeader.click();
    await fixture.whenStable();

    expect(renderedNames()).toEqual(['Alpha', 'Beta']);
  });

  it('renders the filtered count after the debounced search without a forced refresh', async () => {
    vi.useFakeTimers();
    fixture.componentRef.setInput('publications', [
      publication(1, 'Alpha'),
      publication(2, 'Beta')
    ]);
    fixture.detectChanges();

    component.searchControl.setValue('beta');
    await vi.advanceTimersByTimeAsync(200);
    await vi.advanceTimersByTimeAsync(1);

    expect(component.filteredCount()).toBe(1);
    expect(heading()).toContain('Publications (1/2)');
    expect(renderedNames()).toEqual(['Beta']);
  });

  function heading(): string {
    return fixture.nativeElement.querySelector('h3')?.textContent?.trim() ?? '';
  }

  function renderedNames(): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('tr.mat-mdc-row td:last-child') as NodeListOf<HTMLElement>
    ).map(cell => cell.textContent?.trim() ?? '');
  }
});

function publication(id: number, name: string): Publication {
  return {
    date_created: '',
    date_modified: null,
    deleted: Deleted.NotDeleted,
    genre: null,
    id,
    language: null,
    name,
    original_filename: null,
    original_publication_date: null,
    publication_collection_id: 1,
    publication_comment_id: null,
    published: Published.PublishedInternally
  };
}
