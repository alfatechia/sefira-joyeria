# SÉFIRA — Guía de Configuración

## 1. GOOGLE SHEETS (Backend de Inventario)

### Paso 1: Crear la hoja de cálculo
1. Ve a https://sheets.google.com con la cuenta **sefira.joyeria@gmail.com**
2. Crea una nueva hoja llamada **"SÉFIRA Inventario"**
3. NO necesitas crear las hojas manualmente — el script lo hace solo

### Paso 2: Crear el Apps Script
1. En la hoja, ve a **Extensiones > Apps Script**
2. Borra todo el código que aparece
3. Copia y pega TODO el contenido del archivo `google-apps-script.js`
4. Guarda (Ctrl+S)
5. Ejecuta la función **`initSheets`** una vez:
   - En el menú del script, selecciona `initSheets` en el dropdown
   - Click en el botón ▶️ (Ejecutar)
   - Acepta los permisos cuando te los pida
   - Esto crea las 3 hojas: Productos, Pedidos, Clientes

### Paso 3: Desplegar como Web App
1. Click en **Implementar > Nueva implementación**
2. En tipo, selecciona **App web**
3. Descripción: "SÉFIRA API"
4. Ejecutar como: **Yo** (tu cuenta)
5. Quién tiene acceso: **Cualquier persona**
6. Click en **Implementar**
7. **COPIA la URL** que aparece (empieza con https://script.google.com/macros/...)

### Paso 4: Conectar con la web
1. Abre `index.html` y busca la línea:
   ```
   const SHEETS_API_URL = '';
   ```
   Pega la URL entre las comillas.

2. Abre `admin.html` y busca la misma línea:
   ```
   const SHEETS_API_URL = '';
   ```
   Pega la misma URL.

### Paso 5: Subir datos iniciales
1. Abre el panel admin (admin.html)
2. Inicia sesión
3. Click en **"Subir a Sheets"** — esto sube todos los productos actuales a Google Sheets
4. Verifica en tu hoja de Google que aparecieron los 19 productos

### Cómo funciona después:
- La **web pública** carga los productos desde Google Sheets (con fallback a datos locales)
- El **admin** sincroniza automáticamente al iniciar sesión
- Cada vez que agregas/editas/eliminas un producto, se actualiza en Sheets
- Puedes editar directamente en Google Sheets y los cambios se reflejan en la web
- Botón "Sync Google Sheets" = descargar datos desde Sheets
- Botón "Subir a Sheets" = subir datos locales a Sheets

---

## 2. N8N + WHATSAPP (Automatización)

### Paso 1: Crear cuenta n8n
1. Ve a https://n8n.io y crea una cuenta (plan gratuito)
2. Selecciona "Start" y crea tu workspace

### Paso 2: Configurar WhatsApp Business API
1. Ve a https://business.facebook.com
2. Inicia sesión con la cuenta de Facebook de SÉFIRA
3. Ve a **Configuración del negocio > WhatsApp > Comenzar**
4. Sigue los pasos para verificar el negocio
5. Ve a https://developers.facebook.com/apps
6. Crea una nueva app tipo **Business**
7. Agrega el producto **WhatsApp**
8. En WhatsApp > Configuración de API:
   - Copia el **Token de acceso permanente**
   - Copia el **Phone Number ID**

### Paso 3: Configurar variables en n8n
1. En n8n, ve a **Settings > Variables**
2. Crea estas variables:
   - `WHATSAPP_PHONE_ID` = (tu Phone Number ID de Meta)
   - `WHATSAPP_TOKEN` = (tu token de acceso)
   - `SHEETS_API_URL` = (tu URL de Google Apps Script del paso anterior)

### Paso 4: Configurar credenciales en n8n
1. Ve a **Credentials > Add Credential**
2. Tipo: **Header Auth**
3. Name: "WhatsApp Token"
4. Header Name: `Authorization`
5. Header Value: `Bearer TU_TOKEN_AQUÍ`

### Paso 5: Importar workflows
1. En n8n, ve a **Workflows > Import from file**
2. Importa los 3 archivos de la carpeta `n8n-workflows/`:
   - `01-bienvenida-whatsapp.json` — Respuesta automática de bienvenida
   - `02-notificacion-pedido.json` — Notificación cuando alguien hace checkout
   - `03-seguimiento-cliente.json` — Mensaje de seguimiento 3 días después de entrega

### Paso 6: Configurar webhooks
1. Abre el workflow **"Bienvenida WhatsApp"**
2. Click en el nodo **"WhatsApp Webhook"**
3. Copia la URL del webhook (la de producción)
4. Ve a Meta Developers > WhatsApp > Configuración
5. En **Webhook**, pega la URL y configura:
   - Verify Token: el que n8n te indica
   - Campos suscritos: `messages`

### Paso 7: Conectar webhook de pedidos
1. Abre el workflow **"Notificación de Pedido"**
2. Copia la URL del webhook de producción
3. En `index.html`, busca:
   ```
   const N8N_PEDIDO_WEBHOOK = '';
   ```
   Pega la URL del webhook entre las comillas.

### Paso 8: Activar workflows
1. En cada workflow, activa el toggle de **Active**
2. Prueba enviando un mensaje al WhatsApp de SÉFIRA

### Los 3 flujos:
- **Bienvenida**: Cuando alguien escribe al WhatsApp → mensaje de bienvenida con menú
- **Pedido**: Cuando alguien hace checkout en la web → mensaje al cliente + notificación a admin
- **Seguimiento**: Cada día a las 10am → revisa pedidos entregados hace 3 días → envía mensaje pidiendo feedback

---

## 3. DOMINIO PROPIO (sefira.co)

### Paso 1: Comprar el dominio
Opciones recomendadas (precios aproximados para .co):
- **Namecheap** (https://namecheap.com): ~$12 USD/año
- **Google Domains** (https://domains.google): ~$30 USD/año
- **GoDaddy** (https://godaddy.com): ~$15 USD/año (primer año)
- **Hostinger** (https://hostinger.co): ~$45.000 COP/año

Busca **sefira.co** y cómpralo.

### Paso 2: Agregar dominio en Netlify
1. Ve a https://app.netlify.com
2. Entra al sitio **sefira-joyeria**
3. Ve a **Domain management > Add custom domain**
4. Escribe: `sefira.co`
5. Click en **Verify** y luego **Add domain**
6. También agrega: `www.sefira.co`

### Paso 3: Configurar DNS
Tienes 2 opciones:

**Opción A — Usar DNS de Netlify (RECOMENDADO):**
1. En Netlify, en Domain management, click en **Set up Netlify DNS**
2. Netlify te da 4 nameservers (tipo dns1.p01.nsone.net)
3. Ve a tu registrador de dominio (donde compraste sefira.co)
4. En la configuración de DNS/Nameservers, cambia los nameservers por los de Netlify
5. Espera 24-48 horas para que propaguen

**Opción B — DNS externo:**
1. En tu registrador, agrega estos registros DNS:
   ```
   Tipo: A
   Nombre: @
   Valor: 75.2.60.5
   
   Tipo: CNAME
   Nombre: www
   Valor: sefira-joyeria.netlify.app
   ```

### Paso 4: SSL automático
- Netlify genera el certificado SSL automáticamente
- En **Domain management > HTTPS**, click en **Verify DNS configuration**
- Una vez verificado, se activa HTTPS gratis con Let's Encrypt

### Paso 5: Actualizar enlaces
Una vez el dominio funcione, actualiza las URLs en:
- Redes sociales (Instagram, TikTok, Facebook)
- WhatsApp Business (URL del catálogo)
- Google My Business (si lo tienes)
- Los workflows de n8n (los mensajes mencionan la URL)

### Resultado final:
- `sefira.co` → tu web principal
- `www.sefira.co` → redirige a sefira.co
- `sefira-joyeria.netlify.app` → redirige a sefira.co (el netlify.toml ya tiene esta redirección)
- HTTPS activado automáticamente

---

## RESUMEN DE URLs A CONFIGURAR

| Archivo | Variable | Qué pegar |
|---------|----------|-----------|
| `index.html` | `SHEETS_API_URL` | URL de Google Apps Script |
| `index.html` | `N8N_PEDIDO_WEBHOOK` | URL webhook de n8n (pedidos) |
| `admin.html` | `SHEETS_API_URL` | URL de Google Apps Script |
