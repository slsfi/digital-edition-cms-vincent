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

export interface AddNodeDialogData {
  collectionId: number;
  parentPath: number[];
  publications: Publication[];
}

@Component({
  selector: 'app-add-node-dialog',
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
    MatSnackBarModule
    ,MatAutocompleteModule
    ,MatOptionModule
  ],
  templateUrl: './add-node-dialog.component.html',
  styleUrls: ['./add-node-dialog.component.scss']
})
export class AddNodeDialogComponent implements OnInit {
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
    public dialogRef: MatDialogRef<AddNodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddNodeDialogData,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.publications = this.data.publications || [];
    this.filteredPublications = this.publications;
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
    this.collapsed = false;
    this.itemId = '';
    this.selectedPublication = null;
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

    const node: TocNode = {
      type: this.nodeType,
      text: textValue
    };

    // Add type-specific properties
    if (this.nodeType === 'subtitle') {
      // Subtitle-specific properties
      node.collapsed = this.collapsed; // Always assign boolean value
      if (this.itemId.trim()) {
        node.itemId = this.itemId.trim();
      }
      node.children = [];
    } else if (this.nodeType === 'est') {
      // Text node-specific properties
      if (this.description.trim()) {
        node.description = this.description.trim();
      }
      if (this.date) {
        node.date = this.date;
      }
      if (this.category.trim()) {
        node.category = this.category.trim();
      }
      node.facsimileOnly = this.facsimileOnly; // Always assign boolean value
      // Set itemId from manual input or publication selection
      if (this.itemId.trim()) {
        node.itemId = this.itemId.trim();
      } else if (this.selectedPublication) {
        node.itemId = `${this.data.collectionId}_${this.selectedPublication.id}`;
      }
    }

    this.dialogRef.close(node);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}
