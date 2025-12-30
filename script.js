// Define a data de hoje automaticamente ao carregar
document.addEventListener("DOMContentLoaded", function() {
    document.getElementById('dataAtual').valueAsDate = new Date();
    // Adiciona a primeira linha inicial
    adicionarLinha();
    
    // Adiciona o evento de click ao botão
    document.getElementById('btnAdd').addEventListener('click', adicionarLinha);
});

function adicionarLinha() {
    const tbody = document.getElementById('tabelaItens').getElementsByTagName('tbody')[0];
    const row = tbody.insertRow();

    // Célula Quantidade
    const cellQtd = row.insertCell(0);
    const inputQtd = document.createElement('input');
    inputQtd.type = 'number';
    inputQtd.value = 1;
    inputQtd.min = 1;
    inputQtd.addEventListener('input', calcularTotal); // Event listener moderno
    cellQtd.appendChild(inputQtd);

    // Célula Descrição
    const cellDesc = row.insertCell(1);
    cellDesc.className = 'col-desc';
    const inputDesc = document.createElement('input');
    inputDesc.type = 'text';
    inputDesc.placeholder = 'Item...';
    cellDesc.appendChild(inputDesc);

    // Célula Valor Unitário
    const cellValor = row.insertCell(2);
    const inputValor = document.createElement('input');
    inputValor.type = 'number';
    inputValor.step = '0.01';
    inputValor.placeholder = '0.00';
    inputValor.addEventListener('input', calcularTotal); // Event listener moderno
    cellValor.appendChild(inputValor);

    // Célula Total da Linha
    const cellTotal = row.insertCell(3);
    cellTotal.className = 'col-total';
    const inputTotal = document.createElement('input');
    inputTotal.type = 'text';
    inputTotal.readOnly = true;
    inputTotal.value = '0,00';
    cellTotal.appendChild(inputTotal);

    // Célula Ação (Remover) - Visível apenas na tela
    const cellAcao = row.insertCell(4);
    cellAcao.className = 'no-print';
    const btnRemove = document.createElement('button');
    btnRemove.innerText = 'X';
    btnRemove.className = 'btn-remove';
    btnRemove.onclick = function() {
        if (tbody.rows.length > 1) {
            row.remove();
            calcularTotal();
        } else {
            alert("O recibo deve ter pelo menos um item.");
        }
    };
    cellAcao.appendChild(btnRemove);
}

function calcularTotal() {
    const tbody = document.getElementById('tabelaItens').getElementsByTagName('tbody')[0];
    let totalGeral = 0;

    for (let i = 0; i < tbody.rows.length; i++) {
        const row = tbody.rows[i];
        
        // Pega os inputs dentro das células
        const qtdInput = row.cells[0].getElementsByTagName('input')[0];
        const valorInput = row.cells[2].getElementsByTagName('input')[0];
        const totalInput = row.cells[3].getElementsByTagName('input')[0];

        const qtd = parseFloat(qtdInput.value) || 0;
        const valor = parseFloat(valorInput.value) || 0;
        
        const totalLinha = qtd * valor;
        
        // Atualiza o input de total da linha (formatado)
        totalInput.value = totalLinha.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        totalGeral += totalLinha;
    }

    // Atualiza o Total Geral em destaque
    document.getElementById('valorTotalGeral').innerText = totalGeral.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}