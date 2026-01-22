import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'explore';
  
  // understanding change detection in Angular
 counter = 0;
 readonly changeDetector=inject(ChangeDetectorRef);


// Do nothing function
 doNothing() {}


 constructor(){
     // increase the counter after each 3 seconds
    setInterval(()=> {
      this.counter++;
      this.changeDetector.detectChanges();   
      console.log("Counter",this.counter) ;
        
    },1000);

 
  
 }


}
