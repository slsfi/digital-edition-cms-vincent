import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, map, Observable, of, startWith } from 'rxjs';

import { PublicationLite } from '../../models/publication';
import { EditNodeDialogData, TocNode, TocNodeType } from '../../models/table-of-contents';


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
  collapsed = false;
  itemId = '';

  publications: PublicationLite[] = [];
  filteredPublications$: Observable<PublicationLite[]> = of([]);
  selectedPublication: PublicationLite | null = null;
  searchControl = new FormControl<string | PublicationLite>('');

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
    this.facsimileOnly = node.facsimileOnly || false;
    this.collapsed = node.collapsed || false;
    this.itemId = node.itemId || '';
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
    this.description = '';
    this.date = '';
    this.category = '';
    this.facsimileOnly = false;
    this.collapsed = false;
  }

  selectPublication(publication: PublicationLite): void {
    this.selectedPublication = publication;
    this.text = publication.name || 'Untitled';
    this.date = publication.original_publication_date || '';
    this.itemId = `${this.data.collectionId}_${publication.id}`;
  }

  clearPublicationSearch(event: MouseEvent) {
    this.searchControl.setValue('');
    event.stopPropagation();
  }

  saveNode(): void {
    const textValue = this.text.trim();
    if (!textValue) {
      this.showError('Text is required.');
      return;
    }

    if (this.nodeType === 'text') {
      if (!this.itemId.trim()) {
        this.showError('Item ID is required.');
        return;
      }
    }

    let newNode: TocNode = {
      type: this.nodeType,
      text: textValue
    };

    if (this.data.dialogMode === 'edit') {
      newNode = {
        ...this.data.node, // Preserve existing properties like id, isExpanded, children
        ...newNode
      };

      // Remove type-inappropriate properties
      delete newNode.description;
      delete newNode.date;
      delete newNode.category;
      delete newNode.facsimileOnly;
      delete newNode.collapsed;
      delete newNode.itemId;
    }

    if (this.itemId.trim()) {
      newNode.itemId = this.itemId.trim();
    }

    // Add type-specific properties
    if (this.nodeType === 'section') {
      // Section node-specific properties
      newNode.collapsed = this.collapsed; // Always assign boolean value
      
      if (this.data.dialogMode === 'add') {
        newNode.children = []
      }
    } else if (this.nodeType === 'text') {
      // Text node-specific properties
      if (this.description.trim()) {
        newNode.description = this.description.trim();
      }

      if (this.date.trim()) {
        newNode.date = this.date.trim();
      }

      if (this.category.trim()) {
        newNode.category = this.category.trim();
      }
  
      newNode.facsimileOnly = this.facsimileOnly; // Always assign boolean value
    }

    this.dialogRef.close(newNode);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
  }
}
