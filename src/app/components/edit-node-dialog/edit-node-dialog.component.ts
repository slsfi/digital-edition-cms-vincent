import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Publication } from '../../models/publication';
import { EditNodeDialogData, TocNode } from '../../models/table-of-contents';


@Component({
  selector: 'edit-toc-node-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatOptionModule
  ],
  templateUrl: './edit-node-dialog.component.html',
  styleUrls: ['./edit-node-dialog.component.scss']
})
export class EditNodeDialogComponent implements OnInit {
  nodeType: 'subtitle' | 'est' = 'subtitle';
  text = '';
  description = '';
  date = '';
  category = '';
  facsimileOnly = false;
  collapsed = false;
  itemId = '';

  // Publications for text nodes
  publications: Publication[] = [];
  publicationQuery = '';
  filteredPublications: Publication[] = [];
  selectedPublication: Publication | null = null;

  constructor(
    public dialogRef: MatDialogRef<EditNodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditNodeDialogData,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.data.dialogMode === 'edit' && this.data.node) {
      this.setInitialFormValuesFromNode(this.data.node);
    }

    this.publications = this.data.publications || [];
    this.filteredPublications = this.publications;

    if (this.itemId) {
      const pubId = Number(this.itemId.split('_')[1] ?? undefined);
      if (!Number.isNaN(pubId)) {
        this.selectedPublication = this.publications.find(p => p.id === pubId) || null;
        this.publicationQuery = this.selectedPublication?.name || '';
      }
    }
  }

  private setInitialFormValuesFromNode(node: TocNode): void {
    // Default to 'subtitle' if no type is specified (backend compatibility)
    this.nodeType = (node.type as 'subtitle' | 'est') || 'subtitle';
    this.text = node.text || '';
    this.description = node.description || '';
    this.date = node.date || '';
    this.category = node.category || '';
    this.facsimileOnly = node.facsimileOnly || false;
    this.collapsed = node.collapsed || false;
    this.itemId = node.itemId || '';
  }

  setNodeType(): void {
    // Reset form when node type changes
    this.text = '';
    this.description = '';
    this.date = '';
    this.category = '';
    this.facsimileOnly = false;
    this.collapsed = false;
    this.itemId = '';
    this.selectedPublication = null;
    this.publicationQuery = 'No publication linked';
  }

  queryPublication(query: string): void {
    this.publicationQuery = query;
    const q = query.toLowerCase();
    
    // If query is "No publication linked", show all publications
    if (q === 'no publication linked') {
      this.filteredPublications = this.publications;
      return;
    }
    
    this.filteredPublications = this.publications.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.original_filename || '').toLowerCase().includes(q) ||
      String(p.id).includes(q)
    ).slice(0, 50);
  }

  selectPublication(publication: Publication | null): void {
    if (!publication) {
      this.selectedPublication = null;
      this.date = '';
      this.itemId = '';
      this.publicationQuery = 'No publication linked';
      return;
    }
    this.selectedPublication = publication;
    this.text = publication.name || 'Untitled';
    this.date = publication.original_publication_date || '';
    this.itemId = `${this.data.collectionId}_${publication.id}`;
    this.publicationQuery = publication.name || 'Untitled';
  }

  saveNode(): void {
    const textValue = this.text.trim();
    if (!textValue) {
      this.showError('Text is required.');
      return;
    }

    if (this.nodeType === 'est') {
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
    if (this.nodeType === 'subtitle') {
      // Subtitle-specific properties
      newNode.collapsed = this.collapsed; // Always assign boolean value
      
      if (this.data.dialogMode === 'add') {
        newNode.children = []
      }
    } else if (this.nodeType === 'est') {
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
