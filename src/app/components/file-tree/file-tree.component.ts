import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule, MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material/tree';
import { map } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

interface TreeNode {
  name: string;
  children: TreeNode[];
}

interface FlatTreeNode {
  expandable: boolean;
  name: string;
  level: number;
}

@Component({
  selector: 'file-tree',
  standalone: true,
  imports: [MatTreeModule, MatButtonModule, MatIconModule, LoadingSpinnerComponent, CommonModule, MatDialogModule],
  templateUrl: './file-tree.component.html',
  styleUrl: './file-tree.component.scss'
})
export class FileTreeComponent {
  readonly filename = inject<string>(MAT_DIALOG_DATA);

  @Input() value: string | null = '';
  @Input() onlyFiles: boolean = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() fileSelected = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  treeControl: FlatTreeControl<FlatTreeNode>;
  treeFlattener: MatTreeFlattener<TreeNode, FlatTreeNode>;
  dataSource: MatTreeFlatDataSource<TreeNode, FlatTreeNode>;
  loading: boolean = true;

  selectedNodes: string[] = [];

  constructor(private projectService: ProjectService) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren
    );
    this.treeControl = new FlatTreeControl<FlatTreeNode>(
      this.getLevel,
      this.isExpandable
    );
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  }

  ngOnInit() {
    if (this.value) {
      this.selectedNodes = this.value.split('/');
    }
    if (this.filename && typeof this.filename === 'string') {
      this.selectedNodes = this.filename.split('/');
    } else {
      this.selectedNodes = this.value?.split('/') || [];
    }
  }

  ngAfterViewInit() {
    // Fetch file tree data
    setTimeout(() => {
      this.projectService.getFileTree().pipe(
        map((fileTree) => this.convertToTreeNode(fileTree))
      ).subscribe((data: TreeNode[]) => {
        this.dataSource.data = data;
        if (data.length > 0) {
          this.loading = false;
        }
      });
    });
  }

  get selectedNodeName() {
    return this.selectedNodes[this.selectedNodes.length - 1];
  }

  // Transformer to flatten the tree data
  private transformer = (node: TreeNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      level: level
    };
  }

  // Getters for tree control
  private getLevel = (node: FlatTreeNode) => node.level;
  private isExpandable = (node: FlatTreeNode) => node.expandable;
  private getChildren = (node: TreeNode): TreeNode[] => node.children;
  hasChild = (_: number, node: FlatTreeNode) => node.expandable;

  convertToTreeNode(data: any): TreeNode[] {
    const result: TreeNode[] = [];

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const node: TreeNode = {
          name: key,
          children: []
        };

        // If the value is an object, recurse
        if (data[key] && typeof data[key] === 'object') {
          node.children = this.convertToTreeNode(data[key]);
        }

        result.push(node);
      }
    }

    return result;
  }

  select(node: FlatTreeNode) {
    this.selectedNodes = [...this.getParentNodes(node).map(node => node.name), node.name];
    this.valueChange.emit(this.selectedNodes.join('/'));
    this.treeControl.dataNodes.forEach(node => this.treeControl.collapse(node));
  }

  getParentNodes(node: FlatTreeNode): FlatTreeNode[] {
    const parentNodes: FlatTreeNode[] = [];
    let currentLevel = node.level;
    // Traverse backwards through the tree control data to find parent nodes
    for (let i = this.treeControl.dataNodes.indexOf(node) - 1; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];
      if (currentNode.level < currentLevel) {
        parentNodes.unshift(currentNode);  // Add to the front of the list (parents should be ordered)
        currentLevel = currentNode.level;
      }
    }

    return parentNodes;
  }

  isSelected(node: FlatTreeNode): boolean {
    const idx = this.selectedNodes.indexOf(node.name);
    return idx === node.level;
  }

  selected() {
    this.fileSelected.emit(this.selectedNodes.join('/'));
  }

  previous() {
    this.close.emit();
  }

}
