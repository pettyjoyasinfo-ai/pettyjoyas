<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AiLessonController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DiscountController;
use App\Http\Controllers\Api\EmailFlowController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\LabelSettingController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\CashRegisterController;
use App\Http\Controllers\Api\PosController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SyncController;
use App\Http\Controllers\Api\NewsletterController;
use App\Http\Controllers\Api\WhatsAppAutomationController;
use App\Http\Controllers\Api\WhatsAppController;
use App\Http\Controllers\Api\WhatsAppInboxController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API — Petty Joyas
| Fase 1: Auth, Catálogo, Inventario · Fase 2: Pedidos/POS/Pagos
| Fase 3: CRM/Marketing · Fase 4: Sync offline · Fase 5: Reportes
| Fase 6: WhatsApp / Meta
|--------------------------------------------------------------------------
*/

// ───────── Público ─────────
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/google', [AuthController::class, 'google']);
Route::post('/auth/accept-invitation', [AuthController::class, 'acceptInvitation']);
Route::post('/auth/resend-invitation', [AuthController::class, 'resendInvitation']);

Route::get('/settings', [SettingController::class, 'index']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/lookup', [ProductController::class, 'lookup']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::get('/inventory/stock', [InventoryController::class, 'stock']);

// Reseñas — GET público, can-review opcional auth, POST requiere auth (see below)
Route::get('/products/{productId}/reviews', [ReviewController::class, 'index'])->where('productId', '[0-9]+');
Route::get('/products/{productId}/can-review', [ReviewController::class, 'canReview'])->where('productId', '[0-9]+');

Route::post('/coupons/validate', [CouponController::class, 'validateCode']);
Route::get('/coupons/active', [CouponController::class, 'active']);

// Landing de descuento por link único
Route::get('/promo/{token}', [DiscountController::class, 'showByToken']);

// Newsletter — suscripción pública
Route::post('/newsletter', [NewsletterController::class, 'subscribe']);

// Carrito — funciona logueado o como invitado (token de carrito vía header
// `X-Guest-Cart-Token`). CartService::resolve() decide a quién pertenece.
Route::get('/cart', [CartController::class, 'index']);
Route::post('/cart/items', [CartController::class, 'store']);
Route::patch('/cart/items/{item}', [CartController::class, 'update'])->where('item', '[0-9]+');
Route::delete('/cart/items/{item}', [CartController::class, 'destroy'])->where('item', '[0-9]+');
Route::delete('/cart', [CartController::class, 'clear']);

// Validación de carrito sin persistir — sin uso del frontend, se mantiene por compatibilidad
Route::post('/cart/validate', [CartController::class, 'validateItems']);

// Checkout online (público, invitado o logueado: pide email del comprador)
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/lookup', [OrderController::class, 'lookup']);

// Pagos — público
Route::post('/payments/mercadopago/webhook', [PaymentController::class, 'webhook']);
Route::get('/payments/mercadopago/simulate/{number}', [PaymentController::class, 'simulate']);
Route::get('/payments/transfer-info', [PaymentController::class, 'transferInfo']);

// WhatsApp Cloud API webhook — reactivado: WhatsAppBotService reusa el mismo
// ChatbotService (IA con tool-calling) que el chat del sitio.
Route::get('/whatsapp/webhook', [WhatsAppController::class, 'verify']);
Route::post('/whatsapp/webhook', [WhatsAppController::class, 'receive']);

// Chatbot con IA (Grok) — responde con datos reales del catálogo/pedidos.
// Público; si viene un token de cliente, la IA puede consultar SUS pedidos.
Route::post('/chat', [ChatController::class, 'send']);

// ───────── Autenticado (staff) ─────────
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Reseñas de productos
    Route::post('/products/{productId}/reviews', [ReviewController::class, 'store'])->where('productId', '[0-9]+');

    // Fusiona el carrito de invitado al loguearse.
    Route::post('/cart/merge', [CartController::class, 'merge']);

    // Cuenta del cliente (mi-cuenta)
    Route::get('/account/orders', [AccountController::class, 'orders']);
    Route::get('/account/orders/{order}', [AccountController::class, 'order']);
    Route::put('/account/profile', [AccountController::class, 'updateProfile']);
    Route::get('/account/addresses', [AccountController::class, 'addresses']);
    Route::post('/account/addresses', [AccountController::class, 'storeAddress']);
    Route::put('/account/addresses/{address}', [AccountController::class, 'updateAddress']);
    Route::delete('/account/addresses/{address}', [AccountController::class, 'destroyAddress']);
    Route::get('/account/favorites', [AccountController::class, 'favorites']);
    Route::get('/account/favorites/ids', [AccountController::class, 'favoriteIds']);
    Route::post('/account/favorites/toggle', [AccountController::class, 'toggleFavorite']);

    // Catálogo
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{category}', [CategoryController::class, 'update']);
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
    Route::get('/variant-suggestions', [ProductController::class, 'variantSuggestions']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{product}', [ProductController::class, 'update']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    Route::patch('/products/{product}/label-info', [ProductController::class, 'updateLabelInfo']);

    // Pedidos + POS
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/export', [OrderController::class, 'export']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::patch('/orders/{order}/notes', [OrderController::class, 'updateNotes']);
    Route::post('/orders/{order}/notify', [OrderController::class, 'notify']);
    Route::patch('/orders/{order}/confirm-payment', [PaymentController::class, 'confirmPayment']);
    Route::post('/pos/sales', [PosController::class, 'store']);
    Route::patch('/pos/sales/{order}/confirm-transfer', [PosController::class, 'confirmTransfer']);
    Route::patch('/pos/sales/{order}/edit', [PosController::class, 'editSale']);
    Route::get('/pos/daily-summary', [PosController::class, 'dailySummary']);
    Route::get('/pos/cash-register/current', [CashRegisterController::class, 'current']);
    Route::post('/pos/cash-register/open', [CashRegisterController::class, 'open']);
    Route::post('/pos/cash-register/close', [CashRegisterController::class, 'close']);
    Route::get('/pos/cash-register/history', [CashRegisterController::class, 'history']);
    Route::get('/pos/credit-notes', [CashRegisterController::class, 'indexCreditNotes']);
    Route::post('/pos/credit-notes', [CashRegisterController::class, 'storeCreditNote']);

    // Calibración de etiquetas de joyería (persiste para siempre)
    Route::get('/admin/label-settings', [LabelSettingController::class, 'show']);
    Route::put('/admin/label-settings', [LabelSettingController::class, 'update']);
    Route::delete('/admin/label-settings', [LabelSettingController::class, 'destroy']);

    // Bloques conversacionales de WhatsApp (bienvenida, ice breakers, comandos).
    // Solo configura la UI que Meta muestra en el chat; se mantiene por si se usa.
    Route::get('/admin/whatsapp-automation', [WhatsAppAutomationController::class, 'show']);
    Route::put('/admin/whatsapp-automation', [WhatsAppAutomationController::class, 'update']);
    Route::get('/admin/whatsapp-automation/live', [WhatsAppAutomationController::class, 'live']);

    // Bandeja de entrada de WhatsApp (chats estilo WhatsApp Desktop).
    Route::get('/admin/whatsapp/ai-status', [WhatsAppInboxController::class, 'aiStatus']);
    Route::post('/admin/whatsapp/ai-status/toggle', [WhatsAppInboxController::class, 'toggleGlobalAi']);

    // Aprendizajes de la IA (compartidos por el chatbot de WhatsApp y el de la tienda).
    Route::get('/admin/ai-lessons', [AiLessonController::class, 'index']);
    Route::post('/admin/ai-lessons', [AiLessonController::class, 'store']);
    Route::put('/admin/ai-lessons/{lesson}', [AiLessonController::class, 'update']);
    Route::delete('/admin/ai-lessons/{lesson}', [AiLessonController::class, 'destroy']);

    Route::get('/admin/whatsapp/conversations', [WhatsAppInboxController::class, 'index']);
    Route::get('/admin/whatsapp/conversations/{waId}/messages', [WhatsAppInboxController::class, 'messages'])->where('waId', '[0-9]+');
    Route::post('/admin/whatsapp/conversations/{waId}/messages', [WhatsAppInboxController::class, 'send'])->where('waId', '[0-9]+');
    Route::post('/admin/whatsapp/conversations/{waId}/read', [WhatsAppInboxController::class, 'markRead'])->where('waId', '[0-9]+');
    Route::post('/admin/whatsapp/conversations/{waId}/toggle-ai', [WhatsAppInboxController::class, 'toggleAi'])->where('waId', '[0-9]+');
    Route::post('/admin/whatsapp/conversations/{waId}/toggle-archive', [WhatsAppInboxController::class, 'toggleArchive'])->where('waId', '[0-9]+');
    Route::delete('/admin/whatsapp/conversations/{waId}', [WhatsAppInboxController::class, 'destroy'])->where('waId', '[0-9]+');

    // Marketing
    Route::get('/coupons', [CouponController::class, 'index']);
    Route::post('/coupons', [CouponController::class, 'store']);
    Route::put('/coupons/{coupon}', [CouponController::class, 'update']);
    Route::delete('/coupons/{coupon}', [CouponController::class, 'destroy']);
    Route::post('/coupons/{coupon}/send', [CouponController::class, 'send']);
    Route::get('/emails', [EmailFlowController::class, 'index']);
    Route::post('/emails', [EmailFlowController::class, 'store']);
    Route::post('/emails/{flow}/toggle', [EmailFlowController::class, 'toggle']);
    Route::put('/emails/{flow}', [EmailFlowController::class, 'update']);
    Route::delete('/emails/{flow}', [EmailFlowController::class, 'destroy']);

    Route::get('/discounts', [DiscountController::class, 'index']);
    Route::post('/discounts', [DiscountController::class, 'store']);
    Route::put('/discounts/{discount}', [DiscountController::class, 'update']);
    Route::delete('/discounts/{discount}', [DiscountController::class, 'destroy']);

    // Apariencia / configuración del sitio
    Route::put('/settings', [SettingController::class, 'update']);
    Route::post('/media/upload', [MediaController::class, 'upload']);

    // CRM
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/export', [CustomerController::class, 'export']);
    Route::get('/customers/birthdays', [CustomerController::class, 'birthdays']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::put('/customers/{customer}', [CustomerController::class, 'update']);
    Route::post('/customers/{customer}/email', [CustomerController::class, 'email']);

    // Reportes
    Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
    Route::get('/reports/comparison', [ReportController::class, 'comparison']);
    Route::get('/reports/top-products', [ReportController::class, 'topProducts']);
    Route::get('/reports/top-customers', [ReportController::class, 'topCustomers']);
    Route::get('/reports/coupons', [ReportController::class, 'coupons']);
    Route::get('/reports/payment-breakdown', [ReportController::class, 'paymentBreakdown']);

    // Sincronización offline (POS/PWA)
    Route::post('/sync/events', [SyncController::class, 'events']);

    // Admin — panel de notificaciones, búsqueda y perfil propio
    Route::get('/admin/notifications', [NotificationController::class, 'index']);
    Route::get('/admin/search', [SearchController::class, 'index']);
    Route::put('/admin/profile', [ProfileController::class, 'update']);

    // Admin — gestión de usuarios staff (solo admin)
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::post('/admin/users', [AdminUserController::class, 'store']);
    Route::put('/admin/users/{user}', [AdminUserController::class, 'update']);

    // Newsletter — admin
    Route::get('/admin/newsletter', [NewsletterController::class, 'index']);
    Route::delete('/admin/newsletter/{subscriber}', [NewsletterController::class, 'destroy']);
});
