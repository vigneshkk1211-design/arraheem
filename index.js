const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Store Configurations & Admin Number (Replace with your admin WhatsApp number including country code, e.g., 919965025001)
const STORE_NAME = "Arraheem Furnitures & Home Appliances";
const STORE_ADDRESS_EN = "Near Girls Hostel, Milagai Tottam, Kacharapalayam Road, Kallakurichi, Tamil Nadu – 606202";
const STORE_ADDRESS_TA = "பெண்கள் விடுதி அருகில், மிளகாய் தோட்டம், கச்சராபாளையம் ரோடு, கள்ளக்குறிச்சி, தமிழ்நாடு - 606202";
const STORE_PHONE = "+91 99650 25001";
const STORE_TIMINGS_EN = "9:00 AM to 9:30 PM (Open daily)";
const STORE_TIMINGS_TA = "காலை 9:00 மணி முதல் இரவு 9:30 மணி வரை (தினமும் திறந்திருக்கும்)";

const ADMIN_PHONE = "919965025001@s.whatsapp.net"; // உங்கள் அட்மின் வாட்ஸ்அப் எண்ணை இங்கே மாற்றிக் கொள்ளவும்

const welcomedUsers = new Set();

async function startWhatsAppBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('📱 Scan this QR code using your WhatsApp:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed, reconnecting...', shouldReconnect);
            if (shouldReconnect) {
                startWhatsAppBot();
            }
        } else if (connection === 'open') {
            console.log('✅ Arraheem WhatsApp Chatbot connected successfully with Admin Notification!');
        }
    });

    async function sendCategoryImagesThenText(senderID, folderName, descriptionText) {
        try {
            const folderPath = path.join(__dirname, 'images', folderName);
            if (fs.existsSync(folderPath)) {
                const files = fs.readdirSync(folderPath);
                const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp|avif)$/i.test(file));

                if (imageFiles.length > 0) {
                    for (let i = 0; i < imageFiles.length; i++) {
                        const imagePath = path.join(folderPath, imageFiles[i]);
                        const buffer = fs.readFileSync(imagePath);
                        await sock.sendMessage(senderID, { image: buffer });
                    }
                }
            }
            await sock.sendMessage(senderID, { text: descriptionText });
        } catch (err) {
            console.error(`Error sending folder ${folderName}:`, err);
            await sock.sendMessage(senderID, { text: descriptionText });
        }
    }

    async function sendWelcomeMessage(senderID, isTamilUser) {
        try {
            const folderPath = path.join(__dirname, 'images', 'welcome');
            if (fs.existsSync(folderPath)) {
                const files = fs.readdirSync(folderPath);
                const imageFile = files.find(file => /\.(jpg|jpeg|png|webp|avif)$/i.test(file));
                if (imageFile) {
                    const buffer = fs.readFileSync(path.join(folderPath, imageFile));
                    await sock.sendMessage(senderID, { image: buffer });
                }
            }
        } catch (err) {
            console.error("Error sending welcome image:", err);
        }

        let welcomeText = isTamilUser ?
            `வணக்கம்! Arraheem Furnitures, கள்ளக்குறிச்சிக்கு உங்களை அன்புடன் வரவேற்கிறோம்!\n\n` +
            `ஸ்டைலான பர்னிச்சர்கள் மற்றும் வீட்டு உபயோகப் பொருட்களுக்கான சிறந்த இடம்.\n\n` +
            `கீழ்க்கண்ட பிரிவுகளைப் பார்க்கப் பெயரை டைப் செய்யவும்:\n` +
            `- bedroom (படுக்கையறை)\n` +
            `- ceiling (சீலிங் டிசைன்)\n` +
            `- dining (டைனிங் டேபிள்)\n` +
            `- fridge (பிரிட்ஜ்)\n` +
            `- kitchen (சமையலறை)\n` +
            `- matters (மெத்தைகள்)\n` +
            `- office (அலுவலகம்)\n` +
            `- sofa (சோஃபா)\n` +
            `- speaker (ஸ்பீக்கர்)\n` +
            `- tv (டிவி)\n` +
            `- washing (வாஷிங் மெஷின்)\n` +
            `- address (முகவரி)\n` +
            `- contact (தொடர்பு எண்)\n\n` +
            `தேவையானதின் பெயரை அனுப்பவும்!` :

            `Hi! Welcome to Arraheem Furnitures, Kallakurichi!\n\n` +
            `Your destination for stylish furniture and home appliances.\n\n` +
            `Type any category below to explore:\n` +
            `- bedroom\n` +
            `- ceiling\n` +
            `- dining\n` +
            `- fridge\n` +
            `- kitchen\n` +
            `- matters\n` +
            `- office\n` +
            `- sofa\n` +
            `- speaker\n` +
            `- tv\n` +
            `- washing\n` +
            `- address\n` +
            `- contact\n\n` +
            `Type a category name to view details!`;

        await sock.sendMessage(senderID, { text: welcomeText });
    }

    function isTamil(text) {
        const tamilRegex = /[\u0B80-\u0BFF]/;
        return tamilRegex.test(text) || text.toLowerCase().includes('வணக்கம்') || text.toLowerCase().includes('தமிழ்');
    }

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const senderID = msg.key.remoteJid;
        const messageType = Object.keys(msg.message)[0];

        let msgBody = "";
        if (messageType === 'conversation') {
            msgBody = msg.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            msgBody = msg.message.extendedTextMessage.text;
        } else {
            return;
        }

        const lowerMsg = msgBody.trim().toLowerCase();
        let userIsTamil = isTamil(msgBody);

        if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('menu') || lowerMsg.includes('வணக்கம்') || lowerMsg.includes('ஸ்டார்ட்') || lowerMsg.includes('start')) {
            welcomedUsers.add(senderID);
            await sendWelcomeMessage(senderID, userIsTamil);
            return;
        }

        if (lowerMsg.includes('address') || lowerMsg.includes('முகவரி') || lowerMsg.includes('இடம்')) {
            let addrText = userIsTamil ?
                `📍 முகவரி:\n${STORE_ADDRESS_TA}\n⏰ நேரம்: ${STORE_TIMINGS_TA}` :
                `📍 Store Address:\n${STORE_ADDRESS_EN}\n⏰ Timings: ${STORE_TIMINGS_EN}`;
            await sock.sendMessage(senderID, { text: addrText });
            return;
        }

        if (lowerMsg.includes('contact') || lowerMsg.includes('phone') || lowerMsg.includes 'தொடர்பு' || lowerMsg.includes('நம்பர்')) {
        let contactText = userIsTamil ?
            `📞 தொடர்பு எண்:\n${STORE_PHONE}\nஎங்களை எப்போது வேண்டுமானாலும் அழைக்கலாம்!` :
            `📞 Contact Number:\n${STORE_PHONE}\nFeel free to call us anytime!`;
        await sock.sendMessage(senderID, { text: contactText });
        return;
    }

    if (lowerMsg.includes('sofa') || lowerMsg.includes('சோஃபா')) {
        let text = userIsTamil ?
            `🛋️ சோஃபா கலெக்ஷன்ஸ்:\nபிரீமியம் எல்-ஷேப் சோஃபா செட்கள் மற்றும் மாடர்ன் வெல்வெட் ஆர்ம்செர்ஸ்.` :
            `🛋️ Sofas Collections:\nMulti-seat premium fabric sectional & L-shaped sofas with plush velvet finish.`;
        await sendCategoryImagesThenText(senderID, 'sofa', text);
    }
    else if (lowerMsg.includes('bedroom') || lowerMsg.includes('படுக்கையறை')) {
        let text = userIsTamil ?
            `🛏️ படுக்கையறை & மெத்தைகள்:\nபிரீமியம் டபுள் பெட்கள் மற்றும் சாலிடீக் வுட் காட்ஸ்.` :
            `🛏️ Bedroom & Mattresses:\nPremium upholstered double beds and solid teak wood cots.`;
        await sendCategoryImagesThenText(senderID, 'bedroom', text);
    }
    else if (lowerMsg.includes('ceiling') || lowerMsg.includes('சீலிங்')) {
        let text = userIsTamil ?
            `🏠 சீலிங் டிசைன்கள்:\nநவீன எல்இடி லைட்டிங் கொண்ட ஃபால்ஸ் சீலிங் சொல்யூஷன்கள்.` :
            `🏠 Ceiling Designs:\nModern false ceiling solutions with integrated warm lighting.`;
        await sendCategoryImagesThenText(senderID, 'ceiling', text);
    }
    else if (lowerMsg.includes('dining') || lowerMsg.includes('டைனிங்')) {
        let text = userIsTamil ?
            `🍽️ டைனிங் கலெக்ஷன்ஸ்:\nமாடர்ன் டைனிங் டேபிள்கள் மற்றும் குஷன் செய்யப்பட்ட சேர்கள்.` :
            `🍽️ Dining Collections:\nModern dining tables paired with cushioned high-back chairs.`;
        await sendCategoryImagesThenText(senderID, 'dining', text);
    }
    else if (lowerMsg.includes('kitchen') || lowerMsg.includes('சமையலறை')) {
        let text = userIsTamil ?
            `🍳 சமையலறை தீர்வுகள்:\nமாடுலர் கிச்சன் செட்டப்புகள் மற்றும் ஸ்டோரேஜ் கேபினட்டுகள்.` :
            `🍳 Kitchen Solutions:\nCustom modular kitchen setups and multi-tier storage cabinets.`;
        await sendCategoryImagesThenText(senderID, 'kitchen', text);
    }
    else if (lowerMsg.includes('matters') || lowerMsg.includes('mattress') || lowerMsg.includes('மெத்தை')) {
        let text = userIsTamil ?
            `🛏️ மெத்தைகள்:\nஉயர் ரக ஆர்த்தோபெடிக் மற்றும் மெமரி ஃபோம் மெத்தைகள்.` :
            `🛏️ Mattresses Collections:\nHigh-comfort orthopedic and memory foam mattresses.`;
        await sendCategoryImagesThenText(senderID, 'matters', text);
    }
    else if (lowerMsg.includes('office') || lowerMsg.includes('அலுவலகம்')) {
        let text = userIsTamil ?
            `💻 அலுவலக பர்னிச்சர்கள்:\nஎர்கோனாமிக் டெஸ்க் சேர்கள் மற்றும் வுட்டன் டெஸ்க்குகள்.` :
            `💻 Office Furniture:\nErgonomic desk chairs and executive wooden desks.`;
        await sendCategoryImagesThenText(senderID, 'office', text);
    }
    else if (lowerMsg.includes('tv') || lowerMsg.includes('டிவி')) {
        let text = userIsTamil ?
            `📺 ஸ்மார்ட் டிவி கலெக்ஷன்ஸ்:\nகம்பெனி வாரண்டியுடன் உயர் தெளிவுத்திறன் கொண்ட ஸ்மார்ட் டிவிகள்.` :
            `📺 Smart TV Collections:\nHigh-definition Smart TVs with advanced features and warranty.`;
        await sendCategoryImagesThenText(senderID, 'tv', text);
    }
    else if (lowerMsg.includes('fridge') || lowerMsg.includes('பிரிட்ஜ்')) {
        let text = userIsTamil ?
            `🧊 குளிர்சாதனப் பெட்டிகள்:\nசிறந்த பிராண்டுகளின் சிங்கிள் மற்றும் டபுள் டோர் பிரிட்ஜ்கள்.` :
            `🧊 Refrigerators:\nEnergy-efficient single and double-door refrigerators.`;
        await sendCategoryImagesThenTest = false; // dummy guard
        await sendCategoryImagesThenText(senderID, 'fridge', text);
    }
    else if (lowerMsg.includes('washing') || lowerMsg.includes('வாஷிங்')) {
        let text = userIsTamil ?
            `🌀 வாஷிங் மெஷின்கள்:\nஆட்டோமேட்டிக் வாஷிங் மெஷின்கள் சிறந்த துணி துவைக்கும் வசதியுடன்.` :
            `🌀 Washing Machines:\nFully automatic washing machines for powerful cleaning.`;
        await sendCategoryImagesThenText(senderID, 'washing', text);
    }
    else if (lowerMsg.includes('speaker') || lowerMsg.includes('ஸ்பீக்கர்')) {
        let text = userIsTamil ?
            `🔊 ஸ்பீக்கர்கள்:\nஹோம் தியேட்டர் மற்றும் ப்ளூடூத் ஸ்பீக்கர்கள்.` :
            `🔊 Home Audio Speakers:\nHigh-bass home theater systems and bluetooth speakers.`;
        await sendCategoryImagesThenText(senderID, 'speaker', text);
    }
    else {
        // Unmatched / Invalid Query -> Notify Admin and reply to user
        let userReply = userIsTamil ?
            `மன்னிக்கவும், உங்கள் கேள்விக்குரிய தகவல் எங்கள் பட்டியலில் இல்லை. உங்களது கோரிக்கை எங்கள் அட்மினுக்கு அனுப்பப்பட்டுள்ளது. விரைவில் உங்களைத் தொடர்புகொள்வார்கள்!` :
            `Sorry, I couldn't understand your query. Your request has been forwarded to our admin. They will contact you soon!`;

        await sock.sendMessage(senderID, { text: userReply });

        // Send notification to Admin number
        let adminAlert = `🚨 *New Unmatched Query Alert!*\n\nFrom User: ${senderID}\nMessage: "${msgBody}"`;
        await sock.sendMessage(ADMIN_PHONE, { text: adminAlert });
    }
});
}

startWhatsAppBot();