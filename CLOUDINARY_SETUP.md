# 📸 CONFIGURAÇÃO DO CLOUDINARY - Upload de Imagens

## ❌ Problema na Railway

A Railway **não tem sistema de arquivos persistente**. Quando o container reinicia, todos os arquivos salvos em `/public/uploads` são **perdidos**.

## ✅ Solução: Cloudinary

**Cloudinary** é um serviço de hospedagem de imagens na nuvem:
- ✅ **100% GRATUITO** (plano free tier)
- ✅ 25 GB de armazenamento
- ✅ 25 GB de transferência/mês
- ✅ Transformações de imagem ilimitadas
- ✅ Imagens persistem mesmo após redeploy

---

## 🚀 PASSO A PASSO (5 minutos)

### 1️⃣ Criar Conta no Cloudinary

1. Acesse: https://cloudinary.com/users/register_free
2. Preencha o formulário:
   - Nome
   - Email
   - Senha
   - Tipo de uso: "Developer" ou "Business"
3. Confirme seu email
4. Faça login

### 2️⃣ Copiar Credenciais

1. Acesse o Dashboard: https://console.cloudinary.com/
2. Na página inicial, você verá um card com:
   ```
   Cloud name: dxxxxxxxxxxxxx
   API Key: 123456789012345
   API Secret: xxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Copie esses 3 valores

### 3️⃣ Configurar Localmente

Edite o arquivo `.env` e substitua:

```env
CLOUDINARY_CLOUD_NAME=seu-cloud-name-aqui
CLOUDINARY_API_KEY=sua-api-key-aqui
CLOUDINARY_API_SECRET=seu-api-secret-aqui
```

### 4️⃣ Configurar na Railway

**Via Dashboard:**
1. Acesse: https://railway.app/dashboard
2. Selecione seu projeto
3. Clique no serviço da aplicação (não o Postgres)
4. Vá em "Variables"
5. Adicione as 3 variáveis:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

**Via CLI:**
```bash
railway variables set CLOUDINARY_CLOUD_NAME=seu-cloud-name
railway variables set CLOUDINARY_API_KEY=sua-api-key
railway variables set CLOUDINARY_API_SECRET=seu-api-secret
```

### 5️⃣ Fazer Deploy

O código já foi atualizado! Basta fazer push:

```bash
git add -A
git commit -m "feat: integrar Cloudinary para upload de imagens persistentes"
git push origin main
```

---

## 🧪 TESTAR

### Localmente:
1. Reinicie o servidor: `npm run dev`
2. Acesse: http://localhost:3000/dashboard/meu-salao
3. Faça upload de uma foto de capa
4. Verifique no Cloudinary Dashboard se apareceu

### Na Railway:
1. Aguarde o deploy (~2 minutos)
2. Acesse: https://seu-app.up.railway.app/dashboard/meu-salao
3. Faça upload de uma foto de capa
4. Recarregue a página - foto deve permanecer!

---

## 📊 O QUE FOI ALTERADO

### Arquivo: `app/api/salon/upload-cover/route.ts`

**ANTES (salvava localmente - ❌ não funciona na Railway):**
```typescript
await writeFile(filePath, buffer);
const coverPhotoUrl = `/uploads/covers/${fileName}`;
```

**DEPOIS (salva no Cloudinary - ✅ persistente):**
```typescript
const uploadResponse = await cloudinary.uploader.upload(dataURI, {
  folder: 'salao/covers',
  public_id: `${salon.id}-${Date.now()}`,
});
const coverPhotoUrl = uploadResponse.secure_url;
```

### Nova Dependência: `cloudinary`
```bash
npm install cloudinary
```

---

## 🎯 VANTAGENS DO CLOUDINARY

1. **Persistência:** Imagens nunca são perdidas
2. **CDN Global:** Carregamento rápido em qualquer lugar do mundo
3. **Transformações:** Redimensionar/otimizar imagens automaticamente
4. **Backup:** Suas imagens ficam seguras na nuvem
5. **Grátis:** 25GB é mais que suficiente para centenas de salões

---

## 🔒 SEGURANÇA

- ✅ API Secret **nunca** é exposta ao cliente
- ✅ Apenas backend pode fazer upload
- ✅ Autenticação obrigatória (NextAuth)
- ✅ Validações de tipo e tamanho de arquivo
- ✅ Limite de 5MB por imagem

---

## 📝 VARIÁVEIS NECESSÁRIAS

### Local (.env):
```env
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret
```

### Railway (Dashboard → Variables):
```
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

---

## ❓ FAQ

**P: Preciso de cartão de crédito?**  
R: Não! O plano gratuito não requer cartão.

**P: 25GB é suficiente?**  
R: Sim! Uma foto de capa tem ~500KB. 25GB = ~50.000 fotos.

**P: E se passar do limite?**  
R: O Cloudinary te avisa antes. Você pode fazer upgrade ou otimizar imagens.

**P: Posso migrar as fotos antigas?**  
R: Sim, mas as locais em `/public/uploads` já foram perdidas na Railway.

**P: Funciona com outras imagens (logo, galeria)?**  
R: Sim! O mesmo sistema pode ser usado para qualquer upload.

---

## 🎉 PRONTO!

Após configurar, suas fotos de capa estarão **seguras e persistentes** na nuvem! 🚀
