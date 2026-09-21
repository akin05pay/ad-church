# Governança e hierarquia — AD Church 0.6

## Princípio

Nenhuma interface concede autoridade por si só. Toda concessão é validada no banco por papel, ranking de autoridade, organização, unidade, ministério, status da atribuição e permissão explícita.

## Escala de autoridade

| Ranking | Papel |
| ---: | --- |
| 1000 | Proprietário da plataforma |
| 900 | Administrador técnico |
| 800 | Pastor setorial |
| 700 | Secretaria setorial |
| 600 | Pastor local |
| 500 | Secretaria local |
| 400 | Líder de ministério |
| 300 | Operador de culto |
| 100 | Membro |

O papel platform_owner é reservado ao bootstrap institucional e não pode ser concedido pela interface.

## Regras de concessão

1. O ator precisa estar ativo.
2. O ator precisa possuir a permissão apropriada.
3. O ranking do ator deve ser estritamente superior ao ranking do papel solicitado.
4. O escopo concedido deve estar dentro do escopo do ator.
5. Um usuário não pode moderar a própria atribuição.
6. Convites, aprovações, suspensões, reativações e revogações são auditados.

## Fluxo de convite

- Administradores com team.manage podem propor um papel inferior.
- Se também possuem roles.grant, o convite já nasce aprovado.
- Caso contrário, permanece pendente para uma autoridade superior.
- A pessoa cria e confirma a conta com o mesmo e-mail.
- No primeiro login, claim_role_invitations materializa a atribuição.
- Convites expiram após 14 dias e podem ser revogados.

## Proprietário inicial

O primeiro proprietário é definido por claim privado no banco, fora do Git.
A ativação ocorre somente quando o e-mail autorizado cria e confirma a conta.

## Moderação

O painel /admin/equipe permite, conforme a autoridade do usuário:
- criar convites;
- aprovar convites pendentes;
- revogar convites;
- suspender atribuições;
- reativar atribuições;
- revogar atribuições.

A regra de teto é aplicada no banco, não apenas na interface.
