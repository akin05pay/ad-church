# O que reaproveitar do mockup assembleia.church

O site assembleia.church é tratado como **mockup conceitual**, não como fonte de dados reais e não como produto a ser copiado integralmente.

## Reaproveitar como conceito

### 1. Hierarquia organizacional flexível
O mockup propõe níveis como denominação/rede, setor, sede, congregação, célula/grupo e ministérios. Isso converge com a arquitetura atual de organizations + units + ministries e deve ser preservado.

### 2. Permissões por função e localidade
A ideia de acesso granular por papel e nível organizacional já foi incorporada em role_assignments + permissions + RLS.

### 3. Gestão de pessoas
O conceito de histórico, grupos, cargos e jornada espiritual é útil, mas no AD Church a entidade pessoa continua separada da conta de login.

### 4. Eventos e agenda
Será reaproveitado, com um modelo único de evento e escopo, em vez de calendários independentes por módulo.

### 5. Comunicação segmentada
Avisos/notificações por setor, congregação, ministério e grupo entram no roadmap.

### 6. Oração, auditoria e relatórios
São conceitos válidos para fases posteriores, com acesso mínimo necessário.

### 7. Multi-tenant / white-label
A fundação multi-organização é mantida para permitir expansão futura, sem transformar o piloto em um SaaS genérico.

## Não reaproveitar agora

### Métricas comerciais do mockup
Números como organizações, membros, contribuições e eventos não serão usados enquanto não houver origem verificável.

### Planos e preços
Os tiers comerciais do mockup não fazem parte do projeto institucional atual.

### Linguagem de SaaS genérico
"Teste grátis", "começar agora", comparativos de planos e a estética de landing page comercial não combinam com o front institucional em construção.

### Financeiro como prioridade
Doações, Pix, boleto e reconciliação só entram depois de mapear o fluxo oficial já existente e a governança do Ministério.

### IA como feature de vitrine
IA e automações só entram quando houver caso de uso real, dado autorizado e controle humano.

### Cópia literal da interface
O mockup serve para recuperar boas ideias de produto e arquitetura; a UI atual segue uma direção editorial e própria, integrada ao assembleia.online.

## Regra de decisão

Uma ideia do mockup só entra quando satisfizer os quatro critérios:

1. resolve um problema real do Setor 04;
2. respeita a hierarquia eclesiástica;
3. pode ser protegida por escopo/RLS;
4. complementa, e não duplica sem necessidade, o assembleia.online.
