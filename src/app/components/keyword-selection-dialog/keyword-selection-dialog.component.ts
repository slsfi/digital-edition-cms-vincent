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

import { Keyword, KeywordCreationRequest } from '../../models/keyword.model';
import { KeywordService } from '../../services/keyword.service';
import { KeywordDialogComponent } from '../keyword-dialog/keyword-dialog.component';

export interface KeywordSelectionDialogData {
  projectName: string;
  publicationId: number;
}

export interface KeywordSelectionDialogResult {
  keyword?: Keyword;
  keywordRequest?: KeywordCreationRequest;
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
  templateUrl: './keyword-selection-dialog.component.html',
  styleUrl: './keyword-selection-dialog.component.scss'
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
    return keyword ? keyword.name : '';
  }

  onOptionSelected(event: any) {
    const value = event.option.value;
    
    if (value === null) {
      // This is the "create new keyword" option
      this.createNewKeyword();
    } else if (value) {
      // This is a regular keyword
      this.dialogRef.close({
        keyword: value,
        action: 'link'
      } as KeywordSelectionDialogResult);
    }
  }

  createNewKeyword() {
    const searchTerm = this.searchControl.value;
    if (!searchTerm) return;

    // Get categories for the dialog
    const categories$ = this.keywordService.getUniqueCategories(this.data.projectName);

    // Create a temporary keyword object with the search term as the text
    const tempKeyword: Keyword = {
      id: 0, // Temporary ID
      name: searchTerm,
      category: null,
      projectId: 1, // Mock project ID
      translations: []
    };

    // Open the keyword creation dialog with the search term pre-filled
    const keywordDialogRef = this.dialog.open(KeywordDialogComponent, {
      data: {
        mode: 'add',
        keyword: tempKeyword, // Pre-fill with search term
        categories$: categories$
      },
      width: '500px'
    });

    keywordDialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Close this dialog and return the keyword creation request
        this.dialogRef.close({
          keywordRequest: result,
          action: 'create'
        } as KeywordSelectionDialogResult);
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
