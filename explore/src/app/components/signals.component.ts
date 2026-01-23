import { ChangeDetectionStrategy, Component, signal } from "@angular/core";

@Component( {
    'selector' : 'app-signal',
     templateUrl:'./signals.component.html',
     styleUrls:['./signals.component.scss'],
     standalone:true,
     changeDetection: ChangeDetectionStrategy.OnPush
})

export class SignalsComponent {
    

    readonly firstSignal= signal(42);
    readonly secondSignal= signal('Signals');


    constructor(){
        console.log(" The first signal value is : ", this. firstSignal()); 
    }
}