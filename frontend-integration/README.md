# Integração com o frontend

Notas para ligar o React (GitHub Pages) a esta API (Heroku). **Nenhuma alteração
no frontend foi feita** — este documento apenas registra o contrato.

## Contrato

`GET /products` retorna os produtos ativos:

```json
[{ "id": 1, "name": "Choco Clássico", "price": 3.00, "stock": 15, "active": true }]
```

O frontend hoje tem, em `src/data/products.ts`, um tipo mais rico:

```ts
type Product = {
  id: number
  name: string
  description: string   // permanece no frontend
  price: number
  stock: number
  image: string         // permanece no frontend
}
```

`description` e `image` **não vêm da API** — continuam no frontend, como
combinado. O `id` é a chave que une os dois lados.

## Estratégia sugerida

Manter a lista local como fonte de `description`/`image` e usar a API apenas para
os dados que mudam (`price`, `stock`, `active`), casando pelo `id`:

```ts
const API = import.meta.env.VITE_API_URL

type CatalogItem = { id: number; name: string; price: number; stock: number; active: boolean }

export async function loadCatalog(): Promise<Product[]> {
  const response = await fetch(`${API}/products`)
  if (!response.ok) throw new Error(`Falha ao carregar catálogo: ${response.status}`)

  const remote: CatalogItem[] = await response.json()
  const byId = new Map(remote.map((item) => [item.id, item]))

  // A API manda o catálogo ativo; a lista local fornece imagem e descrição.
  return remote
    .map((item) => {
      const local = products.find((p) => p.id === item.id)
      if (!local) return null            // produto novo sem imagem ainda
      return { ...local, name: item.name, price: item.price, stock: item.stock }
    })
    .filter((p): p is Product => p !== null)
}
```

Se a API estiver fora do ar, vale manter a lista local como fallback — o catálogo
continua visível, apenas com estoque possivelmente desatualizado.

## Variável de ambiente no frontend

```env
# .env.development
VITE_API_URL=http://localhost:3000

# .env.production
VITE_API_URL=https://kaka-trufas-api-<sufixo>.herokuapp.com
```

## CORS

O backend só aceita as origens listadas em `CORS_ORIGIN`. Garanta que a origem do
frontend esteja lá:

```bash
# desenvolvimento
CORS_ORIGIN=http://localhost:5173

# produção (várias origens separadas por vírgula)
heroku config:set CORS_ORIGIN=https://juliowk.github.io
```

A origem do GitHub Pages é apenas `https://juliowk.github.io` — sem o caminho do
repositório, porque o navegador envia somente esquema + host + porta no header
`Origin`.

## Imagens

Nada muda: o backend não conhece imagens. O arquivo é resolvido pelo `id`
(`/products/{id}.webp` ou o import local atual). Por isso os `id` de 1 a 10 são
fixos no seed e não devem ser alterados.
