document.addEventListener("DOMContentLoaded", function() {
    // 1. Data de Hoje
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    document.getElementById('dataAtual').value = `${dia}/${mes}/${ano}`;

    // 2. Adiciona APENAS UMA linha inicial
    adicionarLinha();

    // 3. Botão adicionar
    document.getElementById('btnAdd').addEventListener('click', adicionarLinha);
});

function adicionarLinha() {
    const tbody = document.getElementById('tabelaItens').getElementsByTagName('tbody')[0];
    const row = tbody.insertRow();

    // QTD
    const cellQtd = row.insertCell(0);
    const inputQtd = document.createElement('input');
    inputQtd.addEventListener('input', calcularTotal);
    cellQtd.appendChild(inputQtd);

    // DESCRIÇÃO
    const cellDesc = row.insertCell(1);
    cellDesc.className = 'col-desc';
    const inputDesc = document.createElement('input');
    cellDesc.appendChild(inputDesc);

    // VALOR UNIT
    const cellValor = row.insertCell(2);
    const inputValor = document.createElement('input');
    inputValor.addEventListener('input', calcularTotal);
    cellValor.appendChild(inputValor);

    // TOTAL
    const cellTotal = row.insertCell(3);
    const inputTotal = document.createElement('input');
    inputTotal.readOnly = true;
    cellTotal.appendChild(inputTotal);
}

function calcularTotal() {
    const tbody = document.getElementById('tabelaItens').getElementsByTagName('tbody')[0];
    let totalGeral = 0;

    for (let i = 0; i < tbody.rows.length; i++) {
        const row = tbody.rows[i];
        
        const qVal = row.cells[0].getElementsByTagName('input')[0].value.replace(',', '.');
        const vVal = row.cells[2].getElementsByTagName('input')[0].value.replace(',', '.');
        const tInput = row.cells[3].getElementsByTagName('input')[0];

        const qtd = parseFloat(qVal);
        const valor = parseFloat(vVal);

        if (!isNaN(qtd) && !isNaN(valor)) {
            const linhaTotal = qtd * valor;
            tInput.value = linhaTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            totalGeral += linhaTotal;
        } else {
            tInput.value = '';
        }
    }

    const totalEl = document.getElementById('valorTotalGeral');
    if (totalGeral > 0) {
        totalEl.innerText = totalGeral.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    } else {
        totalEl.innerText = '0,00';
    }
}