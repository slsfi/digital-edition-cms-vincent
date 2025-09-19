import { Component, Input, Output, EventEmitter, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { TocRoot, TocNode } from '../../models/table-of-contents';
import { TocNodeComponent } from '../toc-node/toc-node.component';
import { AddNodeDialogComponent } from '../add-node-dialog/add-node-dialog.component';

@Component({
  selector: 'app-toc-tree',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    CdkDropList,
    CdkDrag,
    TocNodeComponent
  ],
  templateUrl: './toc-tree.component.html',
  styleUrls: ['./toc-tree.component.scss']
})
export class TocTreeComponent implements OnInit {
  @Input() toc!: TocRoot;
  @Input() collectionId!: number;
  @Output() tocChanged = new EventEmitter<void>();

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Initialize the tree structure
  }

  onNodeChanged(): void {
    this.tocChanged.emit();
  }

  onAddNode(parentPath: number[] = []): void {
    const dialogRef = this.dialog.open(AddNodeDialogComponent, {
      width: '500px',
      data: {
        collectionId: this.collectionId,
        parentPath
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addNodeToPath(parentPath, result);
      }
    });
  }

  private addNodeToPath(parentPath: number[], node: TocNode): void {
    let current = this.toc;
    
    // Navigate to the parent node
    for (const index of parentPath) {
      if (current.children && current.children[index]) {
        current = current.children[index] as any; // Type assertion for navigation
      } else {
        return; // Invalid path
      }
    }

    // Add the new node
    if (!current.children) {
      current.children = [];
    }
    current.children.push(node);
    this.onNodeChanged();
  }

  onDeleteNode(nodePath: number[]): void {
    if (nodePath.length === 0) {
      return; // Cannot delete root
    }

    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      data: {
        title: 'Delete Node',
        message: 'Are you sure you want to delete this node? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteNodeByPath(nodePath);
      }
    });
  }

  private deleteNodeByPath(nodePath: number[]): void {
    if (nodePath.length === 1) {
      // Deleting from root level
      this.toc.children.splice(nodePath[0], 1);
    } else {
      // Deleting from nested level
      let current = this.toc;
      for (let i = 0; i < nodePath.length - 1; i++) {
        const index = nodePath[i];
        if (current.children && current.children[index]) {
          current = current.children[index] as any; // Type assertion for navigation
        } else {
          return; // Invalid path
        }
      }

      const lastIndex = nodePath[nodePath.length - 1];
      if (current.children) {
        current.children.splice(lastIndex, 1);
      }
    }

    this.onNodeChanged();
  }

  onDrop(event: CdkDragDrop<TocNode[]>): void {
    if (event.previousContainer === event.container) {
      // Moving within the same container
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving between containers
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    
    this.onNodeChanged();
  }

  onNodeDrop(event: CdkDragDrop<TocNode[]>, targetPath: number[]): void {
    // Handle dropping a node onto another node (nesting)
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    
    this.onNodeChanged();
  }

  getNodePath(index: number): number[] {
    return [index];
  }

  getNestedNodePath(parentPath: number[], index: number): number[] {
    return [...parentPath, index];
  }
}

// Simple confirmation dialog component
@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button [mat-dialog-close]="false">{{ data.cancelText }}</button>
      <button mat-button [mat-dialog-close]="true" color="warn">{{ data.confirmText }}</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDeleteDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
