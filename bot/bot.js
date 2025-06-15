
const { Telegraf, session } = require('telegraf');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
require('dotenv').config();
const database = require('../db/connect');
const BOT_TOKEN = process.env.BOT_TOKEN;
const DOMAIN = process.env.DOMAIN || 'http://localhost:3000';

if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN not found in .env file');
    console.log('Create .env file with your bot token from @BotFather');
    process.exit(1);
}
if (BOT_TOKEN === 'your_bot_token_here') {
    console.error('❌ Please replace BOT_TOKEN in .env file with real token');
    process.exit(1);
}
const bot = new Telegraf(BOT_TOKEN);
bot.use(session());
const states = {
    WAITING_QR: 'waiting_qr',
    WAITING_FIRST_NAME: 'waiting_first_name',
    WAITING_LAST_NAME: 'waiting_last_name',
    WAITING_BIRTH_DATE: 'waiting_birth_date',
    WAITING_MONTH: 'waiting_month'
};


bot.start((ctx) => {
    ctx.session = {
        state: states.WAITING_QR,
        data: {}
    };
    
    ctx.reply('Hallo! Senden Sie ein Foto des QR-Codes, um mit der Erstellung des Tickets zu beginnen.');
});
bot.on('photo', async (ctx) => {
    if (ctx.session?.state !== states.WAITING_QR) {
        return ctx.reply('Geben Sie zuerst den Befehl /start ein');
    }

    try {

        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        const file = await ctx.telegram.getFile(photo.file_id);
        

        const fileName = `${uuidv4()}.jpg`;
        const filePath = path.join(__dirname, '../public/images', fileName);
        

        const imagesDir = path.dirname(filePath);
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }
        

        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`;
        

        const downloadFile = (url, dest) => {
            return new Promise((resolve, reject) => {
                const fileStream = fs.createWriteStream(dest);
                https.get(url, (response) => {
                    response.pipe(fileStream);
                    fileStream.on('finish', () => {
                        fileStream.close();
                        resolve();
                    });
                }).on('error', (err) => {
                    fs.unlink(dest, () => {}); // Удаляем файл при ошибке
                    reject(err);
                });
            });
        };
        
        await downloadFile(fileUrl, filePath);
        

        ctx.session.data.qrImagePath = fileName;
        ctx.session.state = states.WAITING_FIRST_NAME;
        
        ctx.reply('QR-Code gespeichert! Geben Sie jetzt Ihren Vornamen ein:');
        
    } catch (error) {
        console.error('Error downloading photo:', error);
        ctx.reply('Ein Fehler ist aufgetreten. Versuchen Sie es erneut mit dem Befehl /start');
    }
});


bot.on('text', async (ctx) => {
    if (!ctx.session?.state) {
        return ctx.reply('Geben Sie den Befehl /start ein, um zu beginnen');
    }

    const text = ctx.message.text.trim();

    switch (ctx.session.state) {
        case states.WAITING_FIRST_NAME:

            if (!text) {
                return ctx.reply('❌ Bitte geben Sie Ihren Vornamen ein:');
            }
            if (text.length < 2) {
                return ctx.reply('❌ Der Vorname muss mindestens 2 Zeichen enthalten. Geben Sie Ihren Vornamen ein:');
            }
            if (text.length > 30) {
                return ctx.reply('❌ Der Vorname ist zu lang (maximal 30 Zeichen). Geben Sie Ihren Vornamen ein:');
            }
            if (!/^[а-яёА-ЯЁa-zA-ZäöüÄÖÜß\s-]+$/.test(text)) {
                return ctx.reply('❌ Der Vorname darf nur Buchstaben, Leerzeichen und Bindestriche enthalten. Geben Sie Ihren Vornamen ein:');
            }
            
            ctx.session.data.firstName = text;
            ctx.session.state = states.WAITING_LAST_NAME;
            ctx.reply('Ausgezeichnet! Geben Sie jetzt Ihren Nachnamen ein:');
            break;

        case states.WAITING_LAST_NAME:

            if (!text) {
                return ctx.reply('❌ Bitte geben Sie Ihren Nachnamen ein:');
            }
            if (text.length < 2) {
                return ctx.reply('❌ Der Nachname muss mindestens 2 Zeichen enthalten. Geben Sie Ihren Nachnamen ein:');
            }
            if (text.length > 30) {
                return ctx.reply('❌ Der Nachname ist zu lang (maximal 30 Zeichen). Geben Sie Ihren Nachnamen ein:');
            }
            if (!/^[а-яёА-ЯЁa-zA-ZäöüÄÖÜß\s-]+$/.test(text)) {
                return ctx.reply('❌ Der Nachname darf nur Buchstaben, Leerzeichen und Bindestriche enthalten. Geben Sie Ihren Nachnamen ein:');
            }
            
            ctx.session.data.lastName = text;
            ctx.session.state = states.WAITING_BIRTH_DATE;
            ctx.reply('Geben Sie Ihr Geburtsdatum im Format JJJJ-MM-TT ein (z.B.: 2000-01-27):');
            break;

        case states.WAITING_BIRTH_DATE:

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(text)) {
                return ctx.reply('❌ Falsches Datumsformat. Geben Sie das Datum im Format JJJJ-MM-TT ein (z.B.: 2000-01-27):');
            }
            

            const dateParts = text.split('-');
            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]);
            const day = parseInt(dateParts[2]);
            

            const todayYear = new Date().getFullYear();
            if (year < 1900 || year > todayYear) {
                return ctx.reply(`❌ Das Jahr muss zwischen 1900 und ${todayYear} liegen. Geben Sie das Geburtsdatum ein:`);
            }
            

            if (month < 1 || month > 12) {
                return ctx.reply('❌ Der Monat muss zwischen 01 und 12 liegen. Geben Sie das Geburtsdatum ein:');
            }
            

            const daysInMonth = new Date(year, month, 0).getDate();
            if (day < 1 || day > daysInMonth) {
                return ctx.reply(`❌ Der ${month}. Monat ${year} hat nur ${daysInMonth} Tage. Geben Sie ein korrektes Datum ein:`);
            }
            

            const inputDate = new Date(year, month - 1, day);
            const today = new Date();
            if (inputDate > today) {
                return ctx.reply('❌ Das Geburtsdatum kann nicht in der Zukunft liegen. Geben Sie ein korrektes Datum ein:');
            }
            

            const age = today.getFullYear() - year;
            if (age < 5) {
                return ctx.reply('❌ Das Alter muss mindestens 5 Jahre betragen. Geben Sie ein korrektes Geburtsdatum ein:');
            }
            
            ctx.session.data.birthDate = text;
            ctx.session.state = states.WAITING_MONTH;
            ctx.reply('Geben Sie einen beliebigen Monat auf Deutsch ein (z.B.: Januar, Februar, März):');
            break;

        case states.WAITING_MONTH:

            if (!text) {
                return ctx.reply('❌ Bitte geben Sie einen Monat ein:');
            }
            if (text.length < 3) {
                return ctx.reply('❌ Der Monatsname ist zu kurz. Geben Sie den vollständigen Monatsnamen ein:');
            }
            if (text.length > 15) {
                return ctx.reply('❌ Der Monatsname ist zu lang. Geben Sie einen korrekten Monatsnamen ein:');
            }
            

            if (!/^[a-zA-ZäöüÄÖÜß]+$/.test(text)) {
                return ctx.reply('❌ Der Monatsname darf nur Buchstaben enthalten. Geben Sie einen korrekten Monatsnamen ein:');
            }
            

            const validMonths = [
                'januar', 'februar', 'märz', 'april', 'mai', 'juni',
                'juli', 'august', 'september', 'oktober', 'november', 'dezember'
            ];
            
            const inputMonth = text.toLowerCase().trim();
            

            let foundMonth = null;
            let foundMonthNumber = 0;
            
            for (let i = 0; i < validMonths.length; i++) {
                const month = validMonths[i];
                if (month === inputMonth || month.startsWith(inputMonth) || inputMonth.startsWith(month.substring(0, 3))) {
                    foundMonth = month;
                    foundMonthNumber = i + 1; // +1 потому что массив начинается с 0
                    break;
                }
            }
            
            if (!foundMonth) {
                return ctx.reply(
                    '❌ Unbekannter Monat! Geben Sie einen gültigen deutschen Monatsnamen ein:\n\n' +
                    '✅ Gültige Monate:\n' +
                    'Januar, Februar, März, April, Mai, Juni,\n' +
                    'Juli, August, September, Oktober, November, Dezember\n\n' +
                    'Versuchen Sie es erneut:'
                );
            }
            

            const now = new Date();
            const nowMonth = now.getMonth() + 1; // getMonth() возвращает 0-11
            

            if (foundMonthNumber < nowMonth) {
                const monthNames = {
                    1: 'Januar', 2: 'Februar', 3: 'März', 4: 'April',
                    5: 'Mai', 6: 'Juni', 7: 'Juli', 8: 'August',
                    9: 'September', 10: 'Oktober', 11: 'November', 12: 'Dezember'
                };
                
                return ctx.reply(
                    `⚠️ ACHTUNG: ${monthNames[foundMonthNumber]} ist bereits vergangen!\n\n` +
                    `❌ Sie können kein Ticket für einen vergangenen Monat erstellen.\n\n` +
                    `💡 Bitte wählen Sie einen aktuellen oder zukünftigen Monat:\n\n` +
                    `✅ Verfügbare Monate:\n` +
                    `${validMonths.slice(nowMonth - 1).map(month => month.charAt(0).toUpperCase() + month.slice(1)).join(', ')}\n\n` +
                    `Geben Sie einen anderen Monat ein:`
                );
            }
            

            const formattedMonth = foundMonth.charAt(0).toUpperCase() + foundMonth.slice(1);
            ctx.session.data.month = formattedMonth;
            

            await createTicket(ctx);
            break;
            break;

        default:
            ctx.reply('Geben Sie den Befehl /start ein, um zu beginnen');
    }
});


async function createTicket(ctx) {
    try {
        const ticketId = uuidv4();
        const userId = ctx.from.id;
        

        const ticketNumber = Math.floor(Math.random() * 9000000000) + 1000000000;
        
        const ticketData = {
            id: ticketId,
            userId: userId,
            firstName: ctx.session.data.firstName,
            lastName: ctx.session.data.lastName,
            birthDate: ctx.session.data.birthDate,
            month: ctx.session.data.month,
            qrImagePath: ctx.session.data.qrImagePath,
            ticketNumber: ticketNumber
        };


        await database.insertTicket(ticketData);


        await generateHTMLPage(ticketData);


        const ticketUrl = `${DOMAIN}/ticket/${ticketId}`;
        

        const isLocalhost = DOMAIN.includes('localhost') || DOMAIN.includes('127.0.0.1');
        
        if (isLocalhost) {

            ctx.reply(
                `✅ Ticket erfolgreich erstellt!\n\n` +
                `🔗 Ihr Link: ${ticketUrl}\n\n` +
                `Um ein neues Ticket zu erstellen, geben Sie /start ein`
            );
        } else {

            ctx.reply(
                `✅ Ticket erfolgreich erstellt!\n\n` +
                `🔗 Ihr Link: ${ticketUrl}\n\n` +
                `Um ein neues Ticket zu erstellen, geben Sie /start ein`,
                {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '🎫 Ticket öffnen', url: ticketUrl }
                        ]]
                    }
                }
            );
        }


        ctx.session = null;

    } catch (error) {
        console.error('Error creating ticket:', error);
        ctx.reply('Ein Fehler ist aufgetreten. Versuchen Sie es erneut mit dem Befehl /start');
        ctx.session = null;
    }
}


async function generateHTMLPage(data) {

    const monthMap = {
        'januar': '01', 'februar': '02', 'märz': '03', 'april': '04',
        'mai': '05', 'juni': '06', 'juli': '07', 'august': '08',
        'september': '09', 'oktober': '10', 'november': '11', 'dezember': '12'
    };
    
    const inputMonth = data.month.toLowerCase();
    let monthNumber = '06'; // по умолчанию июнь
    

    for (const [monthName, monthNum] of Object.entries(monthMap)) {
        if (monthName.includes(inputMonth) || inputMonth.includes(monthName)) {
            monthNumber = monthNum;
            break;
        }
    }
    

    let nextMonth = parseInt(monthNumber) + 1;
    let nextYear = '2025';
    
    if (nextMonth > 12) {
        nextMonth = 1;
        nextYear = '2026';
    }
    
    const nextMonthFormatted = nextMonth.toString().padStart(2, '0');
    

    const validFrom = `01.${monthNumber}.2025 - 00:00`;
    const validUntil = `01.${nextMonthFormatted}.${nextYear} - 03:00`;

    const template = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket - ${data.firstName} ${data.lastName}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 10px;
                animation: gradientShift 6s ease infinite;
            }
            
            @keyframes gradientShift {
                0%, 100% { background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); }
                50% { background: linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #667eea 100%); }
            }
            
            .ticket-container {
                width: 100%;
                display: flex;
                justify-content: center;
                perspective: 1000px;
            }
            
            .ticket {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 24px;
                padding: 30px;
                box-shadow: 
                    0 25px 50px rgba(0,0,0,0.2),
                    0 0 0 1px rgba(255,255,255,0.3);
                max-width: 500px;
                width: 100%;
                text-align: center;
                position: relative;
                overflow: hidden;
                transform: rotateX(5deg);
                transition: transform 0.3s ease;
                animation: slideIn 0.8s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(50px) rotateX(15deg);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) rotateX(5deg);
                }
            }
            
            .ticket:hover {
                transform: rotateX(0deg) translateY(-10px);
            }
            
            .ticket::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 6px;
                background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
                background-size: 200% 100%;
                animation: shimmer 2s linear infinite;
            }
            
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            
            .qr-section {
                position: relative;
                margin-bottom: 25px;
            }
            
            .qr-code {
                width: 100%;
                height: auto;
                object-fit: cover;
                border-radius: 16px;
                border: 3px solid rgba(255,255,255,0.8);
                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                transition: transform 0.3s ease;
                margin: 0 auto;
                display: block;
            }
            
            .qr-code:hover {
                transform: scale(1.02);
            }
            
            .ticket-number {
                font-size: 28px;
                font-weight: 600;
                color: #1a365d;
                letter-spacing: 1px;
                margin: 15px 0 10px 0;
                font-family: 'Monaco', 'Consolas', monospace;
            }
            
            .validity-dates {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 15px 0;
                padding: 0 20px;
                font-size: 14px;
                color: #4a5568;
            }
            
            .validity-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
            }
            
            .validity-label {
                font-size: 12px;
                color: #718096;
                margin-bottom: 2px;
                font-weight: 500;
            }
            
            .validity-date {
                font-weight: 600;
                color: #2d3748;
                font-size: 14px;
            }
            
            .qr-slider {
                width: 70%;
                height: 15px;
                background: #e2e8f0;
                border-radius: 8px;
                position: relative;
                margin: 15px auto 0;
                overflow: hidden;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
            }
            
            @keyframes slideQR {
      0% {
        transform: translateX(0);
      }
      45% {
        transform: translateX(calc(1000% - 30px));
      }
      55% {
        transform: translateX(calc(1000% - 30px));
      }
      100% {
        transform: translateX(0);
      }
    }
    
    .qr-slider-track {
      position: absolute;
      top: 2px;
      left: 2px;
      bottom: 2px;
      width: 30px;
      background: linear-gradient(45deg, #48bb78, #38a169);
      border-radius: 6px;
      animation: slideQR 3s ease-in-out infinite;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
            
            
            .divider {
                height: 2px;
                background: linear-gradient(90deg, transparent, #cbd5e0, transparent);
                margin: 25px 0;
                position: relative;
            }
            
            .divider::before,
            .divider::after {
                content: '';
                position: absolute;
                top: -6px;
                width: 12px;
                height: 12px;
                background: rgba(255,255,255,0.95);
                border-radius: 50%;
                border: 2px solid #cbd5e0;
            }
            
            .divider::before { left: -6px; }
            .divider::after { right: -6px; }
            
            .info {
                text-align: left;
            }
            
            .info-item {
                margin-bottom: 15px;
                padding: 12px 16px;
                background: linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.3));
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,0.3);
                backdrop-filter: blur(10px);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .info-item:hover {
                transform: translateX(5px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .info-item::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 3px;
                background: linear-gradient(180deg, #667eea, #764ba2);
                border-radius: 0 3px 3px 0;
            }
            
            .label {
                font-weight: 600;
                color: #4a5568;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .value {
                color: #1a202c;
                font-size: 16px;
                font-weight: 500;
            }
            
            .ticket-info {
                background: rgba(59, 130, 246, 0.1);
                border: 1px solid rgba(59, 130, 246, 0.2);
                border-radius: 12px;
                padding: 15px;
                margin-top: 20px;
            }
            
            .ticket-info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 10px;
            }
            
            .ticket-info-item {
                display: flex;
                flex-direction: column;
            }
            
            .ticket-info-label {
                font-size: 11px;
                color: #64748b;
                font-weight: 500;
                margin-bottom: 2px;
            }
            
            .ticket-info-value {
                font-size: 13px;
                color: #334155;
                font-weight: 600;
            }
            
            .validity-dates-single {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            
            .validity-item-single {
                display: flex;
                flex-direction: column;
            }
            
            .footer {
                margin-top: 25px;
                padding-top: 15px;
                border-top: 1px solid rgba(255,255,255,0.3);
                color: #6b7280;
                font-size: 12px;
                line-height: 1.4;
            }
            
            .created-time {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                margin-top: 8px;
                font-size: 11px;
            }
            
            @media (max-width: 480px) {
                .ticket {
                    padding: 20px 15px;
                    margin: 10px;
                    transform: none;
                }
                
                .ticket:hover {
                    transform: translateY(-5px);
                }
                
                .qr-code {
                    width: 100%;
                    height: auto;
                }
                
                .ticket-number {
                    font-size: 24px;
                }
                
                .validity-dates {
                    padding: 0 10px;
                }
                
                .qr-slider {
                    width: 80%;
                    height: 15px;
                }
                
                .qr-slider-track {
                    width: 25px;
                }
                
                .value {
                    font-size: 15px;
                }
                
                .ticket-info-grid {
                    grid-template-columns: 1fr;
                    gap: 8px;
                }
            }
        </style>
    </head>
    <body>
        <div class="ticket-container">
            <div class="ticket">
                <div class="qr-section">
                    <img src="/images/${data.qrImagePath}" alt="QR Code" class="qr-code" />
                    
                    <div class="ticket-number">${data.ticketNumber}</div>
                    
                    <div class="qr-slider">
                        <div class="qr-slider-track"></div>
                    </div>
                </div>
                
                <div class="divider"></div>
                
                <div class="info">
                    <div class="info-item">
                        <div class="label">
                            👤 Ticketinhaber*in
                        </div>
                        <div class="value">${data.firstName} ${data.lastName}</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="label">
                            📅 Geburtsdatum
                        </div>
                        <div class="value">${data.birthDate}</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="validity-dates-single">
                            <div class="validity-item-single">
                                <div class="label">🕐 Gültig von</div>
                                <div class="value">${validFrom}</div>
                            </div>
                            <div class="validity-item-single">
                                <div class="label">Gültig bis</div>
                                <div class="value">${validUntil}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-item">
                        <div class="label">
                            📍 Geltungsbereich
                        </div>
                        <div class="value">Deutschlandweit</div>
                    </div>
                    
                    <div class="info-item">
                        <div class="label">
                            🎫 Klasse
                        </div>
                        <div class="value">2. Klasse</div>
                    </div>
                </div>
                
                <div class="footer">
                    <div>Gilt bundesweit für beliebig viele Fahrten in allen Nahverkehrszügen, Verkehrsverbünden und teilnehmenden Verkehrsunternehmen. Nicht übertragbar, Umtausch und Erstattung des Tickets sind ausgeschlossen</div>
                    <div class="created-time">
                        <span>🕐</span>
                        <span>${new Date().toLocaleString('de-DE')}</span>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>`;

    const ticketsDir = path.join(__dirname, '../public/tickets');
    if (!fs.existsSync(ticketsDir)) {
        fs.mkdirSync(ticketsDir, { recursive: true });
    }


    const htmlPath = path.join(ticketsDir, `${data.id}.html`);
    fs.writeFileSync(htmlPath, template, 'utf8');
}




async function cleanupExpiredTickets() {
    try {
        console.log('🗑️ Запуск очистки просроченных билетов...');
        

        const tickets = await database.getAllTickets();
        const now = new Date();
        let deletedCount = 0;
        let deletedImagesCount = 0;
        let deletedHtmlCount = 0;
        
        for (const ticket of tickets) {
            try {

                const monthMap = {
                    'januar': 1, 'jan': 1,
                    'februar': 2, 'feb': 2,
                    'märz': 3, 'mar': 3, 'mrz': 3,
                    'april': 4, 'apr': 4,
                    'mai': 5,
                    'juni': 6, 'jun': 6,
                    'juli': 7, 'jul': 7,
                    'august': 8, 'aug': 8,
                    'september': 9, 'sep': 9, 'sept': 9,
                    'oktober': 10, 'okt': 10, 'oct': 10,
                    'november': 11, 'nov': 11,
                    'dezember': 12, 'dez': 12, 'dec': 12
                };
                
                const inputMonth = ticket.month ? ticket.month.toLowerCase().trim() : '';
                let monthNumber = 0; // 0 означает "месяц не определен"
                

                if (inputMonth) {
                    for (const [monthName, monthNum] of Object.entries(monthMap)) {
                        if (monthName === inputMonth || 
                            monthName.includes(inputMonth) || 
                            inputMonth.includes(monthName) ||
                            inputMonth.startsWith(monthName.substring(0, 3))) {
                            monthNumber = monthNum;
                            break;
                        }
                    }
                    

                    if (monthNumber === 0) {
                        const numericMonth = parseInt(inputMonth);
                        if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
                            monthNumber = numericMonth;
                        }
                    }
                }
                

                const createdAt = new Date(ticket.created_at);
                const currentDate = new Date();
                

                if (monthNumber === 0) {
                    const createdMonth = createdAt.getMonth() + 1;
                    

                    monthNumber = createdMonth + 1;
                    if (monthNumber > 12) {
                        monthNumber = 1;
                    }
                    
                    console.log(`⚠️ Месяц не определен для билета ${ticket.id}, используем автоматический: ${monthNumber}`);
                }
                

                let ticketMonth = monthNumber;
                let ticketYear = currentDate.getFullYear();
                

                const monthYearRegex = /(\d{4})/;
                const yearMatch = ticket.month ? ticket.month.match(monthYearRegex) : null;
                if (yearMatch) {
                    ticketYear = parseInt(yearMatch[1]);
                }
                

                if (!yearMatch) {

                    const createdYear = createdAt.getFullYear();
                    const createdMonth = createdAt.getMonth() + 1;
                    const currentYear = currentDate.getFullYear();
                    const currentMonth = currentDate.getMonth() + 1;
                    

                    const referenceDate = createdAt > currentDate ? createdAt : currentDate;
                    const referenceYear = referenceDate.getFullYear();
                    const referenceMonth = referenceDate.getMonth() + 1;
                    

                    if (ticketMonth < referenceMonth) {
                        ticketYear = referenceYear + 1;
                    } else {
                        ticketYear = referenceYear;
                    }
                }
                

                let expiryMonth = ticketMonth + 1;
                let expiryYear = ticketYear;
                
                if (expiryMonth > 12) {
                    expiryMonth = 1;
                    expiryYear = ticketYear + 1;
                }
                

                const expiryDate = new Date(expiryYear, expiryMonth - 1, 1, 3, 0, 0);
                

                if (now > expiryDate) {
                    let ticketDeleted = false;
                    

                    const htmlPath = path.join(__dirname, '../public/tickets', `${ticket.id}.html`);
                    if (fs.existsSync(htmlPath)) {
                        try {
                            fs.unlinkSync(htmlPath);
                            deletedHtmlCount++;
                            console.log(`📄 Удален HTML файл просроченного билета: ${ticket.id}.html`);
                        } catch (htmlError) {
                            console.error(`❌ Ошибка при удалении HTML файла ${ticket.id}.html:`, htmlError.message);
                        }
                    }
                    

                    const qrImagePath = ticket.qr_image_path || ticket.qrImagePath || ticket.qr_path || ticket.image_path;
                    if (qrImagePath) {
                        const imagePath = path.join(__dirname, '../public/images', qrImagePath);
                        if (fs.existsSync(imagePath)) {
                            try {
                                fs.unlinkSync(imagePath);
                                deletedImagesCount++;
                                console.log(`🖼️ Удалено QR изображение просроченного билета: ${qrImagePath}`);
                            } catch (imageError) {
                                console.error(`❌ Ошибка при удалении изображения ${qrImagePath}:`, imageError.message);
                            }
                        } else {
                            console.log(`⚠️ QR изображение просроченного билета не найдено на диске: ${qrImagePath}`);
                        }
                    } else {
                        console.log(`⚠️ QR изображение просроченного билета не указано в БД для билета ${ticket.id}`);
                    }
                    

                    try {
                        await database.deleteTicket(ticket.id);
                        ticketDeleted = true;
                        deletedCount++;
                    } catch (dbError) {
                        console.error(`❌ Ошибка при удалении просроченного билета из БД ${ticket.id}:`, dbError.message);
                    }
                    
                    if (ticketDeleted) {
                        const monthNames = {
                            1: 'Januar', 2: 'Februar', 3: 'März', 4: 'April',
                            5: 'Mai', 6: 'Juni', 7: 'Juli', 8: 'August',
                            9: 'September', 10: 'Oktober', 11: 'November', 12: 'Dezember'
                        };
                        
                        console.log(`✅ Полностью удален просроченный билет: ${ticket.id} (${ticket.first_name} ${ticket.last_name})`);
                        console.log(`   📅 Создан: ${createdAt.toLocaleDateString('de-DE')}`);
                        console.log(`   🗓️ Период действия: ${monthNames[ticketMonth]} ${ticketYear}`);
                        console.log(`   ⏰ Срок истек: ${expiryDate.toLocaleString('de-DE')}`);
                    }
                } else {

                    if (process.env.DEBUG_CLEANUP === 'true') {
                        const monthNames = {
                            1: 'Januar', 2: 'Februar', 3: 'März', 4: 'April',
                            5: 'Mai', 6: 'Juni', 7: 'Juli', 8: 'August',
                            9: 'September', 10: 'Oktober', 11: 'November', 12: 'Dezember'
                        };
                        console.log(`ℹ️ Билет ${ticket.id} (${monthNames[ticketMonth]} ${ticketYear}) действует до ${expiryDate.toLocaleString('de-DE')}`);
                    }
                }
                
            } catch (ticketError) {
                console.error(`❌ Ошибка при обработке билета ${ticket.id}:`, ticketError.message);
            }
        }
        

        if (deletedCount === 0) {
            console.log('✨ Просроченных билетов не найдено');
        } else {
            console.log('🎯 Очистка просроченных билетов завершена:');
            console.log(`   📋 Просроченных билетов удалено из БД: ${deletedCount}`);
            console.log(`   📄 HTML файлов просроченных билетов удалено: ${deletedHtmlCount}`);
            console.log(`   🖼️ QR изображений просроченных билетов удалено: ${deletedImagesCount}`);
        }
        

        
    } catch (error) {
        console.error('❌ Общая ошибка при очистке просроченных билетов:', error.message);
        

        if (error.message && error.message.includes('getAllTickets')) {
            console.log('💡 Убедитесь, что в вашем database модуле есть методы:');
            console.log('   - getAllTickets() - возвращает массив всех билетов');
            console.log('   - deleteTicket(id) - удаляет билет по ID');
        }
    }
}


