import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTree, MatTreeModule } from '@angular/material/tree';
import { map, Subject, takeUntil } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";
import { CommonModule } from '@angular/common';

interface TreeNode {
  name: string;
  children: TreeNode[];
  level: number;
  isSelectable: boolean;
}

@Component({
  selector: 'file-tree',
  standalone: true,
  imports: [MatTreeModule, MatButtonModule, MatIconModule, LoadingSpinnerComponent, CommonModule],
  templateUrl: './file-tree.component.html',
  styleUrl: './file-tree.component.scss'
})
export class FileTreeComponent {

  private destroy$ = new Subject<void>();

  @Input() value: string | null = '';
  @Input() selectFolder: boolean = false;
  @Input() showLoading: boolean = true;
  @Output() valueChange = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
  @Output() filesInFolder = new EventEmitter<string[]>();

  closeInUse = false;
  dataSource: TreeNode[] = [];
  loading: boolean = true;
  selectedNodes: string[] = [];

  constructor(private projectService: ProjectService) {

  }

  ngOnInit() {
    this.closeInUse = this.close.observed;
    this.selectedNodes = this.value?.split('/') || [];

    this.projectService.getFileTree()
      .pipe(
        takeUntil(this.destroy$),
        map((fileTree) => this.convertToTreeNode(fileTree))
      )
      .subscribe((data: TreeNode[]) => {
        this.dataSource = data;
        if (data.length > 0) {
          this.loading = false;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get selectedNodeName() {
    return this.selectedNodes[this.selectedNodes.length - 1];
  }

  childrenAccessor = (node: TreeNode) => node.children ?? [];
  hasChild = (_: number, node: TreeNode) => node.children.length > 0;

  convertToTreeNode(data: any, level: number = 0): TreeNode[] {
    const result: TreeNode[] = [];

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        let isSelectable = false;
        if (key.split('.')[1] === 'xml' && !this.selectFolder) {
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
          if (this.selectFolder) {
            node.isSelectable = node.children.some(child => child.name.split('.')[1] === 'xml');
          } else {
            node.isSelectable = node.name.split('.')[1] === 'xml' ? true : false;
          }
        }

        result.push(node);
      }
    }

    return result;
  }

  select(node: TreeNode, tree: MatTree<TreeNode>) {
    const nodes = this.getNodes(node);
    if (this.selectFolder) {
      const fileNames = [];
      const lastItem = nodes[nodes.length - 1];
      for (const item of lastItem.children.filter(child => child.name.split('.')[1] === 'xml')) {
        fileNames.push([...nodes.map(node => node.name), item.name].join('/'));
      }
      this.filesInFolder.emit(fileNames);
    } else {
      this.selectedNodes = nodes.map(node => node.name);
      this.valueChange.emit(this.selectedNodes.join('/'));
    }
    tree.collapseAll();
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
    findPath(this.dataSource, targetNode);

    return path;
  }

  isSelected(node: TreeNode): boolean {
    const idx = this.selectedNodes.indexOf(node.name);
    return idx === node.level;
  }

  previous() {
    this.close.emit();
  }

}
