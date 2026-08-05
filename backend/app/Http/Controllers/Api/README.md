# app/Http/Controllers/Api

Controladores REST, **delgados**, uno por módulo. Patrón:

```php
public function store(StoreSaleRequest $request, CreateSaleAction $action)
{
    $sale = $action->execute($request->validated());
    return new SaleResource($sale);
}
```

No contienen lógica de negocio: validan (Form Request), invocan una Action y devuelven un
Resource. Rutas declaradas en `routes/api.php`.

Controllers previstos: `AuthController`, `ProductController`, `CategoryController`,
`InventoryController`, `SaleController`, `CustomerController`, `ReportController`,
`SyncController`.
