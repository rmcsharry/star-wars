import { Component, OnInit } from '@angular/core';
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
import { FilterType } from '../../people-store/reducers/filter.reducer';

@Component({
  selector: 'sw-people-list',
  templateUrl: './people-list.component.html',
  styleUrls: ['./people-list.component.scss']
})
export class PeopleListComponent implements OnInit {
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
      .subscribe((filters) => {
        if (this.peopleFiltered$) {
          this.peopleFiltered$ = this.people$; // always start wtih full set, then filter
          filters.forEach(filter => {
            if (filter.value !== null) this.peopleFiltered$ = this.filterPeople(this.peopleFiltered$, filter);
          });
        }
      });
  }

  private filterPeople(peopleToFilter$: Observable<PeopleState>, filter: FilterType): Observable<PeopleState> {
    return peopleToFilter$.pipe(
      map((state: PeopleState) => {
        let filtered = this.processFilter(state.results, filter);
        this.page = 1;
        return {
          ...state,
          count: filtered.length,
          results: filtered,
          totalPages: Math.ceil(filtered.length / this.pageSize)
        };
      })
    );
  }

  processFilter(people: Person[], filter: FilterType): Person[] {
    if (!filter.value) return people;
    switch (filter.name) {
      case 'bornFrom':
        return people.filter((person: Person) => this.convertSWYear(person.birth_year) >= filter.value);
      case 'bornTo':
        return people.filter((person: Person) => this.convertSWYear(person.birth_year) <= filter.value);
      default:
        return people.filter((person: Person) => this.matchElement(person[filter.name], filter.value as string));
    };
  }

  convertSWYear(birth_year: string): number {
    let year = birth_year.length - 3;
    let factor = 1;
    if (birth_year.substr(year, 3) === 'BBY') factor = - 1;
    return parseInt(birth_year.substring(0, year)) * factor;
  }

  matchElement(items: string[], element: string): boolean {
    return items.indexOf(element) > -1 ? true : false;
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
      new FilterActions.SetPeopleSpeciesFilter({ filterValue: null })
    );
    this.store.dispatch(
      new FilterActions.SetPeopleMoviesFilter({ filterValue: null })
    );
    this.store.dispatch(
      new FilterActions.SetPeopleBornFromFilter({ filterValue: null })
    );
    this.store.dispatch(
      new FilterActions.SetPeopleBornToFilter({ filterValue: null })
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
