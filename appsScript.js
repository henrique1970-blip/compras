const SPREADSHEET_ID = '1FczZSVfA9guu509GBWxXgcD0W--v_4aYXTuz6p8L4nU';
const USERS_SHEET_NAME = 'Usuários';

const userProfiles = {
    "bijsterveld57@gmail.com": { nome: "Monique", perfil: "Financeiro" },
    "pieterjcobbijsterveld@gmail.com": { nome: "Jan", perfil: "Solicitante" },
    "tiagotheodorobj@gmail.com": { nome: "Tiago", perfil: "Financeiro" },
    "pieterbijsterveld95@gmail.com": { nome: "Pieter", perfil: "Solicitante" },
    "darleydacostavale@gmail.com": { nome: "Darley", perfil: "Compras" },
    "onfarm2021@gmail.com": { nome: "Ana Carolina", perfil: "Solicitante" }
};

const purchasingEmail = "darleydacostavale@gmail.com";
const financeEmails = ["bijsterveld57@gmail.com", "tiagotheodorobj@gmail.com"];

function doPost(e) {
    try {
        const action = e.parameter.action;
        const data = JSON.parse(e.postData.contents);
        const userInfo = data.userInfo;

        if (!userProfiles[userInfo.email]) {
            throw new Error('Acesso negado.');
        }

        switch (action) {
            case 'submitRequest':
                return handleNewRequest(data);
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

function handleNewRequest(data) {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName(data.formData.empresa);

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
        data.formData.urgencia,
        data.formData.fornecedor,
        data.formData.observacao
    ];

    sheet.appendRow(rowData);

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

function notifyPurchasing(requestId, data) {
    const subject = `Nova Solicitação de ${data.requestType}: ${requestId}`;
    const body = `
        Uma nova solicitação foi criada por ${data.userInfo.nome}.
        
        ID do Pedido: ${requestId}
        Empresa: ${data.formData.empresa}
        Setor: ${data.formData.setor}
        
        Por favor, acesse o aplicativo para adicionar os orçamentos.
    `;
    
    MailApp.sendEmail(purchasingEmail, subject, body);
}

function doGet(e) {
    return HtmlService.createHtmlOutputFromFile('index').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}