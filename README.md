# Recibos · Info Projekt

Gerador de recibos de pagamento em HTML, CSS e JavaScript. Funciona como site estático no GitHub Pages, sem servidor de aplicação, cadastro ou dependências em produção.

## Uso

1. Preencha a data e o nome do cliente. Endereço e referência são opcionais.
2. Adicione os serviços ou produtos, com quantidade inteira e preço unitário. Valores como `79,90`, `1.299,90` e `1299.90` são aceitos.
3. Selecione pagamento integral ou parcial e a forma de pagamento. No pagamento misto, a soma das formas precisa ser igual ao valor recebido.
4. Confira a prévia e clique em **Imprimir / salvar PDF**. No diálogo do navegador, escolha uma impressora ou **Salvar como PDF**.

A referência é manual: use o número do recibo, OS ou contrato do seu controle interno. O site não gera numeração compartilhada nem confirma pagamentos em bancos ou sistemas externos.

## Rascunho e privacidade

Os dados preenchidos ficam na página. Não há API, analytics ou envio automático dos campos para um servidor. O carregamento inicial do site utiliza normalmente a hospedagem GitHub Pages.

**Salvar rascunho neste navegador** é opcional e vem desativado. Quando ativado, usa `localStorage` neste navegador e dispositivo; os dados permanecem até serem apagados. Não é histórico, backup nem sincronização entre computadores. Evite ativar em computadores compartilhados.

**Apagar rascunho** remove a cópia salva e mantém os campos na aba atual. **Novo recibo** apaga também o preenchimento após confirmação. Uma cópia mantém os dados, atualiza a data e limpa a referência; confira tudo antes de emitir novamente.

## Impressão

O documento tem estilos A4, margens de 15 mm e cabeçalho de tabela repetido entre páginas. A barra da ferramenta e o formulário são ocultados na impressão. O botão valida o preenchimento antes de abrir o diálogo. Caso se use a impressão direta do navegador com dados incompletos, o documento recebe o aviso **RASCUNHO — NÃO EMITIDO**.

Confira a prévia de impressão antes de entregar. Nomes extensos, observações, configurações de cabeçalho/rodapé do navegador e drivers de impressora podem alterar a paginação. Não há assinatura eletrônica ou verificação de autenticidade.

## Estrutura

- `index.html`: formulário e documento, com rótulos e controles acessíveis.
- `style.css`: interface, adaptação para telas menores e impressão.
- `money.js`: leitura estrita de valores monetários e cálculos em centavos.
- `script.js`: preenchimento, validação, prévia e rascunho.
- `info.png`: logo original.

As quantidades aceitas vão de 1 a 99.999. Há limite de 100 itens e até cinco formas no pagamento misto. Valores, subtotais e soma ficam limitados a R$ 999.999.999,99. O pagamento parcial deve ser positivo e menor que o total. Itens gratuitos são permitidos, mas o total recebido precisa ser maior que zero.

## Verificação

O site não precisa de Node ou instalação para funcionar. Para os testes de desenvolvimento, use Node 24 ou superior:

```sh
npm ci
npm test
npm run test:ui
```

Os testes de interface usam DOM simulado (jsdom), sem abrir um navegador. Cobrem validação, cálculos, atualização da prévia, pagamento parcial/misto, rascunho, duplicação e limpeza. Não substituem uma revisão visual no navegador ou impressão física.
