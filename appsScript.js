// =================================================================================
// CONFIGURAÇÕES
// =================================================================================
const SPREADSHEET_ID = '1FczZSVfA9guu509GBWxXgcD0W--v_4aYXTuz6p8L4nU'; // ID da sua planilha
const USERS_SHEET_NAME = 'Usuários';

const userProfiles = {
    // E-mails e perfis (pode ser carregado da aba 'Usuários' para ser dinâmico)
    "bijsterveld57@gmail.com": { nome: "Monique", perfil: "Financeiro" },
    "pieterjcobbijsterveld@gmail.com": { nome: "Jan", perfil: "Solicitante" },
    "tiagotheodorobj@gmail.com": { nome: "Tiago", perfil: "Financeiro" },
    "pieterbijsterveld95@gmail.com": { nome: "Pieter", perfil: "Solicitante" },
    "darleydacostavale@gmail.com": { nome: "Darley", perfil: "Compras" },
    "onfarm2021@gmail.com": { nome: "Ana Carolina", perfil: "Solicitante" }
};

const purchasingEmail = "darleydacostavale@gmail.com";
const financeEmails = ["bijsterveld57@gmail.com", "tiagotheodorobj@gmail.com"];


// =================================================================================
// FUNÇÃO PRINCIPAL - RECEBER DADOS DO APP (PONTO DE ENTRADA)
// =================================================================================
function doPost(e) {
    try {
        const action = e.parameter.action;
        const data = JSON.parse(e.postData.contents);
        const userInfo = data.userInfo;

        // Verifica se o usuário tem permissão para a ação
        if (!userProfiles[userInfo.email]) {
            throw new Error('Acesso negado.');
        }

        switch (action) {
            case 'submitRequest':
                return handleNewRequest(data);
            // Futuras ações aqui: 'getPurchaseTasks', 'submitQuotes', etc.
            default:
                throw new Error('Ação desconhecida.');
        }

    } catch (error) {
        Logger.log(error);
        return ContentService
            .createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// =================================================================================
// FUNÇÕES DE MANIPULAÇÃO DE DADOS
// =================================================================================
function handleNewRequest(data) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(data.formData.empresa);

    // Cria a aba da empresa se ela não existir
    if (!sheet) {
        sheet = ss.insertSheet(data.formData.empresa);
        const headers = ['Timestamp', 'ID', 'Solicitante', 'Email Solicitante', 'Tipo', 'Empresa', 'Setor', 'Status', /* Adicionar outros cabeçalhos aqui */];
        sheet.appendRow(headers);
    }

    const newId = generateRequestId(data.formData.empresa, sheet);
    const timestamp = new Date();

    const rowData = [
        timestamp,
        newId,
        data.userInfo.nome,
        data.userInfo.email,
        data.requestType,
        data.formData.empresa,
        data.formData.setor,
        'Aguardando orçamento',
        // Adicionar os outros dados do formulário na ordem correta
        data.formData.urgencia,
        data.formData.fornecedor,
        data.formData.observacao
    ];

    sheet.appendRow(rowData);

    // Enviar notificação para o setor de compras
    notifyPurchasing(newId, data);
    
    return ContentService
        .createTextOutput(JSON.stringify({ status: 'success', message: 'Solicitação enviada!', newId: newId }))
        .setMimeType(ContentService.MimeType.JSON);
}

function generateRequestId(empresa, sheet) {
    const prefix = empresa.substring(0, 3).toUpperCase();
    const lastRow = sheet.getLastRow();
    return `${prefix}-${lastRow + 1}`;
}


// =================================================================================
// FUNÇÕES DE NOTIFICAÇÃO (PLACEHOLDERS)
// =================================================================================
function notifyPurchasing(requestId, data) {
    const subject = `Nova Solicitação de ${data.requestType}: ${requestId}`;
    const body = `
        Uma nova solicitação foi criada por ${data.userInfo.nome}.
        
        ID do Pedido: ${requestId}
        Empresa: ${data.formData.empresa}
        Setor: ${data.formData.setor}
        
        Por favor, acesse o aplicativo para adicionar os orçamentos.
    `;
    
    // Envio de E-mail
    MailApp.sendEmail(purchasingEmail, subject, body);
    
    // Envio para o Google Chat (requer configuração de webhook)
    // sendToGoogleChat(purchasingEmail, `Nova Solicitação: ${requestId} de ${data.userInfo.nome}`);
}

// =================================================================================
// FUNÇÃO doGet (Necessária para publicação inicial do App da Web)
// =================================================================================
function doGet(e) {
  // Retorna o conteúdo do arquivo index.html principal
  return HtmlService.createHtmlOutputFromFile('index').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}