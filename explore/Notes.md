
# Angular Signals?

Before we understand Signals, lets understand about Change Detection


## Change Detection - What does it do?

 - Compare the **current**  and  **previous** value of the binding expressions.
 - if **changed**, update at the proper place in the **DOM** 


## Change Detection - When does it happen?
 Depends on the Change Detection strategy-

 - **On Push**
     - Angular input changes
     - Angular events triggered
     - When triggered using **ChangeDetectorRef**
     - A few more selected triggers
  - **Default**
      - seems like all the time
      - But how?

 ## how to manually trigger the change detection if we are using OnPush

`readonly changeDetector = inject(ChangeDetectorRef)`

ChangeDetectorRef is a service which gives access to Angular's Change detection

Why use `readonly`? 

- `readonly` marks a class property as assignable only at declaration or inside the constructor — TypeScript prevents later reassignment at compile time.
- It's primarily a developer-safety and documentation tool (the modifier is erased at runtime).

Quick examples

```ts
// inject pattern (common in standalone components)
readonly changeDetector = inject(ChangeDetectorRef);

// constructor DI shorthand
constructor(private readonly http: HttpClient) {}
```

Notes & gotchas

- `readonly` is shallow: it prevents reassigning the property reference but does not freeze an object's contents (use `Readonly<T>` or `Object.freeze()` for deeper immutability).
- Avoid marking `@Input()` properties `readonly` — Angular assigns inputs at runtime and marking them `readonly` can be confusing for readers (TS prevents reassignment in code but Angular still sets the property at runtime).


## How Async Pipe(Obersvable) work in terms of Change Detection?

- The `AsyncPipe` subscribes to an `Observable`/`Promise`, saves the latest value, marks the view for check when a new value arrives, updates the DOM on the next change-detection run, and unsubscribes automatically on destroy.

How it works (concise)

1. Template evaluation: when the template sees `{{ some$ | async }}` the pipe subscribes to `some$` (or attaches `then` for a Promise).
2. On each emission: the pipe stores the emitted value and requests Angular to check the view (internally it marks the view for check so an OnPush component will be included in the next CD run).
3. Rendering: during the next change-detection run the template reads the pipe's stored value and updates the DOM.
4. Swap/Destroy: if the Observable reference changes the pipe unsubscribes from the old one; it also unsubscribes automatically when the component is destroyed.

OnPush nuance

- Because `AsyncPipe` marks the view for check when a new value arrives, it makes `OnPush` components update without manual `ChangeDetectorRef.detectChanges()` calls. Note: marking for check doesn't force an immediate CD run — if the emission happens entirely outside NgZone and no other trigger runs, the view may still not update until Angular runs CD.

Minimal example

```ts
// component.ts
@Component({
    selector: 'my-comp',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div>Value: {{ data$ | async }}</div>
    `
})
export class MyComp {
    // an Observable that emits strings
    data$ = this.service.getData$();
}
```

Edge cases / gotchas (short)

- Emissions outside NgZone: if the observable emits outside Angular's zone and no other CD trigger occurs, the DOM may not update until CD runs. Fix: run inside NgZone or trigger CD manually.
- Same-value emissions: if the evaluated binding result is strictly equal (===) to the previous value, Angular won't update the DOM even though the pipe marked the view for check.
- Multiple `| async` on the same Observable creates multiple subscriptions. Use shared replay or store the value if you want a single subscription.


## Limitations of Observable-based Change Detection

- What happens today  
    - Angular's change detection walks the component tree and re-evaluates template bindings during a CD cycle. Even with OnPush, the framework still schedules checks and evaluates templates when triggered (the AsyncPipe only marks the view for check).
- The drawback  
    - This can be wasteful: many bindings get re-evaluated even if only one piece of data changed, causing unnecessary CPU work for large trees or complex templates.
- How Signals differ  
    - Signals provide fine-grained reactivity: only computations and DOM parts that depend on a changed signal are updated, avoiding a full component/template traversal.
- Trade-offs / notes  
    - Signals improve update granularity and predictability but require adopting a new model and some migration effort. Observables remain valuable for streams, I/O and event composition; use interop (toSignal, toObservable) to combine both approaches.
- Practical guidance  
    - Prefer signals for local, frequently-updated component state or performance-sensitive UI paths. Keep observables for async data sources and cross-cutting streams.

## Examples: async data source + cross-cutting stream (concise)

1) Cached HTTP (avoid duplicate requests)

```ts
// posts.service.ts
@Injectable({ providedIn: 'root' })
export class PostsService {
    private posts$?: Observable<Post[]>;
    constructor(private http: HttpClient) {}

    getPostsCached(): Observable<Post[]> {
        if (!this.posts$) {
            this.posts$ = this.http.get<Post[]>('/api/posts').pipe(
                shareReplay({ bufferSize: 1, refCount: true })
            );
        }
        return this.posts$;
    }

    refresh() { this.posts$ = undefined; }
}

// component.ts (OnPush)
posts$ = this.postsService.getPostsCached();
// template: <li *ngFor="let p of posts$ | async">{{ p.title }}</li>
```

2) App-level state (BehaviorSubject) — cross-cutting

```ts
// auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();

    setUser(user: User | null) { this.currentUserSubject.next(user); }
    get snapshot() { return this.currentUserSubject.value; }
}

// usage in template: <span *ngIf="auth.currentUser$ | async as user">Hi {{ user.name }}</span>
```

Short notes: use `shareReplay` to cache HTTP responses and avoid duplicate executions. Use `BehaviorSubject` when you need the latest value immediately for late subscribers.


