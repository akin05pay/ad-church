# Pessoas e vínculos — AD Church 0.7

## Separação de conceitos

O AD Church trata três coisas como entidades diferentes:

1. **Pessoa** — o registro humano da igreja. Pode existir sem conta digital.
2. **Vínculo congregacional** — relação da pessoa com uma congregação.
3. **Conta / função** — login e permissões administrativas, tratados separadamente por profiles e role_assignments.

Isso permite cadastrar crianças, idosos, visitantes, novos convertidos e membros sem obrigar todos a possuírem login.

## Tipos de vínculo atuais

O schema existente já admite:
- visitor — Visitante
- attendee — Frequentador
- convert — Novo convertido
- member — Membro
- worker — Obreiro
- leader — Líder

A função administrativa continua separada. Um vínculo do tipo leader, por exemplo, não concede automaticamente nenhuma permissão no sistema.

## Ações do painel /admin/pessoas

Conforme people.read / people.manage e o escopo do usuário:
- pesquisar por nome, e-mail ou telefone;
- filtrar por congregação;
- cadastrar uma pessoa;
- alterar nome, contato e data de nascimento;
- alterar tipo e status do vínculo;
- ativar/inativar vínculos;
- transferir para outra congregação.

## Transferência

Uma transferência direta somente é permitida quando o usuário possui people.manage tanto sobre a congregação de origem quanto sobre a de destino.

Exemplo:
- pastor local da Congregação A não transfere diretamente para Congregação B se B estiver fora do seu escopo;
- pastor setorial ou administrador com escopo sobre ambas pode concluir a transferência.

Futuramente, transferências entre escopos distintos podem ganhar um fluxo de solicitação/aprovação.

## Segurança

As mutações não são feitas com INSERT/UPDATE direto do browser. A UI chama RPCs públicos que delegam para funções no schema private.

As funções privadas:
- verificam auth.uid();
- verificam people.manage no escopo;
- validam organização e congregação;
- registram auditoria;
- não são expostas pelo Data API como tabelas públicas.

O cadastro de uma pessoa não cria automaticamente uma conta de autenticação.
