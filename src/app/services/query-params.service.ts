import { ActivatedRoute, Params, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { QueryParamType } from '../models/common';
import { map, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class QueryParamsService {

  queryParams$: Observable<Params>;
  sortParams$: Observable<QueryParamType[]>;
  filterParams$: Observable<QueryParamType[]>;
  pageParams$: Observable<QueryParamType[]>;

  constructor(private router: Router, private route: ActivatedRoute) {
    this.queryParams$ = this.route.queryParams;

    this.sortParams$ = this.queryParams$.pipe(
      map(params => {
        const sort = params['sort'];
        const direction = params['direction'];
        if (sort && direction) {
          return [{ key: sort, value: direction }];
        }
        return [];
      })
    );

    this.filterParams$ = this.queryParams$.pipe(
      map(params => {
        const skipKeys = ['sort', 'direction', 'page'];
        const res: QueryParamType[] = [];
        Object.entries(params).map(([key, value]) => {
          if (!skipKeys.includes(key)) {
            res.push({ key, value });
          }
        });
        return res
      })
    );

    this.pageParams$ = this.queryParams$.pipe(
      map(params => {
        const page = params['page'];
        if (page) {
          return [{ key: 'page', value: page }];
        }
        return [];
      })
    );
  }

  getPageNumber(): string {
    return this.router.parseUrl(this.router.url).queryParams['page'];
  }

  getQueryParams() {
    return this.router.parseUrl(this.router.url).queryParams;
  }

  addQueryParams(params: QueryParamType) {
    this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge' });
  }

  clearQueryParams() {
    this.router.navigate([], { queryParams: {} });
  }

}
