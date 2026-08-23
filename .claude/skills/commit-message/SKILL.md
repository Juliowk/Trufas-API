---
name: commit-message
description: Redige a mensagem de commit padronizada deste repositorio a partir das mudancas pendentes (ou de um alvo indicado). Use quando o usuario pedir uma mensagem de commit, quiser padronizar/revisar um texto de commit, ou perguntar como descrever as alteracoes. NAO executa o commit.
---

# Mensagem de commit

Produz a mensagem pronta para colar. **Nunca executa `git commit`** — nem
quando a mensagem sair perfeita, nem quando o usuario disser "pode
commitar" durante a skill. Nesse caso, entregue a mensagem e diga que
basta ele pedir o commit em uma mensagem propria.

## 1. Leia o que mudou

```bash
git status --short
git diff --stat HEAD
git diff HEAD          # ou --cached se so o stage interessa
```

Nada pendente? Diga isso e pare — nao invente uma mensagem.

Se houver muita coisa staged e unstaged misturada, pergunte qual
conjunto descrever antes de escrever.

## 2. Escolha o tipo

Conventional Commits, minusculo, seguido de `: `:

| Tipo | Quando |
|---|---|
| `feat` | endpoint, regra ou capacidade nova da API |
| `fix` | correcao de comportamento errado |
| `refactor` | reorganiza codigo sem mudar comportamento |
| `perf` | melhora desempenho sem mudar o contrato |
| `docs` | README, comentarios, documentacao |
| `test` | testes ou scripts de validacao |
| `chore` | build, dependencias, config, CI, deploy |
| `revert` | desfaz um commit anterior |

Na duvida entre dois, pergunte-se o que o leitor do historico procura:
um endpoint quebrado procura `fix`, um endpoint novo procura `feat`.

Escopo (`feat(products):`) so quando o repositorio ja tiver areas
nomeadas e estaveis. Neste projeto, hoje, **nao use escopo** — os
modulos `auth`, `products` e `health` sao poucos e o assunto ja aparece
no proprio texto.

## 3. Assunto

- portugues, minusculo depois do `: `, sem ponto final
- ate ~72 caracteres
- imperativo: "adiciona", "corrige", "remove" — nunca "adicionado",
  "adicionando", "adiciona-se"
- descreve o efeito, nao o arquivo mexido

```
feat: api de catalogo com estoque protegido por JWT       # bom
fix: rejeita estoque negativo no patch de produto          # bom

fix: altera products.service.ts                            # ruim: cita o arquivo
feat: varias melhorias                                     # ruim: nao diz nada
Feat: Adiciona Endpoint.                                   # ruim: caixa e ponto
```

## 4. Corpo

Opcional para mudancas de uma linha; obrigatorio quando alguem poderia
perguntar "por que?".

Regras de escrita:

- **portugues sem acentos no corpo** (o assunto tambem) — e o padrao
  deste repositorio, para evitar problemas de encoding entre terminais
- linha em branco depois do assunto
- quebre em ~72 colunas
- bullets com `-` para listar mudancas independentes
- explique o **porque**, nao o passo a passo do diff — o diff ja mostra o
  que mudou
- registre limitacoes conhecidas e decisoes que o codigo nao revela
  (ex.: "sem migrations; schema criado pelo synchronize do TypeORM")
- nao mencione a skill, o processo, nem ferramentas usadas para chegar la

Rodape, quando aplicavel:

```
Refs: #12
BREAKING CHANGE: <o que quebrou e como migrar>
```

`BREAKING CHANGE` vale tambem para mudanca de contrato da API — rota
renomeada, campo removido da resposta, novo campo obrigatorio no corpo:
quem quebra e o frontend, e o historico precisa dizer isso.

Termine com a linha de co-autoria exigida neste ambiente:

```
Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
```

## 5. Entregue

Mostre a mensagem em bloco de codigo, pronta para copiar. Se ela tiver
corpo, entregue tambem o comando com heredoc — o usuario decide se e
quando roda:

````
```bash
git commit -F- <<'EOF'
<mensagem completa>
EOF
```
````

Heredoc em vez de `-m` porque aspas e `$` na mensagem quebram o parsing
do shell; `git commit -m @'...'@` ja falhou neste projeto.

**Heredoc e sintaxe de Bash — nao roda no PowerShell**, que responde
"Operador '<' reservado para uso futuro". Rode o comando acima pela
ferramenta Bash. Se o shell disponivel for o PowerShell, escreva a
mensagem em um arquivo e use `git commit -F <arquivo>`.

## Um commit por ideia

Se o diff misturar assuntos independentes (uma correcao + uma feature
nova), diga isso e proponha a divisao, com uma mensagem para cada parte e
os `git add` correspondentes. Nao force tudo em um assunto vago so para
caber em uma linha.

Neste repositorio, cuidado especial com dois pares que costumam vir
juntos e merecem commits separados: mudanca de codigo + atualizacao do
README, e mudanca de comportamento + o teste que a cobre. Se o README so
documenta o que o mesmo diff acabou de criar, pode ir junto.
