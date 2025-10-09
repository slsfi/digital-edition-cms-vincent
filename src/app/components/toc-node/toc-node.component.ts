import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';

import { TocNode } from '../../models/table-of-contents';
import { PublicationService } from '../../services/publication.service';
import { ProjectService } from '../../services/project.service';
import { Publication } from '../../models/publication';

@Component({
  selector: 'app-toc-node',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './toc-node.component.html',
  styleUrls: ['./toc-node.component.scss']
})
export class TocNodeComponent implements OnInit, OnDestroy {
  @Input() node!: TocNode;
  @Input() nodePath!: number[];
  @Input() collectionId!: number;
  @Input() isRootNode = false;
  @Input() depth = 0; // Track depth level for indentation
  @Output() nodeChanged = new EventEmitter<void>();
  @Output() deleteNode = new EventEmitter<number[]>();
  @Output() addChildNode = new EventEmitter<number[]>();

  private destroy$ = new Subject<void>();

  // Edit mode
  isEditing = false;
  editText = '';
  editDescription = '';
  editDate = '';
  editCategory = '';
  editFacsimileOnly = false;

  // Node type specific properties
  isSubtitle = false;
  isTextNode = false;
  isCollapsed = false;

  // Publications for text nodes
  publications: Publication[] = [];
  selectedPublication: Publication | null = null;

  constructor(
    private publicationService: PublicationService,
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initializeNode();
    this.loadPublications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeNode(): void {
    this.isSubtitle = this.node.type === 'subtitle';
    this.isTextNode = this.node.type === 'est';
    this.isCollapsed = this.node.collapsed || false;
    
    // Initialize edit values
    this.editText = this.node.text;
    this.editDescription = this.node.description || '';
    this.editDate = this.node.date || '';
    this.editCategory = this.node.category || '';
    this.editFacsimileOnly = this.node.facsimileOnly || false;
  }

  private loadPublications(): void {
    if (this.isTextNode) {
      const projectName = this.projectService.getCurrentProject();
      if (!projectName) {
        console.error('No project selected');
        return;
      }
      
      this.publicationService.getPublications(this.collectionId.toString(), projectName)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (publications) => {
            this.publications = publications;
            // Find the publication that matches this node's itemId
            if (this.node.itemId) {
              const [publicationId] = this.node.itemId.split('_');
              this.selectedPublication = publications.find(p => p.id === parseInt(publicationId)) || null;
            }
          },
          error: (error) => {
            console.error('Error loading publications:', error);
          }
        });
    }
  }

  onEdit(): void {
    this.isEditing = true;
  }

  onSave(): void {
    if (!this.editText.trim()) {
      this.showError('Text is required');
      return;
    }

    // Update node properties
    this.node.text = this.editText.trim();
    this.node.description = this.editDescription.trim() || undefined;
    this.node.date = this.editDate || undefined;
    this.node.category = this.editCategory.trim() || undefined;
    this.node.facsimileOnly = this.editFacsimileOnly;

    this.isEditing = false;
    this.nodeChanged.emit();
  }

  onCancel(): void {
    // Reset edit values
    this.editText = this.node.text;
    this.editDescription = this.node.description || '';
    this.editDate = this.node.date || '';
    this.editCategory = this.node.category || '';
    this.editFacsimileOnly = this.node.facsimileOnly || false;
    
    this.isEditing = false;
  }

  onDelete(): void {
    this.deleteNode.emit(this.nodePath);
  }

  onAddChild(): void {
    this.addChildNode.emit(this.nodePath);
  }

  onToggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    this.node.collapsed = this.isCollapsed;
    this.nodeChanged.emit();
  }

  onPublicationSelected(publication: Publication): void {
    this.selectedPublication = publication;
    this.node.text = publication.name || 'Untitled';
    this.node.itemId = `${this.collectionId}_${publication.id}`;
    this.node.date = publication.original_publication_date || undefined;
    
    this.editText = this.node.text;
    this.editDate = this.node.date || '';
    
    this.nodeChanged.emit();
  }

  onRemovePublication(): void {
    this.selectedPublication = null;
    this.node.itemId = undefined;
    this.node.date = undefined;
    this.editDate = '';
    this.nodeChanged.emit();
  }

  onChildDrop(event: CdkDragDrop<TocNode[]>): void {
    // Only allow reordering within the same container
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      
      
      this.nodeChanged.emit();
    }
  }


  getNodeIcon(): string {
    switch (this.node.type) {
      case 'title':
        return 'title';
      case 'subtitle':
        return 'subtitles';
      case 'est':
        return 'description';
      default:
        return 'help_outline';
    }
  }

  getNodeTypeLabel(): string {
    switch (this.node.type) {
      case 'title':
        return 'Title';
      case 'subtitle':
        return 'Subtitle';
      case 'est':
        return 'Text Node';
      default:
        return 'Unknown';
    }
  }

  getChildNodePath(index: number): number[] {
    return [...this.nodePath, index];
  }


  getNodeClass(): string {
    const classes = ['toc-node'];
    if (this.isSubtitle) {
      classes.push('subtitle-node');
    }
    if (this.depth > 0) {
      classes.push(`depth-${this.depth}`);
    }
    return classes.join(' ');
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}
