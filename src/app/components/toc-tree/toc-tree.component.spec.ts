import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';

import { TocTreeComponent } from './toc-tree.component';
import { TocRoot } from '../../models/table-of-contents.model';

describe('TocTreeComponent', () => {
  let fixture: ComponentFixture<TocTreeComponent>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    const originalWarn = console.warn;
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (!String(args[0]).includes('NG0914')) {
        originalWarn(...args);
      }
    });

    await TestBed.configureTestingModule({
      imports: [TocTreeComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MatDialog, useValue: { open: vi.fn() } }
      ]
    })
    .overrideProvider(MatDialog, { useValue: { open: vi.fn() } })
    .compileComponents();

    fixture = TestBed.createComponent(TocTreeComponent);
    fixture.componentRef.setInput('toc', tocRoot());
    fixture.componentRef.setInput('collectionId', 7);
    fixture.componentRef.setInput('publications', []);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  it('disables every TOC mutation control and drag target while saving', async () => {
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
