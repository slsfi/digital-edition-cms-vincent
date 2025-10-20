import { Component, DOCUMENT, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDragDrop, CdkDropList, CdkDrag, CdkDragMove } from '@angular/cdk/drag-drop';

import { DropInfo, TocContainer, TocNode, TocRoot, TocSectionNode } from '../../models/table-of-contents';
import { PublicationLite } from '../../models/publication';
import { EditNodeDialogComponent } from '../edit-node-dialog/edit-node-dialog.component';
import { EditRootTitleDialogComponent } from '../edit-root-title-dialog/edit-root-title-dialog.component';
import { ConfirmDeleteDialogComponent } from '../confirm-delete-dialog/confirm-delete-dialog.component';
import { CanMoveNodeDownPipe } from '../../pipes/can-move-node-down.pipe';
import { CanMoveNodeUpPipe } from '../../pipes/can-move-node-up.pipe';


@Component({
  selector: 'toc-tree',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatTooltipModule,
    CdkDrag,
    CdkDropList,
    CanMoveNodeDownPipe,
    CanMoveNodeUpPipe
  ],
  templateUrl: './toc-tree.component.html',
  styleUrls: ['./toc-tree.component.scss']
})
export class TocTreeComponent implements OnChanges {
  private readonly dialog = inject(MatDialog);
  private document: Document = inject(DOCUMENT);

  @Input() toc!: TocRoot;
  @Input() collectionId!: number;
  @Input() publications: PublicationLite[] = [];
  @Output() tocChanged = new EventEmitter<void>();

  // Drag and drop properties
  nodeLookup: Record<string, TocNode> = {};
  currentDropAction: DropInfo | null = null;
  private cachedDropListIds: string[] = [];
  private dropListIdsCacheValid = false;

  ngOnChanges(changes: SimpleChanges): void {
    // only prepare drag-drop if toc in changes -> avoids
    // running the prepare method multiple times for the same toc
    if ('toc' in changes) {
      const curr = changes['toc'].currentValue as TocRoot | null | undefined;
      if (curr) {
        this.prepareDragDrop(curr.children);
      }
    }
  }

  /**
   * Prepare drag and drop functionality by setting up node lookup and drop
   * targets.
   * This method initializes the nodeLookup map for efficient node retrieval
   * during drag operations and prepares the drop target IDs for CDK drag
   * and drop connectivity.
   * 
   * @param nodes - Array of TOC nodes to prepare for drag and drop
   */
  private prepareDragDrop(nodes: TocNode[]): void {
    this.nodeLookup = {};
    this.generateIdsAndPrepareDragDrop(nodes, []);
  }

