const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // For sending images/messages via WhatsApp API
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Store Configurations
const STORE_NAME = "Arraheem Furnitures & Home Appliances";
const STORE_ADDRESS_EN = "Near Girls Hostel, Milagai Tottam, Kacharapalayam Road, Kallakurichi, Tamil Nadu – 606202";
const STORE_ADDRESS_TA = "பெண்கள் விடுதி அருகில், மிளகாய் தோட்டம், கச்சராபாளையம் ரோடு, கள்ளக்குறிச்சி, தமிழ்நாடு - 606202";
const STORE_PHONE = "+91 99650 25001";
const STORE_TIMINGS_EN = "9:00 AM to 9:30 PM (Open daily)";
const STORE_TIMINGS_TA = "காலை 9:00 மணி முதல் இரவு 9:30 மணி வரை (தினமும் திறந்திருக்கும்)";
const POWERED_BY = "GLOARO PVT LTD";

// WhatsApp Cloud API Credentials (Update your token and phone number ID in .env)
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// Webhook Verification
app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "arraheem_token";
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Message Handling Webhook
app.post('/webhook', async (req, res) => {
    let body = req.body;

    if (body.object === 'whatsapp_business_account') {
        for (let entry of body.entry) {
            for (let change of entry.changes) {
                let value = change.value;
                if (value.messages && value.messages[0]) {
                    let phoneNumberId = value.metadata.phone_number_id;
                    let from = value.messages[0].from; // User phone number
                    let msgBody = value.messages[0].text ? value.messages[0].text.body.trim() : '';

                    await handleIncomingMessage(from, msgBody, phoneNumberId);
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Detect if text contains Tamil characters
function isTamil(text) {
    const tamilRegex = /[\u0B80-\u0BFF]/;
    return tamilRegex.test(text);
}

async function sendWhatsAppMessage(to, phoneNumberId, textMessage) {
    if (!TOKEN || !PHONE_NUMBER_ID) {
        console.log(`[Simulated WhatsApp Send to ${to}]:\n${textMessage}`);
        return;
    }
    try {
        await axios({
            method: 'POST',
            url: `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: {
                messaging_product: "whatsapp",
                to: to,
                type: "text",
                text: { body: textMessage }
            }
        });
    } catch (error) {
        console.error("Error sending WhatsApp message:", error.response?.data || error.message);
    }
}

async function handleIncomingMessage(to, message, phoneNumberId) {
    let lowerMsg = message.toLowerCase();
    let userIsTamil = isTamil(message) || lowerMsg.includes('வணக்கம்') || lowerMsg.includes('தமிழ்');

    let responseText = "";

    if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('menu') || lowerMsg.includes('வணக்கம்') || lowerMsg.includes('ஸ்டார்ட்')) {
        if (userIsTamil) {
            responseText = `🌟 *${STORE_NAME}*-க்கு உங்களை அன்புடன் வரவேற்கிறோம்! 🛋️✨\n` +
                `संचालन: *${POWERED_BY}*\n\n` +
                `📍 முகவரி: ${STORE_ADDRESS_TA}\n` +
                `📞 தொடர்பு எண்: ${STORE_PHONE}\n` +
                `⏰ நேரம்: ${STORE_TIMINGS_TA}\n\n` +
                `👇 கீழே உள்ள பட்டியலிலிருந்து (List) உங்களுக்குத் தேவையான பிரிவைத் தேர்ந்தெடுக்கவும்:\n\n` +
                `1️⃣ *ஹால் மற்றும் சோஃபா செட்கள்* (Living Room / Sofas)\n` +
                `2️⃣ *படுக்கையறை மற்றும் மெத்தைகள்* (Bedroom & Mattresses)\n` +
                `3️⃣ *டைனிங் டேபிள் கலெக்ஷன்ஸ்* (Dining Collections)\n` +
                `4️⃣ *வார்ட்ரோப் மற்றும் கிச்சன் ஸ்டோரேஜ்* (Storage & Kitchen)\n` +
                `5️⃣ *ஆபீஸ் பர்னிச்சர்கள்* (Office Furniture)\n` +
                `6️⃣ *வீட்டு உபயோகப் பொருட்கள்* (TV, Fridge, Washing Machine, Speakers)\n` +
                `7️⃣ *திருமண சீர்வரிசை காம்போ பேக்கேஜ்கள்* (Marriage Combos)\n` +
                `8️⃣ *ஈசி இஎம்ஐ பைனான்ஸ் வசதிகள்* (Easy EMI Options)\n\n` +
                `💬 *எண் அல்லது பெயரிட்டு அனுப்பவும் (எ.கா: 1 அல்லது sofa)*`;
        } else {
            responseText = `🌟 Welcome to *${STORE_NAME}*! 🛋️✨\n` +
                `Powered by *${POWERED_BY}*\n\n` +
                `📍 Address: ${STORE_ADDRESS_EN}\n` +
                `📞 Contact: ${STORE_PHONE}\n` +
                `⏰ Timings: ${STORE_TIMINGS_EN}\n\n` +
                `👇 Please explore our collections from the list below:\n\n` +
                `1️⃣ *Living Room & Sofas*\n` +
                `2️⃣ *Bedroom & Mattresses*\n` +
                `3️⃣ *Dining Collections*\n` +
                `4️⃣ *Storage & Kitchen Solutions*\n` +
                `5️⃣ *Office Furniture*\n` +
                `6️⃣ *Home Appliances (TV, Fridge, Washing Machine, Speakers)*\n` +
                `7️⃣ *Marriage Combo Bundles (Seervarisai)*\n` +
                `8️⃣ *Easy EMI / Finance Options*\n\n` +
                `💬 *Reply with the option number or category name!*`;
        }
    }
    else if (lowerMsg.includes('1') || lowerMsg.includes('sofa') || lowerMsg.includes('living')) {
        responseText = userIsTamil ?
            `🛋️ *ஹால் மற்றும் சோஃபா கலெக்ஷன்ஸ்*:\n- பிரீமியம் எல்-ஷேப் சோஃபா செட்கள்\n- மாடர்ன் வெல்வெட் சிங்கிள் ஆர்ம்செர்ஸ்\n- டூயல் டயர் வுட்டன் சென்டர் டேபிள்கள்\n\nகள்ளக்குறிச்சி ஷோரூமை நேரில் பார்வையிட வருக!` :
            `🛋️ *Living Room & Sofas*:\n- Multi-seat premium fabric sectional & L-shaped sofas\n- Modern plush velvet single armchairs\n- Dual-tier wooden center coffee tables\n\nVisit our Kallakurichi showroom to check live models!`;
    }
    else if (lowerMsg.includes('2') || lowerMsg.includes('bedroom') || lowerMsg.includes('matters') || lowerMsg.includes('படுக்கையறை')) {
        responseText = userIsTamil ?
            `🛏️ *படுக்கையறை & மெத்தைகள்*:\n- பிரீமியம் அப்கோல்ஸ்டர்ட் டபுள் பெட்கள்\n- சாலிட்டீக் வுட் கிங் & குவீன் காட்ஸ்\n- ஆர்த்தோபெடிக் மற்றும் லக்சுரி மெத்தைகள்\n\nதொடர்புக்கு: ${STORE_PHONE}` :
            `🛏️ *Bedroom & Mattresses*:\n- Premium upholstered double beds with vertical tufted headboards\n- Solid teak wood King & Queen cots\n- Orthopedic & luxury mattresses\n\nCall ${STORE_PHONE} for custom sizing!`;
    }
    else if (lowerMsg.includes('3') || lowerMsg.includes('dining') || lowerMsg.includes('டைனிங்')) {
        responseText = userIsTamil ?
            `🍽️ *டைனிங் கலெக்ஷன்ஸ்*:\n- 4 முதல் 6 சீட்டர் மாடர்ன் டைனிங் டேபிள்கள்\n- குஷன் செய்யப்பட்ட சேர்கள் மற்றும் கிளாஸ்-டாப் ஆப்ஷன்கள்.` :
            `🍽️ *Dining Collections*:\n- Modern 4-to-6 seater dining tables with cushioned high-back chairs\n- Fine-finish solid wood & glass-top contemporary options.`;
    }
    else if (lowerMsg.includes('4') || lowerMsg.includes('kitchen') || lowerMsg.includes('storage') || lowerMsg.includes('வார்ட்ரோப்')) {
        responseText = userIsTamil ?
            `🚪 *ஸ்டோரேஜ் & கிச்சன் தீர்வுகள்*:\n- கஸ்டம் மாடுலர் வார்ட்ரோப்கள்\n- வார்ம் எல்இடி டிஸ்ப்ளே யூனிட்டுகள்\n- ஸ்டீல் பெரோக்கள் மற்றும் கிச்சன் கேபினட்டுகள்.` :
            `🚪 *Storage & Kitchen Solutions*:\n- Custom modular wardrobes & multi-door closets\n- Integrated display units with warm ambient strip lighting\n- Heavy-gauge steel beros & kitchen cabinets.`;
    }
    else if (lowerMsg.includes('5') || lowerMsg.includes('office') || lowerMsg.includes('ஆபீஸ்')) {
        responseText = userIsTamil ?
            `💻 *ஆபீஸ் பர்னிச்சர்*:\n- எர்கோனாமிக் மெஷ் மற்றும் லெதர் எக்ஸிகியூட்டிவ் சேர்கள்\n- கம்ப்யூட்டர் வொர்க்ஸ்டேஷன்கள் மற்றும் வுட்டன் டெஸ்க்குகள்.` :
            `💻 *Office Furniture*:\n- Ergonomic mesh & leather executive desk chairs\n- Clean-lined computer workstations & wide executive wooden desks.`;
    }
    else if (lowerMsg.includes('6') || lowerMsg.includes('tv') || lowerMsg.includes('fridge') || lowerMsg.includes('washing') || lowerMsg.includes('speaker') || lowerMsg.includes('அபிலியன்சஸ்')) {
        responseText = userIsTamil ?
            `📺 *வீட்டு உபயோகப் பொருட்கள்*:\n- ஸ்மார்ட் டிவிகள், குளிர்சாதனப் பெட்டிகள் (Fridges), வாஷிங் மெஷின்கள் மற்றும் ஹோம் ஆடியோ ஸ்பீக்கர்கள் கம்பெனி வாரண்டியுடன்!` :
            `📺 *Home Appliances*:\n- Smart TVs, Refrigerators, Washing Machines & Home Audio Speakers available with company warranty!`;
    }
    else if (lowerMsg.includes('7') || lowerMsg.includes('combo') || lowerMsg.includes('seervarisai') || lowerMsg.includes('சீர்வரிசை')) {
        responseText = userIsTamil ?
            `🎁 *திருமண சீர்வரிசை காம்போ பேக்கேஜ்கள்*:\nகாட், மெத்தை, வார்ட்ரோப், சோஃபா மற்றும் கிச்சன் எலக்ட்ரானிக்ஸ் அனைத்தும் ஒரே பன்டில் தள்ளுபடி விலையில்!` :
            `🎁 *Marriage Combo Bundles (Seervarisai)*:\nComplete wedding packages combining cot, mattress, wardrobe, sofa, and kitchen electronics at special bundle discount pricing!`;
    }
    else if (lowerMsg.includes('8') || lowerMsg.includes('emi') || lowerMsg.includes('finance') || lowerMsg.includes('இஎம்ஐ')) {
        responseText = userIsTamil ?
            `💳 *ஈசி இஎம்ஐ பைனான்ஸ் வசதி*:\nபஜாஜ் ஃபின்சர்வ் (Bajaj Finserv) மற்றும் முன்னணி நிறுவனங்கள் மூலம் எளிமையான தவணை முறை வசதி உடனுக்குடன் உண்டு!` :
            `💳 *Easy EMI & Finance Options*:\nImmediate Easy EMI finance options available through partners like Bajaj Finserv to make purchases budget-friendly!`;
    }
    else {
        responseText = userIsTamil ?
            `மன்னிக்கவும், உங்கள் கேள்வியை முழுமையாகப் புரிந்து கொள்ள முடியவில்லை. எங்கள் முழுமையான பட்டியலைப் பார்க்க *'menu'* அல்லது *'வணக்கம்'* என அனுப்பவும். தொடர்புக்கு: ${STORE_PHONE}` :
            `Thank you for reaching out to *${STORE_NAME}*. Type *'menu'* to see our complete product categories, or call us directly at ${STORE_PHONE}.`;
    }

    await sendWhatsAppMessage(to, phoneNumberId, responseText);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Arraheem Bilingual Chatbot server is running on port ${PORT}`);
});