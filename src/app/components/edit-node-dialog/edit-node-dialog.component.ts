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

export interface EditNodeDialogData {
  node: TocNode;
  collectionId: number;
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
    MatSnackBarModule
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
  selectedPublication: Publication | null = null;

  constructor(
    public dialogRef: MatDialogRef<EditNodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditNodeDialogData,
    private publicationService: PublicationService,
    private projectService: ProjectService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadPublications();
  }

  private initializeForm(): void {
    const node = this.data.node;
    this.nodeType = node.type as 'subtitle' | 'est';
    this.text = node.text || '';
    this.description = node.description || '';
    this.date = node.date || '';
    this.category = node.category || '';
    this.facsimileOnly = node.facsimileOnly || false;
    this.collapsed = node.collapsed || false;
    this.itemId = node.itemId || '';
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
          // Find the currently selected publication if itemId exists
          if (this.itemId) {
            this.selectedPublication = publications.find(p => 
              `${this.data.collectionId}_${p.id}` === this.itemId
            ) || null;
          }
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
    this.itemId = '';
  }

  onPublicationSelected(publication: Publication): void {
    this.selectedPublication = publication;
    this.text = publication.name || 'Untitled';
    this.date = publication.original_publication_date || '';
    this.itemId = `${this.data.collectionId}_${publication.id}`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (!this.text.trim()) {
      this.showError('Text is required');
      return;
    }

    const updatedNode: TocNode = {
      ...this.data.node, // Preserve existing properties like id, isExpanded, children
      type: this.nodeType,
      text: this.text.trim(),
      description: this.description.trim() || undefined,
      date: this.date || undefined,
      category: this.category.trim() || undefined,
      facsimileOnly: this.facsimileOnly,
      collapsed: this.collapsed,
      itemId: this.itemId || undefined
    };

    this.dialogRef.close(updatedNode);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}
