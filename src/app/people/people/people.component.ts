import { Component, OnInit, Renderer2 } from '@angular/core';
import {Store, select} from '@ngrx/store';
import * as PeopleActions from '../store/actions/people.actions';
import * as fromPeople from '../store/reducers/people.reducer';
import { StartLoader } from 'src/app/store/actions/loader.actions';

@Component({
  selector: 'sw-people',
  templateUrl: './people.component.html',
  styleUrls: ['./people.component.scss']
})
export class PeopleComponent implements OnInit {

  constructor(
    private renderer: Renderer2,
    private store: Store<fromPeople.PeopleState>
  ) { }

  ngOnInit() {
    this.renderer.removeClass(document.body, 'intro');
    console.log('**PEOPLE COMPONENT INIT***')
    this.store.dispatch(new StartLoader);
    this.store.dispatch(new PeopleActions.LoadAllPeople({ page: 1 }));
  }

}
