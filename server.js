const express = require('express');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const bot = require('./bot/bot');
const database = require('./db/connect');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.get('/ticket/:id', async (req, res) => {
    try {
        const ticketId = req.params.id;
        
        const ticket = await database.getTicket(ticketId);
        
        if (!ticket) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Ticket nicht gefunden</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
                        
                        body {
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                            min-height: 100vh;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            color: white;
                            text-align: center;
                            margin: 0;
                            padding: 20px;
                            animation: gradientShift 6s ease infinite;
                        }
                        
                        @keyframes gradientShift {
                            0%, 100% { background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); }
                            50% { background: linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #667eea 100%); }
                        }
                        
                        .error {
                            background: rgba(255, 255, 255, 0.95);
                            backdrop-filter: blur(20px);
                            padding: 50px 40px;
                            border-radius: 24px;
                            box-shadow: 0 25px 50px rgba(0,0,0,0.2);
                            color: #1a202c;
                            max-width: 500px;
                            width: 100%;
                            position: relative;
                            overflow: hidden;
                        }
                        
                        .error::before {
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
                        
                        .error-icon {
                            font-size: 4rem;
                            margin-bottom: 20px;
                            display: block;
                        }
                        
                        h1 {
                            font-size: 28px;
                            font-weight: 600;
                            margin: 0 0 15px 0;
                            color: #e53e3e;
                        }
                        
                        p {
                            font-size: 16px;
                            line-height: 1.6;
                            margin: 0;
                            color: #4a5568;
                        }
                        
                        .error-code {
                            font-family: 'Monaco', 'Consolas', monospace;
                            background: rgba(113, 128, 150, 0.1);
                            padding: 8px 12px;
                            border-radius: 8px;
                            font-size: 14px;
                            margin-top: 15px;
                            display: inline-block;
                        }
                    </style>
                </head>
                <body>
                    <div class="error">
                        <span class="error-icon">🎫</span>
                        <h1>Ticket nicht gefunden</h1>
                        <p>Das Ticket mit der ID <span class="error-code">${ticketId}</span> existiert nicht oder wurde gelöscht.</p>
                    </div>
                </body>
                </html>
            `);
        }

        const htmlPath = path.join(__dirname, 'public/tickets', `${ticketId}.html`);
        
        if (!fs.existsSync(htmlPath)) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Datei nicht gefunden</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
                        
                        body {
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                            min-height: 100vh;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            color: white;
                            text-align: center;
                            margin: 0;
                            padding: 20px;
                            animation: gradientShift 6s ease infinite;
                        }
                        
                        @keyframes gradientShift {
                            0%, 100% { background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); }
                            50% { background: linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #667eea 100%); }
                        }
                        
                        .error {
                            background: rgba(255, 255, 255, 0.95);
                            backdrop-filter: blur(20px);
                            padding: 50px 40px;
                            border-radius: 24px;
                            box-shadow: 0 25px 50px rgba(0,0,0,0.2);
                            color: #1a202c;
                            max-width: 500px;
                            width: 100%;
                            position: relative;
                            overflow: hidden;
                        }
                        
                        .error::before {
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
                        
                        .error-icon {
                            font-size: 4rem;
                            margin-bottom: 20px;
                            display: block;
                        }
                        
                        h1 {
                            font-size: 28px;
                            font-weight: 600;
                            margin: 0 0 15px 0;
                            color: #e53e3e;
                        }
                        
                        p {
                            font-size: 16px;
                            line-height: 1.6;
                            margin: 0;
                            color: #4a5568;
                        }
                    </style>
                </head>
                <body>
                    <div class="error">
                        <span class="error-icon">📄</span>
                        <h1>Datei nicht gefunden</h1>
                        <p>Die HTML-Datei des Tickets existiert nicht oder wurde entfernt.</p>
                    </div>
                </body>
                </html>
            `);
        }

        res.sendFile(htmlPath);
        
    } catch (error) {
        console.error('Error serving ticket:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Serverfehler</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
                    
                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                        min-height: 100vh;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        color: white;
                        text-align: center;
                        margin: 0;
                        padding: 20px;
                        animation: gradientShift 6s ease infinite;
                    }
                    
                    @keyframes gradientShift {
                        0%, 100% { background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); }
                        50% { background: linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #667eea 100%); }
                    }
                    
                    .error {
                        background: rgba(255, 255, 255, 0.95);
                        backdrop-filter: blur(20px);
                        padding: 50px 40px;
                        border-radius: 24px;
                        box-shadow: 0 25px 50px rgba(0,0,0,0.2);
                        color: #1a202c;
                        max-width: 500px;
                        width: 100%;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .error::before {
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
                    
                    .error-icon {
                        font-size: 4rem;
                        margin-bottom: 20px;
                        display: block;
                    }
                    
                    h1 {
                        font-size: 28px;
                        font-weight: 600;
                        margin: 0 0 15px 0;
                        color: #e53e3e;
                    }
                    
                    p {
                        font-size: 16px;
                        line-height: 1.6;
                        margin: 0;
                        color: #4a5568;
                    }
                </style>
            </head>
            <body>
                <div class="error">
                    <span class="error-icon">⚠️</span>
                    <h1>Serverfehler</h1>
                    <p>Beim Laden des Tickets ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.</p>
                </div>
            </body>
            </html>
        `);
    }
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>QR-Ticket Generator</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    text-align: center;
                    margin: 0;
                    padding: 20px;
                    animation: gradientShift 6s ease infinite;
                }
                
                @keyframes gradientShift {
                    0%, 100% { background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); }
                    50% { background: linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #667eea 100%); }
                }
                
                .welcome {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    padding: 60px 50px;
                    border-radius: 24px;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.2);
                    color: #1a202c;
                    max-width: 600px;
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                }
                
                .welcome::before {
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
                
                .ticket-icon {
                    font-size: 5rem;
                    margin-bottom: 25px;
                    display: block;
                    animation: float 3s ease-in-out infinite;
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                h1 {
                    font-size: 36px;
                    font-weight: 700;
                    margin: 0 0 20px 0;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .subtitle {
                    font-size: 18px;
                    line-height: 1.6;
                    margin: 0 0 35px 0;
                    color: #4a5568;
                }
                
                .bot-link {
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    padding: 18px 40px;
                    text-decoration: none;
                    border-radius: 25px;
                    font-weight: 600;
                    font-size: 16px;
                    transition: all 0.3s ease;
                    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
                    position: relative;
                    overflow: hidden;
                }
                
                .bot-link:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
                }
                
                .bot-link::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transition: left 0.5s;
                }
                
                .bot-link:hover::before {
                    left: 100%;
                }
                
                .features {
                    margin-top: 40px;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                    text-align: left;
                }
                
                .feature {
                    padding: 15px;
                    background: rgba(102, 126, 234, 0.1);
                    border-radius: 12px;
                    border: 1px solid rgba(102, 126, 234, 0.2);
                }
                
                .feature-icon {
                    font-size: 24px;
                    margin-bottom: 8px;
                    display: block;
                }
                
                .feature-text {
                    font-size: 14px;
                    color: #4a5568;
                    font-weight: 500;
                }
                
                @media (max-width: 600px) {
                    .welcome {
                        padding: 40px 30px;
                    }
                    
                    h1 {
                        font-size: 28px;
                    }
                    
                    .subtitle {
                        font-size: 16px;
                    }
                    
                    .features {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div class="welcome">
                <span class="ticket-icon">🎫</span>
                <h1>QR-Ticket Generator</h1>
                <p class="subtitle">Erstellen Sie personalisierte Tickets mit QR-Codes über unseren Telegram Bot</p>
                
                <div class="features">
                    <div class="feature">
                        <span class="feature-icon">📱</span>
                        <div class="feature-text">Einfach über Telegram</div>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">🔒</span>
                        <div class="feature-text">Sichere QR-Codes</div>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">⚡</span>
                        <div class="feature-text">Sofortige Erstellung</div>
                    </div>
                </div>
                
                <a href="https://t.me/${process.env.BOT_USERNAME || 'YOUR_BOT_USERNAME'}" class="bot-link">
                    🤖 Bot starten
                </a>
            </div>
        </body>
        </html>
    `);
});

app.use(bot.webhookCallback('/webhook'));

app.listen(PORT, () => {
    console.log(`🚀 Server läuft auf Port ${PORT}`);
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    
    if (process.env.NODE_ENV !== 'production') {
        bot.launch({
            polling: true
        });
        console.log('🤖 Bot im Polling-Modus gestartet');
    }
});

process.once('SIGINT', () => {
    console.log('🛑 Bot wird gestoppt...');
    bot.stop('SIGINT');
    database.close();
});

process.once('SIGTERM', () => {
    console.log('🛑 Bot wird gestoppt...');
    bot.stop('SIGTERM');
    database.close();
});