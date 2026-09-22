# AD Church — Roadmap oficial

Atualizado em 2026-09-21.

## Princípio do produto

AD Church é o braço de vida congregacional do ecossistema digital ligado à Assembleia de Deus Online e, no piloto, ao Setor 04 Santana.

A separação de responsabilidades é intencional:

- **assembleia.online**: alcance digital, transmissão, sermões, Membro Online, Telepaz e portas de entrada.
- **AD Church**: culto acompanhado, Bíblia, Harpa, identidade congregacional, vínculos, ministérios, grupos, EBD, agenda, cuidado e operação local.

O AD Church não deve duplicar plataformas maduras. YouTube continua transmitindo. Zoom e Google Meet continuam hospedando salas. O AD Church organiza contexto, agenda, público autorizado, entrada e continuidade da relação.

---

## Fase 0 — Infraestrutura isolada — CONCLUÍDA

- Repositório GitHub próprio.
- Vercel próprio.
- Supabase próprio.
- CI TypeScript + build.
- RLS desde a fundação.
- PWA.
- Nenhuma conexão com Agrinvest/Greenvest.

## Fase 1 — Experiência pública de culto — CONCLUÍDA

- Home pública editorial.
- Bíblia sem login.
- Harpa sem login.
- Modo Culto.
- Sessão pública por slug.
- Operador de culto.
- Realtime para passagem/hino/aviso.
- Base de conteúdo com controle de licença.

## Fase 2 — Identidade, acesso e hierarquia — FUNDAÇÃO CONCLUÍDA

- Supabase Auth.
- Pessoa separada de usuário.
- Membership.
- Papéis + permissões + escopo.
- Aprovação hierárquica.
- RLS por escopo.
- Bootstrap do administrador raiz.
- Convites administrativos com teto hierárquico.
- Staging/importação e reconciliação de cadastro.

**Dependência externa:** planilhas oficiais das congregações e membros.

## Fase 3 — Ponte com Assembleia de Deus Online — EM ANDAMENTO

- Área pública /online.
- Links oficiais do assembleia.online e YouTube.
- Zoom/Google Meet/YouTube como provedores externos.
- Tabela online_meetings com RLS.
- Visibilidade: pública, autenticada ou membros da unidade.
- Reuniões autenticadas restritas à organização do usuário.
- Permissão online.manage por escopo.

### Próximos itens desta fase

1. Console /admin/online para publicar e editar encontros.
2. Estado AO VIVO automático por horário ou comando.
3. QR/link compartilhável por encontro.
4. Associação a ministério.
5. Associação a grupo.
6. Lembretes e notificações.
7. Importação/sincronização opcional de agenda do assembleia.online, se houver API/feed autorizado.

## Fase 4 — Beta congregacional Setor 04 — EM ANDAMENTO

### Concluído nesta fase

- Administração de pessoas e vínculos por escopo.
- Cadastro manual de pessoa sem obrigar conta de login.
- Tipos de vínculo: visitante, frequentador, novo convertido, membro, obreiro e líder.
- Ativação, inativação e transferência entre congregações com auditoria.
- Minha Igreja personalizada após login.
- Navegação mobile própria da área do membro.
- Tela de perfil com conta, cadastro, vínculos e funções.
- Congregação e setor exibidos conforme o vínculo aprovado.
- Próximos encontros online filtrados por organização, vínculo e RLS.
- Funções administrativas e ministérios do contexto exibidos sem misturar vínculo e permissão.

### Concluído adicionalmente na 0.9

- Modelo de grupos, classes, EBD e discipulado.
- Participação em grupos com papel e status.
- Participação em ministérios preparada no banco.
- Agenda com cultos, EBD, reuniões, discipulado, ministérios e eventos.
- Públicos da agenda: público, organização, unidade ou grupo.
- Console /admin/agenda.
- Console /admin/grupos.
- Agenda do membro em /app/agenda.
- Grupos do membro em /app/grupos.
- Integridade de escopo validada também por triggers no banco.

### Próximos itens

- Carregar cadastro oficial das 43 congregações.
- Carregar/reconciliar membros.
- Associações de membros a ministérios.
- Grupos.
- Eventos e agenda.
- EBD.
- Discipulado / Minha Jornada.
- Escalas e equipes básicas.
- Avisos segmentados.

## Fase 5 — Cuidado e comunicação

- Pedidos de oração.
- Acompanhamento pastoral com acesso restrito.
- Notificações push.
- E-mail/WhatsApp por integrações autorizadas.
- Comunicados por setor, congregação, ministério e grupo.
- Histórico de comunicação e auditoria.

## Fase 6 — AD Kids e operação de culto ampliada

- Famílias/households.
- Responsáveis autorizados.
- Crianças e classes.
- Check-in/check-out.
- Etiquetas/QR.
- Voluntários e escalas.
- Repertório e preparação de culto.

## Fase 7 — Relatórios e consolidação

- Indicadores por setor/congregação/ministério.
- Frequência de EBD/eventos.
- Engajamento de comunicação.
- Jornadas e integração.
- Auditoria operacional.
- Exportações autorizadas.

## Fase 8 — Financeiro e IA — SOMENTE APÓS GOVERNANÇA

O mockup antigo prevê finanças, doações, analytics e IA. Esses módulos não entram por padrão no beta.

Antes deles serão definidos:
- responsabilidade institucional;
- integrações existentes;
- fluxo financeiro oficial;
- LGPD e retenção;
- segregação de funções;
- necessidade real de duplicar ou integrar recursos do assembleia.online.

---

## Critério para o piloto

O piloto deve começar pela Sede + um pequeno conjunto de congregações antes da abertura das 43.

O piloto está pronto quando:
1. a pessoa entra sem login em Bíblia/Harpa/Modo Culto;
2. consegue criar conta e pedir vínculo;
3. a liderança aprova dentro do escopo correto;
4. Minha Igreja muda conforme a congregação;
5. líderes publicam evento/encontro/aviso;
6. encontros online respeitam público e escopo;
7. RLS impede leitura cruzada entre organizações e congregações;
8. logs permitem auditar concessões e ações administrativas.