setInterval(cleanupExpiredTickets, 6 * 60 * 60 * 1000);


setTimeout(cleanupExpiredTickets, 60 * 1000);


bot.command('cleanup', async (ctx) => {

    const adminIds = process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(id => parseInt(id.trim())) : [];
    
    if (adminIds.length > 0 && !adminIds.includes(ctx.from.id)) {
        return ctx.reply('❌ У вас нет прав для выполнения этой команды');
    }
    
    ctx.reply('🗑️ Запускаю очистку просроченных билетов...');
    
    try {
        await cleanupExpiredTickets();
        ctx.reply('✅ Очистка просроченных билетов завершена! Проверьте логи сервера для подробностей.');
    } catch (error) {
        console.error('Error in manual cleanup:', error);
        ctx.reply('❌ Произошла ошибка при очистке. Проверьте логи сервера.');
    }
});


bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    if (ctx && ctx.reply) {
        ctx.reply('Ein Fehler ist aufgetreten. Versuchen Sie es erneut mit dem Befehl /start');
    }
});


process.on('SIGINT', () => {
    console.log('🛑 Получен сигнал SIGINT, завершаю работу бота...');
    bot.stop('SIGINT');
    database.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Получен сигнал SIGTERM, завершаю работу бота...');
    bot.stop('SIGTERM');
    database.close();
    process.exit(0);
});

module.exports = bot;