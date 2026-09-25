import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';

import { TocTreeComponent } from './toc-tree.component';
import { TocNode, TocRoot } from '../../models/table-of-contents.model';

describe('TocTreeComponent', () => {
  let fixture: ComponentFixture<TocTreeComponent>;
  let component: TocTreeComponent;
  let dialogOpen: ReturnType<typeof vi.fn>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    const originalWarn = console.warn;
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (!String(args[0]).includes('NG0914')) {
        originalWarn(...args);
      }
    });
    dialogOpen = vi.fn();

    await TestBed.configureTestingModule({
      imports: [TocTreeComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialog, useValue: { open: dialogOpen } }
      ]
    })
    .overrideProvider(MatDialog, { useValue: { open: dialogOpen } })
    .compileComponents();

    fixture = TestBed.createComponent(TocTreeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('toc', tocRoot());
    fixture.componentRef.setInput('collectionId', 7);
    fixture.componentRef.setInput('publications', []);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleWarn.mockRestore();
  });

  it('disables every TOC mutation control and drag target while saving', async () => {
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();

    expect(button('Edit base properties').disabled).toBe(true);
    expect(button('Edit item properties').disabled).toBe(true);
    expect(button('Move item up').disabled).toBe(true);
    expect(button('Move item down').disabled).toBe(true);
    expect(button('Additional item actions').disabled).toBe(true);
    expect(buttonWithText('Add item').disabled).toBe(true);
    expect(drags().every(drag => drag.disabled)).toBe(true);
    expect(dropLists().every(dropList => dropList.disabled)).toBe(true);

    fixture.componentRef.setInput('disabled', false);
    await fixture.whenStable();

    expect(button('Edit base properties').disabled).toBe(false);
    expect(button('Edit item properties').disabled).toBe(false);
    expect(button('Additional item actions').disabled).toBe(false);
    expect(buttonWithText('Add item').disabled).toBe(false);
    expect(drags().every(drag => !drag.disabled)).toBe(true);
    expect(dropLists().every(dropList => !dropList.disabled)).toBe(true);
  });

  it('renders a dialog-driven node edit and emits the dirty-state event', async () => {
    const result$ = setNextDialogResult<TocNode>();
    const tocChanged = vi.spyOn(component.tocChanged, 'emit');

    component.editNode(component.toc.children[0].children![0]);
    result$.next({ type: 'text', text: 'Edited item', itemId: '7_1' });
    await fixture.whenStable();

    expect(nodeTexts()).toEqual(['Section', 'Edited item']);
    expect(tocChanged).toHaveBeenCalledOnce();
  });

  it('renders a node added from a dialog result', async () => {
    const result$ = setNextDialogResult<TocNode>();

    component.addChildNode();
    result$.next({ type: 'text', text: 'Added item', itemId: '7_2' });
    await fixture.whenStable();

    expect(nodeTexts()).toEqual(['Section', 'Item', 'Added item']);
    expect(component.toc.children[1].id).toBe('node-1');
  });

  it('removes a node after dialog confirmation', async () => {
    const result$ = setNextDialogResult<{ value: boolean }>();

    component.deleteNode(component.toc.children[0].children![0]);
    result$.next({ value: true });
    await fixture.whenStable();

    expect(nodeTexts()).toEqual(['Section']);
  });

  it('renders root properties returned by the dialog', async () => {
    const result$ = setNextDialogResult<{
      value: boolean;
      data: {
        title: string;
        coverPageName?: string;
        titlePageName?: string;
        forewordPageName?: string;
        introductionPageName?: string;
      };
    }>();

    component.editTocRootProperties();
    result$.next({
      value: true,
      data: {
        title: 'Updated TOC',
        coverPageName: 'Cover'
      }
    });
    await fixture.whenStable();

    expect(text('.toc-title')).toBe('Updated TOC');
    expect(text('.fm-name')).toBe('Cover');
  });

  it('renders deferred drag-and-drop ordering and regenerated IDs', async () => {
    fixture.componentRef.setInput('toc', flatTocRoot());
    await fixture.whenStable();
    vi.useFakeTimers();

    component.currentDropAction = { targetId: 'node-0', action: 'before' };
    component.drop({
      item: { data: 'node-1' },
      previousContainer: { id: 'main' }
    } as unknown as CdkDragDrop<TocNode[]>);

    await vi.runAllTimersAsync();
    await fixture.whenStable();

    expect(nodeTexts()).toEqual(['Second', 'First']);
    expect(component.toc.children.map(node => node.id)).toEqual(['node-0', 'node-1']);
  });

  it('renders collapse, expand, and individual section toggles', async () => {
    button('Collapse all items').click();
    await fixture.whenStable();
    expect(nodeTexts()).toEqual(['Section']);

    button('Expand all items').click();
    await fixture.whenStable();
    expect(nodeTexts()).toEqual(['Section', 'Item']);

    button('Toggle expansion for section').click();
    await fixture.whenStable();
    expect(nodeTexts()).toEqual(['Section']);
  });

  function setNextDialogResult<T>(): Subject<T> {
    const result$ = new Subject<T>();
    dialogOpen.mockReturnValue({ afterClosed: () => result$ });
    return result$;
  }

  function button(ariaLabel: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(
      `button[aria-label="${ariaLabel}"]`
    ) as HTMLButtonElement;
  }

  function buttonWithText(label: string): HTMLButtonElement {
    return Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find(candidate => candidate.textContent?.includes(label))!;
  }

  function nodeTexts(): string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.node-text') as NodeListOf<HTMLElement>
    ).map(element => element.textContent?.trim() ?? '');
  }

  function text(selector: string): string {
    return (fixture.nativeElement.querySelector(selector) as HTMLElement).textContent?.trim() ?? '';
  }

  function drags(): CdkDrag[] {
    return fixture.debugElement.queryAll(By.directive(CdkDrag))
      .map(element => element.componentInstance as CdkDrag);
  }

  function dropLists(): CdkDropList[] {
    return fixture.debugElement.queryAll(By.directive(CdkDropList))
      .map(element => element.componentInstance as CdkDropList);
  }
});

function tocRoot(): TocRoot {
  return {
    text: 'Test TOC',
    collectionId: '7',
    type: 'title',
    children: [
      {
        type: 'section',
        text: 'Section',
        collapsed: false,
        children: [
          { type: 'text', text: 'Item', itemId: '7_1' }
        ]
      }
    ]
  };
}

function flatTocRoot(): TocRoot {
  return {
    text: 'Test TOC',
    collectionId: '7',
    type: 'title',
    children: [
      { type: 'text', text: 'First', itemId: '7_1' },
      { type: 'text', text: 'Second', itemId: '7_2' }
    ]
  };
}
