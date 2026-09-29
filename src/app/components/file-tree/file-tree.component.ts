import { Component, DestroyRef, OnInit, inject, signal, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule } from '@angular/material/tree';
import { filter, map } from 'rxjs';

import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";
import { FileTree } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';

interface TreeNode {
  name: string;
  children: TreeNode[];
  level: number;
  isSelectable: boolean;
}

@Component({
  selector: 'file-tree',
  imports: [MatTreeModule, MatButtonModule, MatIconModule, LoadingSpinnerComponent],
  templateUrl: './file-tree.component.html',
  styleUrl: './file-tree.component.scss'
})
export class FileTreeComponent implements OnInit {
  private projectService = inject(ProjectService);
  private destroyRef = inject(DestroyRef);

  readonly value = input<string | null>('');
  readonly selectFolder = input(false);
  readonly showLoading = input(true);
  readonly showCloseButton = input(false);
  readonly valueChange = output<string>();
  readonly panelClosed = output<void>();
  readonly filesInFolder = output<string[]>();

  readonly dataSource = signal<TreeNode[]>([]);
  readonly loading = signal(true);
  selectedNodes: string[] = [];

  ngOnInit() {
    this.selectedNodes = this.value()?.split('/') || [];

    this.projectService.getFileTree().pipe(
      takeUntilDestroyed(this.destroyRef),
      filter((data) => !!data),
      map((fileTree) => this.convertToTreeNode(fileTree))
    ).subscribe((data: TreeNode[]) => {
      this.dataSource.set(data);
      this.loading.set(false);
    });
  }

  /** Returns a node's nested children so MatTree can render and manage their expansion. */
  protected readonly childrenAccessor = (node: TreeNode): TreeNode[] => node.children;

  /** Selects the expandable-node template for nodes that contain children. */
  protected readonly hasChild = (_index: number, node: TreeNode): boolean => node.children.length > 0;

  convertToTreeNode(data: FileTree, level = 0): TreeNode[] {
    const result: TreeNode[] = [];

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        let isSelectable = false;
        const selectFolder = this.selectFolder();
        if (key.split('.').at(-1) === 'xml' && !selectFolder) {
          isSelectable = true;
        }
        const node: TreeNode = {
          name: key,
          children: [],
          level: level,
          isSelectable
        };

        // If the value is an object, recurse
        if (data[key] && typeof data[key] === 'object') {
          node.children = this.convertToTreeNode(data[key], level + 1);
          if (selectFolder) {
            node.isSelectable = node.children.some(child => child.name.split('.').at(-1) === 'xml');
          } else {
            node.isSelectable = node.name.split('.').at(-1) === 'xml' ? true : false;
          }
        }

        result.push(node);
      }
    }

    return result;
  }

  select(node: TreeNode) {
    const nodes = this.getNodes(node);
    if (this.selectFolder()) {
      const fileNames = [];
      const lastItem = nodes[nodes.length - 1];
      for (const item of lastItem.children.filter(child => child.name.split('.').at(-1) === 'xml')) {
        fileNames.push([...nodes.map(node => node.name), item.name].join('/'));
      }
      this.filesInFolder.emit(fileNames);
    } else {
      this.selectedNodes = nodes.map(node => node.name);
      this.valueChange.emit(this.selectedNodes.join('/'));
    }
  }

  getNodes(targetNode: TreeNode): TreeNode[] {
    const path: TreeNode[] = [];

    function findPath(nodes: TreeNode[], target: TreeNode): boolean {
      for (const node of nodes) {
        // Add current node to the path
        path.push(node);

        // If the current node is the target, we found the path
        if (node === target) {
          return true;
        }

        // Recurse on children if any
        if (node.children && findPath(node.children, target)) {
          return true;
        }

        // Remove the node if not part of the path to target
        path.pop();
      }
      return false;
    }

    // Start the recursive search
    findPath(this.dataSource(), targetNode);

    return path;
  }

  isSelected(node: TreeNode): boolean {
    const idx = this.selectedNodes.indexOf(node.name);
    return idx === node.level;
  }

  previous() {
    this.panelClosed.emit();
  }

}
