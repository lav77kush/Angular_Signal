import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BehaviorSubject, combineLatest, debounce, debounceTime, interval, map } from 'rxjs';

type Options= Record<string, string>;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.Default
})
export class AppComponent {
  readonly options$= new BehaviorSubject<Options>({'r':"Red", 'g':"Green", 'b':"Blue"});
  readonly selectedKey$= new BehaviorSubject<string>('b');
  readonly counter$ = interval(1000);
  readonly selectedValue$= combineLatest(this.options$, this.selectedKey$).pipe(
    debounceTime(0),
    map(([options,key])=>options[key]),
   
  );

 constructor(){
     // increase the counter after each 3 seconds
     this.selectedValue$.subscribe(console.log)
 }

 switchOptions() {
  this.options$.next({'m': 'Magenta', 'y': "Yellow", 'c': "Cyan"});
  this.selectedKey$.next('c');
 }




}