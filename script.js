document.addEventListener("DOMContentLoaded", function() {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    document.getElementById('dataAtual').value = `${dia}/${mes}/${ano}`;

    adicionarLinha();
    document.getElementById('btnAdd').addEventListener('click', adicionarLinha);
});

function adicionarLinha() {
    const tbody = document.getElementById('tabelaItens').getElementsByTagName('tbody')[0];
    const row = tbody.insertRow();

    // 1. Quantidade
    const cellQtd = row.insertCell(0);
    cellQtd.className = 'col-qtd';
    const inputQtd = document.createElement('input');
    inputQtd.type = 'number';
    inputQtd.addEventListener('input', calcularTotal);
    cellQtd.appendChild(inputQtd);

    // 2. Descrição
    const cellDesc = row.insertCell(1);
    cellDesc.className = 'col-desc';
    const inputDesc = document.createElement('input');
    inputDesc.type = 'text';
    cellDesc.appendChild(inputDesc);

    // 3. Valor Unitário (Com R$)
    const cellValor = row.insertCell(2);
    cellValor.className = 'col-unit';
    
    const wrapperValor = document.createElement('div');
    wrapperValor.className = 'money-wrapper';
    
    const symbolValor = document.createElement('span');
    symbolValor.innerText = 'R$';
    
    const inputValor = document.createElement('input');
    inputValor.type = 'text'; // Usar text para facilitar formatação se quiser futuramente
    inputValor.addEventListener('input', calcularTotal);

    wrapperValor.appendChild(symbolValor);
    wrapperValor.appendChild(inputValor);
    cellValor.appendChild(wrapperValor);

    // 4. Total (Com R$)
    const cellTotal = row.insertCell(3);
    cellTotal.className = 'col-total';

    const wrapperTotal = document.createElement('div');
    wrapperTotal.className = 'money-wrapper';

    const symbolTotal = document.createElement('span');
    symbolTotal.innerText = 'R$';

    const inputTotal = document.createElement('input');
    inputTotal.type = 'text';
    inputTotal.readOnly = true;

    wrapperTotal.appendChild(symbolTotal);
    wrapperTotal.appendChild(inputTotal);
    cellTotal.appendChild(wrapperTotal);
}

function calcularTotal() {
    const tbody = document.getElementById('tabelaItens').getElementsByTagName('tbody')[0];
    let totalGeral = 0;

    for (let i = 0; i < tbody.rows.length; i++) {
        const row = tbody.rows[i];
        
        // Célula 0 (Qtd) -> input direto
        const qtdInput = row.cells[0].getElementsByTagName('input')[0];
        
        // Célula 2 (Valor) -> input dentro do wrapper
        const valorInput = row.cells[2].getElementsByTagName('input')[0];
        
        // Célula 3 (Total) -> input dentro do wrapper
        const totalInput = row.cells[3].getElementsByTagName('input')[0];

        const qVal = qtdInput.value.replace(',', '.');
        const vVal = valorInput.value.replace(',', '.');

        const qtd = parseFloat(qVal);
        const valor = parseFloat(vVal);

        if (!isNaN(qtd) && !isNaN(valor)) {
            const linhaTotal = qtd * valor;
            totalInput.value = linhaTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            totalGeral += linhaTotal;
        } else {
            totalInput.value = '';
        }
    }

    const totalEl = document.getElementById('valorTotalGeral');
    if (totalGeral > 0) {
        totalEl.innerText = totalGeral.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    } else {
        totalEl.innerText = '0,00';
    }
}