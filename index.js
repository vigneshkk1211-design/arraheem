const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const express = require('express');

// Express setup for Render Web Service Port Binding
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.send('Arraheem WhatsApp Chatbot is running live!');
});
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

// Store Configurations & Admin Number
const STORE_NAME = "Arraheem Furnitures & Home Appliances";
const STORE_ADDRESS_EN = "Near Girls Hostel, Milagai Tottam, Kacharapalayam Road, Kallakurichi, Tamil Nadu – 606202";
const STORE_ADDRESS_TA = "பெண்கள் விடுதி அருகில், மிளகாய் தோட்டம், கச்சராபாளையம் ரோடு, கள்ளக்குறிச்சி, தமிழ்நாடு - 606202";
const STORE_PHONE = "+91 99650 25001";
const STORE_TIMINGS_EN = "9:00 AM to 9:30 PM (Open daily)";
const STORE_TIMINGS_TA = "காலை 9:00 மணி முதல் இரவு 9:30 மணி வரை (தினமும் திறந்திருக்கும்)";

const ADMIN_PHONE = "919965025001@s.whatsapp.net";

async function startWhatsAppBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "22.04.4"]
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
            console.log('✅ Arraheem WhatsApp Chatbot connected successfully!');
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
            `🏠 வணக்கம்! Arraheem Furnitures, கள்ளக்குறிச்சிக்கு உங்களை அன்புடன் வரவேற்கிறோம்!\n` +
            `✨ ஸ்டைலான பர்னிச்சர்கள், வீட்டு உபயோகப் பொருட்கள் மற்றும் முழுமையான ஹோம் சொல்யூஷன்களுக்கான ஒரே இடம். 🎯\n\n` +
            `😍 எங்களுடைய தயாரிப்புகள், பர்னிச்சர் கலெக்ஷன்ஸ், வீட்டு உபயோகப் பொருட்கள், இஎம்ஐ வசதிகள், திருமண சீர்வரிசை காம்போ பேக்கேஜ்கள், டெலிவரி மற்றும் காண்டாக்ட் விவரங்களை நீங்கள் தெரிந்துகொள்ள உதவ முடியும். 😊\n\n` +
            `கீழ்க்கண்ட பிரிவுகளைப் பார்க்கப் பெயரை டைப் செய்யவும்:\n` +
            `- bedroom\n` +
            `- ceiling\n` +
            `- dining\n` +
            `- fridge\n` +
            `- ac\n` +
            `- kitchen\n` +
            `- matters\n` +
            `- office\n` +
            `- sofa\n` +
            `- speaker\n` +
            `- tv\n` +
            `- address\n` +
            `- contact\n\n` +
            `தேவையானதின் பெயரை அனுப்பவும்!` :

            `🏠 Hi 👋 Welcome to Arraheem Furnitures, Kallakurichi!\n` +
            `✨ Your one-stop destination for stylish furniture, home appliances and complete home solutions.🎯\n\n` +
            `😍I can help you explore our products, furniture collections, home appliances, EMI options, Marriage Seervarisai Combo Bundles, delivery and contact details.😊\n\n` +
            `Type any category below to explore:\n` +
            `- bedroom\n` +
            `- ceiling\n` +
            `- dining\n` +
            `- fridge\n` +
            `- ac\n` +
            `- kitchen\n` +
            `- matters\n` +
            `- office\n` +
            `- sofa\n` +
            `- speaker\n` +
            `- tv\n` +
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

        // Auto-Welcome for ANY initial message (Hi, Hello, Everyone, etc.) or explicit triggers
        if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('menu') || lowerMsg.includes('வணக்கம்') || lowerMsg.includes('ஸ்டார்ட்') || lowerMsg.includes('start') || lowerMsg.includes('everyone') || lowerMsg.length > 0) {

            // Check if it's a specific category request first, otherwise send welcome
            if (lowerMsg.includes('sofa') || lowerMsg.includes('bedroom') || lowerMsg.includes('ceiling') || lowerMsg.includes('dining') || lowerMsg.includes('kitchen') || lowerMsg.includes('matters') || lowerMsg.includes('mattress') || lowerMsg.includes('office') || lowerMsg.includes('tv') || lowerMsg.includes('fridge') || lowerMsg.includes('ac') || lowerMsg.includes('speaker') || lowerMsg.includes('address') || lowerMsg.includes('contact')) {
                // Let it flow to category handlers below
            } else {
                await sendWelcomeMessage(senderID, userIsTamil);
                return;
            }
        }

        if (lowerMsg.includes('address') || lowerMsg.includes('முகவரி') || lowerMsg.includes('இடம்')) {
            let addrText = userIsTamil ?
                `📍 ஷோரூம் முகவரி விவரங்கள்:\n\nஇடம்: ${STORE_ADDRESS_TA}\nநேரம்: ${STORE_TIMINGS_TA}\n\nநமது ஷோரூமுக்கு நேரில் வருகை தந்து முழுமையான சேவைகளைப் பெறுக!` :
                `📍 Showroom Address Details:\n\nLocation: ${STORE_ADDRESS_EN}\nTimings: ${STORE_TIMINGS_EN}\n\nWe warmly invite you to visit our showroom for a grand experience!`;
            await sock.sendMessage(senderID, { text: addrText });
            return;
        }

        if (lowerMsg.includes('contact') || lowerMsg.includes('phone') || lowerMsg.includes('தொடர்பு') || lowerMsg.includes('நம்பர்')) {
            let contactText = userIsTamil ?
                `📞 தொடர்பு விவரங்கள்:\n\nஅலைபேசி எண்: ${STORE_PHONE}\nஎந்த நேரமும் எங்களைத் தொடர்பு கொள்ளலாம். உடனடி வாடிக்கையாளர் சேவை உண்டு!` :
                `📞 Customer Support Contact:\n\nMobile Number: ${STORE_PHONE}\nReach out to us anytime for instant assistance regarding orders and custom home solutions.`;
            await sock.sendMessage(senderID, { text: contactText });
            return;
        }

        if (lowerMsg.includes('sofa') || lowerMsg.includes('சோஃபா')) {
            let text = userIsTamil ?
                `🛋️ வரவேற்பறை சோஃபா தொகுப்புகள்:\n\nஅதிநவீன டிசைனில் தயாரிக்கப்பட்ட எல்-ஷேப் சோஃபா செட்கள் மற்றும் வசதியான ஆர்ம்செர்ஸ்.` :
                `🛋️ Living Room Sofa Collections:\n\nExplore our multi-seat premium fabric sectional and L-shaped sofas paired with modern plush velvet single armchairs.`;
            await sendCategoryImagesThenText(senderID, 'sofa', text);
        }
        else if (lowerMsg.includes('bedroom') || lowerMsg.includes('படுக்கையறை')) {
            let text = userIsTamil ?
                `🛏️ படுக்கையறை பர்னிச்சர் தொகுப்பு:\n\nஉறுதியான சாலிடீக் வுட் மற்றும் கிங் & குவீன் சைஸ் cots.` :
                `🛏️ Bedroom & Furniture Collection:\n\nTransform your sleeping space with our premium upholstered double beds and solid teak wood cots.`;
            await sendCategoryImagesThenText(senderID, 'bedroom', text);
        }
        else if (lowerMsg.includes('ceiling') || lowerMsg.includes('சீலிங்')) {
            let text = userIsTamil ?
                `🏠 சீலிங் இன்டீரியர் டிசைன்கள்:\n\nநவீன எல்இடி மற்றும் வார்ம் லைட்டிங் வசதியுடன் கூடிய ஃபால்ஸ் சீலிங் அமைப்புகள்.` :
                `🏠 Ceiling & Interior Solutions:\n\nModern false ceiling designs integrated with warm ambient strip lighting.`;
            await sendCategoryImagesThenText(senderID, 'ceiling', text);
        }
        else if (lowerMsg.includes('dining') || lowerMsg.includes('டைனிங்')) {
            let text = userIsTamil ?
                `🍽️ டைனிங் டேபிள் தொகுப்புகள்:\n\n4 மற்றும் 6 சீட்டர்களில் கிடைக்கக்கூடிய நவீன டைனிங் டேபிள்கள்.` :
                `🍽️ Dining Room Collections:\n\nEnhance your dining experience with our 4-to-6 seater modern dining tables and ergonomic chairs.`;
            await sendCategoryImagesThenText(senderID, 'dining', text);
        }
        else if (lowerMsg.includes('kitchen') || lowerMsg.includes('சமையலறை')) {
            let text = userIsTamil ?
                `🍳 சமையலறை தீர்வுகள்:\n\nகஸ்டம் மாடுலர் கிச்சன் செட்டப்புகள் மற்றும் ஸ்டோரேஜ் கேபினட்டுகள்.` :
                `🍳 Modular Kitchen Solutions:\n\nCustomized modular kitchen layouts featuring multi-tier storage cabinets.`;
            await sendCategoryImagesThenText(senderID, 'kitchen', text);
        }
        else if (lowerMsg.includes('matters') || lowerMsg.includes('mattress') || lowerMsg.includes('மெத்தை')) {
            let text = userIsTamil ?
                `🛏️ மெத்தைகள் (Mattresses):\n\nமுதுகுவலி மற்றும் உடல் சோர்வைப் போக்கக்கூடிய உயர் ரக ஆர்த்தோபெடிக் மெத்தைகள்.` :
                `🛏️ Comfort Mattresses Range:\n\nInvest in your health with our high-comfort orthopedic and memory foam mattresses.`;
            await sendCategoryImagesThenText(senderID, 'matters', text);
        }
        else if (lowerMsg.includes('office') || lowerMsg.includes('அலுவலகம்')) {
            let text = userIsTamil ?
                `💻 அலுவலக பர்னிச்சர்கள்:\n\nஎர்கோனாமிக் மெஷ் சேர்கள் மற்றும் வுட்டன் டெஸ்க்குகள்.` :
                `💻 Professional Office Furniture:\n\nBoost productivity with our ergonomic mesh desk chairs and wooden office desks.`;
            await sendCategoryImagesThenText(senderID, 'office', text);
        }
        else if (lowerMsg.includes('tv') || lowerMsg.includes('டிவி')) {
            let text = userIsTamil ?
                `📺 ஸ்மார்ட் தொலைக்காட்சி பெட்டிகள்:\n\nஉயர் தெளிவுத்திறன் மற்றும் சிறந்த சவுண்ட் குவாலிட்டியுடன் கூடிய லேட்டஸ்ட் ஸ்மார்ட் டிவிகள்.` :
                `📺 Smart TV Collections:\n\nImmerse yourself in crystal-clear entertainment with our high-definition Smart TVs.`;
            await sendCategoryImagesThenText(senderID, 'tv', text);
        }
        else if (lowerMsg.includes('fridge') || lowerMsg.includes('பிரிட்ஜ்')) {
            let text = userIsTamil ?
                `🧊 குளிர்சாதனப் பெட்டிகள் (Refrigerators):\n\nமின்சாரத்தைச் சேமிக்கக்கூடிய முன்னணி பிராண்டுகளின் பிரிட்ஜ்கள்.` :
                `🧊 Energy-Efficient Refrigerators:\n\nKeep your food fresh with our selection of refrigerators from leading brands.`;
            await sendCategoryImagesThenText(senderID, 'fridge', text);
        }
        else if (lowerMsg.includes('ac') || lowerMsg.includes('air conditioner')) {
            let text = userIsTamil ?
                `❄️ ஏர் கண்டிஷனர்கள் (AC):\n\nகோடைகாலத்தை எதிர்கொள்ளக் குளுகுளு வசதியுடன் கூடிய அதிநவீன இன்வெர்ட்டர் ஏசிகள்.` :
                `❄️ Air Conditioners (AC):\n\nBeat the heat with our energy-efficient inverter ACs providing rapid cooling.`;
            await sendCategoryImagesThenText(senderID, 'ac', text);
        }
        else if (lowerMsg.includes('speaker') || lowerMsg.includes('ஸ்பீக்கர்')) {
            let text = userIsTamil ?
                `🔊 ஹோம் ஆடியோ ஸ்பீக்கர்கள்:\n\nதிரையரங்கு போன்ற அனுபவத்தைத் தரும் ஹோம் தியேட்டர் சிஸ்டம்கள்.` :
                `🔊 Home Audio Systems & Speakers:\n\nExperience theatre-like acoustics at home with our high-bass home theater systems.`;
            await sendCategoryImagesThenText(senderID, 'speaker', text);
        }
        else {
            // Default fallback: send Welcome Message first, then notify admin
            await sendWelcomeMessage(senderID, userIsTamil);

            let adminAlert = `🚨 *New Unmatched Query Alert!*\n\nFrom User: ${senderID}\nMessage: "${msgBody}"`;
            await sock.sendMessage(ADMIN_PHONE, { text: adminAlert });
        }
    });
}

startWhatsAppBot();