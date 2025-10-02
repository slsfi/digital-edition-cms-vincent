import { Component, Input, Output, EventEmitter, Inject, DOCUMENT, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDragMove } from '@angular/cdk/drag-drop';

import { TocRoot, TocNode, DropInfo } from '../../models/table-of-contents';
import { AddNodeDialogComponent } from '../add-node-dialog/add-node-dialog.component';
import { EditNodeDialogComponent } from '../edit-node-dialog/edit-node-dialog.component';

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
    CdkDrag
  ],
  templateUrl: './toc-tree.component.html',
  styleUrls: ['./toc-tree.component.scss']
})
export class TocTreeComponent implements OnChanges {
  @Input() toc!: TocRoot;
  @Input() collectionId!: number;
  @Output() tocChanged = new EventEmitter<void>();

  // Drag and drop properties
  nodeLookup: Record<string, TocNode> = {};
  currentDropAction: DropInfo | null = null;
  private cachedDropListIds: string[] = [];
  private dropListIdsCacheValid = false;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(DOCUMENT) private document: Document
  ) {
    // Initialize drag and drop when component loads
    if (this.toc) {
      this.prepareDragDrop(this.toc.children);
    }
  }

  ngOnChanges(): void {
    if (this.toc) {
      this.prepareDragDrop(this.toc.children);
    }
  }

  prepareDragDrop(nodes: TocNode[]): void {
    this.nodeLookup = {};
    this.generateIdsAndPrepareDragDrop(nodes, []);
  }

  private generateIdsAndPrepareDragDrop(nodes: TocNode[], path: number[]): void {
    nodes.forEach((node, index) => {
      const currentPath = [...path, index];
      const nodeId = this.generateNodeId(currentPath);
      
      node.id = nodeId;
      node.isExpanded = node.isExpanded ?? false;
      
      this.nodeLookup[nodeId] = node;
      
      if (node.children && node.children.length > 0) {
        this.generateIdsAndPrepareDragDrop(node.children, currentPath);
      }
    });
  }

  // Dynamically get all drop list IDs from the DOM with caching
  getAllDropListIds(): string[] {
    if (!this.dropListIdsCacheValid) {
      this.cachedDropListIds = ['main']; // Always include main
      
      // Find all cdkDropList elements in the component
      const dropLists = this.document.querySelectorAll('.toc-tree [cdkDropList]');
      dropLists.forEach((element) => {
        const id = element.getAttribute('id');
        if (id && id !== 'main') {
          this.cachedDropListIds.push(id);
        }
      });
      
      this.dropListIdsCacheValid = true;
    }
    
    return this.cachedDropListIds;
  }

  // Invalidate the cache when the tree structure changes
  private invalidateDropListCache(): void {
    this.dropListIdsCacheValid = false;
  }

  private generateNodeId(path: number[]): string {
    return 'node-' + path.join('-');
  }

  // Debounce function
  private debounce(func: (event: CdkDragMove) => void, wait: number): (event: CdkDragMove) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (event: CdkDragMove) => {
      const later = () => {
        clearTimeout(timeout);
        func(event);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  onDragMoved = this.debounce((event: CdkDragMove) => {
    const element = this.document.elementFromPoint(event.pointerPosition.x, event.pointerPosition.y);
    
    if (!element) {
      this.clearDragInfo();
      return;
    }
    
    const targetContainer = element.classList.contains("node-item") ? element : element.closest(".node-item");
    if (!targetContainer) {
      this.clearDragInfo();
      return;
    }
    
    this.currentDropAction = {
      targetId: targetContainer.getAttribute("data-id") || '',
      action: 'before' // Will be updated below
    };
    
    const targetRect = targetContainer.getBoundingClientRect();
    const oneThird = targetRect.height / 3;

    if (this.currentDropAction) {
      if (event.pointerPosition.y - targetRect.top < oneThird) {
        // before
        this.currentDropAction.action = "before";
      } else if (event.pointerPosition.y - targetRect.top > 2 * oneThird) {
        // after
        this.currentDropAction.action = "after";
      } else {
        // inside
        this.currentDropAction.action = "inside";
      }
    }
    this.showDragInfo();
  }, 50);

  drop(event: CdkDragDrop<TocNode[]>): void {
    if (!this.currentDropAction) return;

    const draggedItemId = event.item.data;
    const parentItemId = event.previousContainer.id;
    const targetListId = this.getParentNodeId(this.currentDropAction.targetId, this.toc.children, 'main');

    const draggedItem = this.nodeLookup[draggedItemId];

    const oldItemContainer = parentItemId !== 'main' ? this.nodeLookup[parentItemId].children! : this.toc.children;
    const newContainer = targetListId !== 'main' ? this.nodeLookup[targetListId].children! : this.toc.children;

    const index = oldItemContainer.findIndex(c => c.id === draggedItemId);
    oldItemContainer.splice(index, 1);

    switch (this.currentDropAction.action) {
      case 'before':
      case 'after': {
        const targetIndex = newContainer.findIndex(c => c.id === this.currentDropAction!.targetId);
        if (this.currentDropAction.action === 'before') {
          newContainer.splice(targetIndex, 0, draggedItem);
        } else {
          newContainer.splice(targetIndex + 1, 0, draggedItem);
        }
        break;
      }

      case 'inside':
        if (!this.nodeLookup[this.currentDropAction.targetId].children) {
          this.nodeLookup[this.currentDropAction.targetId].children = [];
        }
        this.nodeLookup[this.currentDropAction.targetId].children!.push(draggedItem);
        this.nodeLookup[this.currentDropAction.targetId].isExpanded = true;
        break;
    }

    this.clearDragInfo(true);
    this.onNodeChanged();
  }

  getParentNodeId(id: string, nodesToSearch: TocNode[], parentId: string): string {
    for (const node of nodesToSearch) {
      if (node.id === id) return parentId;
      if (node.children) {
        const ret = this.getParentNodeId(id, node.children, node.id!);
        if (ret) return ret;
      }
    }
    return '';
  }

  showDragInfo(): void {
    this.clearDragInfo();
    if (this.currentDropAction) {
      const element = this.document.getElementById("node-" + this.currentDropAction.targetId);
      if (element) {
        element.classList.add("drop-" + this.currentDropAction.action);
      }
    }
  }

  clearDragInfo(dropped = false): void {
    if (dropped) {
      this.currentDropAction = null;
    }
    this.document
      .querySelectorAll(".drop-before")
      .forEach(element => element.classList.remove("drop-before"));
    this.document
      .querySelectorAll(".drop-after")
      .forEach(element => element.classList.remove("drop-after"));
    this.document
      .querySelectorAll(".drop-inside")
      .forEach(element => element.classList.remove("drop-inside"));
  }

  onNodeChanged(): void {
    // Regenerate IDs after changes
    this.prepareDragDrop(this.toc.children);
    // Invalidate cache after DOM update
    setTimeout(() => {
      this.invalidateDropListCache();
    }, 0);
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
        current = current.children[index] as TocRoot; // Type assertion for navigation
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
          current = current.children[index] as TocRoot; // Type assertion for navigation
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

  toggleNodeExpansion(node: TocNode): void {
    node.isExpanded = !node.isExpanded;
    // Invalidate cache after DOM update
    setTimeout(() => {
      this.invalidateDropListCache();
    }, 0);
  }

  getNodePath(node: TocNode): number[] {
    // Find the path to this node in the tree
    return this.findNodePath(node, this.toc.children, []);
  }

  private findNodePath(targetNode: TocNode, nodes: TocNode[], currentPath: number[]): number[] {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const newPath = [...currentPath, i];
      
      if (node === targetNode) {
        return newPath;
      }
      
      if (node.children && node.children.length > 0) {
        const found = this.findNodePath(targetNode, node.children, newPath);
        if (found.length > 0) {
          return found;
        }
      }
    }
    return [];
  }

  onEditNode(node: TocNode): void {
    const dialogRef = this.dialog.open(EditNodeDialogComponent, {
      width: '500px',
      data: {
        node: node,
        collectionId: this.collectionId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateNode(node, result);
      }
    });
  }

  private updateNode(originalNode: TocNode, updatedNode: TocNode): void {
    // Update the original node with the new values
    Object.assign(originalNode, updatedNode);
    this.onNodeChanged();
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
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; message: string; confirmText: string; cancelText: string }) {}
}
