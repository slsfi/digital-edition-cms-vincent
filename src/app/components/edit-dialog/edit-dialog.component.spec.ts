import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';

import { Column } from '../../models/common.model';
import { XmlMetadata } from '../../models/publication.model';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';
import { EditDialogComponent, EditDialogData } from './edit-dialog.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';

// Simple interface for testing
interface TestData {
    id?: number;
    name?: string;
    language?: string | null;
    original_filename?: string;
}

describe('EditDialogComponent', () => {
    let component: EditDialogComponent<TestData>;
    let fixture: ComponentFixture<EditDialogComponent<TestData>>;
    let dialogData: EditDialogData<TestData>;
    let metadata$: Subject<XmlMetadata>;
    let consoleWarn: ReturnType<typeof vi.spyOn>;

    const languageColumn: Column = {
        field: 'language',
        header: 'Language',
        type: 'language',
        editable: true,
    };

    beforeEach(async () => {
        const originalWarn = console.warn;
        consoleWarn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
            if (!String(args[0]).includes('NG0914')) {
                originalWarn(...args);
            }
        });
        metadata$ = new Subject<XmlMetadata>();
        dialogData = {
            model: null,
            columns: [],
            title: 'Test'
        };

        await TestBed.configureTestingModule({
            imports: [EditDialogComponent],
            providers: [
                ...getCommonTestingProviders(),
                { provide: ProjectService, useValue: { getCurrentProject: () => 'test-project' } },
                { provide: PublicationService, useValue: { getMetadataFromXML: () => metadata$ } },
                {
                    provide: MAT_DIALOG_DATA,
                    useFactory: () => dialogData
                }
            ]
        })
            .compileComponents();
    });

    afterEach(() => {
        consoleWarn.mockRestore();
    });

    function createComponent(data: Partial<EditDialogData<TestData>> = {}) {
        dialogData = {
            model: data.model ?? null,
            columns: data.columns ?? [],
            title: data.title ?? 'Test',
            tableName: data.tableName
        };
        fixture = TestBed.createComponent(EditDialogComponent<TestData>);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    function languageOptionsFor(field: string) {
        return component.languageOptionsByField()[field] ?? component.languageOptions;
    }

    it('should create', () => {
        createComponent();

        expect(component).toBeTruthy();
    });

    it('should render language fields as select controls', () => {
        createComponent({
            model: { language: 'en' },
            columns: [languageColumn]
        });

        expect(component.form.controls['language'].value).toBe('en');
        expect(fixture.nativeElement.querySelector('mat-select')).not.toBeNull();
        expect(fixture.nativeElement.querySelector('input[formcontrolname="language"]')).toBeNull();
    });

    it('should expose language options for language fields', () => {
        createComponent({
            model: { language: 'en' },
            columns: [languageColumn]
        });

        const options = languageOptionsFor('language');

        expect(options.some(option => option.code === 'en' && option.label === 'English')).toBe(true);
        expect(options.some(option => option.label.startsWith('Unknown language'))).toBe(false);
    });

    it('should preserve unknown backend language codes as selectable options', () => {
        createComponent({
            model: { language: 'zz' },
            columns: [languageColumn]
        });

        const options = languageOptionsFor('language');

        expect(component.form.controls['language'].value).toBe('zz');
        expect(options[0]).toEqual({ label: 'Unknown language (zz)', code: 'zz' });
    });

    it('should normalize empty language values to none', () => {
        createComponent({
            columns: [languageColumn]
        });

        const options = languageOptionsFor('language');

        expect(component.form.controls['language'].value).toBeNull();
        expect(options[0]).toEqual({ label: 'None', code: null });
    });

    it('should update unknown language options when the control value changes', () => {
        createComponent({
            model: { language: 'en' },
            columns: [languageColumn]
        });

        component.form.controls['language'].setValue('zz');

        const options = languageOptionsFor('language');
        expect(options[0]).toEqual({ label: 'Unknown language (zz)', code: 'zz' });
    });

    it('renders metadata form updates and re-enables the action after completion', async () => {
        createComponent({
            model: { original_filename: 'document.xml', name: '' },
            columns: [
                { field: 'original_filename', header: 'File path', type: 'string', editable: true },
                { field: 'name', header: 'Name', type: 'string', editable: true }
            ]
        });
        const metadataButton = Array.from(
            fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
        ).find(button => button.textContent?.includes('Get metadata from XML'));

        expect(metadataButton).toBeDefined();
        metadataButton?.click();
        await fixture.whenStable();

        expect(metadataButton?.disabled).toBe(true);

        metadata$.next({
            genre: 'Novel',
            language: 'sv',
            name: 'Updated title',
            original_publication_date: '1900'
        });
        await fixture.whenStable();

        const renderedInputValues = Array.from(
            fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>
        ).map(input => input.value);
        expect(renderedInputValues).toContain('Updated title');
        expect(metadataButton?.disabled).toBe(false);
    });
});
