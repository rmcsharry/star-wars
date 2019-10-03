import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { map, take } from 'rxjs/operators';

import { PageService } from 'src/app/services/page.service';
import * as PeopleActions from '../../people-store/actions/people.actions';
import * as FilterActions from '../../people-store/actions/filter.actions';
import * as fromPeople from '../../people-store/reducers/index';
import { Person } from '../../models/person.model';
import { PeopleState } from '../../people-store/reducers/people.reducer';
import { PeopleFilterState } from '../../people-store/reducers/filter.reducer';

@Component({
  selector: 'sw-people-list',
  templateUrl: './people-list.component.html',
  styleUrls: ['./people-list.component.scss']
})
export class PeopleListComponent implements OnInit {
  @Input() numberOfPages: number = 1;
  people$: Observable<PeopleState>;
  peopleFiltered$: Observable<PeopleState>;
  page: number = 1;
  pageSize = fromPeople.peoplePageSize;
  isAllLoaded: boolean = false;

  constructor(
    private pageService: PageService,
    private store: Store<fromPeople.LazyPeopleState>,
    private router: Router
  ) {}

  ngOnInit() {
    this.pageService.setPageTitle('Character List');
    this.store
      .select(fromPeople.getIsAllLoaded)
      .subscribe((allLoaded: boolean) => {
        if (allLoaded) {
          this.isAllLoaded = true;
          this.getPeople();
        }
      });
    this.handleFiltering();
  }

  private handleFiltering() {
    this.store
      .select(fromPeople.getPeopleFilters)
      .subscribe((state: PeopleFilterState) => {
        console.log('FILTER STATE TRIGGERED');
        if (this.peopleFiltered$) {
          if (state.speciesFilter !== '')
            this.peopleFiltered$ = this.filterPeople(
              'species',
              state.speciesFilter
            );
          else this.peopleFiltered$ = this.people$;
          if (state.moviesFilter !== '')
            this.peopleFiltered$ = this.filterPeople(
              'films',
              state.moviesFilter
            );
          else this.peopleFiltered$ = this.people$;
        }
      });
  }
  private filterPeople(
    property: string,
    filterValue: string
  ): Observable<PeopleState> {
    console.log('FILTERING***', property, filterValue);
    return this.people$.pipe(
      map((state: PeopleState) => {
        console.log(state.results);
        let filtered = state.results.filter((person: Person) => {
          return this.matchElement(person[property], filterValue);
        });
        console.log('RESULT ', filtered);
        return {
          ...state,
          count: filtered.length,
          results: filtered
        };
      })
    );
  }

  private getPeople(): void {
    this.people$ = this.store.select(fromPeople.getPeople).pipe(
      take(1),
      map(state => {
        return state;
      })
    );
    this.peopleFiltered$ = this.people$;
  }

  byPage(people: Person[]): Person[] {
    return people.slice(
      this.page * this.pageSize - this.pageSize,
      this.pageSize * this.page
    );
  }

  onNextPage() {
    ++this.page;
  }

  onPrevPage() {
    --this.page;
  }

  onResetFilters() {
    this.store.dispatch(
      new FilterActions.SetPeopleSpeciesFilter({ filterValue: '' })
    );
    this.store.dispatch(
      new FilterActions.SetPeopleMoviesFilter({ filterValue: '' })
    );
  }

  onSelectPerson(index: number, url: string) {
    this.store.dispatch(
      new PeopleActions.SetCurrentPerson({ swapiId: this.personUrlId(url) })
    );
    this.router.navigate(['characters', this.personNumber(index)], {
      queryParams: { swapiId: this.personUrlId(url) }
    });
  }

  personNumber(index: number): number {
    return (this.page - 1) * this.pageSize + index + 1;
  }

  personUrlId(url: string): string {
    return url.slice(
      url.lastIndexOf('/', url.lastIndexOf('/') - 1) + 1,
      url.length - 1
    );
  }

  matchElement(items: string[], element: string): boolean {
    return items.indexOf(element) ? false : true;
  }

  // reactive onClick handler
  // onClick$ = new Subject<Whatever>();

  // constructor(private _store: Store<AppState>) {
  //   this.onClick$
  //     .withLatestFrom(this._store)
  //     .subscribe(([data, state]) => {
  //       // do whatever you want here
  //     });
  // }
}