  /**
   * Recursively generate unique IDs for nodes and populate the nodeLookup map.
   * This method assigns path-based IDs to each node, stores the node path on
   * each node, and sets default expansion state.
   * 
   * @param nodes - Array of nodes to process
   * @param path - Current path in the tree (array of indices)
   */
  private generateIdsAndPrepareDragDrop(nodes: TocNode[], path: number[]): void {
    nodes.forEach((node, index) => {
      const currentPath = [...path, index];
      const nodeId = this.generateNodeId(currentPath);
      
      node.id = nodeId;
      node.path = currentPath; // keep the path on the node

      // Initialize isExpanded based on collapsed property if not already set
      if (node.isExpanded === undefined) {
        // If collapsed is true, isExpanded should be false
        node.isExpanded = !node.collapsed;
      }
      
      this.nodeLookup[nodeId] = node;
      
      if (node.children?.length) {
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
   * and updates visual indicators accordingly. Uses a 25/50/25 zone split for easier same-level reordering.
   * 
   * @param event - CDK drag move event containing pointer position
   */
  dragMoved = this.debounce((event: CdkDragMove) => {
    const element = this.document.elementFromPoint(event.pointerPosition.x, event.pointerPosition.y);
    
    if (!element) {
      this.clearDragInfo();
      return;
    }
    
    const targetContainer = element.classList.contains("node-item")
      ? element
      : element.closest(".node-item");

    if (!targetContainer) {
      this.clearDragInfo();
      return;
    }
    
    const targetId = (targetContainer as HTMLElement).id || '';
    this.currentDropAction = { targetId, action: 'before' };

    const targetRect = (targetContainer as HTMLElement).getBoundingClientRect();
    const topZone = targetRect.height * 0.25; // Top 25%
    const bottomZone = targetRect.height * 0.75; // Bottom 75%
    const y = event.pointerPosition.y - targetRect.top;

    if (y < topZone) {
      // before (top 25%)
      this.currentDropAction.action = 'before';
    } else if (y > bottomZone) {
      // after (bottom 25%)
      this.currentDropAction.action = 'after';
    } else {
      // middle 50% → "inside" ONLY if target is a section
      if (this.canDropInside(targetId)) {
        this.currentDropAction.action = 'inside';
      } else {
        // pick the nearer edge for non-section nodes
        this.currentDropAction.action = (y < targetRect.height / 2)
          ? 'before'
          : 'after';
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
    const targetId = this.currentDropAction.targetId;

    // If somehow "inside" slipped in for a non-section, coerce to 'after'
    if (this.currentDropAction.action === 'inside' && !this.canDropInside(targetId)) {
      this.currentDropAction.action = 'after';
    }

    const targetListId = this.getParentNodeId(targetId, this.toc.children, 'main');
    const draggedItem = this.nodeLookup[draggedItemId];

    const oldItemContainer = parentItemId !== 'main'
      ? this.nodeLookup[parentItemId].children!
      : this.toc.children;
    const newContainer = targetListId !== 'main'
      ? this.nodeLookup[targetListId].children!
      : this.toc.children;

    // Check if the item is being dropped in the same position
    if (parentItemId === targetListId) {
      const oldIndex = oldItemContainer.findIndex(c => c.id === draggedItemId);
      const targetIndex = newContainer.findIndex(c => c.id === targetId);
      
      // If it's the same item and same position, don't move
      if (draggedItemId === targetId) {
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
        const targetIndex = newContainer.findIndex(c => c.id === targetId);
        if (this.currentDropAction.action === 'before') {
          newContainer.splice(targetIndex, 0, draggedItem);
        } else {
          newContainer.splice(targetIndex + 1, 0, draggedItem);
        }
        break;
      }
      case 'inside': {
        // allowed only for section nodes
        const targetNode = this.nodeLookup[targetId];
        if (!targetNode.children) {
          targetNode.children = [];
        }
        targetNode.children.push(draggedItem);
        targetNode.isExpanded = true;
        break;
      }
    }

    this.clearDragInfo(true);
    this.runNodeChangedActions();
  }

  private getParentNodeId(id: string, nodesToSearch: TocNode[], parentId: string): string {
    for (const node of nodesToSearch) {
      if (node.id === id) return parentId;
      if (node.children) {
        const ret = this.getParentNodeId(id, node.children, node.id!);
        if (ret) return ret;
      }
    }
    return '';
  }

  private showDragInfo(): void {
    this.clearDragInfo();
    if (!this.currentDropAction) return;

    let { targetId, action } = this.currentDropAction;
    if (action === 'inside' && !this.canDropInside(targetId)) {
      // defensive fallback for visuals, it is not possible to
      // drop nodes 'inside' any other nodes than section nodes
      action = 'after';
    }

    const el = this.document.getElementById(targetId);
    if (el) {
      el.classList.add('drop-' + action);
    }
  }

  private clearDragInfo(dropped = false): void {
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

  private canDropInside(targetId: string): boolean {
    const n = this.nodeLookup[targetId];
    return this.isSectionNode(n); // only sections can have children
  }

  private runNodeChangedActions(): void {
    // Regenerate IDs after changes
    this.prepareDragDrop(this.toc.children);
    // Invalidate cache after DOM update
    setTimeout(() => {
      this.invalidateDropListCache();
    }, 0);
    this.tocChanged.emit();
  }

  editNode(node: TocNode): void {
    const dialogRef = this.dialog.open(EditNodeDialogComponent, {
      width: '500px',
      data: {
        dialogMode: 'edit',
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
    // if (updatedNode.collapsed !== undefined) {
    //   originalNode.isExpanded = !updatedNode.collapsed;
    // }
  
    this.runNodeChangedActions();
  }

  addChildNode(target?: TocNode): void {
    // If no target, add to root
    const parentPath = target ? this.resolvePath(target) : [];
    const dialogRef = this.dialog.open(EditNodeDialogComponent, {
      width: '500px',
      data: {
        dialogMode: 'add',
        collectionId: this.collectionId,
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
   * @param target - The node that will have a new sibling added after it
   */
  addSiblingNode(target: TocNode): void {
    // Get the parent path (remove the last index)
    const nodePath = this.resolvePath(target);
    const parentPath = nodePath.slice(0, -1);
    const siblingIndex = nodePath[nodePath.length - 1];
    
    const dialogRef = this.dialog.open(EditNodeDialogComponent, {
      width: '500px',
      data: {
        dialogMode: 'add',
        collectionId: this.collectionId,
        publications: this.publications
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addNodeToPath(parentPath, result, siblingIndex + 1);
      }
    });
  }

  moveNodeUp(target: TocNode): void {
    const nodePath = this.resolvePath(target);
    if (!this.canMoveNodeUp(nodePath)) return;
    
    const parentPath = nodePath.slice(0, -1);
    const index = nodePath[nodePath.length - 1];
    
    const parent = this.getContainerAtPath(parentPath);
    if (!parent || index <= 0) return;

    const arr = parent.children;

    // swap with previous
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    this.runNodeChangedActions();
  }

  moveNodeDown(target: TocNode): void {
    const nodePath = this.resolvePath(target);
    if (!this.canMoveNodeDown(nodePath)) return;
    
    const parentPath = nodePath.slice(0, -1);
    const index = nodePath[nodePath.length - 1];
    
    const parent = this.getContainerAtPath(parentPath);
    if (!parent) return;

    const arr = parent.children;
    if (index >= arr.length - 1) return;

    // swap with next
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    this.runNodeChangedActions();
  }

  private canMoveNodeUp(nodePath: number[]): boolean {
    if (nodePath.length === 0) return false;
    const index = nodePath[nodePath.length - 1];
    return index > 0;
  }

  private canMoveNodeDown(nodePath: number[]): boolean {
    if (nodePath.length === 0) return false;
    const parentPath = nodePath.slice(0, -1);
    const index = nodePath[nodePath.length - 1];
    
    const parent = this.getContainerAtPath(parentPath);
    if (!parent) return false;

    return index < parent.children.length - 1;
  }

  deleteNode(target: TocNode): void {
    const nodePath = this.resolvePath(target);
    if (nodePath.length === 0) return; // Never delete root

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
    if (nodePath.length === 0) return; // Never delete root

    if (nodePath.length === 1) {
      // delete from root level
      this.toc.children.splice(nodePath[0], 1);
      this.runNodeChangedActions();
      return;
    }

    // delete from nested level
    const parentPath = nodePath.slice(0, -1);
    const lastIndex = nodePath[nodePath.length - 1];

    const parent = this.getContainerAtPath(parentPath);
    if (!parent) return;

    parent.children.splice(lastIndex, 1);
    this.runNodeChangedActions();
  }

    toggleNodeExpansion(node: TocNode): void {
    node.isExpanded = !node.isExpanded;
    // Invalidate cache after DOM update
    setTimeout(() => {
      this.invalidateDropListCache();
    }, 0);
  }

  editTocTitle(): void {
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

  collapseAll(): void {
    this.setAllNodesExpanded(false);
  }

  expandAll(): void {
    this.setAllNodesExpanded(true);
  }

  /**
   * Recursively set the expansion state for all section nodes in the tree.
   * This method is used by the collapse/expand all functionality.
   * 
   * @param expanded - Whether nodes should be expanded (true) or collapsed (false)
   */
  private setAllNodesExpanded(expanded: boolean): void {
    const setExpanded = (nodes: TocNode[]): void => {
      nodes.forEach(node => {
        if (node.type === 'section') {
          node.isExpanded = expanded;
        }
        if (node.children && node.children.length > 0) {
          setExpanded(node.children);
        }
      });
    };

    if (this.toc.children) {
      setExpanded(this.toc.children);
      // ToC should not be marked as changed just because nodes
      // are collapsed/expanded in the UI
      // this.onNodeChanged();
    }
  }

  private addNodeToPath(parentPath: number[], node: TocNode, insertIndex?: number): void {
    const parent = this.getContainerAtPath(parentPath);
    if (!parent) return;

    if (insertIndex !== undefined) {
      // Insert at specific index (for sibling insertion)
      parent.children.splice(insertIndex, 0, node);
    } else {
      // Append to end (for child insertion)
      parent.children.push(node);
    }

    // Initialize isExpanded based on collapsed property
    if (node.isExpanded === undefined) {
      node.isExpanded = !node.collapsed; // If collapsed is true, isExpanded should be false
    }

    this.runNodeChangedActions();
  }

  private resolvePath(node: TocNode): number[] {
    // Get the precomputed path to this node in the tree, or
    // compute it if it's not on the node
    return node.path ?? this.findNodePath(node, this.toc.children, []);
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

  private isSectionNode(n: TocNode | undefined): n is TocSectionNode {
    return !!n && n.type === 'section' && Array.isArray(n.children);
  }

  /**
   * Walk down to the container at `path`. Root is a container; each step
   * must land on a section node. Returns undefined if the path is invalid.
   */
  private getContainerAtPath(path: number[]): TocContainer | undefined {
    let container: TocContainer = this.toc; // start at root
    for (const idx of path) {
      // Explicitly annotate the child; no optional chaining since containers
      // always have children
      const child: TocNode | undefined = container.children[idx];
      if (!this.isSectionNode(child)) return undefined; // invalid step
      container = child; // narrowed by the type guard to TocSectionNode
    }
    return container;
  }
}
