
# Angular Signals

Before we understand Signals, lets understand about Change Detection

# Angular Signals & Change Detection

This note briefly explains Angular change detection, how the `AsyncPipe` interacts with it, when to use `readonly` in TypeScript, and practical examples for observables (async data sources and cross-cutting streams).

## Change Detection — what and when

What it does
- Compares the current and previous value of template binding expressions.
- If a value changed, Angular updates the DOM at the right place.

When it runs
- Depends on the change detection strategy.

Default
- Runs frequently (on many framework events) — templates are re-evaluated during each CD cycle.

OnPush
- A component with `ChangeDetectionStrategy.OnPush` is checked only on specific triggers:
    - Input reference changes
    - Template/event handlers (user events)
    - When calling `ChangeDetectorRef` methods
    - When marked for check by a helper like the `AsyncPipe`

### Manually triggering CD (OnPush)

You can inject `ChangeDetectorRef` to trigger checks manually in rare cases:

```ts
readonly changeDetector = inject(ChangeDetectorRef);
```

`ChangeDetectorRef` provides methods such as `markForCheck()` and `detectChanges()`.

---

## Why use `readonly` (TypeScript)

- `readonly` marks a class property as assignable only at declaration or inside the constructor. It prevents reassignment at compile time and documents intent.
- It's a compile-time safety and does not exist at runtime (erased by TypeScript).

Quick examples

```ts
// inject pattern (standalone components)
readonly changeDetector = inject(ChangeDetectorRef);

// constructor DI shorthand
constructor(private readonly http: HttpClient) {}
```

Notes & caveats
- `readonly` is shallow: it prevents reassigning the property reference but does not freeze the object's contents. Use `Readonly<T>` or `Object.freeze()` for deeper immutability.
- Avoid marking `@Input()` properties `readonly` — Angular assigns inputs at runtime and marking them `readonly` can be confusing for readers.

---

## AsyncPipe (Observable / Promise) and change detection

One-liner
- The `AsyncPipe` subscribes to an `Observable`/`Promise`, stores the latest value, marks the view for check when a new value arrives, updates the DOM on the next change-detection run, and unsubscribes automatically when the view is destroyed.

How it works (concise)
1. Template evaluation: `{{ some$ | async }}` — the pipe subscribes to `some$` (or attaches `then` for Promises).
2. On emission: the pipe stores the value and requests Angular to include the component in the next CD run (mark for check).
3. Rendering: during the next CD cycle the template reads the pipe's stored value and updates the DOM.
4. Swap / Destroy: if the Observable reference changes the pipe unsubscribes from the old one; it also unsubscribes automatically when destroyed.

OnPush nuance
- Because `AsyncPipe` marks the view for check, it makes `OnPush` components update without manual `detectChanges()` calls.
- Marking for check does not force an immediate CD run; if the emission happens entirely outside `NgZone` and no other CD-triggering event runs, the view may still not update until Angular runs CD.

Edge cases / gotchas
- Emissions outside `NgZone`: ensure Observables run inside the zone or trigger CD manually.
- Same-value emissions: if the evaluated binding equals the previous value (`===`), Angular won't update the DOM.
- Multiple `| async` bindings to the same cold Observable create multiple subscriptions (use `shareReplay` or cache the Observable).

Minimal example

```ts
@Component({
    selector: 'my-comp',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<div>Value: {{ data$ | async }}</div>`
})
export class MyComp {
    data$ = this.service.getData$(); // Observable<string>
}
```

---

## Limitations of Observable-based change detection

- Angular still walks the component tree and re-evaluates templates during a CD cycle. Even with OnPush, many bindings can be re-evaluated when a single value changes.
- This can be wasteful for large trees or expensive computations.

How Signals differ (short)
- Signals provide fine-grained reactivity: only computations and DOM parts that depend on a changed signal update — avoiding full component/template traversal.
- Trade-offs: Signals improve granularity and predictability but require adopting a new model. Observables remain valuable for async I/O and stream composition. Use interop (`toSignal`, `toObservable`) to combine approaches.

Practical guidance
- Prefer signals for local, frequently-updated component state or performance-sensitive UI paths.
- Keep Observables for async data sources and cross-cutting streams.

---

## Examples: concise, copy-pasteable

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

// component (OnPush)
posts$ = this.postsService.getPostsCached();
// template: <li *ngFor="let p of posts$ | async">{{ p.title }}</li>
```

2) App-level state (BehaviorSubject) — cross-cutting stream

```ts
// auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();

    setUser(user: User | null) { this.currentUserSubject.next(user); }
    get snapshot() { return this.currentUserSubject.value; }
}

// usage in template:
// <span *ngIf="auth.currentUser$ | async as user">Hi {{ user.name }}</span>
```



