import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, of, startWith, map, debounceTime, switchMap, catchError } from 'rxjs';

import { Keyword, KeywordCreationRequest } from '../../models/keyword';
import { KeywordService } from '../../services/keyword.service';
import { KeywordDialogComponent } from '../keyword-dialog/keyword-dialog.component';

export interface KeywordSelectionDialogData {
  projectName: string;
  publicationId: number;
}

export interface KeywordSelectionDialogResult {
  keyword: Keyword;
  action: 'link' | 'create';
}

@Component({
  selector: 'app-keyword-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="keyword-selection-dialog">
      <h2 mat-dialog-title>Link Keyword to Publication</h2>
      
      <mat-dialog-content>
        <p>Search for an existing keyword or create a new one:</p>
        
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search keywords</mat-label>
          <input matInput 
                 [formControl]="searchControl"
                 [matAutocomplete]="auto"
                 placeholder="Type to search keywords...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        
        <mat-autocomplete #auto="matAutocomplete" 
                         [displayWith]="displayKeyword"
                         (optionSelected)="onKeywordSelected($event)">
          <mat-option *ngFor="let keyword of filteredKeywords$ | async" [value]="keyword">
            <div class="keyword-option">
              <span class="keyword-text">{{ keyword.text }}</span>
              <span class="keyword-category" *ngIf="keyword.category">({{ keyword.category }})</span>
            </div>
          </mat-option>
          <mat-option *ngIf="(filteredKeywords$ | async)?.length === 0 && searchControl.value" 
                      (click)="createNewKeyword()">
            <div class="create-new-option">
              <mat-icon>add</mat-icon>
              Create new keyword: "{{ searchControl.value }}"
            </div>
          </mat-option>
        </mat-autocomplete>
        
        <div *ngIf="isLoading" class="loading">
          <mat-spinner diameter="24"></mat-spinner>
          <span>Searching keywords...</span>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-flat-button color="primary" 
                (click)="createNewKeyword()" 
                [disabled]="!searchControl.value">
          <mat-icon>add</mat-icon>
          Create New
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .keyword-selection-dialog {
      min-width: 400px;
    }
    
    .search-field {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .keyword-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .keyword-text {
      font-weight: 500;
    }
    
    .keyword-category {
      color: #666;
      font-size: 0.9em;
    }
    
    .create-new-option {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
    }
    
    .loading {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      color: #666;
    }
  `]
})
export class KeywordSelectionDialogComponent implements OnInit {
  searchControl = new FormControl('');
  filteredKeywords$: Observable<Keyword[]> = of([]);
  isLoading = false;

  constructor(
    public dialogRef: MatDialogRef<KeywordSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: KeywordSelectionDialogData,
    private keywordService: KeywordService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.setupSearch();
  }

  private setupSearch() {
    this.filteredKeywords$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(searchTerm => {
        if (!searchTerm || searchTerm.length < 2) {
          return of([]);
        }
        
        this.isLoading = true;
        return this.keywordService.searchKeywords(this.data.projectName, searchTerm).pipe(
          map(keywords => {
            this.isLoading = false;
            return keywords;
          }),
          catchError(error => {
            console.error('Error searching keywords:', error);
            this.isLoading = false;
            return of([]);
          })
        );
      })
    );
  }

  displayKeyword(keyword: Keyword): string {
    return keyword ? keyword.text : '';
  }

  onKeywordSelected(event: any) {
    const keyword = event.option.value;
    if (keyword) {
      this.dialogRef.close({
        keyword,
        action: 'link'
      } as KeywordSelectionDialogResult);
    }
  }

  createNewKeyword() {
    const searchTerm = this.searchControl.value;
    if (!searchTerm) return;

    // Get categories for the dialog
    const categories$ = this.keywordService.getUniqueCategories(this.data.projectName);

    // Open the keyword creation dialog
    const keywordDialogRef = this.dialog.open(KeywordDialogComponent, {
      data: {
        mode: 'add',
        keyword: undefined, // Creating new keyword
        categories$: categories$
      },
      width: '500px'
    });

    keywordDialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Close this dialog and return the created keyword
        this.dialogRef.close({
          keyword: result,
          action: 'create'
        } as KeywordSelectionDialogResult);
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
