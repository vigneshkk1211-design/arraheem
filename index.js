const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const pino = require('pino');

async function connectToWhatsApp() {
    console.log('WhatsApp inaippu thodangugirathu...');

    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: ["Vengalakshmi Bot", "Chrome", "10.15.0"]
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('Keele ulla QR code-ai ungal WhatsApp-il scan seyyungal:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log('Inaippu thundikkappattathu. Meendum inaikirathu...', shouldReconnect);

            if (shouldReconnect) {
                setTimeout(() => {
                    connectToWhatsApp();
                }, 3000);
            }
        } else if (connection === 'open') {
            console.log('✅ Vengalakshmi TV Agencies Bot vetrikaramaga inaikappattu thayaraga ullathu!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const sender = m.key.remoteJid;
        const text = (
            m.message.conversation ||
            m.message.extendedTextMessage?.text ||
            m.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
            m.message.buttonsResponseMessage?.selectedButtonId ||
            ''
        ).trim().toLowerCase();

        if (sender.includes('@g.us')) return;

        const isTamil = /[\u0B80-\u0BFF]/.test(text) || ['வணக்கம்', 'டீவி', 'பிரிட்ஜ்', 'ஏசி', 'மிக்ஸி', 'முகவரி', 'பேச', 'தமிழ்', 'டிவி', 'சமையல்', 'கடை', 'ஹாய்'].some(k => text.includes(k));

        function getGreeting(lang) {
            const hour = new Date().getHours();
            if (lang === 'tamil') {
                if (hour >= 4 && hour < 12) return "இனிய காலை வணக்கம்!";
                if (hour >= 12 && hour < 16) return "இனிய மதிய வணக்கம்!";
                if (hour >= 16 && hour < 20) return "இனிய மாலை வணக்கம்!";
                return "இனிய இரவு வணக்கம்!";
            } else {
                if (hour >= 4 && hour < 12) return "Good Morning!";
                if (hour >= 12 && hour < 16) return "Good Afternoon!";
                if (hour >= 16 && hour < 20) return "Good Evening!";
                return "Good Night!";
            }
        }

        async function sendImagesThenDescription(folderName, captionText) {
            try {
                const fullDirPath = path.join(__dirname, 'images', folderName);
                if (fs.existsSync(fullDirPath)) {
                    const files = fs.readdirSync(fullDirPath);
                    const imageFiles = files.filter(file => /\.(webp|jpg|jpeg|png|avif)$/i.test(file)).sort();

                    if (imageFiles.length > 0) {
                        for (let i = 0; i < imageFiles.length; i++) {
                            const imgPath = path.join(fullDirPath, imageFiles[i]);
                            if (fs.existsSync(imgPath)) {
                                try {
                                    const buffer = fs.readFileSync(imgPath);
                                    await sock.sendMessage(sender, { image: buffer });
                                    await new Promise(resolve => setTimeout(resolve, 1200));
                                } catch (imgErr) {
                                    console.error(`Padam anuppuvathil pizhai (${imageFiles[i]}):`, imgErr);
                                }
                            }
                        }
                        await sock.sendMessage(sender, { text: captionText });
                    } else {
                        await sock.sendMessage(sender, { text: captionText });
                    }
                } else {
                    await sock.sendMessage(sender, { text: captionText });
                }
            } catch (err) {
                console.error('Image sender error:', err);
            }
        }

        const isTV = text === '1' || text.includes('tv') || text.includes('television') || text.includes('entertainment') || text.includes('டீவி') || text.includes('தொலைக்காட்சி') || text.includes('டிவி');
        const isFridge = text === '2' || text.includes('fridge') || text.includes('fridges') || text.includes('freez') || text.includes('refrigerator') || text.includes('பிரிட்ஜ்') || text.includes('குளிர்சாதன');
        const isKitchen = text === '3' || text.includes('kitchen') || text.includes('gas') || text.includes('mixer') || text.includes('grinder') || text.includes('stove') || text.includes('சமையல்') || text.includes('மிக்ஸி');
        const isAC = text === '4' || text.includes('ac') || text.includes('air conditioner') || text.includes('cooling') || text.includes('fan') || text.includes('cooler') || text.includes('ஏசி') || text.includes('ஃபேன்');
        const isWashing = text === '5' || text.includes('washing') || text.includes('laundry') || text.includes('washer') || text.includes('machine') || text.includes('வாஷிங் மெஷின்');
        const isAddress = text === '6' || text.includes('address') || text.includes('location') || text.includes('map') || text.includes('shop') || text.includes('store') || text.includes('முகவரி') || text.includes('கடை');
        const isAdvisor = text === '7' || text.includes('advisor') || text.includes('call') || text.includes('human') || text.includes('talk') || text.includes('support') || text.includes('பேச');

        const isWelcomeTrigger = text === 'hi' || text === 'hello' || text === 'start' || text === 'menu' || text === 'வணக்கம்' || text === 'ஹாய்';

        if (isTV) {
            const caption = isTamil ?
                `📺 *பொழுதுபோக்கு சாதனங்கள் – வெங்கலலட்சுமி டிவி ஏஜென்சீஸ்*\n• ஸ்மார்ட் டிவிகள் & எல்இடி தொலைக்காட்சிகள் (32" முதல் 75\"+ அல்ட்ரா எச்டி 4K, QLED)\n• முன்னணி பிராண்டுகள்: Samsung, LG, Sony, TCL\n✅ 0% வட்டி எளிமையான ஈஎம்ஐ மற்றும் இலவச வீட்டு விநியோகம்\n📞 *தொடர்புக்கு:* +91 99762 45000` :
                `📺 *Entertainment Appliances – Vengalakshmi TV Agencies*\n• Smart TVs & LED Televisions (32" to 75\"+ Ultra HD 4K, QLED)\n• Leading Brands: Samsung, LG, Sony, TCL\n✅ 0% Interest Easy EMIs & Free Home Delivery\n📞 *Contact:* +91 99762 45000`;

            await sendImagesThenDescription('Entertaiment', caption);
            return;
        }
        else if (isFridge) {
            const caption = isTamil ?
                `❄️ *குளிர்சாதன பெட்டிகள் – வெங்கலலட்சுமி டிவி ஏஜென்சீஸ்*\n• சிங்கிள் டோர், டபுள் டோர் & மல்டி-டோர் பிரிட்ஜ்கள்\n• முன்னணி பிராண்டுகள்: Samsung, LG, Whirlpool, Haier\n✅ எளிமையான ஈஎம்ஐ மற்றும் இலவச இன்ஸ்டாலேஷன் ஆதரவு\n📞 *தொடர்புக்கு:* +91 99762 45000` :
                `❄️ *Refrigerators – Vengalakshmi TV Agencies*\n• Single Door, Double Door & Multi-Door Refrigerators\n• Leading Brands: Samsung, LG, Whirlpool, Haier\n✅ Easy EMI Options & Free Installation Support\n📞 *Contact:* +91 99762 45000`;

            await sendImagesThenDescription('Colling & Fridges', caption);
            return;
        }
        else if (isKitchen) {
            const caption = isTamil ?
                `🍳 *சமையலறை உபகரணங்கள் – வெங்கலலட்சுமி டிவி ஏஜென்சீஸ்*\n• ஹெவி டியூட்டி மிக்ஸி கிரைண்டர்கள் & வெட் கிரைண்டர்கள்\n• கிளாஸ் டாப் கேஸ் ஸ்டவ்கள் & இன்டக்ஷன் ஸ்டவ்கள்\n✅ சிறப்புப் பண்டிகை தள்ளுபடிகள் மற்றும் இலவச டெலிவரி\n📞 *தொடர்புக்கு:* +91 99762 45000` :
                `🍳 *Kitchen & Small Appliances – Vengalakshmi TV Agencies*\n• Heavy Duty Mixer Grinders & Wet Grinders\n• Glass Top Gas Stoves & Induction Stoves\n✅ Best Festive Discounts & Free Delivery\n📞 *Contact:* +91 99762 45000`;

            await sendImagesThenDescription('Kitchen Appliances', caption);
            return;
        }
        else if (isAC) {
            const caption = isTamil ?
                `❄️ *ஏசி மற்றும் குளிரூட்டும் சாதனங்கள் – வெங்கலலட்சுமி டிவி ஏஜென்சீஸ்*\n• இன்வெர்ட்டர் ஸ்பிளிட் ஏசிகள் (1 டன் முதல் 2 டன் - 3 & 5 ஸ்டார்)\n• அதிவேக சீலிங் ஃபேன் மற்றும் டெசர்ட் கூலர்கள்\n✅ எளிமையான ஈஎம்ஐ மற்றும் இலவச இன்ஸ்டாலேஷன் ஆதரவு\n📞 *தொடர்புக்கு:* +91 99762 45000` :
                `❄️ *AC & Cooling – Vengalakshmi TV Agencies*\n• Inverter Split ACs (1 Ton to 2 Ton - 3 & 5 Star)\n• High-Speed Fans & Coolers\n✅ Easy EMI Options & Free Installation Support\n📞 *Contact:* +91 99762 45000`;

            await sendImagesThenDescription('Air Ciruculation & Fans', caption);
            return;
        }
        else if (isWashing) {
            const caption = isTamil ?
                `🧺 *துணி துவைக்கும் இயந்திரங்கள் – வெங்கலலட்சுமி டிவி ஏஜென்சீஸ்*\n• முழு தானியங்கி ஃப்ரண்ட் லோட் & டாப் லோட் வாஷிங் மெஷின்கள்\n• அரை தானியங்கி இரட்டை தொட்டி வாஷர்கள்\n✅ எளிமையான ஈஎம்ஐ மற்றும் நேரடி டெமோ சேவை\n📞 *தொடர்புக்கு:* +91 99762 45000` :
                `🧺 *Washing Machines – Vengalakshmi TV Agencies*\n• Fully-Automatic Front Load & Top Load Washing Machines\n• Semi-Automatic Twin Tub Washers\n✅ Easy EMIs & Free Demonstration\n📞 *Contact:* +91 99762 45000`;

            await sendImagesThenDescription('Laundry & Washine machine', caption);
            return;
        }
        else if (isAddress) {
            const addressCaption = isTamil ?
                `📍 *வெங்கலலட்சுமி டிவி ஏஜென்சீஸ்*\nஎண். 50 / 50A, துருகம் சாலை, ராஜா நகர், ராஜா ராஜேஸ்வரி லாட்ஜ் அருகில், கள்ளக்குறிச்சி - 606202.\n📞 +91 99762 45000 / +91 97888 60021\n\n🗺️ *கூகுள் மேப் இருப்பிடம்:* https://maps.app.goo.gl/YourGoogleMapLinkHere` :
                `📍 *Vengalakshmi TV Agencies*\nNo. 50 / 50A, Dhurugam Road, Raja Nagar, Near Raja Rajeshwari Lodge, Kallakurichi - 606202.\n📞 +91 99762 45000 / +91 97888 60021\n\n🗺️ *Google Maps Location:* https://maps.app.goo.gl/YourGoogleMapLinkHere`;

            const storePhotoPath = path.join(__dirname, 'images', 'store.jpg');
            if (fs.existsSync(storePhotoPath)) {
                try {
                    const storeBuffer = fs.readFileSync(storePhotoPath);
                    await sock.sendMessage(sender, { image: storeBuffer, caption: addressCaption });
                } catch (e) {
                    await sock.sendMessage(sender, { text: addressCaption });
                }
            } else {
                await sock.sendMessage(sender, { text: addressCaption });
            }
            return;
        }
        else if (isAdvisor) {
            const advText = isTamil ?
                `🗣️ எங்களின் விற்பனை ஆலோசகரிடம் உங்களை இணைக்கிறோம்... தயவுசெய்து எங்களை நேரடியாக +91 99762 45000 என்ற எண்ணில் அழைக்கவும்.` :
                `🗣️ Connecting you with our sales advisor... Please call us directly at +91 99762 45000.`;

            await sock.sendMessage(sender, { text: advText });
            return;
        }
        else if (isWelcomeTrigger) {
            try {
                const greeting = getGreeting(isTamil ? 'tamil' : 'english');
                const welcomePath = path.join(__dirname, 'images', 'welcome.png');

                const welcomeText = isTamil ?
                    `╭━━━❖ *வெங்கலலட்சுமி டிவி ஏஜென்சீஸ்* ❖━━━╮\n      *கள்ளக்குறிச்சியின் நம்பகமான விற்பனையாளர்*\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n${greeting} வெங்கலலட்சுமி டிவி ஏஜென்சீஸ்க்கு உங்களை அன்புடன் வரவேற்கிறோம்!\n1985 முதல் உங்கள் வீடுகளுக்குத் தேவையான தொழில்நுட்பம் மற்றும் மகிழ்ச்சியை வழங்கி வருகிறோம்.\n\nகள்ளக்குறிச்சிக்குள் எளிமையான ஈஎம்ஐ மற்றும் இலவச வீட்டு விநியோகம் வழங்கப்படுகிறது!\n\n👇 *பொருட்களைப் பார்க்க எண்களை அனுப்பவும்:*\n1️⃣ டிவி\n2️⃣ பிரிட்ஜ்\n3️⃣ சமையலறை உபகரணங்கள்\n4️⃣ ஏசி\n5️⃣ வாஷிங் மெஷின்\n6️⃣ கடை முகவரி & விபரங்கள்\n7️⃣ அதிகாரியிடம் பேச` :
                    `╭━━━❖ *VENGALAKSHMI TV AGENCIES* ❖━━━╮\n      *Kallakurichi's Trusted Retailer*\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n${greeting} Welcome to Vengalakshmi T.V. Agencies!\nBringing comfort, technology, and happiness to your homes since 1985.\n\nWe offer Easy EMIs and Free Home Delivery within Kallakurichi!\n\n👇 *CHOOSE A CATEGORY (Type Number):*\n1️⃣ TV\n2️⃣ Fridges\n3️⃣ Kitchen Appliances\n4️⃣ Ac\n5️⃣ Washing Machines\n6️⃣ Store Address & Info\n7️⃣ Speak with Advisor`;

                if (fs.existsSync(welcomePath)) {
                    try {
                        const buffer = fs.readFileSync(welcomePath);
                        await sock.sendMessage(sender, { image: buffer });
                    } catch (imgErr) {
                        console.error('Welcome image error:', imgErr);
                    }
                }

                await sock.sendMessage(sender, { text: welcomeText });
            } catch (e) {
                console.error('Menu anuppuvathil pizhai:', e);
            }
        }
    });
}

connectToWhatsApp();