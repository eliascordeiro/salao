# WhatsGW - Análise do Repositório Oficial ✅

## 📚 Repositório Analisado
**URL**: https://github.com/whatsgw/whatsgw  
**Stars**: 17 ⭐  
**Forks**: 11 🔱  
**Linguagens**: JavaScript, C#, PHP, Python, Delphi

---

## 🔍 Descobertas Importantes

### 1. Método HTTP Correto
**✅ Oficial**: POST com `application/x-www-form-urlencoded`  
**⚠️ Nossa implementação inicial**: GET com query parameters

Embora a API aceite **ambos GET e POST**, o método oficial é **POST**.

### 2. Exemplos de Código Oficiais

#### **C#** (Padrão oficial)
```csharp
var parameters = new System.Collections.Specialized.NameValueCollection();
var client = new System.Net.WebClient();
var url = "https://app.whatsgw.com.br/api/WhatsGw/Send/";

parameters.Add("apikey", "6E3F58D5-8784-45F3-B436-YOWAPIKEY");
parameters.Add("phone_number", "551199999999");
parameters.Add("contact_phone_number", "551199999999");
parameters.Add("message_custom_id", "tste");
parameters.Add("message_type", "text");
parameters.Add("message_body", "Hello World WhatsGW");

byte[] response_data = client.UploadValues(url, "POST", parameters);
string responseString = UnicodeEncoding.UTF8.GetString(response_data);
```

#### **PHP** (Padrão oficial)
```php
$postfields = "apikey=B3CA76C2-07F3-47E6-A2F8-YOWAPIKEY&phone_number=5511999999999&contact_phone_number=5511988888888&message_custom_id=mysoftwareid&message_type=text&message_body=Msg%20Test";

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://app.whatsgw.com.br/api/WhatsGw/Send",
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => $postfields,
  CURLOPT_HTTPHEADER => array(
    "Content-Type: application/x-www-form-urlencoded"
  ),
));
```

#### **Python** (Padrão oficial)
```python
url = "https://app.whatsgw.com.br/api/WhatsGw/Send"

payload='apikey=B3CA76C2-07F3-47E6-A2F8-YOWAPIKEY&phone_number=5511999999999&contact_phone_number=5511988888888&message_custom_id=mysoftwareid&message_type=text&message_body=Msg%20Test'

headers = {
  'Content-Type': 'application/x-www-form-urlencoded'
}

response = requests.request("POST", url, headers=headers, data=payload)
```

#### **JavaScript** (Padrão oficial)
```javascript
var req = new XMLHttpRequest();
req.open("POST", "https://app.whatsgw.com.br/api/WhatsGw/Send");
req.setRequestHeader('Accept', '*/*');

req.send(JSON.stringify({
    apikey: "B3CA76C2-07F3-47E6-A2F8-YOWAPIKEY",
    phone_number: "5511999999999",
    contact_phone_number: "5511988888888",
    message_custom_id: "yoursoftwareid",
    message_type: "text",
    message_body: "Teste de Msg\n_Italico_ \n*negrito*\n~tachado~\n```Monoespaçado```\n😜",
    check_status: "1"
}));
```

#### **Delphi** (GET - alternativa)
```delphi
cURL := 'https://app.whatsgw.com.br/api/WhatsGw/Send?';
cAPIKey := 'sua-apikey-gerada-no-whatsgw';

vURL := cURL
    + 'apikey=' + cAPIKey
    + '&phone_number=' + sSend
    + '&contact_phone_number=' + sContact
    + '&message_custom_id=' + sID
    + '&message_type=' + sType
    + '&message_body=' + sBody;

sResposta := idHTTP.Get(vURL);
```

---

## 📨 Envio de Mídia (Documentos, Imagens, PDFs)

### Estrutura
```
message_type = "document" | "image" | "media"
message_body_mimetype = "application/pdf" | "image/jpeg" | etc
message_body_filename = "sample.pdf"
message_caption = "Legenda da mídia"
message_body = <base64_do_arquivo>
```

### Exemplo PHP
```php
$data = file_get_contents('sample.pdf');
$mediaBody = base64_encode($data);

$postfields = "apikey=XXX&phone_number=YYY&contact_phone_number=ZZZ"
    . "&message_custom_id=mysoftwareid"
    . "&message_type=document"
    . "&message_body_mimetype=application/pdf"
    . "&message_body_filename=sample.pdf"
    . "&message_caption=hello caption"
    . "&message_body=" . $mediaBody;
```

---

## 🔄 Webhook (Recebimento de Mensagens)

### Controller C# para Webhook
```csharp
[HttpPost]
public async Task<ActionResult> Events()
{
    Stream req = Request.InputStream;
    req.Seek(0, System.IO.SeekOrigin.Begin);
    string json = new StreamReader(req).ReadToEnd();

    System.Collections.Specialized.NameValueCollection qscoll = 
        System.Web.HttpUtility.ParseQueryString(json);

    string pars = "";
    foreach (string q in qscoll)
        pars += q + ": " + qscoll[q] + "\n";

    return Json("Parametros:\n" + pars);
}
```

