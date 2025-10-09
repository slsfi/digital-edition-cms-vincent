import { Component, Input, Output, EventEmitter, Inject, DOCUMENT, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDragMove } from '@angular/cdk/drag-drop';

import { TocRoot, TocNode, DropInfo } from '../../models/table-of-contents';
import { Publication } from '../../models/publication';
import { AddNodeDialogComponent } from '../add-node-dialog/add-node-dialog.component';
import { EditNodeDialogComponent } from '../edit-node-dialog/edit-node-dialog.component';
import { EditRootTitleDialogComponent } from '../edit-root-title-dialog/edit-root-title-dialog.component';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog.component';

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
  @Input() publications: Publication[] = [];
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

  /**
   * Prepare drag and drop functionality by setting up node lookup and drop targets.
   * This method initializes the nodeLookup map for efficient node retrieval during drag operations
   * and prepares the drop target IDs for CDK drag and drop connectivity.
   * 
   * @param nodes - Array of TOC nodes to prepare for drag and drop
   */
  prepareDragDrop(nodes: TocNode[]): void {
    this.nodeLookup = {};
    this.generateIdsAndPrepareDragDrop(nodes, []);
  }

  /**
   * Recursively generate unique IDs for nodes and populate the nodeLookup map.
   * This method assigns path-based IDs to each node and sets default expansion state.
   * 
   * @param nodes - Array of nodes to process
   * @param path - Current path in the tree (array of indices)
   */
  private generateIdsAndPrepareDragDrop(nodes: TocNode[], path: number[]): void {
    nodes.forEach((node, index) => {
      const currentPath = [...path, index];
      const nodeId = this.generateNodeId(currentPath);
      
      node.id = nodeId;
      // Initialize isExpanded based on collapsed property if not already set
      if (node.isExpanded === undefined) {
        node.isExpanded = !node.collapsed; // If collapsed is true, isExpanded should be false
      }
      
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

  /**
   * Handle drag movement events to provide real-time visual feedback.
   * This method detects drop zones (before/after/inside) based on mouse position
   * and updates visual indicators accordingly. Uses a 20/60/20 zone split for easier same-level reordering.
   * 
   * @param event - CDK drag move event containing pointer position
   */
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
    const topZone = targetRect.height * 0.2; // Top 20%
    const bottomZone = targetRect.height * 0.8; // Bottom 80%

    if (this.currentDropAction) {
      if (event.pointerPosition.y - targetRect.top < topZone) {
        // before (top 20%)
        this.currentDropAction.action = "before";
      } else if (event.pointerPosition.y - targetRect.top > bottomZone) {
        // after (bottom 20%)
        this.currentDropAction.action = "after";
      } else {
        // inside (middle 60%)
        this.currentDropAction.action = "inside";
      }
    }
    this.showDragInfo();
  }, 50);

  /**
   * Handle drop events for drag and drop operations.
   * This method implements the core drag and drop logic, removing the dragged item
   * from its original position and inserting it at the new position based on the detected drop action.
   * 
   * @param event - CDK drag drop event containing source and target information
   */
  drop(event: CdkDragDrop<TocNode[]>): void {
    if (!this.currentDropAction) return;

    const draggedItemId = event.item.data;
    const parentItemId = event.previousContainer.id;
    const targetListId = this.getParentNodeId(this.currentDropAction.targetId, this.toc.children, 'main');

    const draggedItem = this.nodeLookup[draggedItemId];

    const oldItemContainer = parentItemId !== 'main' ? this.nodeLookup[parentItemId].children! : this.toc.children;
    const newContainer = targetListId !== 'main' ? this.nodeLookup[targetListId].children! : this.toc.children;

    // Check if the item is being dropped in the same position
    if (parentItemId === targetListId) {
      const oldIndex = oldItemContainer.findIndex(c => c.id === draggedItemId);
      const targetIndex = newContainer.findIndex(c => c.id === this.currentDropAction!.targetId);
      
      // If it's the same item and same position, don't move
      if (draggedItemId === this.currentDropAction.targetId) {
        this.clearDragInfo();
        return;
      }
      
      // Calculate the new position based on the action
      let newPosition: number;
      if (this.currentDropAction.action === 'before') {
        newPosition = targetIndex;
      } else if (this.currentDropAction.action === 'after') {
        newPosition = targetIndex + 1;
      } else {
        // 'inside' action - always allow
        newPosition = -1;
      }
      
      // If the new position would be the same as the current position, don't move
      if (newPosition !== -1 && oldIndex === newPosition) {
        this.clearDragInfo();
        return;
      }
    }

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
        parentPath,
        publications: this.publications
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addNodeToPath(parentPath, result);
      }
    });
  }

  /**
   * Add a new sibling node after the specified node.
   * This method opens the add node dialog and inserts the new node as a sibling
   * (at the same level) after the current node.
   * 
   * @param siblingPath - Path to the node that will have a new sibling added after it
   */
  onAddSibling(siblingPath: number[]): void {
    // Get the parent path (remove the last index)
    const parentPath = siblingPath.slice(0, -1);
    const siblingIndex = siblingPath[siblingPath.length - 1];
    
    const dialogRef = this.dialog.open(AddNodeDialogComponent, {
      width: '500px',
      data: {
        collectionId: this.collectionId,
        parentPath,
        insertAfterIndex: siblingIndex,
        publications: this.publications
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addNodeToPath(parentPath, result, siblingIndex + 1);
      }
    });
  }

  canMoveUp(nodePath: number[]): boolean {
    if (nodePath.length === 0) return false;
    const index = nodePath[nodePath.length - 1];
    return index > 0;
  }

  canMoveDown(nodePath: number[]): boolean {
    if (nodePath.length === 0) return false;
    const parentPath = nodePath.slice(0, -1);
    const index = nodePath[nodePath.length - 1];
    
    let current = this.toc;
    for (const pathIndex of parentPath) {
      if (current.children && current.children[pathIndex]) {
        current = current.children[pathIndex] as TocRoot;
      } else {
        return false;
      }
    }
    
    return current.children && index < current.children.length - 1;
  }

  onMoveNodeUp(nodePath: number[]): void {
    if (!this.canMoveUp(nodePath)) return;
    
    const parentPath = nodePath.slice(0, -1);
    const index = nodePath[nodePath.length - 1];
    
    let current = this.toc;
    for (const pathIndex of parentPath) {
      if (current.children && current.children[pathIndex]) {
        current = current.children[pathIndex] as TocRoot;
      } else {
        return;
      }
    }
    
    if (current.children && index > 0) {
      // Swap with previous element
      const temp = current.children[index];
      current.children[index] = current.children[index - 1];
      current.children[index - 1] = temp;
      this.onNodeChanged();
    }
  }

  onMoveNodeDown(nodePath: number[]): void {
    if (!this.canMoveDown(nodePath)) return;
    
    const parentPath = nodePath.slice(0, -1);
    const index = nodePath[nodePath.length - 1];
    
    let current = this.toc;
    for (const pathIndex of parentPath) {
      if (current.children && current.children[pathIndex]) {
        current = current.children[pathIndex] as TocRoot;
      } else {
        return;
      }
    }
    
    if (current.children && index < current.children.length - 1) {
      // Swap with next element
      const temp = current.children[index];
      current.children[index] = current.children[index + 1];
      current.children[index + 1] = temp;
      this.onNodeChanged();
    }
  }

  onEditRootTitle(): void {
    const dialogRef = this.dialog.open(EditRootTitleDialogComponent, {
      width: '400px',
      data: {
        currentTitle: this.toc.text
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.trim()) {
        this.toc.text = result.trim();
        this.tocChanged.emit();
      }
    });
  }

  onCollapseAll(): void {
    this.setAllNodesExpanded(false);
  }

  onExpandAll(): void {
    this.setAllNodesExpanded(true);
  }

  /**
   * Recursively set the expansion state for all subtitle nodes in the tree.
   * This method is used by the collapse/expand all functionality.
   * 
   * @param expanded - Whether nodes should be expanded (true) or collapsed (false)
   */
  private setAllNodesExpanded(expanded: boolean): void {
    const setExpanded = (nodes: TocNode[]): void => {
      nodes.forEach(node => {
        if (node.type === 'subtitle') {
          node.isExpanded = expanded;
        }
        if (node.children && node.children.length > 0) {
          setExpanded(node.children);
        }
      });
    };

    if (this.toc.children) {
      setExpanded(this.toc.children);
      this.onNodeChanged();
    }
  }

  private addNodeToPath(parentPath: number[], node: TocNode, insertIndex?: number): void {
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
    
    if (insertIndex !== undefined) {
      // Insert at specific index (for sibling insertion)
      current.children.splice(insertIndex, 0, node);
    } else {
      // Append to end (for child insertion)
      current.children.push(node);
    }
    
    // Initialize isExpanded based on collapsed property
    if (node.isExpanded === undefined) {
      node.isExpanded = !node.collapsed; // If collapsed is true, isExpanded should be false
    }
    
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
        collectionId: this.collectionId,
        publications: this.publications
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
    
    // If collapsed property changed, update isExpanded accordingly
    if (updatedNode.collapsed !== undefined) {
      originalNode.isExpanded = !updatedNode.collapsed;
    }
    
    this.onNodeChanged();
  }
}

