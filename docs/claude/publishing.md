# Publicação

Publica pelo GitHub Actions com **trusted publishing (OIDC)**: Actions → _Release_ → _Run
workflow_, escolhendo a dist-tag. Não existe token npm no repositório, nem secret, nem `.npmrc`.

**O OIDC não cobre a primeira publicação de um pacote novo.** O npm exige que o pacote já exista
para aceitar um trusted publisher — não há "pending publisher". Então o bootstrap é manual e
autenticado, uma única vez por pacote:

```sh
npm login                 # ou um token, se o 2FA estiver acessível
npm publish --tag next
npm trust github create-anvil --file release.yml --repo UsgMathe/create-anvil --allow-publish
```

Feito isso, o workflow assume e nenhuma publicação seguinte pede credencial.

O `npm trust` também aceita configuração pela página do pacote em npmjs.com. Os campos são
**case-sensitive e precisam bater exatamente**: usuário `UsgMathe`, repositório `create-anvil`,
workflow `release.yml`.

`npm trust github` responder **409** (`a trusted publisher configuration ... already exists`) não é
erro de permissão: já existe um publisher. Veja qual com `npm trust list create-anvil` e, se estiver
errado, `npm trust revoke create-anvil --id=<id>` antes de recriar. O job do `release.yml` **não
declara `environment`** — um publisher configurado com environment não casa com o token e a
publicação falha.

Três armadilhas que já custaram tempo:

- **Não passe `registry-url` no `actions/setup-node`.** Ele escreve
  `_authToken=${NODE_AUTH_TOKEN}` no `.npmrc`; sem token a variável expande para vazio, o npm cai
  na autenticação clássica e falha com `ENEEDAUTH`. O OIDC dispensa `.npmrc`.
- **`setup-node` precisa ser v6+** (usamos v7). Versões anteriores injetam o token fantasma acima.
- **O npm do runner precisa ser ≥ 11.5.1 e o Node ≥ 22.14**, porque é o próprio npm que faz a
  troca OIDC. O Node 22 ainda vem com npm 10.x, então o workflow roda `npm install -g npm@latest`
  antes de publicar.

Renomear `release.yml` quebra a publicação em silêncio — o npm casa o publisher pelo nome do
arquivo.
