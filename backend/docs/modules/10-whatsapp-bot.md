# Módulo 10 — WhatsApp Bot (IA sobre la BD)

## Objetivo
Atención automática por **WhatsApp con número empresarial** (no un chat de página). El bot
entiende el catálogo, el stock y los pedidos reales para responder bien, y captura leads.

## ¿Qué tecnología usar? (recomendación)

### Conexión a WhatsApp → **WhatsApp Cloud API** (de Meta)
Es la vía oficial y gratuita (dentro de límites). Da un número empresarial verificado en
Meta Business. **Evitar** librerías no oficiales (ej. baileys/venom): violan los términos y
pueden banear el número.

Pasos de alta (una vez):
1. Crear app en **Meta for Developers** → producto *WhatsApp*.
2. Verificar el número empresarial y el negocio en **Meta Business Manager**.
3. Obtener `Phone Number ID`, `WhatsApp Business Account ID` y un `Access Token` permanente.
4. Configurar el **webhook** apuntando a `https://api.pettyjoyas.com/api/whatsapp/webhook`.

### Orquestación → **Laravel (recomendado)** vs n8n
| | Laravel (recomendado) | n8n |
|---|---|---|
| Infra | Ya está, sin servidor extra | Hay que hostear n8n |
| Acceso a la BD | Directo (Eloquent) | Vía API |
| Lógica compleja / IA | Total control | Por nodos (visual) |
| Edición no-dev | No | Sí (flujos visuales) |

**Para una joyería: hacerlo en Laravel.** Es más simple, más barato y el bot accede a la BD
sin saltos. *n8n conviene si más adelante el cliente quiere armar/editar flujos sin
programar* — en ese caso n8n recibe el webhook, llama a la API de Laravel para los datos y a
un nodo de IA, y responde. La arquitectura de abajo soporta ambas (la lógica vive en
Services reutilizables).

### Inteligencia → **Claude API con tool-use** (RAG sobre la BD)
No le "cargamos toda la BD" al modelo. En su lugar le damos **herramientas** que consultan la
BD en el momento (patrón tool-use / function-calling). El modelo decide qué herramienta usar:

- `buscar_producto(texto)` → nombre, precio, materiales, link.
- `ver_stock(producto, variante)` → disponibilidad real (derivada de `stock_movements`).
- `estado_pedido(numero, email)` → estado + seguimiento.
- `recomendar(categoria | ocasion)` → top productos.
- `responder_faq(tema)` → base de conocimiento (envíos, talles, pagos, cuidados).
- `derivar_a_humano(motivo)` → notifica al equipo y marca la conversación.

Así las respuestas son precisas (datos reales) y no alucina precios/stock.

## Flujo
```
Cliente (WhatsApp)
  → Meta Cloud API
    → POST /api/whatsapp/webhook (Laravel)
      → WhatsAppBotService:
          1. guarda el mensaje (conversations/messages)
          2. llama a Claude con las TOOLS disponibles
          3. Claude pide tool(s) → Service ejecuta queries Eloquent → devuelve datos
          4. Claude redacta la respuesta final
      → envía la respuesta vía Cloud API (POST graph.facebook.com/.../messages)
```

## Tablas
- `wa_conversations` (phone, customer_id?, status [bot|humano|resuelto], last_message_at).
- `wa_messages` (conversation_id, direction [in|out], body, payload JSON, created_at).
- `faqs` (topic, question, answer, enabled).

## Endpoints
```
GET  /api/whatsapp/webhook     # verificación (hub.challenge de Meta)
POST /api/whatsapp/webhook     # recepción de mensajes entrantes
POST /api/whatsapp/send        # envío manual desde el panel (derivación a humano)
```

## Variables de entorno
```
WHATSAPP_TOKEN=            # Access Token permanente (Meta)
WHATSAPP_PHONE_ID=         # Phone Number ID
WHATSAPP_VERIFY_TOKEN=     # token propio para verificar el webhook
ANTHROPIC_API_KEY=         # Claude (motor del bot)
```

## Seguridad
- Validar la firma del webhook (`X-Hub-Signature-256`).
- Rate-limit por número. Horario de atención configurable (fuera de horario: mensaje fijo).
- El bot **nunca** ejecuta acciones que muevan dinero/stock por sí solo: solo informa y
  deriva. Crear ventas/pedidos requiere confirmación humana o el flujo normal de checkout.

## Estado
Pendiente (Fase 6). El panel `/admin/chatbot` ya tiene la UI de configuración (conexión,
FAQ, IA, horario y conversaciones).
