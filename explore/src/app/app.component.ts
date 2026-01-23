import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BehaviorSubject, combineLatest, debounce, debounceTime, firstValueFrom, interval, map } from 'rxjs';
import { SignalsComponent } from './components/signals.component';
type Options= Record<string, string>;
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SignalsComponent],
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
     this.selectedValue$.subscribe(console.log);
     this.sum$.subscribe(console.log);
 }
 switchOptions() {
  this.options$.next({'m': 'Magenta', 'y': "Yellow", 'c': "Cyan"});
  this.selectedKey$.next('c');
 }
 // RxJS State Management Challenges 2
readonly a$= new BehaviorSubject<number>(1);
readonly b$= new BehaviorSubject<number>(2);
readonly sum$= combineLatest(this.a$, this.b$).pipe(map(([a,b])=> a+b));
//  constraint : - we can not increment a or b if there sum is 10
async incA() {
   // only increment  if a+b < 10
   const currentSum=  await firstValueFrom(this.sum$);

   if(currentSum < 10) {
    this.a$.next(this.a$.value+1);
   }
}
}