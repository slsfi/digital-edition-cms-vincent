import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, map, Observable, of, startWith } from 'rxjs';

import { PublicationLite } from '../../models/publication.model';
import { EditableTocNode, EditNodeDialogData, TocNode, TocNodeType, tocLanguageOptions } from '../../models/table-of-contents.model';
import { LanguageObj } from '../../models/translation.model';

/**
 * To modify the fields that can be edited in this dialog, you also have
 * to modify the EDITABLE_TOC_NODE_KEYS constant and possibly the TocNode
 * interface in models/table-of-contents.ts.
 */
@Component({
  selector: 'edit-toc-node-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatOptionModule,
    MatRadioModule,
    MatSelectModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    AsyncPipe
  ],
  templateUrl: './edit-node-dialog.component.html',
  styleUrls: ['./edit-node-dialog.component.scss']
})
export class EditNodeDialogComponent implements OnInit {
  readonly data: EditNodeDialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EditNodeDialogComponent>);
  private readonly snackBar = inject(MatSnackBar);

  nodeType: TocNodeType = 'section';
  text = '';
  description = '';
  date = '';
  category = '';
  facsimileOnly = false;
  collapsed = true;
  itemId = '';
  language: string | null = null;

  publications: PublicationLite[] = [];
  filteredPublications$: Observable<PublicationLite[]> = of([]);
  selectedPublication: PublicationLite | null = null;
  searchControl = new FormControl<string | PublicationLite>('');

  private readonly noneLanguageOption: LanguageObj[] = [{label: 'None', code: null}];
  readonly languageOptions: LanguageObj[] = this.noneLanguageOption.concat(tocLanguageOptions);

  readonly MAX_FILTERED = 50;

  ngOnInit(): void {
    if (this.data.dialogMode === 'edit' && this.data.node) {
      this.setInitialFormValuesFromNode(this.data.node);
    }

    this.publications = this.data.publications || [];

    // preselect the linked pub in edit mode using itemId -> pubId
    this.selectInitialPublicationFromItemId();

    this.filteredPublications$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      // normalize the control value to a plain string
      map(v => typeof v === 'string' ? v : (v?.name ?? '')),
      debounceTime(300),
      distinctUntilChanged(),
      // if < 3 characters, don't filter
      map(v => v.length < 3 ? this.publications : this.filterPublications(v))
    );
  }

  private setInitialFormValuesFromNode(node: TocNode): void {
    this.nodeType = node.type || 'section';
    this.text = node.text || '';
    this.description = node.description || '';
    this.date = node.date || '';
    this.category = node.category || '';
    this.facsimileOnly = node.facsimileOnly ?? false;
    this.collapsed = node.collapsed ?? true;
    this.itemId = node.itemId || '';
    this.setLanguage(node.language);
  }

  // Extracts publication ID from an itemId
  private getPubIdFromItemId(itemId: string): number | null {
    const raw = itemId?.split('_')[1];
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  private selectInitialPublicationFromItemId(): void {
    const pubId = this.getPubIdFromItemId(this.itemId);
    if (pubId == null) {
      return;
    }

    const pub = this.publications.find(p => p.id === pubId) || null;
    this.selectedPublication = pub;

    // Populate the autocomplete input with the Publication object,
    // but don't fire valueChanges (avoids triggering filtering).
    if (pub) {
      this.searchControl.setValue(pub, { emitEvent: false });
    }
  }

  private filterPublications(query: string): PublicationLite[] {
    const q = query.toLowerCase();
    const out: PublicationLite[] = [];
    for (const p of this.publications) {
      if (p._search.includes(q)) {
        out.push(p);
        if (out.length === this.MAX_FILTERED) {
          break;
        }
      }
    }
    return out;
  }

  displayPublication(pub?: PublicationLite | null): string {
    return pub ? `${pub.name} (ID: ${pub.id})` : '';
  }

  setNodeType(): void {
    // Reset fields that are not shared when node type changes
    this.date = '';
    this.category = '';
    this.facsimileOnly = false;
    this.collapsed = true;
  }

  selectPublication(publication: PublicationLite): void {
    this.selectedPublication = publication;
    this.text = publication.name || 'Untitled';
    this.date = publication.original_publication_date || '';
    this.itemId = `${this.data.collectionId}_${publication.id}`;
    this.setLanguage(publication.language);
  }

  clearPublicationSearch(event: MouseEvent) {
    this.searchControl.setValue('');
    event.stopPropagation();
  }

  saveNode(): void {
    const textValue = this.trimmedStringOrNullish(this.text);

    if (!textValue) {
      this.showError('Text is required.');
      return;
    }

    const itemIdValue = this.trimmedStringOrNullish(this.itemId);

    if (this.nodeType === 'text') {
      if (!itemIdValue) {
        this.showError('Item ID is required.');
        return;
      }
    }

    const patchNode: EditableTocNode = {
      type: this.nodeType,
      text: textValue,
      ...(itemIdValue ? {itemId: itemIdValue} : {}),
      ...(this.language ? {language: this.language} : {})
    };

    const descValue = this.trimmedStringOrNullish(this.description);
    if (descValue) {
      patchNode.description = descValue;
    }

    // Add type-specific properties
    if (this.nodeType === 'section') {
      patchNode.collapsed = this.collapsed; // Always assign boolean value
    } else if (this.nodeType === 'text') {
      const dateValue = this.trimmedStringOrNullish(this.date);
      if (dateValue) {
        patchNode.date = dateValue;
      }

      const catValue = this.trimmedStringOrNullish(this.category);
      if (catValue) {
        patchNode.category = catValue;
      }
  
      patchNode.facsimileOnly = this.facsimileOnly; // Always assign boolean value
    }

    this.dialogRef.close(patchNode);
  }

  private setLanguage(languageCode: string | null | undefined): void {
    if (languageCode) {
      const validLang = this.languageOptions.find(
        (lang: LanguageObj) => lang.code === languageCode
      );
      this.language = validLang ? languageCode : null;
    } else {
      this.language = null;
    }
  }

  private trimmedStringOrNullish(value: any): string | null | undefined {
    return ((value ?? '') === '') ? value : String(value).trim();
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: undefined,
      panelClass: ['snackbar-error']
    });
  }
}
