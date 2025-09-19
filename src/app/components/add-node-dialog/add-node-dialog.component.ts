import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { TocNode } from '../../models/table-of-contents';
import { PublicationService } from '../../services/publication.service';
import { ProjectService } from '../../services/project.service';
import { Publication } from '../../models/publication';

export interface AddNodeDialogData {
  collectionId: number;
  parentPath: number[];
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

  // Publications for text nodes
  publications: Publication[] = [];
  selectedPublication: Publication | null = null;

  constructor(
    public dialogRef: MatDialogRef<AddNodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddNodeDialogData,
    private publicationService: PublicationService,
    private projectService: ProjectService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPublications();
  }

  private loadPublications(): void {
    const projectName = this.projectService.getCurrentProject();
    if (!projectName) {
      console.error('No project selected');
      return;
    }
    
    this.publicationService.getPublications(this.data.collectionId.toString(), projectName)
      .subscribe({
        next: (publications) => {
          this.publications = publications;
        },
        error: (error) => {
          console.error('Error loading publications:', error);
        }
      });
  }

  onNodeTypeChange(): void {
    // Reset form when node type changes
    this.text = '';
    this.description = '';
    this.date = '';
    this.category = '';
    this.facsimileOnly = false;
    this.selectedPublication = null;
  }

  onPublicationSelected(publication: Publication): void {
    this.selectedPublication = publication;
    this.text = publication.name || 'Untitled';
    this.date = publication.original_publication_date || '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.text.trim()) {
      this.showError('Text is required');
      return;
    }

    const node: TocNode = {
      type: this.nodeType,
      text: this.text.trim(),
      description: this.description.trim() || undefined,
      date: this.date || undefined,
      category: this.category.trim() || undefined,
      facsimileOnly: this.facsimileOnly,
      collapsed: this.collapsed
    };

    // For text nodes, set itemId if a publication is selected
    if (this.nodeType === 'est' && this.selectedPublication) {
      node.itemId = `${this.data.collectionId}_${this.selectedPublication.id}`;
    }

    // For subtitle nodes, initialize children array
    if (this.nodeType === 'subtitle') {
      node.children = [];
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
