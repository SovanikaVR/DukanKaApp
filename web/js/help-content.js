/* User guide: one entry per module, in English and Hindi. Also used to build docs/USER_GUIDE.md. */
export const HELP = [
  {
    id: 'start', icon: 'user',
    title: { en: 'Getting started', hi: 'शुरुआत कैसे करें' },
    what: {
      en: 'DukanKaApp is your shop register on the phone and computer. Everything you save goes into the shop owner\'s own Google Sheet.',
      hi: 'DukanKaApp आपकी दुकान का रजिस्टर है, फ़ोन और कंप्यूटर दोनों पर। जो भी सेव करते हैं वह दुकान मालिक की अपनी Google Sheet में जाता है।'
    },
    steps: [
      { en: 'Open the app link that the owner sent on WhatsApp. On Android tap the menu (⋮) → "Add to Home screen" so it opens like an app.',
        hi: 'मालिक ने WhatsApp पर जो लिंक भेजा है उसे खोलें। Android में मेनू (⋮) → "Add to Home screen" दबाएँ, तब यह ऐप की तरह खुलेगा।' },
      { en: 'First time only: paste the shop link (ends with /exec) and tap Connect. If the owner sent a link with the shop already in it, this step is skipped.',
        hi: 'सिर्फ पहली बार: दुकान का लिंक (/exec पर खत्म) डालें और "जोड़ें" दबाएँ। अगर मालिक ने दुकान वाला लिंक भेजा है तो यह कदम नहीं आएगा।' },
      { en: 'Type your login name and PIN, then Log in. You stay logged in for 30 days.',
        hi: 'अपना लॉगिन नाम और पिन डालें, फिर लॉग इन करें। 30 दिन तक लॉग इन रहेगा।' },
      { en: 'Every morning: set today\'s rate (top of the Home screen). Bills, girvi value and orders use it.',
        hi: 'हर सुबह: आज का भाव डालें (होम स्क्रीन पर सबसे ऊपर)। बिल, गिरवी की कीमत और ऑर्डर इसी से चलते हैं।' },
      { en: 'Tap EN / हिं at the top of Home to switch the language.', hi: 'भाषा बदलने के लिए होम पर ऊपर EN / हिं दबाएँ।' }
    ],
    tips: [
      { en: 'While something is saving, the screen shows "Saving… please wait". Wait for it — do not tap again. Even if the internet is slow, the same entry is never saved twice.',
        hi: 'सेव होते समय स्क्रीन पर "सेव हो रहा है… रुकिए" दिखता है। रुकिए — दोबारा न दबाएँ। इंटरनेट धीमा हो तब भी एक एंट्री दो बार सेव नहीं होगी।' },
      { en: 'The ? button at the top right of every screen opens the help for that screen.',
        hi: 'हर स्क्रीन के ऊपर दाईं ओर ? बटन उसी स्क्रीन की मदद खोलता है।' }
    ]
  },
  {
    id: 'rate', icon: 'chart',
    title: { en: "Today's rate", hi: 'आज का भाव' },
    what: { en: 'The gold and silver rate per gram for today.', hi: 'आज का सोने और चाँदी का प्रति ग्राम भाव।' },
    steps: [
      { en: 'On Home tap the rate strip.', hi: 'होम पर भाव वाली पट्टी दबाएँ।' },
      { en: 'Type the 24K rate. 22K and 18K fill in by themselves from the purity in Settings — change them if your rate is different.',
        hi: '24K भाव डालें। 22K और 18K सेटिंग की प्योरिटी से अपने आप भर जाते हैं — आपका भाव अलग हो तो बदल दें।' },
      { en: 'Type the silver rate and tap Save today\'s rate. If the rate did not change, tap "Same as <last date>".',
        hi: 'चाँदी का भाव डालें और "आज का भाव सेव करें" दबाएँ। भाव नहीं बदला तो "Same as <पिछली तारीख>" दबाएँ।' }
    ],
    tips: [{ en: 'An orange strip on Home means today\'s rate is not set yet.', hi: 'होम पर नारंगी पट्टी का मतलब है आज का भाव अभी नहीं डाला।' }]
  },
  {
    id: 'customers', icon: 'user',
    title: { en: 'Customers', hi: 'ग्राहक' },
    what: { en: 'One page per customer with all their girvi, orders, repairs, bills, old gold and baki.',
      hi: 'हर ग्राहक का एक पेज, जिसमें उसकी गिरवी, ऑर्डर, रिपेयर, बिल, पुराना सोना और बाकी सब है।' },
    steps: [
      { en: 'Tap the search box on Home. Type the first name, surname, mobile or village — no customer numbers needed.',
        hi: 'होम पर खोज बॉक्स दबाएँ। नाम, सरनेम, मोबाइल या गाँव लिखें — ग्राहक नंबर की ज़रूरत नहीं।' },
      { en: 'Tap the customer to open their page. From there start a sale, girvi or order with the customer already filled in.',
        hi: 'ग्राहक पर दबाकर उसका पेज खोलें। वहीं से बिक्री, गिरवी या ऑर्डर शुरू करें, ग्राहक पहले से भरा रहेगा।' },
      { en: 'A new customer is created by itself when you type a new name and mobile in any entry.',
        hi: 'किसी भी एंट्री में नया नाम और मोबाइल लिखते ही नया ग्राहक अपने आप बन जाता है।' }
    ],
    tips: [{ en: 'If the customer has baki, the page shows "Baki received" to take the payment.', hi: 'ग्राहक की बाकी हो तो पेज पर "बाकी मिली" बटन से पैसा लें।' }]
  },
  {
    id: 'sale', icon: 'bill',
    title: { en: 'New sale and bills', hi: 'नई बिक्री और बिल' },
    what: { en: 'Make a GST bill or a Non-GST estimate. Old gold taken from the customer goes in the same bill.',
      hi: 'GST बिल या बिना GST का एस्टिमेट बनाएँ। ग्राहक से लिया पुराना सोना इसी बिल में आता है।' },
    steps: [
      { en: 'Tap New Sale. Choose GST bill or Non-GST (estimate).', hi: '"नई बिक्री" दबाएँ। GST बिल या बिना GST (एस्टिमेट) चुनें।' },
      { en: 'Pick the customer (type mobile or name).', hi: 'ग्राहक चुनें (मोबाइल या नाम लिखें)।' },
      { en: 'Add the item: name, karat, weight. Rate and making are already filled — every value can be changed. Tap "Save name" to keep a new item name for next time.',
        hi: 'आइटम डालें: नाम, कैरेट, वजन। भाव और मेकिंग पहले से भरे हैं — हर चीज़ बदल सकते हैं। नया आइटम नाम अगली बार के लिए रखने को "नाम सेव करें" दबाएँ।' },
      { en: 'Selling a piece from stock? Tap "From stock" and pick it. Then it leaves stock by itself. For a lot (many pieces), type the weight and pieces sold.',
        hi: 'स्टॉक का आइटम बेच रहे हैं? "स्टॉक से" दबाकर चुनें। तब वह अपने आप स्टॉक से निकल जाएगा। लॉट (कई नग) में बेचा गया वजन और नग लिखें।' },
      { en: 'Old gold from the customer: tap "+ Add old gold / silver", type weight and the customer cut %. The value is taken off the bill. "Our purity estimate" is only for the shop and is not printed.',
        hi: 'ग्राहक का पुराना सोना: "+ पुराना सोना / चाँदी जोड़ें" दबाएँ, वजन और ग्राहक कटौती % डालें। उसकी कीमत बिल से घट जाएगी। "हमारा प्योरिटी अंदाज़" सिर्फ दुकान के लिए है, छपता नहीं।' },
      { en: 'Payment: type the cash. UPI fills itself with the rest. If the customer pays less, put the rest in Baki.',
        hi: 'पैसा: कैश लिखें। बाकी अपने आप UPI में भर जाता है। ग्राहक कम दे तो बची रकम बाकी में डालें।' },
      { en: 'Tap Save bill. On the next screen send the PDF on WhatsApp, open the customer\'s chat, or print (thermal 58/80 mm or A4).',
        hi: '"बिल सेव करें" दबाएँ। अगली स्क्रीन पर WhatsApp पर PDF भेजें, ग्राहक की चैट खोलें, या प्रिंट करें (थर्मल 58/80 mm या A4)।' }
    ],
    tips: [
      { en: 'Items typed by hand do not change stock. Only "From stock" items leave stock.', hi: 'हाथ से लिखे आइटम से स्टॉक नहीं बदलता। सिर्फ "स्टॉक से" वाले आइटम स्टॉक से निकलते हैं।' },
      { en: 'Wrong bill? Owner opens Bills → the bill → Cancel bill. Stock and cash go back. Then make a new bill.',
        hi: 'बिल गलत बना? मालिक बिल → वह बिल → "बिल रद्द करें" दबाए। स्टॉक और कैश वापस हो जाते हैं। फिर नया बिल बनाएँ।' },
      { en: 'GST bills need the shop GSTIN in Settings.', hi: 'GST बिल के लिए सेटिंग में दुकान का GSTIN चाहिए।' }
    ]
  },
  {
    id: 'oldgold', icon: 'swap',
    title: { en: 'Buy old gold', hi: 'पुराना सोना खरीदें' },
    what: { en: 'Buy old gold or silver for cash when the customer is not buying anything.', hi: 'जब ग्राहक कुछ नहीं खरीद रहा, तब पुराना सोना या चाँदी कैश में खरीदें।' },
    steps: [
      { en: 'Pick the customer, type the item, weight and customer cut %.', hi: 'ग्राहक चुनें, आइटम, वजन और ग्राहक कटौती % डालें।' },
      { en: 'Check "Our purity estimate" (shop only) — the app shows your margin in grams and rupees.', hi: '"हमारा प्योरिटी अंदाज़" (सिर्फ दुकान) देखें — ऐप ग्राम और रुपये में आपका फायदा दिखाता है।' },
      { en: 'Tap Save & pay. The money goes out of the cash book and the gold waits in "old gold stock" for melting.',
        hi: '"सेव करें और पैसे दें" दबाएँ। पैसा कैश बुक से जाता है और सोना गलाई के लिए "पुराना सोना स्टॉक" में रहता है।' }
    ],
    tips: []
  },
  {
    id: 'girvi', icon: 'lock',
    title: { en: 'Girvi (gold loan)', hi: 'गिरवी (गोल्ड लोन)' },
    what: { en: 'Give a loan against gold or silver. Interest is counted day by day and shown month by month.',
      hi: 'सोने या चाँदी पर लोन दें। ब्याज दिन के हिसाब से लगता है और महीने वार दिखता है।' },
    steps: [
      { en: 'Girvi Loan → "+ New girvi loan". Pick the customer, type the item, karat, weight, loan amount and interest (₹ per 100 per month).',
        hi: 'गिरवी लोन → "+ नया गिरवी लोन"। ग्राहक चुनें, आइटम, कैरेट, वजन, लोन राशि और ब्याज (₹ प्रति 100 प्रति माह) डालें।' },
      { en: 'The gold box shows the item value today and loan %. Tap Save & send receipt.',
        hi: 'सुनहरे बॉक्स में आज आइटम की कीमत और लोन % दिखता है। "सेव करें और रसीद भेजें" दबाएँ।' },
      { en: 'When the customer comes: open the girvi. Use "Interest only", "Part pay" or "Extra loan". To give the item back tap "Release & send receipt".',
        hi: 'जब ग्राहक आए: गिरवी खोलें। "सिर्फ ब्याज", "थोड़ा जमा" या "और लोन" दबाएँ। आइटम वापस देने के लिए "छुड़ाएँ और रसीद भेजें" दबाएँ।' },
      { en: 'Customer cannot pay everything at release? Type what they pay; the app asks to put the rest in Baki.',
        hi: 'छुड़ाते समय ग्राहक पूरा नहीं दे पा रहा? जितना दे रहा है लिखें; ऐप बची रकम बाकी में डालने को पूछेगा।' }
    ],
    tips: [
      { en: '"Work out till" shows how much will be due on a future date.', hi: '"इस तारीख तक हिसाब" से आगे की तारीख का बाकी देख सकते हैं।' },
      { en: 'Wrong entry? Owner: "Undo last payment", "Edit details", or "Cancel girvi" (only before any payment).',
        hi: 'गलत एंट्री? मालिक: "आखिरी जमा वापस लें", "जानकारी बदलें", या "गिरवी रद्द करें" (सिर्फ कोई जमा होने से पहले)।' },
      { en: 'Shaded rows in the list are older than 12 months.', hi: 'लिस्ट में रंगीन लाइनें 12 महीने से पुरानी हैं।' }
    ]
  },
  {
    id: 'orders', icon: 'order',
    title: { en: 'Orders', hi: 'ऑर्डर' },
    what: { en: 'Book an item to be made. Two ways: rate fixed today, or only a deposit with the rate fixed later.',
      hi: 'बनवाने का आइटम बुक करें। दो तरीके: आज भाव फिक्स, या सिर्फ जमा और भाव बाद में।' },
    steps: [
      { en: 'Orders → "+ Book order". Pick the customer, item, approx weight, making ₹/g and karigar ₹/g (shop only).',
        hi: 'ऑर्डर → "+ ऑर्डर बुक करें"। ग्राहक, आइटम, अंदाज़ वजन, मेकिंग ₹/g और कारीगर ₹/g (सिर्फ दुकान) डालें।' },
      { en: '"Rate fixed": e.g. 10 g at today\'s rate = ₹1,53,000 + making; the advance is taken now.',
        hi: '"भाव फिक्स": जैसे 10 g आज के भाव पर = ₹1,53,000 + मेकिंग; एडवांस अभी लें।' },
      { en: '"Only deposit": no rate now. When the customer pays the balance, use "+ Payment / fix rate" — that day\'s rate is used and the delivery date is set.',
        hi: '"सिर्फ जमा": अभी भाव नहीं। जब ग्राहक बाकी दे, "+ जमा / भाव फिक्स" दबाएँ — उस दिन का भाव लगेगा और डिलीवरी तारीख तय होगी।' },
      { en: 'Track it: "Give to karigar" → "Item ready" (final weight) → "Deliver & collect balance".',
        hi: 'आगे: "कारीगर को दें" → "आइटम तैयार" (आखिरी वजन) → "डिलीवर करें और बाकी लें"।' },
      { en: 'At delivery the customer may pay less — the rest goes to Baki. If they paid extra, the app tells you how much to return.',
        hi: 'डिलीवरी पर ग्राहक कम दे सकता है — बची रकम बाकी में जाएगी। ज़्यादा दिया हो तो ऐप बताएगा कितना वापस करना है।' }
    ],
    tips: [{ en: 'Owner can fix mistakes with "Edit details" on the order.', hi: 'मालिक ऑर्डर पर "जानकारी बदलें" से गलती सुधार सकता है।' }]
  },
  {
    id: 'repair', icon: 'wrench',
    title: { en: 'Repair and polish', hi: 'रिपेयर और पॉलिश' },
    what: { en: 'Customer item for repair or polish. Karigar cost vs customer charge shows the profit.',
      hi: 'ग्राहक का आइटम रिपेयर या पॉलिश के लिए। कारीगर खर्च और ग्राहक चार्ज से प्रॉफिट दिखता है।' },
    steps: [
      { en: 'Repair → "+ New repair / polish". Pick the customer, item, weight in, karigar and rates (per gram or fixed). Save & send receipt.',
        hi: 'रिपेयर → "+ नया रिपेयर / पॉलिश"। ग्राहक, आइटम, आया वजन, कारीगर और रेट (प्रति ग्राम या फिक्स) डालें। सेव करें और रसीद भेजें।' },
      { en: 'When it comes back: "Back from karigar" — weight out and karigar cost.', hi: 'वापस आने पर: "कारीगर से वापस" — वापसी वजन और कारीगर खर्च।' },
      { en: '"Give back & collect charge". If the customer pays less, the rest goes to Baki.',
        hi: '"वापस दें और चार्ज लें"। ग्राहक कम दे तो बची रकम बाकी में जाएगी।' }
    ],
    tips: []
  },
  {
    id: 'stock', icon: 'box',
    title: { en: 'Stock', hi: 'स्टॉक' },
    what: { en: 'What is in the shop: by category, pieces, weight and value today.', hi: 'दुकान में क्या है: कैटेगरी, नग, वजन और आज की कीमत।' },
    steps: [
      { en: 'Stock → "+ Add stock". Type item, category, weight, purity, pieces, our cost. Many small same items can be one lot (total weight + pieces).',
        hi: 'स्टॉक → "+ स्टॉक जोड़ें"। आइटम, कैटेगरी, वजन, प्योरिटी, नग, हमारी लागत डालें। कई छोटे एक जैसे आइटम एक लॉट में (कुल वजन + नग)।' },
      { en: 'Sell with "From stock" in New Sale — the item leaves stock by itself. Cancelling the bill puts it back.',
        hi: 'नई बिक्री में "स्टॉक से" से बेचें — आइटम अपने आप स्टॉक से निकलेगा। बिल रद्द करने पर वापस आ जाएगा।' },
      { en: 'Remove an item that is lost or sent back with "Remove". Owner can "Edit" a wrong weight or name.',
        hi: 'खोया या वापस भेजा आइटम "हटाएँ" से हटाएँ। मालिक गलत वजन या नाम "बदलें" से सुधार सकता है।' }
    ],
    tips: [{ en: 'Goods bought from a wholesaler on credit: add them from the Wholesaler screen.', hi: 'होलसेलर से उधार में खरीदा माल होलसेलर स्क्रीन से डालें।' }]
  },
  {
    id: 'melt', icon: 'flame',
    title: { en: 'Melting and fine gold', hi: 'गलाई और फाइन सोना' },
    what: { en: 'Melt old gold, enter the tested purity, and see the real gain. The fine gold goes to fine stock.',
      hi: 'पुराना सोना गलाएँ, जाँच की प्योरिटी डालें, और असली फायदा देखें। फाइन सोना फाइन स्टॉक में जाता है।' },
    steps: [
      { en: 'Melting → tick the old gold items to melt.', hi: 'गलाई → गलाने वाले पुराने आइटम पर टिक करें।' },
      { en: 'Type bar weight, tested purity % and melting charge. Tap Add to fine stock.', hi: 'पासा वजन, जाँच प्योरिटी % और गलाई चार्ज डालें। "फाइन स्टॉक में जोड़ें" दबाएँ।' },
      { en: 'Fine stock is used to pay wholesalers in gold and to give gold to karigars.', hi: 'फाइन स्टॉक से होलसेलर को सोना देते हैं और कारीगर को सोना देते हैं।' }
    ],
    tips: []
  },
  {
    id: 'partners', icon: 'truck',
    title: { en: 'Wholesaler and karigar', hi: 'होलसेलर और कारीगर' },
    what: { en: 'Accounts in fine gold grams and cash for wholesalers and karigars.', hi: 'होलसेलर और कारीगर का खाता — फाइन ग्राम और कैश में।' },
    steps: [
      { en: 'Wholesaler: "Bought goods" (fine to pay, e.g. 100 g goods → 90 g), "Give fine gold", "Pay cash (rate cut)" or "Pay cash dues".',
        hi: 'होलसेलर: "माल खरीदा" (देना फाइन, जैसे 100 g माल → 90 g), "फाइन सोना दें", "कैश दें (भाव कट)" या "कैश बाकी दें"।' },
      { en: 'Karigar: "Give gold", "Gold returned", "Job done" (fine used + labour), "Pay labour".',
        hi: 'कारीगर: "सोना दें", "सोना वापस", "काम पूरा" (लगा फाइन + मज़दूरी), "मज़दूरी दें"।' },
      { en: 'The top of each account shows gold and cash still to give or take.', hi: 'हर खाते के ऊपर दिखता है कि कितना सोना और कैश देना या लेना बाकी है।' }
    ],
    tips: []
  },
  {
    id: 'dues', icon: 'cash',
    title: { en: 'Baki (dues)', hi: 'बाकी (उधार)' },
    what: { en: 'One list of everyone who still has to pay the shop — from bills, orders, repairs and girvi.',
      hi: 'उन सबकी एक लिस्ट जिन्हें दुकान को पैसा देना बाकी है — बिल, ऑर्डर, रिपेयर और गिरवी से।' },
    steps: [
      { en: 'Money not paid in a bill, order, repair or girvi release comes here by itself.', hi: 'बिल, ऑर्डर, रिपेयर या गिरवी छुड़ाने में जो पैसा नहीं मिला, वह अपने आप यहाँ आता है।' },
      { en: 'Tap a name to see where the baki came from. Tap "Payment received" when they pay (part or full).',
        hi: 'नाम दबाकर देखें बाकी कहाँ से आई। ग्राहक पैसा दे (थोड़ा या पूरा) तो "पैसा मिला" दबाएँ।' },
      { en: 'When the full amount is paid, the name goes off the list by itself.', hi: 'पूरा पैसा मिलते ही नाम अपने आप लिस्ट से हट जाता है।' },
      { en: 'Owner can "Write off / correct" (e.g. discount given) — no cash entry is made.', hi: 'मालिक "माफ़ करें / सुधारें" कर सकता है (जैसे छूट दी) — कैश में एंट्री नहीं होती।' }
    ],
    tips: [{ en: 'Home shows how many customers have baki and the total.', hi: 'होम पर दिखता है कितने ग्राहकों की बाकी है और कुल कितनी।' }]
  },
  {
    id: 'cash', icon: 'cash',
    title: { en: 'Cash book', hi: 'कैश बुक' },
    what: { en: 'Every rupee in and out, written by itself from bills, girvi, orders and so on. Shows what should be in the drawer.',
      hi: 'हर रुपया जो आया और गया — बिल, गिरवी, ऑर्डर वगैरह से अपने आप लिखा जाता है। गल्ले में कितना होना चाहिए वह दिखता है।' },
    steps: [
      { en: 'Owner sets the opening cash once ("Set opening cash").', hi: 'मालिक एक बार शुरुआती कैश डाले ("शुरुआती कैश डालें")।' },
      { en: 'Add shop expenses (rent, salary, electricity) with "+ Expense", other money with "+ Other income".',
        hi: 'दुकान के खर्च (किराया, तनख्वाह, बिजली) "+ खर्च" से, दूसरी आमदनी "+ दूसरी आमदनी" से डालें।' },
      { en: 'Count the drawer in the evening and match it with "Should be in drawer".', hi: 'शाम को गल्ला गिनें और "गल्ले में होना चाहिए" से मिलाएँ।' }
    ],
    tips: [{ en: 'A wrong expense can be removed by the owner ("Remove (wrong entry)").', hi: 'गलत खर्च मालिक हटा सकता है ("हटाएँ (गलत एंट्री)")।' }]
  },
  {
    id: 'reports', icon: 'chart',
    title: { en: 'Reports', hi: 'रिपोर्ट' },
    what: { en: 'Today, this month, and where things stand (stock, girvi, orders, gold with others).',
      hi: 'आज, इस महीने, और अभी की स्थिति (स्टॉक, गिरवी, ऑर्डर, दूसरों के पास सोना)।' },
    steps: [
      { en: 'Reports → Today: sales, girvi interest, repair and order profit, expenses.', hi: 'रिपोर्ट → आज: बिक्री, गिरवी ब्याज, रिपेयर और ऑर्डर प्रॉफिट, खर्च।' },
      { en: 'Month: profit day by day. Position: everything the shop holds and owes.', hi: 'महीना: दिन वार प्रॉफिट। स्थिति: दुकान के पास क्या है और किसका देना है।' },
      { en: 'The owner gets a PDF report by email every night (set the email in Settings).', hi: 'मालिक को हर रात ईमेल पर PDF रिपोर्ट मिलती है (सेटिंग में ईमेल डालें)।' }
    ],
    tips: []
  },
  {
    id: 'mistakes', icon: 'undo',
    title: { en: 'Fixing mistakes', hi: 'गलती कैसे सुधारें' },
    what: { en: 'Old records are never deleted silently. The owner cancels or corrects them, and the cash book is corrected too.',
      hi: 'पुरानी एंट्री चुपचाप नहीं मिटती। मालिक उसे रद्द या सुधारता है, और कैश बुक भी साथ में सुधर जाती है।' },
    steps: [
      { en: 'Bill: Bills → open → Cancel bill (stock and cash go back), then make it again.', hi: 'बिल: बिल → खोलें → बिल रद्द करें (स्टॉक और कैश वापस), फिर दोबारा बनाएँ।' },
      { en: 'Girvi: open → "Undo last payment", "Edit details", or "Cancel girvi".', hi: 'गिरवी: खोलें → "आखिरी जमा वापस लें", "जानकारी बदलें", या "गिरवी रद्द करें"।' },
      { en: 'Order / repair: open → "Edit details". Stock item: Stock → Edit. Expense: Cash book → Remove (wrong entry).',
        hi: 'ऑर्डर / रिपेयर: खोलें → "जानकारी बदलें"। स्टॉक आइटम: स्टॉक → बदलें। खर्च: कैश बुक → हटाएँ (गलत एंट्री)।' },
      { en: 'Baki: Baki list → "Write off / correct".', hi: 'बाकी: बाकी लिस्ट → "माफ़ करें / सुधारें"।' }
    ],
    tips: [{ en: 'Every change is written in the Audit tab of the Google Sheet with who did it and when.', hi: 'हर बदलाव Google Sheet के Audit टैब में लिखा जाता है — किसने और कब।' }]
  },
  {
    id: 'settings', icon: 'gear',
    title: { en: 'Settings (owner)', hi: 'सेटिंग (मालिक)' },
    what: { en: 'Shop details, standard values, modules on/off, formulas, users and backup.', hi: 'दुकान की जानकारी, सामान्य वैल्यू, मॉड्यूल चालू/बंद, फॉर्मूला, यूज़र और बैकअप।' },
    steps: [
      { en: 'Shop details and GSTIN are printed on every bill.', hi: 'दुकान की जानकारी और GSTIN हर बिल पर छपते हैं।' },
      { en: 'Standard values (cut %, making, interest) are pre-filled in every entry and can always be changed there.',
        hi: 'सामान्य वैल्यू (कटौती %, मेकिंग, ब्याज) हर एंट्री में पहले से भरती हैं और वहाँ बदल सकते हैं।' },
      { en: 'Modules: switch off what the shop does not use (e.g. Girvi). Data stays safe.', hi: 'मॉड्यूल: जो दुकान में नहीं चाहिए उसे बंद करें (जैसे गिरवी)। डेटा सुरक्षित रहता है।' },
      { en: 'Users: add employees (can make entries) or view-only users. Each has their own PIN.',
        hi: 'यूज़र: कर्मचारी (एंट्री कर सकते हैं) या सिर्फ देखने वाले जोड़ें। हर एक का अपना पिन।' },
      { en: 'Back up now saves a copy of the sheet in Google Drive. A backup is also made every night.',
        hi: '"अभी बैकअप लें" से Google Drive में शीट की कॉपी बनती है। हर रात भी बैकअप बनता है।' }
    ],
    tips: []
  }
];
