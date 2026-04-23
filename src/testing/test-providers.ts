import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';

export function getCommonTestingProviders() {
  return [
    provideRouter([]),
    {
      provide: ActivatedRoute,
      useValue: {
        snapshot: {
          params: {},
          queryParams: {},
          paramMap: convertToParamMap({}),
          queryParamMap: convertToParamMap({})
        },
        params: of({}),
        queryParams: of({}),
        paramMap: of(convertToParamMap({})),
        queryParamMap: of(convertToParamMap({})),
        data: of({}),
        fragment: of(null),
        url: of([])
      }
    },
    { provide: MAT_DIALOG_DATA, useValue: {} }
  ];
}
