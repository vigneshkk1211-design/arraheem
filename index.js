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
            `வணக்கம்! Arraheem Furnitures, கள்ளக்குறிச்சிக்கு உங்களை அன்புடன் வரவேற்கிறோம்.\n\n` +
            `எங்களிடம் பிரீமியம் ரக பர்னிச்சர்கள் மற்றும் வீட்டு உபயோகப் பொருட்கள் சிறந்த தரத்தில் கிடைக்கின்றன.\n\n` +
            `கீழ்க்கண்ட பிரிவுகளைப் பார்வையிட அதன் பெயரை அனுப்பவும்:\n` +
            `- bedroom (படுக்கையறை பர்னிச்சர் தொகுப்பு)\n` +
            `- ceiling (நவீன சீலிங் இன்டீரியர் டிசைன்கள்)\n` +
            `- dining (குடும்பத்துடன் அமர்ந்து உண்ண டைனிங் டேபிள்கள்)\n` +
            `- fridge (குளிர்சாதனப் பெட்டிகள்)\n` +
            `- kitchen (மாடுலர் சமையலறை தீர்வுகள்)\n` +
            `- matters (ஆர்த்தோபெடிக் மற்றும் லக்சுரி மெத்தைகள்)\n` +
            `- office (அலுவலகப் பயன்பாட்டுப் பொருட்கள்)\n` +
            `- sofa (வரவேற்பறை சோஃபா செட்கள்)\n` +
            `- speaker (ஹோம் ஆடியோ ஸ்பீக்கர்கள்)\n` +
            `- tv (ஸ்மார்ட் தொலைக்காட்சி பெட்டிகள்)\n` +
            `- address (ஷோரூம் முகவரி விவரங்கள்)\n` +
            `- contact (தொடர்பு எண்கள்)\n\n` +
            `உங்களுக்குத் தேவையான பிரிவின் பெயரை டைப் செய்யவும்.` :

            `Welcome to Arraheem Furnitures, Kallakurichi.\n\n` +
            `We specialize in luxury wooden furniture, customized home decor layouts, and essential household electronics.\n\n` +
            `Please type any of the categories below to explore our collections:\n` +
            `- bedroom (Premium double beds and solid wood cots)\n` +
            `- ceiling (Modern false ceiling interior solutions)\n` +
            `- dining (Elegant 4-to-6 seater dining tables)\n` +
            `- fridge (Energy-efficient refrigerators)\n` +
            `- kitchen (Modular kitchen storage and setups)\n` +
            `- matters (High-comfort orthopedic mattresses)\n` +
            `- office (Ergonomic office and desk chairs)\n` +
            `- sofa (Luxury sectional and L-shaped sofas)\n` +
            `- speaker (High-bass home audio speaker systems)\n` +
            `- tv (High-definition Smart TVs)\n` +
            `- address (Showroom physical location details)\n` +
            `- contact (Primary customer support numbers)\n\n` +
            `Type a category name to view model images and complete descriptions.`;

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
                `ஷோரூம் முகவரி விவரங்கள்:\n\nஇடம்: ${STORE_ADDRESS_TA}\nபார்வையிடும் நேரம்: ${STORE_TIMINGS_TA}\n\nநமது ஷோரூமுக்கு நேரில் வருகை தந்து முழுமையான சேவைகளைப் பெறுக.` :
                `Showroom Address Details:\n\nLocation: ${STORE_ADDRESS_EN}\nTimings: ${STORE_TIMINGS_EN}\n\nWe warmly invite you to visit our showroom for a grand experience.`;
            await sock.sendMessage(senderID, { text: addrText });
            return;
        }

        if (lowerMsg.includes('contact') || lowerMsg.includes('phone') || lowerMsg.includes('தொடர்பு') || lowerMsg.includes('நம்பர்')) {
            let contactText = userIsTamil ?
                `தொடர்பு விவரங்கள்:\n\nஅலைபேசி எண்: ${STORE_PHONE}\nஎந்த நேரமும் எங்களைத் தொடர்பு கொள்ளலாம். உடனடி வாடிக்கையாளர் சேவை உண்டு.` :
                `Customer Support Contact:\n\nMobile Number: ${STORE_PHONE}\nReach out to us anytime for instant assistance regarding orders and custom home solutions.`;
            await sock.sendMessage(senderID, { text: contactText });
            return;
        }

        if (lowerMsg.includes('sofa') || lowerMsg.includes('சோஃபா')) {
            let text = userIsTamil ?
                `வரவேற்பறை சோஃபா தொகுப்புகள்:\n\nஅதிநவீன டிசைனில் தயாரிக்கப்பட்ட எல்-ஷேப் சோஃபா செட்கள் மற்றும் வசதியான ஆர்ம்செர்ஸ். உங்கள் வீட்டின் ஹாலுக்கு கூடுதல் அழகு சேர்க்கும் பிரீமியம் தயாரிப்புகள்.` :
                `Living Room Sofa Collections:\n\nExplore our multi-seat premium fabric sectional and L-shaped sofas paired with modern plush velvet single armchairs and dual-tier wooden center coffee tables.`;
            await sendCategoryImagesThenText(senderID, 'sofa', text);
        }
        else if (lowerMsg.includes('bedroom') || lowerMsg.includes('படுக்கையறை')) {
            let text = userIsTamil ?
                `படுக்கையறை பர்னிச்சர் தொகுப்பு:\n\nஉறுதியான சாலிடீக் வுட் மற்றும் கிங் & குவீன் சைஸ் cots. கண்கவர் வெர்டிகல் டஃப্টেட் ஹெட்ரெஸ்ட்களுடன் கூடிய பிரீமியம் டபுள் பெட்கள்.` :
                `Bedroom & Furniture Collection:\n\nTransform your sleeping space with our premium upholstered double beds, vertical tufted headboards, and solid teak wood cots built for absolute comfort.`;
            await sendCategoryImagesThenText(senderID, 'bedroom', text);
        }
        else if (lowerMsg.includes('ceiling') || lowerMsg.includes('சீலிங்')) {
            let text = userIsTamil ?
                `சீலிங் இன்டீரியர் டிசைன்கள்:\n\nநவீன எல்இடி மற்றும் வார்ம் லைட்டிங் வசதியுடன் கூடிய ஃபால்ஸ் சீலிங் அமைப்புகள். உங்கள் வீட்டின் உட்புறத் தோற்றத்தை முழுமையாக மாற்றியமைக்கும்.` :
                `Ceiling & Interior Solutions:\n\nModern false ceiling designs integrated with warm ambient strip lighting and professional finishes to elevate your home aesthetics.`;
            await sendCategoryImagesThenText(senderID, 'ceiling', text);
        }
        else if (lowerMsg.includes('dining') || lowerMsg.includes('டைனிங்')) {
            let text = userIsTamil ?
                `டைனிங் டேபிள் தொகுப்புகள்:\n\n4 மற்றும் 6 சீட்டர்களில் கிடைக்கக்கூடிய நவீன டைனிங் டேபிள்கள். குஷன் செய்யப்பட்ட சேர்கள் மற்றும் ஃபைன்-பினிஷ் வுட்டன் மேற்பரப்புடன் கூடியவை.` :
                `Dining Room Collections:\n\nEnhance your dining experience with our 4-to-6 seater modern dining tables, ergonomic cushioned high-back chairs, and fine-finish solid wood surfaces.`;
            await sendCategoryImagesThenText(senderID, 'dining', text);
        }
        else if (lowerMsg.includes('kitchen') || lowerMsg.includes('சமையலறை')) {
            let text = userIsTamil ?
                `சமையலறை தீர்வுகள்:\n\nகஸ்டம் மாடுலர் கிச்சன் செட்டப்புகள், பல அடுக்கு ஸ்டோரேஜ் கேபினட்டுகள் மற்றும் நவீன உபகரண ஃபிட்டிங்குகளுடன் உங்கள் சமையலறையை எளிமையாக்குங்கள்.` :
                `Modular Kitchen Solutions:\n\nCustomized modular kitchen layouts featuring multi-tier storage cabinets and smart fittings designed for an organized and efficient cooking experience.`;
            await sendCategoryImagesThenText(senderID, 'kitchen', text);
        }
        else if (lowerMsg.includes('matters') || lowerMsg.includes('mattress') || lowerMsg.includes('மெத்தை')) {
            let text = userIsTamil ?
                `மெத்தைகள் (Mattresses):\n\nமுதுகுவலி மற்றும் உடல் சோர்வைப் போக்கக்கூடிய உயர் ரக ஆர்த்தோபெடிக், மெமரி ஃபோம் மற்றும் காயிர் மெத்தைகள்.` :
                `Comfort Mattresses Range:\n\nInvest in your health with our high-comfort orthopedic, memory foam, and coir mattresses engineered for optimum spine support and restful sleep.`;
            await sendCategoryImagesThenText(senderID, 'matters', text);
        }
        else if (lowerMsg.includes('office') || lowerMsg.includes('அலுவலகம்')) {
            let text = userIsTamil ?
                `அலுவலக பர்னிச்சர்கள்:\n\nநீண்ட நேரம் வேலை செய்ய ஏதுவான எர்கோனாமிக் மெஷ் சேர்கள், லெதர் எக்ஸிகியூட்டிவ் டெஸ்க்குகள் மற்றும் கம்ப்யூட்டர் வொர்க்ஸ்டேஷன்கள்.` :
                `Professional Office Furniture:\n\nBoost productivity with our ergonomic mesh and leather executive desk chairs, sturdy computer workstations, and professional wooden office desks.`;
            await sendCategoryImagesThenText(senderID, 'office', text);
        }
        else if (lowerMsg.includes('tv') || lowerMsg.includes('டிவி')) {
            let text = userIsTamil ?
                `ஸ்மார்ட் தொலைக்காட்சி பெட்டிகள்:\n\nஉயர் தெளிவுத்திறன் (High-Definition) மற்றும் சிறந்த சவுண்ட் குவாலிட்டியுடன் கூடிய லேட்டஸ்ட் ஸ்மார்ட் டிவிகள் கம்பெனி வாரண்டியுடன்.` :
                `Smart TV Collections:\n\nImmerse yourself in crystal-clear entertainment with our high-definition Smart TVs equipped with advanced features and reliable manufacturer warranty.`;
            await sendCategoryImagesThenText(senderID, 'tv', text);
        }
        else if (lowerMsg.includes('fridge') || lowerMsg.includes('பிரிட்ஜ்')) {
            let text = userIsTamil ?
                `குளிர்சாதனப் பெட்டிகள் (Refrigerators):\n\nமின்சாரத்தைச் சேமிக்கக்கூடிய முன்னணி பிராண்டுகளின் சிங்கிள் மற்றும் டபுள் டோர் பிரிட்ஜ்கள்.` :
                `Energy-Efficient Refrigerators:\n\nKeep your food fresh and beverages chilled with our selection of single and double-door refrigerators from leading trusted brands.`;
            await sendCategoryImagesThenText(senderID, 'fridge', text);
        }
        else if (lowerMsg.includes('speaker') || lowerMsg.includes('ஸ்பீக்கர்')) {
            let text = userIsTamil ?
                `ஹோம் ஆடியோ ஸ்பீக்கர்கள்:\n\nதிரையரங்கு போன்ற அனுபவத்தைத் தரும் அதிநவீன ஹோம் தியேட்டர் சிஸ்டம்கள் மற்றும் ப்ளூடூத் ஸ்பீக்கர்கள்.` :
                `Home Audio Systems & Speakers:\n\nExperience theatre-like acoustics at home with our high-bass home theater systems and portable Bluetooth speakers.`;
            await sendCategoryImagesThenText(senderID, 'speaker', text);
        }
        else {
            let userReply = userIsTamil ?
                `மன்னிக்கவும், தாங்கள் கேட்ட தகவல் எங்கள் தானியங்கிப் பட்டியலில் இல்லை. உங்களது செய்தி எங்கள் கடையின் முதன்மை நிர்வாகிக்கு (Admin) அனுப்பப்பட்டுள்ளது. அவர்கள் விரைவில் உங்களைத் தொடர்பு கொண்டு விளக்கம் அளிப்பார்கள்.` :
                `Sorry, the requested item is not currently listed in our automated directory. Your message has been forwarded to our showroom admin. They will get in touch with you shortly.`;

            await sock.sendMessage(senderID, { text: userReply });

            let adminAlert = `🚨 *New Unmatched Query Alert!*\n\nFrom User: ${senderID}\nMessage: "${msgBody}"`;
            await sock.sendMessage(ADMIN_PHONE, { text: adminAlert });
        }
    });
}

startWhatsAppBot();