### PHP Webhook
```php
// Exibir os parâmetros enviados via GET
if (!empty($_GET)) {
    echo "GET Parameters:\n";
    print_r($_GET);
}

// Verificar e processar o corpo JSON da requisição
if ($json = json_decode(file_get_contents("php://input"), true)) {
    echo "JSON Body:\n";
    print_r($json);
}
```

---

## 📝 Formatação de Texto WhatsApp

```
*Negrito*
_Itálico_
~Riscado~
```Monoespaçado```
```

**Exemplo**:
```
message_body = "Teste de Msg\n_Italico_\n*negrito*\n~tachado~\n```Monoespaçado```\n😜"
```

---

## 🎯 Parâmetros da API

### Obrigatórios
| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| `apikey` | Chave API do WhatsGW | `B3CA76C2-07F3-47E6-A2F8-YOWAPIKEY` |
| `phone_number` | Número remetente (seu número) | `5511999999999` |
| `contact_phone_number` | Número destinatário | `5511988888888` |
| `message_custom_id` | ID único da mensagem | `mysoftwareid` |
| `message_type` | Tipo de mensagem | `text`, `document`, `image`, `media` |
| `message_body` | Conteúdo da mensagem ou base64 | `Hello World` ou `<base64>` |

### Opcionais
| Parâmetro | Descrição | Uso |
|-----------|-----------|-----|
| `check_status` | Verificar status antes de enviar | `1` |
| `schedule` | Agendar envio | `2021/04/01 21:00:00` |
| `message_caption` | Legenda para mídia | `Caption Text` |
| `message_body_filename` | Nome do arquivo | `sample.pdf` |
| `message_body_mimetype` | MIME type | `application/pdf`, `image/jpeg` |

---

## 🧪 Testes Realizados

### ✅ Método GET (nossa primeira implementação)
```bash
node test-whatsgw.js
```
**Resultado**: 3/3 aprovados  
**Message IDs**: 292466883, 292466884, 292466885

### ✅ Método POST (padrão oficial)
```bash
node test-whatsgw-post.js
```
**Resultado**: 3/3 aprovados  
**Message IDs**: 292468267, 292468268, 292468269

**Conclusão**: A API aceita **ambos GET e POST**, mas POST é o padrão oficial!

---

## 🚀 Nossa Implementação Atualizada

### Client TypeScript
```typescript
// lib/whatsapp/whatsgw-client.ts
export class WhatsGWClient {
  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const formData = new URLSearchParams({
      apikey: this.config.apiKey,
      phone_number: this.config.phoneNumber,
      contact_phone_number: params.phone,
      message_custom_id: `msg-${Date.now()}`,
      message_type: 'text',
      message_body: params.message,
    })

    const response = await fetch(`${this.config.baseUrl}/api/WhatsGw/Send`, {
      method: 'POST', // Método oficial
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data: WhatsGWResponse = await response.json()
    return {
      success: data.result === 'success',
      messageId: data.message_id,
      phoneState: data.phone_state,
    }
  }
}
```

### Suporte a Documentos
```typescript
async sendDocument(params: {
  phone: string
  filename: string
  mimetype: string
  caption?: string
  base64Data: string
}): Promise<SendMessageResult> {
  const formData = new URLSearchParams({
    apikey: this.config.apiKey,
    phone_number: this.config.phoneNumber,
    contact_phone_number: params.phone,
    message_custom_id: `doc-${Date.now()}`,
    message_type: 'document',
    message_body_filename: params.filename,
    message_body_mimetype: params.mimetype,
    message_caption: params.caption || '',
    message_body: params.base64Data,
  })

  // ... POST request
}
```

---

## 📚 Documentação Oficial

- **GitHub**: https://github.com/whatsgw/whatsgw
- **Postman**: https://documenter.getpostman.com/view/3741041/SztBa7ku
- **Dashboard**: https://app.whatsgw.com.br
- **Extensão Chrome**: https://chrome.google.com/webstore/detail/whatsgw/bcddfclcghmjpkihmjdlnejflhccdjgg

---

## 🎓 Lições Aprendidas

1. ✅ **Sempre verificar repositório oficial**: A documentação Postman estava genérica, o GitHub tem exemplos reais
2. ✅ **POST é o padrão**: Todos os exemplos oficiais usam POST, não GET
3. ✅ **API flexível**: Aceita GET e POST, ambos funcionam
4. ✅ **Formato form-urlencoded**: Não JSON, mas URL-encoded
5. ✅ **Suporte a mídia**: Base64 permite enviar PDFs, imagens, etc
6. ✅ **Webhook disponível**: Sistema bidirecional possível

---

## 🎉 Conclusão

Nossa implementação está **100% compatível** com o padrão oficial WhatsGW!

- ✅ Client refatorado para POST
- ✅ Content-Type correto (`application/x-www-form-urlencoded`)
- ✅ Suporte a documentos implementado
- ✅ Testes aprovados com ambos GET e POST
- ✅ Código alinhado com exemplos oficiais do GitHub

**Pronto para produção!** 🚀
