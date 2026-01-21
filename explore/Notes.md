#Why do we need signals?


Angular's Change detection strategy - 

OnPush - it checks change detection of the values only in case of Angular function/events or changing the inputs

Default- in this case, it checks the change detection every time



##how to manudally trigger the change detection if we are suing OnPush

readonly changeDetector = inject(ChangeDetectorRef)

ChangeDetectorRef is a service which gives access to Angular's Change detection

