const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');

// 1. Initialize WhatsApp Client with Local Session Auth
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// 2. Generate QR Code in Terminal for Login
client.on('qr', (qr) => {
    console.log('SCAN THIS QR CODE TO LOGIN:');
    qrcode.generate(qr, { small: true });
});

// 3. Ready Event after Successful Login
client.on('ready', () => {
    console.log('WhatsApp Client is ready and successfully logged in!');
});

// 4. Message Handler Function (Bilingual Tamil & English Support)
async function handleIncomingMessage(client, chatId, userMessage) {
    const text = userMessage.trim().toLowerCase();
    const isTamil = /[\u0B80-\u0BFF]/.test(text);

    // Welcome Message Trigger (Hi, Hello, Menu, Start, Vanakkam)
    if (text === 'hi' || text === 'hello' || text === 'menu' || text === 'start' || text === 'வணக்கம்') {
        const imagePath = path.join(__dirname, 'images', 'Welcome.png'); // Updated to .png
        const media = MessageMedia.fromFilePath(imagePath);

        const caption = isTamil ?
            `🌿 வணக்கம்! ராஜேஷ்வரி நியூட்ரிஷன் சென்டர், கள்ளக்குறிச்சிக்கு உங்களை வரவேற்கிறோம்! 🌿

ஊட்டச்சத்து, எடை மேலாண்மை, உடற்பயிற்சி, வாழ்க்கை முறை வழிகாட்டுதல் மற்றும் எங்களது கோச்சைத் தொடர்புகொள்ள நான் உங்களுக்கு உதவத் தயாராக இருக்கிறேன்.
✨ இன்று நான் உங்களுக்கு எப்படி உதவ வேண்டும்?

🌱 சேவைகள் (Services)
🥗 ஊட்டச்சத்து திட்டங்கள் (Nutrition Programs)
⚖️ எடை மேலாண்மை (Weight Management)
💪 உடற்பயிற்சி மற்றும் வாழ்க்கை முறை (Fitness & Lifestyle)

தொடர மேலே உள்ள விருப்பங்களில் ஒன்றை அனுப்பவும். 😊` :
            `🌿 Hi 👋 Welcome to Rajeshwari Nutrition Center, Kallakurichi! 🌿

I’m here to help you with nutrition, weight management, fitness, lifestyle guidance, location details, and connecting with our coach.
✨ How can I assist you today?

🌱 Services 
🥗 Nutrition Programs
⚖️ Weight Management
💪 Fitness & Lifestyle

Please select an option above to continue. 😊`;

        await client.sendMessage(chatId, media, { caption: caption });
        return;
    }

    // Services Option
    if (text.includes('services') || text.includes('🌱 services') || text.includes('சேவைகள்')) {
        const imagePath = path.join(__dirname, 'images', 'service.png'); // Updated to .png
        const media = MessageMedia.fromFilePath(imagePath);

        const caption = isTamil ?
            `🌱 **எங்கள் சேவைகள்** 🌱

எஸ். ராஜேஷ்வரி கள்ளக்குறிச்சியைச் சேர்ந்த சுதந்திரமான வெல்னெஸ் கோச் ஆவார். ஹெர்பலைஃப் நியூட்ரிஷன் மூலம் முழுமையான ஆரோக்கிய தீர்வுகளை நாங்கள் வழங்குகிறோம்:
• தனிப்பயனாக்கப்பட்ட உடல் எடை குறைப்பு திட்டங்கள்
• ஆரோக்கியமான உடல் எடை அதிகரிப்பு திட்டங்கள்
• காலை சமூக உடற்பயிற்சி சந்திப்புகள்
• உடல் கட்டமைப்பு கண்காணிப்பு

📍 **இடம்:** ஹெர்பலைஃப் நியூட்ரிஷன் சென்டர், 2A, கந்தபொடி சந்து, OTTO துணிக்கடை & HDFC பேங்க் எதிரில், சேலம் மெயின் ரோடு அருகில், கள்ளக்குறிச்சி, தமிழ்நாடு 606202.
⏰ **நேரம்:** திங்கள் முதல் ஞாயிறு வரை, காலை 7:30 மணி முதல் 10:30 மணி வரை.` :
            `🌱 **Our Core Services** 🌱

S. Rajeshwari is an independent Wellness Coach based in Kallakurichi. We provide comprehensive health and wellness solutions powered by Herbalife Nutrition:
• Personalized Fat Loss Programs
• Healthy Weight Gain Programs
• Morning Community Fitness Meetups
• Metabolic Body Composition Monitoring

📍 **Visit Location:** Herbalife Nutrition Center, 2A, Kanthapodi Lane, Opposite OTTO Clothing & HDFC Bank, Near Salem Main Road, Kallakurichi, Tamil Nadu 606202.
⏰ **Timings:** Monday to Sunday, 7:30 AM – 10:30 AM.`;

        await client.sendMessage(chatId, media, { caption: caption });
    }
    // Nutrition Programs Option
    else if (text.includes('nutrition programs') || text.includes('🥗 nutrition programs') || text.includes('ஊட்டச்சத்து')) {
        const imagePath = path.join(__dirname, 'images', 'program.png'); // Updated to .png
        const media = MessageMedia.fromFilePath(imagePath);

        const caption = isTamil ?
            `🥗 **ஊட்டச்சத்து திட்டங்கள்** 🥗

எங்களது ஊட்டச்சத்து ஆலோசனைகள் மற்றும் ஆரோக்கிய கண்காணிப்பு திட்டங்கள் ஹெர்பலைஃப் நியூட்ரிஷன் மூலம் உங்கள் உடலின் தேவைக்கேற்ப வடிவமைக்கப்பட்டுள்ளன.
• **பொன்மொழி:** "உணவே மருந்து, மருந்தே உணவு".
• நிலையான முடிவுகளைப் பெற பிரத்யேக உணவுத் திட்டங்கள் மற்றும் ஊட்டச்சத்து கண்காணிப்பு.

📞 **தொடர்புக்கு (கோச் எஸ். ராஜேஷ்வரி):** +91 97871 05903 / +91 63839 96873` :
            `🥗 **Nutrition Programs** 🥗

Our nutritional counseling and health tracking programs are tailored to your body's needs, powered by Herbalife Nutrition. 
• **Motto:** "Food is medicine, medicine is food".
• Specialized meal replacement plans and customized nutritional tracking to help you achieve sustainable results.

📞 **Contact Coach S. Rajeshwari:** +91 97871 05903 / +91 63839 96873`;

        await client.sendMessage(chatId, media, { caption: caption });
    }
    // Weight Management Option
    else if (text.includes('weight management') || text.includes('⚖️ weight management') || text.includes('எடை மேலாண்மை')) {
        const imagePath = path.join(__dirname, 'images', 'weight.png'); // Updated to .png
        const media = MessageMedia.fromFilePath(imagePath);

        const caption = isTamil ?
            `⚖️ **எடை மேலாண்மை** ⚖️

சுதந்திரமான வெல்னெஸ் கோச் எஸ். ராஜேஷ்வரியின் வழிகாட்டுதலுடன் உங்கள் ஆரோக்கிய இலக்குகளை அடையுங்கள்:
• **தனிப்பயனாக்கப்பட்ட கொழுப்பு குறைப்பு:** பாதுகாப்பான மற்றும் முறையான கொழுப்பு குறைப்பு வழிகள்.
• **ஆரோக்கியமான எடை அதிகரிப்பு:** தசை வளர்ச்சி மற்றும் உடல் எடை அதிகரிக்க சத்தான உணவுத் திட்டமிடல்.
• **உடல் கட்டமைப்பு கண்காணிப்பு:** கள்ளக்குறிச்சி மையத்தில் காலை நேரத்தில் வழக்கமான உடல் மதிப்பீடுகள்.` :
            `⚖️ **Weight Management** ⚖️

Achieve your health goals with structured guidance from Independent Wellness Coach S. Rajeshwari:
• **Personalized Fat Loss:** Safe, steady, and customized fat reduction routines.
• **Healthy Weight Gain:** Nutritious meal planning for muscle mass and healthy weight increase.
• **Metabolic Tracking:** Regular body composition evaluations during morning hours at our Kallakurichi hub.`;

        await client.sendMessage(chatId, media, { caption: caption });
    }
    // Fitness & Lifestyle Option
    else if (text.includes('fitness') || text.includes('💪 fitness & lifestyle') || text.includes('உடற்பயிற்சி')) {
        const imagePath = path.join(__dirname, 'images', 'principle.png'); // Updated to .png
        const media = MessageMedia.fromFilePath(imagePath);

        const caption = isTamil ?
            `💪 **உடற்பயிற்சி மற்றும் வாழ்க்கை முறை** 💪

நீண்டகால ஆரோக்கிய வெற்றிக்கு நாங்கள் முழுமையான வாழ்க்கை முறை பழக்கவழக்கங்களில் கவனம் செலுத்துகிறோம்:
• காலை சமூக உடற்பயிற்சி சந்திப்புகள் மற்றும் குழு ஊக்கம்.
• செயலில் உள்ள வாழ்க்கை முறை வழிகாட்டுதல் மற்றும் தினசரி கண்காணிப்பு.
• கோச் ராஜேஷ்வரியின் அதிகாரப்பூர்வ **பேஸ்புக் பக்கம்** அல்லது **இன்ஸ்டாகிராம்** சுயவிவரம் மூலம் நேரடியாக இணைந்திருங்கள்.` :
            `💪 **Fitness & Lifestyle Principles** 💪

We focus on holistic lifestyle habits for long-term health success:
• Morning community fitness meetups and group motivation.
• Active lifestyle coaching and daily routine tracking.
• Connect with Coach Rajeshwari directly via her official **Facebook Page** or follow daily routines on her **Instagram** profile.`;

        await client.sendMessage(chatId, media, { caption: caption });
    }
}

// 5. Incoming Message Listener
client.on('message', async (msg) => {
    const chatId = msg.from;
    const userMessage = msg.body;
    await handleIncomingMessage(client, chatId, userMessage);
});

// Start the client
client.initialize();