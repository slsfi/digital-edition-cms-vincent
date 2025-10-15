import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TocNode } from '../../models/table-of-contents';
import { Publication } from '../../models/publication';

export interface EditNodeDialogData {
  node: TocNode;
  collectionId: number;
  publications: Publication[];
}

@Component({
  selector: 'app-edit-node-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
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
    this.initializeForm();
    this.publications = this.data.publications || [];
    this.filteredPublications = this.publications;
    if (this.itemId) {
      const pubId = this.itemId.split('_').pop();
      this.selectedPublication = this.publications.find(p => String(p.id) === pubId) || null;
      this.publicationQuery = this.selectedPublication?.name || '';
    }
  }

  private initializeForm(): void {
    const node = this.data.node;
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

  onPublicationQueryChange(query: string): void {
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

  onNodeTypeChange(): void {
    // Reset form when node type changes
    this.text = '';
    this.description = '';
    this.date = '';
    this.category = '';
    this.facsimileOnly = false;
    this.selectedPublication = null;
    this.itemId = '';
  }

  onPublicationSelected(publication: Publication | null): void {
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

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // Ensure text is a string and trim it
    const textValue = String(this.text || '').trim();
    if (!textValue) {
      this.showError('Text is required');
      return;
    }

    const updatedNode: TocNode = {
      ...this.data.node, // Preserve existing properties like id, isExpanded, children
      type: this.nodeType,
      text: textValue
    };

    // Remove type-inappropriate properties first
    delete updatedNode.description;
    delete updatedNode.date;
    delete updatedNode.category;
    delete updatedNode.facsimileOnly;
    delete updatedNode.collapsed;
    delete updatedNode.itemId;

    // Add type-specific properties
    if (this.nodeType === 'subtitle') {
      // Subtitle-specific properties
      updatedNode.collapsed = this.collapsed; // Always assign boolean value
      if (this.itemId.trim()) {
        updatedNode.itemId = this.itemId.trim();
      }
    } else if (this.nodeType === 'est') {
      // Text node-specific properties
      if (this.description.trim()) {
        updatedNode.description = this.description.trim();
      }
      if (this.date) {
        updatedNode.date = this.date;
      }
      if (this.category.trim()) {
        updatedNode.category = this.category.trim();
      }
      updatedNode.facsimileOnly = this.facsimileOnly; // Always assign boolean value
      if (this.itemId) {
        updatedNode.itemId = this.itemId;
      }
    }

    this.dialogRef.close(updatedNode);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
  }
}
