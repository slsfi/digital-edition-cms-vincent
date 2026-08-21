import type { MockedObject } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { FacsimileCollectionComponent } from './facsimile-collection.component';
import { EditDialogComponent } from '../../components/edit-dialog/edit-dialog.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';
import { Deleted } from '../../models/common.model';
import { FacsimileCollection, FacsimileCollectionEditRequest } from '../../models/facsimile.model';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { SnackbarService } from '../../services/snackbar.service';
import { FACSIMILE_COLLECTION_ALL_COLUMN_DATA } from '../facsimile-collections/facsimile-collection-columns';

describe('FacsimileCollectionComponent', () => {
    let component: FacsimileCollectionComponent;
    let fixture: ComponentFixture<FacsimileCollectionComponent>;
    let dialog: MockedObject<Pick<MatDialog, 'open'>>;
    let facsimileService: MockedObject<Pick<FacsimileService,
        'getFacsimileCollection' | 'verifyFacsimileFile' | 'editFacsimileCollection'>>;
    let snackbar: MockedObject<Pick<SnackbarService, 'show'>>;

    const facsimileCollection: FacsimileCollection = {
        date_created: '2024-01-01T00:00:00',
        date_modified: null,
        deleted: Deleted.NotDeleted,
        description: 'Original description',
        external_url: 'https://example.com/facsimile',
        folder_path: null,
        id: 1,
        number_of_pages: 4,
        page_comment: null,
        start_page_number: 1,
        title: 'Original title'
    };

    beforeEach(async () => {
        dialog = {
            open: vi.fn().mockName("MatDialog.open")
        };
        facsimileService = {
            getFacsimileCollection: vi.fn().mockName("FacsimileService.getFacsimileCollection"),
            verifyFacsimileFile: vi.fn().mockName("FacsimileService.verifyFacsimileFile"),
            editFacsimileCollection: vi.fn().mockName("FacsimileService.editFacsimileCollection")
        };
        snackbar = {
            show: vi.fn().mockName("SnackbarService.show")
        };

        facsimileService.getFacsimileCollection.mockReturnValue(of(facsimileCollection));
        facsimileService.verifyFacsimileFile.mockReturnValue(of({
            success: true,
            message: '',
            data: { missing_file_numbers: [] }
        }));
        facsimileService.editFacsimileCollection.mockImplementation((collectionId, payload) => of({
            success: true,
            message: '',
            data: {
                ...facsimileCollection,
                ...payload,
                id: collectionId
            }
        }));

        await TestBed.configureTestingModule({
            imports: [FacsimileCollectionComponent],
            providers: [
                ...getCommonTestingProviders(),
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            params: { id: '1' },
                            paramMap: convertToParamMap({ id: '1' })
                        }
                    }
                },
                {
                    provide: ProjectService,
                    useValue: {
                        getCurrentProject: () => 'test-project'
                    }
                },
                {
                    provide: MatDialog,
                    useValue: dialog
                },
                {
                    provide: FacsimileService,
                    useValue: facsimileService
                },
                {
                    provide: SnackbarService,
                    useValue: snackbar
                }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(FacsimileCollectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should enable save only when a valid title or number of pages changes', () => {
        let saveButton = fixture.debugElement.query(By.css('.edit-facs-coll-row button')).nativeElement as HTMLButtonElement;
        expect(saveButton.disabled).toBe(true);

        component.numberOfPagesControl.setValue(0);
        fixture.detectChanges();

        saveButton = fixture.debugElement.query(By.css('.edit-facs-coll-row button')).nativeElement as HTMLButtonElement;
        expect(saveButton.disabled).toBe(true);

        component.numberOfPagesControl.setValue(5);
        fixture.detectChanges();

        saveButton = fixture.debugElement.query(By.css('.edit-facs-coll-row button')).nativeElement as HTMLButtonElement;
        expect(saveButton.disabled).toBe(false);

        component.numberOfPagesControl.setValue(facsimileCollection.number_of_pages);
        fixture.detectChanges();

        saveButton = fixture.debugElement.query(By.css('.edit-facs-coll-row button')).nativeElement as HTMLButtonElement;
        expect(saveButton.disabled).toBe(true);

        component.titleControl.setValue('Updated title');
        fixture.detectChanges();

        saveButton = fixture.debugElement.query(By.css('.edit-facs-coll-row button')).nativeElement as HTMLButtonElement;
        expect(saveButton.disabled).toBe(false);

        component.titleControl.setValue(' ');
        fixture.detectChanges();

        saveButton = fixture.debugElement.query(By.css('.edit-facs-coll-row button')).nativeElement as HTMLButtonElement;
        expect(saveButton.disabled).toBe(true);
    });

    it('should update title and number_of_pages in the edit request', () => {
        const payload: FacsimileCollectionEditRequest = {
            title: 'Updated title',
            number_of_pages: 6,
            start_page_number: facsimileCollection.start_page_number,
            description: facsimileCollection.description,
            external_url: facsimileCollection.external_url,
            deleted: facsimileCollection.deleted
        };

        component.titleControl.setValue('Updated title');
        component.numberOfPagesControl.setValue(6);
        component.saveFacsimileCollection(facsimileCollection);

        expect(facsimileService.editFacsimileCollection).toHaveBeenCalledTimes(1);

        expect(facsimileService.editFacsimileCollection).toHaveBeenCalledWith(facsimileCollection.id, payload, 'test-project');
        expect(component.numberOfPages()).toBe(6);
        expect(component.facsimileCollection()?.title).toBe('Updated title');
        expect(snackbar.show).toHaveBeenCalledWith('Facsimile collection saved.');
    });

    it('should edit the collection through the full edit dialog', () => {
        const dialogPayload = {
            id: facsimileCollection.id,
            title: 'Dialog title',
            description: 'Dialog description',
            number_of_pages: 8,
            start_page_number: 2,
            external_url: 'https://example.com/updated',
            page_comment: 'Dialog page comment',
            deleted: Deleted.NotDeleted,
            folder_path: '/facsimile-collections/dialog'
        };

        dialog.open.mockReturnValue({
            afterClosed: () => of({
                form: {
                    getRawValue: () => dialogPayload
                }
            })
        } as never);

        component.editFacsimileCollection(facsimileCollection);

        expect(dialog.open).toHaveBeenCalledTimes(1);

        expect(dialog.open).toHaveBeenCalledWith(EditDialogComponent, {
            data: {
                model: facsimileCollection,
                columns: FACSIMILE_COLLECTION_ALL_COLUMN_DATA,
                title: 'fascimile collection'
            }
        });
        expect(facsimileService.editFacsimileCollection).toHaveBeenCalledWith(facsimileCollection.id, dialogPayload, 'test-project');
        expect(component.facsimileCollection()?.title).toBe('Dialog title');
        expect(component.numberOfPages()).toBe(8);
        expect(snackbar.show).toHaveBeenCalledWith('Facsimile collection saved.');
    });
});
