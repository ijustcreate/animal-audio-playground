(function () {
  const SUPPORTED_LANGUAGES = [
    { code: "en", label: "English", nativeLabel: "English" },
    { code: "es", label: "Spanish", nativeLabel: "Espanol" },
    { code: "fr", label: "French", nativeLabel: "Francais" },
    { code: "zh", label: "Chinese", nativeLabel: "中文" },
  ];

  const UI_COPY = {
    en: {
      common: {
        settings: "Settings",
        close: "Close",
        status: "Status",
        language: "Language",
        museumGuest: "Museum Guest",
        creatureFacts: "Creature Facts",
        playVideo: "Play Video",
        stopVideo: "Stop Video",
        noVideo: "No video has been added for this animal yet.",
        loading: "Loading animal library...",
        contentUpdated: "Content updated.",
        saveReady: "Live preview ready.",
      },
      main: {
        headerSubtitle: "Interactive Museum Display",
        headerTitle: "Press And Hold To Hear The Animal",
        idleStatus: "Hold a button to hear the animal. Sounds can overlap.",
        loadError: "The museum wall could not finish loading.",
        couldNotPlay: "Could not play {label}.",
        playingStatus: "{animals} playing. Overlap is enabled.",
        emptyTitle: "No animals are available yet.",
        emptyBody:
          "Add a named animal folder with its image, audio, about file, and animal config, then reload from Settings.",
        openInfoAria: "Open more info for {animal}.",
        openSettingsAria: "Open settings for {animal}.",
        playAnimalSoundAria: "Play the sound for {animal}.",
        infoAction: "{animal} Details",
        guessingMode: "Who Made That Sound?",
        exitGuessingMode: "Exit Guessing Mode",
        guessPrompt: "Who made that sound? Tap the animal image you think made it.",
        guessRetry:
          "Not quite. That choice is now crossed off. Listen one more time and try again.",
        guessFail:
          "Two misses. Returning to free play so your group can try again whenever they want.",
        guessCorrect: "Correct! That was the {animal}.",
        guessComplete: "Amazing! You matched every animal sound.",
        guessStart: "Listen carefully. Guessing mode has started.",
        guessAgain: "Try again",
        guessCardHint: "Tap the image to guess",
      },
      info: {
        eyebrow: "Detailed Animal View",
        aboutEyebrow: "About",
        aboutTitle: "About This Animal",
        unforgettableEyebrow: "Big Wow Fact",
        unforgettableTitle: "One Unforgettable Fact",
        sizeEyebrow: "Size Compare",
        sizeTitle: "How Big Is It?",
        keyFactsEyebrow: "Key Facts",
        keyFactsTitle: "What To Notice",
        scienceEyebrow: "How It Works",
        scienceTitle: "Science In Action",
        questionsEyebrow: "Curious Questions",
        ages35: "Ages 3 To 5",
        ages58: "Ages 5 To 8",
        ages813: "Ages 8 To 13",
        videoUnavailable: "No video has been added for this animal yet.",
        videoReady: "Press Play Video to watch this animal over its photo.",
        sizePrompt: "Tap a size comparison button to explore this animal in a familiar way.",
      },
      app: {
        guessModeAction: "Guessing Mode",
      },
    },
    es: {
      common: {
        settings: "Configuracion",
        close: "Cerrar",
        status: "Estado",
        language: "Idioma",
        museumGuest: "Visitante del museo",
        creatureFacts: "Datos del animal",
        playVideo: "Reproducir video",
        stopVideo: "Detener video",
        noVideo: "Todavia no se agrego un video para este animal.",
        loading: "Cargando biblioteca de animales...",
        contentUpdated: "Contenido actualizado.",
        saveReady: "Vista previa en vivo lista.",
      },
      main: {
        headerSubtitle: "Pantalla interactiva del museo",
        headerTitle: "Manten presionado para escuchar al animal",
        idleStatus: "Manten presionado un boton para escuchar al animal. Los sonidos pueden superponerse.",
        loadError: "La pared del museo no pudo terminar de cargarse.",
        couldNotPlay: "No se pudo reproducir {label}.",
        playingStatus: "{animals} sonando. La superposicion esta activada.",
        emptyTitle: "Todavia no hay animales disponibles.",
        emptyBody:
          "Agrega una carpeta de animal con su imagen, audio, archivo informativo y configuracion, y despues vuelve a cargar desde Configuracion.",
        openInfoAria: "Abrir mas informacion de {animal}.",
        openSettingsAria: "Abrir configuracion de {animal}.",
        playAnimalSoundAria: "Reproducir el sonido de {animal}.",
        infoAction: "Detalles de {animal}",
        guessingMode: "Quien hizo ese sonido?",
        exitGuessingMode: "Salir del modo de adivinanza",
        guessPrompt: "Quien hizo ese sonido? Toca la imagen del animal que crees que lo hizo.",
        guessRetry:
          "Casi. Esa opcion ya queda descartada. Escucha otra vez e intenta una vez mas.",
        guessFail:
          "Dos errores. Volviendo al modo libre para que puedan intentarlo otra vez cuando quieran.",
        guessCorrect: "Correcto! Era {animal}.",
        guessComplete: "Increible! Identificaste todos los sonidos.",
        guessStart: "Escucha con atencion. El modo de adivinanza ha comenzado.",
        guessAgain: "Intentar otra vez",
        guessCardHint: "Toca la imagen para adivinar",
      },
      info: {
        eyebrow: "Vista detallada del animal",
        aboutEyebrow: "Acerca de",
        aboutTitle: "Sobre este animal",
        unforgettableEyebrow: "Dato sorpresa",
        unforgettableTitle: "Un dato inolvidable",
        sizeEyebrow: "Comparar tamano",
        sizeTitle: "Que tan grande es?",
        keyFactsEyebrow: "Datos clave",
        keyFactsTitle: "Que notar",
        scienceEyebrow: "Como funciona",
        scienceTitle: "Ciencia en accion",
        questionsEyebrow: "Preguntas curiosas",
        ages35: "Edades 3 a 5",
        ages58: "Edades 5 a 8",
        ages813: "Edades 8 a 13",
        videoUnavailable: "Todavia no se agrego un video para este animal.",
        videoReady: "Pulsa Reproducir video para verlo sobre su fotografia.",
        sizePrompt: "Toca un boton de tamano para comparar este animal con algo conocido.",
      },
      app: {
        guessModeAction: "Modo de adivinanza",
      },
    },
    fr: {
      common: {
        settings: "Parametres",
        close: "Fermer",
        status: "Etat",
        language: "Langue",
        museumGuest: "Visiteur du musee",
        creatureFacts: "Faits sur l'animal",
        playVideo: "Lire la video",
        stopVideo: "Arreter la video",
        noVideo: "Aucune video n'a encore ete ajoutee pour cet animal.",
        loading: "Chargement de la bibliotheque des animaux...",
        contentUpdated: "Contenu mis a jour.",
        saveReady: "Apercu en direct pret.",
      },
      main: {
        headerSubtitle: "Presentation interactive du musee",
        headerTitle: "Appuyez et maintenez pour entendre l'animal",
        idleStatus: "Maintenez un bouton pour entendre l'animal. Les sons peuvent se superposer.",
        loadError: "Le mur sonore du musee n'a pas pu terminer son chargement.",
        couldNotPlay: "Impossible de lire {label}.",
        playingStatus: "{animals} en cours. La superposition est activee.",
        emptyTitle: "Aucun animal n'est encore disponible.",
        emptyBody:
          "Ajoutez un dossier d'animal avec son image, son audio, son fichier d'information et sa configuration, puis rechargez depuis Parametres.",
        openInfoAria: "Ouvrir plus d'informations sur {animal}.",
        openSettingsAria: "Ouvrir les parametres de {animal}.",
        playAnimalSoundAria: "Lire le son de {animal}.",
        infoAction: "Details de {animal}",
        guessingMode: "Qui a fait ce son ?",
        exitGuessingMode: "Quitter le mode devinette",
        guessPrompt: "Qui a fait ce son ? Touchez l'image de l'animal que vous choisissez.",
        guessRetry:
          "Pas encore. Ce choix est maintenant elimine. Ecoutez encore une fois et reessayez.",
        guessFail:
          "Deux erreurs. Retour au mode libre pour que votre groupe puisse recommencer quand il veut.",
        guessCorrect: "Bravo ! C'etait {animal}.",
        guessComplete: "Formidable ! Vous avez reconnu tous les sons.",
        guessStart: "Ecoutez bien. Le mode devinette commence.",
        guessAgain: "Reessayer",
        guessCardHint: "Touchez l'image pour deviner",
      },
      info: {
        eyebrow: "Vue detaillee de l'animal",
        aboutEyebrow: "A propos",
        aboutTitle: "A propos de cet animal",
        unforgettableEyebrow: "Grand fait surprise",
        unforgettableTitle: "Un fait inoubliable",
        sizeEyebrow: "Comparer la taille",
        sizeTitle: "Quelle taille fait-il ?",
        keyFactsEyebrow: "Faits cles",
        keyFactsTitle: "Ce qu'il faut remarquer",
        scienceEyebrow: "Comment cela marche",
        scienceTitle: "La science en action",
        questionsEyebrow: "Questions curieuses",
        ages35: "Ages 3 a 5",
        ages58: "Ages 5 a 8",
        ages813: "Ages 8 a 13",
        videoUnavailable: "Aucune video n'a encore ete ajoutee pour cet animal.",
        videoReady: "Appuyez sur Lire la video pour voir l'animal par-dessus sa photo.",
        sizePrompt: "Touchez un bouton de comparaison pour imaginer la taille de l'animal.",
      },
      app: {
        guessModeAction: "Mode devinette",
      },
    },
    zh: {
      common: {
        settings: "设置",
        close: "关闭",
        status: "状态",
        language: "语言",
        museumGuest: "博物馆访客",
        creatureFacts: "动物知识",
        playVideo: "播放视频",
        stopVideo: "停止视频",
        noVideo: "这个动物还没有添加视频。",
        loading: "正在加载动物资料库...",
        contentUpdated: "内容已更新。",
        saveReady: "实时预览已就绪。",
      },
      main: {
        headerSubtitle: "互动博物馆展项",
        headerTitle: "按住按钮聆听动物的声音",
        idleStatus: "按住按钮即可听到动物声音。多个声音可以同时播放。",
        loadError: "博物馆声音墙没有成功加载完成。",
        couldNotPlay: "无法播放 {label}。",
        playingStatus: "{animals} 正在播放，允许声音重叠。",
        emptyTitle: "目前还没有可用的动物。",
        emptyBody: "请先添加动物文件夹、图片、音频、说明文件和配置，然后在设置中重新加载。",
        openInfoAria: "打开 {animal} 的详细信息。",
        openSettingsAria: "打开 {animal} 的设置。",
        infoAction: "{animal} 详细信息",
        guessingMode: "是谁发出的声音？",
        exitGuessingMode: "退出猜声音模式",
        guessPrompt: "是谁发出的声音？点按你认为正确的动物图片。",
        guessRetry: "还不对。这个选项已被划掉。再听一遍，再试一次。",
        guessFail: "连续错了两次。正在返回自由体验模式，之后可以再试。",
        guessCorrect: "答对了！这是 {animal}。",
        guessComplete: "太棒了！你找出了所有动物的声音。",
        guessStart: "请认真听。猜声音模式已经开始。",
        guessAgain: "再试一次",
        guessCardHint: "点按图片进行猜测",
      },
      info: {
        eyebrow: "动物详细视图",
        aboutEyebrow: "关于它",
        aboutTitle: "关于这种动物",
        unforgettableEyebrow: "最令人难忘的事实",
        unforgettableTitle: "一个一定会记住的知识点",
        sizeEyebrow: "大小比较",
        sizeTitle: "它有多大？",
        keyFactsEyebrow: "关键事实",
        keyFactsTitle: "值得注意的地方",
        scienceEyebrow: "原理说明",
        scienceTitle: "科学正在发生",
        questionsEyebrow: "好奇问题",
        ages35: "3 到 5 岁",
        ages58: "5 到 8 岁",
        ages813: "8 到 13 岁",
        videoUnavailable: "这个动物还没有添加视频。",
        videoReady: "按播放视频按钮，就能在照片上方观看这只动物。",
        sizePrompt: "点按大小比较按钮，用熟悉的东西来想象它的体型。",
      },
      app: {
        guessModeAction: "猜声音模式",
      },
    },
  };

  const ANIMAL_COPY = {};

  Object.assign(ANIMAL_COPY, {
    "barn-owl": {
      en: {
        displayName: "Barn Owl",
        soundButton: "Owl Sounds",
        scientificPronunciation: "TIE-toe AL-buh",
        aboutBody:
          "Barn owls hunt by listening with astonishing precision. Their pale heart-shaped face helps funnel sound toward hidden ears, and their soft feathers let them fly quietly enough to surprise a mouse in near-total darkness.",
        keyFacts: [
          "Barn owls often hunt small mammals in very low light.",
          "Their heart-shaped facial disc helps guide sound toward the ears.",
          "They often nest in barns, silos, towers, and other sheltered places.",
        ],
        scienceHighlights: [
          "Barn owls have ears set at slightly different heights, which helps them pinpoint where a sound is coming from.",
          "Special feather edges break up airflow so the owl can fly almost silently.",
        ],
        curiousQuestionAge3To5: "What sound do you think a barn owl listens for in the dark?",
        curiousQuestionAge5To8: "Why might a quiet set of feathers help an owl catch dinner?",
        curiousQuestionAge8To13: "How do the barn owl's face and ears work together like a sound-finding tool?",
        unforgettableFact: "A barn owl can hear a tiny mouse moving under dry grass in the dark.",
        sizeComparisons: [
          {
            label: "About as long as a house cat",
            detail: "From beak to tail, many barn owls are about the length of a relaxed house cat.",
          },
          {
            label: "Wings wider than a school backpack",
            detail: "A barn owl's wingspan can stretch wider than a large classroom backpack.",
          },
          {
            label: "Lighter than it looks",
            detail: "Even with wide wings, a barn owl is built to be light enough for quiet flight.",
          },
        ],
      },
      es: {
        displayName: "Lechuza de granero",
        soundButton: "Sonidos del buho",
        scientificPronunciation: "TIE-toe AL-buh",
        aboutBody:
          "La lechuza de granero caza escuchando con una precision sorprendente. Su cara clara con forma de corazon dirige el sonido hacia sus oidos ocultos, y sus plumas suaves le permiten volar tan silenciosamente que puede sorprender a un raton en casi total oscuridad.",
        keyFacts: [
          "La lechuza de granero suele cazar pequenos mamiferos con muy poca luz.",
          "Su disco facial en forma de corazon ayuda a dirigir el sonido hacia los oidos.",
          "Suele anidar en graneros, silos, torres y otros lugares protegidos.",
        ],
        scienceHighlights: [
          "Sus oidos estan a alturas ligeramente distintas y eso le ayuda a localizar de donde viene un sonido.",
          "Los bordes especiales de sus plumas rompen el aire para que el vuelo sea casi silencioso.",
        ],
        curiousQuestionAge3To5: "Que sonido crees que escucha una lechuza en la oscuridad?",
        curiousQuestionAge5To8: "Por que unas plumas silenciosas ayudarian al buho a atrapar su comida?",
        curiousQuestionAge8To13: "Como trabajan juntos la cara y los oidos de la lechuza para encontrar sonidos?",
        unforgettableFact: "Una lechuza de granero puede oir a un raton diminuto moverse bajo la hierba seca en la oscuridad.",
        sizeComparisons: [
          {
            label: "Tan larga como un gato casero",
            detail: "Del pico a la cola, muchas lechuzas de granero miden casi como un gato domestico tranquilo.",
          },
          {
            label: "Alas mas anchas que una mochila escolar",
            detail: "Su envergadura puede ser mas ancha que una mochila grande de escuela.",
          },
          {
            label: "Mas ligera de lo que parece",
            detail: "Aunque sus alas son grandes, su cuerpo es ligero para poder volar en silencio.",
          },
        ],
      },
      fr: {
        displayName: "Effraie des clochers",
        soundButton: "Sons du hibou",
        scientificPronunciation: "TIE-toe AL-buh",
        aboutBody:
          "L'effraie chasse grace a une ecoute tres precise. Son visage clair en forme de coeur dirige le son vers ses oreilles cachees, et ses plumes souples lui permettent de voler si silencieusement qu'elle peut surprendre une souris dans presque toute l'obscurite.",
        keyFacts: [
          "L'effraie chasse souvent de petits mammiferes quand la lumiere est faible.",
          "Son disque facial en forme de coeur aide a guider le son vers ses oreilles.",
          "Elle niche souvent dans des granges, des silos, des tours et d'autres abris.",
        ],
        scienceHighlights: [
          "Ses oreilles ne sont pas tout a fait a la meme hauteur, ce qui l'aide a localiser les sons.",
          "Le bord special de ses plumes casse l'air pour rendre le vol presque silencieux.",
        ],
        curiousQuestionAge3To5: "Quel son, a ton avis, l'effraie ecoute-t-elle dans le noir ?",
        curiousQuestionAge5To8: "Pourquoi des plumes silencieuses aideraient-elles un hibou a attraper son repas ?",
        curiousQuestionAge8To13: "Comment le visage et les oreilles de l'effraie travaillent-ils ensemble pour trouver un son ?",
        unforgettableFact: "Une effraie peut entendre une toute petite souris bouger sous l'herbe seche dans le noir.",
        sizeComparisons: [
          {
            label: "A peu pres longue comme un chat",
            detail: "Du bec a la queue, beaucoup d'effraies ont a peu pres la longueur d'un chat domestique.",
          },
          {
            label: "Des ailes plus larges qu'un sac d'ecole",
            detail: "L'envergure d'une effraie peut depasser la largeur d'un grand sac a dos d'ecole.",
          },
          {
            label: "Plus legere qu'elle n'en a l'air",
            detail: "Malgre ses grandes ailes, l'effraie reste legere pour voler en silence.",
          },
        ],
      },
      zh: {
        displayName: "仓鸮",
        soundButton: "猫头鹰声音",
        scientificPronunciation: "TIE-toe AL-buh",
        aboutBody:
          "仓鸮靠极其准确的听觉来捕猎。它浅色的心形脸盘会把声音集中到隐藏的耳朵里，柔软的羽毛让它飞行时几乎没有声音，因此能在黑暗中悄悄接近老鼠。",
        keyFacts: [
          "仓鸮常在很暗的环境里捕捉小型哺乳动物。",
          "它心形的脸盘能把声音导向耳朵。",
          "它们常在谷仓、筒仓、塔楼和其他遮蔽地点筑巢。",
        ],
        scienceHighlights: [
          "仓鸮两只耳朵的位置高低略有不同，这让它更容易判断声音来自哪里。",
          "羽毛边缘的特殊结构会打散气流，让飞行更安静。",
        ],
        curiousQuestionAge3To5: "你觉得仓鸮会在黑暗里听什么声音？",
        curiousQuestionAge5To8: "为什么安静的羽毛会帮助猫头鹰抓到晚餐？",
        curiousQuestionAge8To13: "仓鸮的脸和耳朵怎样一起工作，像一个找声音的工具？",
        unforgettableFact: "仓鸮能在黑暗中听见干草下面一只小老鼠轻轻移动的声音。",
        sizeComparisons: [
          {
            label: "和家猫差不多长",
            detail: "很多仓鸮从嘴到尾巴的长度，大约和一只放松的家猫差不多。",
          },
          {
            label: "翅膀比书包还宽",
            detail: "仓鸮张开双翅时，宽度可能比一个大号学生书包还要宽。",
          },
          {
            label: "比看上去更轻",
            detail: "虽然翅膀很大，但它的身体很轻，才能安静飞行。",
          },
        ],
      },
    },
    "bull-elk": {
      en: {
        displayName: "Bull Elk",
        soundButton: "Elk Sounds",
        scientificPronunciation: "SUR-vus kan-uh-DEN-sis",
        aboutBody:
          "A bull elk uses its loud bugle call to advertise strength during the breeding season. Huge antlers, powerful neck muscles, and a deep chest help it stand out across open forests and mountain valleys.",
        keyFacts: [
          "Bull elk give bugling calls that can echo across a valley.",
          "Their antlers are grown and shed every year.",
          "Large groups of elk often move together between feeding and resting areas.",
        ],
        scienceHighlights: [
          "Fast-growing antlers are made of bone and are among the quickest growing tissues in mammals.",
          "The bugle mixes a low and high sound, making the call seem even larger than the animal.",
        ],
        curiousQuestionAge3To5: "How far away do you think an elk call can travel?",
        curiousQuestionAge5To8: "Why might a bull elk want such a loud voice in autumn?",
        curiousQuestionAge8To13: "How do antlers, body size, and sound work together as signals during elk breeding season?",
        unforgettableFact: "A bull elk grows a brand-new rack of antlers every single year.",
        sizeComparisons: [
          {
            label: "As tall as a small horse",
            detail: "A big bull elk can stand about as tall at the shoulder as a small horse.",
          },
          {
            label: "Antlers wider than bicycle handlebars",
            detail: "The antlers on a large bull can spread wider than a set of handlebars.",
          },
          {
            label: "Heavier than a piano bench full of books",
            detail: "Bull elk are truly heavy animals built for power, distance, and winter survival.",
          },
        ],
      },
      es: {
        displayName: "Uapiti macho",
        soundButton: "Sonidos del alce",
        scientificPronunciation: "SUR-vus kan-uh-DEN-sis",
        aboutBody:
          "Un uapiti macho usa su potente bramido para mostrar fuerza durante la epoca reproductiva. Sus enormes astas, su cuello musculoso y su pecho profundo le ayudan a destacar en bosques abiertos y valles de montana.",
        keyFacts: [
          "El uapiti macho emite bramidos que pueden resonar por todo un valle.",
          "Sus astas crecen y se caen cada ano.",
          "Los grupos grandes de uapitis suelen desplazarse juntos entre zonas de comida y descanso.",
        ],
        scienceHighlights: [
          "Las astas son hueso de rapido crecimiento y estan entre los tejidos que mas rapido crecen en los mamiferos.",
          "El bramido mezcla un sonido grave y uno agudo, haciendo que el animal parezca aun mas grande.",
        ],
        curiousQuestionAge3To5: "Que tan lejos crees que puede viajar el sonido de un alce?",
        curiousQuestionAge5To8: "Por que un macho querria una voz tan fuerte en otono?",
        curiousQuestionAge8To13: "Como se combinan las astas, el tamano del cuerpo y el sonido como senales en la epoca reproductiva?",
        unforgettableFact: "Un alce macho hace crecer un juego completamente nuevo de astas cada ano.",
        sizeComparisons: [
          {
            label: "Tan alto como un caballo pequeno",
            detail: "Un gran macho puede medir a la altura del hombro casi como un caballo pequeno.",
          },
          {
            label: "Astas mas anchas que un manillar",
            detail: "Las astas de un macho grande pueden abrirse mas que un manillar de bicicleta.",
          },
          {
            label: "Mucho mas pesado de lo que parece",
            detail: "El cuerpo del alce esta hecho para fuerza, distancia y supervivencia invernal.",
          },
        ],
      },
      fr: {
        displayName: "Wapiti male",
        soundButton: "Sons du wapiti",
        scientificPronunciation: "SUR-vus kan-uh-DEN-sis",
        aboutBody:
          "Le wapiti male utilise son brame puissant pour montrer sa force pendant la saison des amours. Ses grands bois, son cou musculeux et sa poitrine profonde l'aident a dominer les forets ouvertes et les vallees de montagne.",
        keyFacts: [
          "Le brame d'un wapiti male peut resonner tres loin dans une vallee.",
          "Ses bois poussent puis tombent chaque annee.",
          "De grands groupes de wapitis se deplacent souvent ensemble entre les zones de nourriture et de repos.",
        ],
        scienceHighlights: [
          "Les bois sont faits d'os a croissance rapide, parmi les tissus les plus rapides chez les mammiferes.",
          "Le brame melange une note grave et une note aigue, ce qui fait paraitre l'animal encore plus grand.",
        ],
        curiousQuestionAge3To5: "Jusqu'ou penses-tu qu'un cri de wapiti peut voyager ?",
        curiousQuestionAge5To8: "Pourquoi un male voudrait-il une voix si forte en automne ?",
        curiousQuestionAge8To13: "Comment les bois, la taille du corps et le son deviennent-ils des signaux pendant la reproduction ?",
        unforgettableFact: "Un wapiti male fait pousser une toute nouvelle paire de bois chaque annee.",
        sizeComparisons: [
          {
            label: "Aussi grand qu'un petit cheval",
            detail: "Un grand wapiti male peut atteindre a l'epaule la taille d'un petit cheval.",
          },
          {
            label: "Des bois plus larges qu'un guidon",
            detail: "Les bois d'un grand male peuvent s'etendre plus largement qu'un guidon de velo.",
          },
          {
            label: "Bien plus lourd qu'il n'en a l'air",
            detail: "Le corps du wapiti est concu pour la puissance, la distance et l'hiver.",
          },
        ],
      },
      zh: {
        displayName: "雄性马鹿",
        soundButton: "马鹿声音",
        scientificPronunciation: "SUR-vus kan-uh-DEN-sis",
        aboutBody:
          "雄性马鹿在繁殖季会发出响亮的鸣叫来展示力量。巨大的鹿角、结实的颈部肌肉和深厚的胸腔，让它在开阔森林和山谷中格外醒目。",
        keyFacts: [
          "雄性马鹿的鸣叫声可以在山谷中回荡很远。",
          "它们的鹿角每年都会重新长出，再脱落。",
          "成群的马鹿常会一起在觅食区和休息区之间移动。",
        ],
        scienceHighlights: [
          "快速生长的鹿角由骨骼组成，是哺乳动物中生长最快的组织之一。",
          "马鹿的鸣叫同时有低音和高音，让它听起来比实际体型更大。",
        ],
        curiousQuestionAge3To5: "你觉得马鹿的叫声能传多远？",
        curiousQuestionAge5To8: "为什么雄性马鹿在秋天需要这么响亮的声音？",
        curiousQuestionAge8To13: "鹿角、体型和叫声怎样一起成为繁殖季中的信号？",
        unforgettableFact: "一只雄性马鹿每一年都会重新长出一整副新的鹿角。",
        sizeComparisons: [
          {
            label: "像一匹小马那么高",
            detail: "大型雄鹿肩高大约能和一匹小马差不多。",
          },
          {
            label: "鹿角比自行车车把还宽",
            detail: "一只大型雄鹿的鹿角展开后，可能比车把还宽。",
          },
          {
            label: "比看起来更重",
            detail: "马鹿的身体为力量、远行和越冬而打造，非常结实。",
          },
        ],
      },
    },
    coyote: {
      en: {
        displayName: "Coyote",
        soundButton: "Coyote Sounds",
        scientificPronunciation: "KAY-nis LAY-tranz",
        aboutBody:
          "Coyotes are adaptable hunters and scavengers that can live in deserts, grasslands, forests, and even cities. Their howls, yips, and barks help family members stay in touch across a wide territory.",
        keyFacts: [
          "Coyotes can live close to people if food and shelter are available.",
          "A coyote family often communicates with several different call types.",
          "They eat many foods, from mice and rabbits to fruit and insects.",
        ],
        scienceHighlights: [
          "A coyote's flexible diet helps it survive in many habitats.",
          "Its long legs and narrow feet help it travel quickly over long distances.",
        ],
        curiousQuestionAge3To5: "What do you think a coyote is saying when it yips at night?",
        curiousQuestionAge5To8: "Why would a coyote family need more than one kind of call?",
        curiousQuestionAge8To13: "How does being an adaptable eater help coyotes spread into so many different habitats?",
        unforgettableFact: "A coyote can sound like many animals at once because one family often calls together.",
        sizeComparisons: [
          {
            label: "About as long as a medium dog",
            detail: "A coyote is often about the length of a medium-size dog, but built leaner for travel.",
          },
          {
            label: "Tall enough to peek over a backpack",
            detail: "At shoulder height, a coyote can stand high enough to peek over a school backpack.",
          },
          {
            label: "Lighter than an adult person",
            detail: "Coyotes are lighter than most people, which helps them move quickly and quietly.",
          },
        ],
      },
      es: {
        displayName: "Coyote",
        soundButton: "Sonidos del coyote",
        scientificPronunciation: "KAY-nis LAY-tranz",
        aboutBody:
          "Los coyotes son cazadores y oportunistas muy adaptables que pueden vivir en desiertos, praderas, bosques e incluso ciudades. Sus aullidos, chillidos y ladridos ayudan a la familia a mantenerse en contacto dentro de un territorio amplio.",
        keyFacts: [
          "Los coyotes pueden vivir cerca de las personas si encuentran comida y refugio.",
          "Una familia de coyotes suele comunicarse con varios tipos distintos de sonidos.",
          "Comen muchos alimentos, desde ratones y conejos hasta fruta e insectos.",
        ],
        scienceHighlights: [
          "Su dieta flexible le ayuda a sobrevivir en muchos habitats.",
          "Sus patas largas y pies estrechos le ayudan a recorrer largas distancias con rapidez.",
        ],
        curiousQuestionAge3To5: "Que crees que dice un coyote cuando chilla por la noche?",
        curiousQuestionAge5To8: "Por que una familia de coyotes necesitaria mas de un tipo de llamada?",
        curiousQuestionAge8To13: "Como ayuda una dieta adaptable a que los coyotes vivan en tantos lugares distintos?",
        unforgettableFact: "Una familia de coyotes puede sonar como si hubiera muchos animales porque suelen llamar juntos.",
        sizeComparisons: [
          {
            label: "Tan largo como un perro mediano",
            detail: "Un coyote suele medir mas o menos como un perro mediano, pero con un cuerpo mas esbelto.",
          },
          {
            label: "Lo bastante alto para asomarse sobre una mochila",
            detail: "A la altura del hombro, un coyote puede asomarse por encima de una mochila escolar.",
          },
          {
            label: "Mas ligero que una persona adulta",
            detail: "Su cuerpo ligero le ayuda a moverse rapido y en silencio.",
          },
        ],
      },
      fr: {
        displayName: "Coyote",
        soundButton: "Sons du coyote",
        scientificPronunciation: "KAY-nis LAY-tranz",
        aboutBody:
          "Le coyote est un chasseur et charognard tres adaptable qui peut vivre dans les deserts, les prairies, les forets et meme les villes. Ses hurlements, ses glapissements et ses aboiements permettent a la famille de rester en contact sur un grand territoire.",
        keyFacts: [
          "Le coyote peut vivre pres des humains si la nourriture et les abris sont disponibles.",
          "Une famille de coyotes communique avec plusieurs types de cris.",
          "Il mange des souris, des lapins, des fruits et meme des insectes.",
        ],
        scienceHighlights: [
          "Son regime alimentaire souple l'aide a survivre dans de nombreux habitats.",
          "Ses longues pattes et ses pieds etroits l'aident a parcourir de longues distances rapidement.",
        ],
        curiousQuestionAge3To5: "A ton avis, que dit un coyote quand il glapit la nuit ?",
        curiousQuestionAge5To8: "Pourquoi une famille de coyotes aurait-elle besoin de plusieurs sortes de cris ?",
        curiousQuestionAge8To13: "Comment une alimentation adaptable aide-t-elle les coyotes a vivre dans tant d'endroits differents ?",
        unforgettableFact: "Une seule famille de coyotes peut donner l'impression qu'il y a tout un groupe d'animaux autour de vous.",
        sizeComparisons: [
          {
            label: "Long comme un chien moyen",
            detail: "Un coyote a souvent la longueur d'un chien moyen, mais avec un corps plus fin pour voyager.",
          },
          {
            label: "Assez haut pour depasser un sac",
            detail: "A l'epaule, un coyote peut etre assez haut pour jeter un coup d'oeil au-dessus d'un sac d'ecole.",
          },
          {
            label: "Plus leger qu'un adulte",
            detail: "Le coyote reste plus leger que la plupart des personnes, ce qui l'aide a bouger vite et sans bruit.",
          },
        ],
      },
      zh: {
        displayName: "郊狼",
        soundButton: "郊狼声音",
        scientificPronunciation: "KAY-nis LAY-tranz",
        aboutBody:
          "郊狼是一种非常适应环境的猎手和食腐动物，能生活在沙漠、草原、森林，甚至城市里。它们会用嚎叫、尖叫和吠叫，让家族成员在广阔领地中保持联系。",
        keyFacts: [
          "只要有食物和藏身处，郊狼就能生活在人类附近。",
          "一个郊狼家庭通常会使用多种不同的叫声交流。",
          "它们会吃很多种食物，从老鼠和兔子到水果和昆虫。",
        ],
        scienceHighlights: [
          "灵活的食谱让郊狼能在许多不同环境中生存。",
          "长腿和狭窄的脚有助于它快速走很远的路。",
        ],
        curiousQuestionAge3To5: "你觉得郊狼在夜里尖叫时想说什么？",
        curiousQuestionAge5To8: "为什么一个郊狼家庭需要不止一种叫声？",
        curiousQuestionAge8To13: "为什么适应各种食物会帮助郊狼进入这么多不同的环境？",
        unforgettableFact: "一整个郊狼家庭一起叫时，听起来会像有很多只动物同时在发声。",
        sizeComparisons: [
          {
            label: "和中型狗差不多长",
            detail: "郊狼的身体长度常常和一只中型狗差不多，但更瘦长。",
          },
          {
            label: "站起来能越过书包",
            detail: "按肩高算，郊狼足够高，能从学生书包上方探出头来。",
          },
          {
            label: "比成年人轻得多",
            detail: "较轻的身体能帮助郊狼快速而安静地移动。",
          },
        ],
      },
    },
    "field-cricket": {
      en: {
        displayName: "Field Cricket",
        soundButton: "Cricket Sounds",
        scientificPronunciation: "GRIL-us pen-sil-VAN-ih-kus",
        aboutBody:
          "Field crickets make their familiar chirping song by rubbing one forewing against the other. That repeating rhythm helps nearby crickets know who is calling and where the singer is hiding.",
        keyFacts: [
          "Only male crickets make the loud calling song.",
          "Crickets often sing from grassy cover or small openings in the soil.",
          "Their long back legs are built for jumping.",
        ],
        scienceHighlights: [
          "A cricket's song is made by stridulation, which means rubbing body parts together to create sound.",
          "Temperature can change how quickly a cricket chirps.",
        ],
        curiousQuestionAge3To5: "What do you think the cricket is rubbing together to make that song?",
        curiousQuestionAge5To8: "Why might a tiny animal need such a repeating sound?",
        curiousQuestionAge8To13: "How can scientists use chirp speed to learn about the cricket's environment?",
        unforgettableFact: "A field cricket sings by playing one wing against the other like a tiny violin.",
        sizeComparisons: [
          {
            label: "Smaller than your thumb",
            detail: "A field cricket can fit easily on or under most people's thumbs.",
          },
          {
            label: "About as long as a paper clip",
            detail: "Many field crickets are only about as long as a small paper clip.",
          },
          {
            label: "Lighter than a coin",
            detail: "A cricket's body is so light that a small jump can launch it far beyond its own length.",
          },
        ],
      },
      es: {
        displayName: "Grillo campestre",
        soundButton: "Sonidos del grillo",
        scientificPronunciation: "GRIL-us pen-sil-VAN-ih-kus",
        aboutBody:
          "El grillo campestre produce su canto conocido frotando una ala delantera contra la otra. Ese ritmo repetido ayuda a otros grillos a saber quien canta y donde se esconde.",
        keyFacts: [
          "Solo los grillos machos producen el canto fuerte de llamada.",
          "Suelen cantar desde la hierba o pequenas aberturas del suelo.",
          "Sus largas patas traseras estan hechas para saltar.",
        ],
        scienceHighlights: [
          "El sonido del grillo se produce por estridulacion, es decir, al frotar partes del cuerpo para crear sonido.",
          "La temperatura puede cambiar la rapidez del canto.",
        ],
        curiousQuestionAge3To5: "Que crees que frota el grillo para hacer ese sonido?",
        curiousQuestionAge5To8: "Por que un animal tan pequeno necesitara un sonido tan repetido?",
        curiousQuestionAge8To13: "Como pueden los cientificos usar la velocidad de los chirridos para aprender sobre el ambiente?",
        unforgettableFact: "Un grillo campestre canta tocando un ala contra la otra como un violin diminuto.",
        sizeComparisons: [
          {
            label: "Mas pequeno que tu pulgar",
            detail: "Un grillo campestre cabe facilmente sobre o debajo del pulgar de muchas personas.",
          },
          {
            label: "Tan largo como un clip",
            detail: "Muchos grillos campestres miden solo lo que un clip pequeno.",
          },
          {
            label: "Mas ligero que una moneda",
            detail: "Su cuerpo es tan ligero que un solo salto puede llevarlo muchas veces su propio largo.",
          },
        ],
      },
      fr: {
        displayName: "Grillon des champs",
        soundButton: "Sons du grillon",
        scientificPronunciation: "GRIL-us pen-sil-VAN-ih-kus",
        aboutBody:
          "Le grillon des champs produit son chant en frottant une aile avant contre l'autre. Ce rythme repete aide les autres grillons a savoir qui chante et ou le chanteur se cache.",
        keyFacts: [
          "Seuls les grillons males emettent le chant d'appel puissant.",
          "Les grillons chantent souvent depuis l'herbe ou de petites ouvertures dans le sol.",
          "Leurs longues pattes arriere sont faites pour sauter.",
        ],
        scienceHighlights: [
          "Le chant du grillon est cree par stridulation, c'est-a-dire en frottant des parties du corps l'une contre l'autre.",
          "La temperature peut changer la vitesse des cris du grillon.",
        ],
        curiousQuestionAge3To5: "Qu'est-ce que le grillon frotte, a ton avis, pour faire ce son ?",
        curiousQuestionAge5To8: "Pourquoi un si petit animal aurait-il besoin d'un son aussi repete ?",
        curiousQuestionAge8To13: "Comment les scientifiques peuvent-ils utiliser la vitesse des cris pour etudier l'environnement du grillon ?",
        unforgettableFact: "Le grillon des champs chante en jouant une aile contre l'autre comme un minuscule violon.",
        sizeComparisons: [
          {
            label: "Plus petit que ton pouce",
            detail: "Un grillon des champs tient facilement sur ou sous le pouce de beaucoup de personnes.",
          },
          {
            label: "Long comme un petit trombone",
            detail: "Beaucoup de grillons des champs n'ont que la longueur d'un petit trombone.",
          },
          {
            label: "Plus leger qu'une piece",
            detail: "Son corps est si leger qu'un saut peut le propulser bien plus loin que sa taille.",
          },
        ],
      },
      zh: {
        displayName: "田野蟋蟀",
        soundButton: "蟋蟀声音",
        scientificPronunciation: "GRIL-us pen-sil-VAN-ih-kus",
        aboutBody:
          "田野蟋蟀会把一片前翅摩擦到另一片前翅上，发出大家熟悉的鸣叫声。这样的重复节奏能让附近的蟋蟀知道是谁在唱、又躲在哪里。",
        keyFacts: [
          "只有雄性蟋蟀会发出响亮的求偶叫声。",
          "蟋蟀常在草丛或土壤的小洞口附近鸣叫。",
          "它们长长的后腿特别适合跳跃。",
        ],
        scienceHighlights: [
          "蟋蟀的声音来自摩擦发声，也就是用身体部位互相摩擦来产生声音。",
          "温度会影响蟋蟀鸣叫的速度。",
        ],
        curiousQuestionAge3To5: "你觉得蟋蟀是用什么互相摩擦来发出声音的？",
        curiousQuestionAge5To8: "为什么这么小的动物需要一直重复同一种声音？",
        curiousQuestionAge8To13: "科学家怎样利用蟋蟀鸣叫的速度来了解环境变化？",
        unforgettableFact: "田野蟋蟀是靠两片翅膀互相摩擦，像拉小提琴一样唱歌的。",
        sizeComparisons: [
          {
            label: "比你的拇指还小",
            detail: "一只田野蟋蟀很容易就能放在大多数人的拇指上。",
          },
          {
            label: "差不多像回形针一样长",
            detail: "很多田野蟋蟀的身体长度大约只有一个小回形针那么长。",
          },
          {
            label: "比硬币还轻",
            detail: "它身体非常轻，所以一次跳跃就能跨过自己身体很多倍的距离。",
          },
        ],
      },
    },
  });

  Object.assign(ANIMAL_COPY, {
    "mallard-duck": {
      en: {
        displayName: "Mallard Duck",
        soundButton: "Mallard Sounds",
        scientificPronunciation: "AN-us PLAT-ih-RIN-kos",
        aboutBody:
          "Mallards are familiar ducks found on ponds, marshes, rivers, and city parks. Their flat bills help them strain food from the water, and their waterproof feathers help them float and stay warm.",
        keyFacts: [
          "Mallards dabble by tipping forward to reach food in shallow water.",
          "The female mallard's quack is especially easy for people to recognize.",
          "Mallards can live in both wild wetlands and busy city parks.",
        ],
        scienceHighlights: [
          "Special oil from a gland near the tail helps keep duck feathers waterproof.",
          "Their broad bill works like a food filter in mud and water.",
        ],
        curiousQuestionAge3To5: "What do you think a duck is scooping up with its bill?",
        curiousQuestionAge5To8: "Why would waterproof feathers matter on a cold pond?",
        curiousQuestionAge8To13: "How do a duck's bill and feathers work together for life on the water?",
        unforgettableFact: "A mallard's feathers are coated with oil so water rolls right off.",
        sizeComparisons: [
          {
            label: "About as long as a ruler",
            detail: "A mallard is often close to the length of a classroom ruler from bill to tail.",
          },
          {
            label: "Wings wider than a bed pillow",
            detail: "Its wingspan can stretch wider than many bed pillows.",
          },
          {
            label: "Lighter than a house cat",
            detail: "A mallard looks sturdy on the water, but it weighs far less than a cat.",
          },
        ],
      },
      es: {
        displayName: "Anade real",
        soundButton: "Sonidos del pato",
        scientificPronunciation: "AN-us PLAT-ih-RIN-kos",
        aboutBody:
          "El anade real es un pato muy conocido de estanques, marismas, rios y parques urbanos. Su pico ancho le ayuda a filtrar comida del agua, y sus plumas impermeables le ayudan a flotar y conservar el calor.",
        keyFacts: [
          "Los anades reales se inclinan hacia adelante para alcanzar comida en aguas poco profundas.",
          "El clasico cuac de la hembra es especialmente facil de reconocer.",
          "Pueden vivir tanto en humedales salvajes como en parques de ciudad.",
        ],
        scienceHighlights: [
          "Un aceite especial de una glandula cerca de la cola ayuda a que las plumas repelan el agua.",
          "Su pico ancho funciona como un filtro de comida en barro y agua.",
        ],
        curiousQuestionAge3To5: "Que crees que esta recogiendo el pato con su pico?",
        curiousQuestionAge5To8: "Por que importarian unas plumas impermeables en un estanque frio?",
        curiousQuestionAge8To13: "Como trabajan juntos el pico y las plumas para la vida en el agua?",
        unforgettableFact: "Las plumas del anade real tienen aceite y por eso el agua se desliza sobre ellas.",
        sizeComparisons: [
          {
            label: "Tan largo como una regla",
            detail: "Muchos anades reales tienen casi la misma longitud que una regla escolar.",
          },
          {
            label: "Alas mas anchas que una almohada",
            detail: "La envergadura puede ser mas ancha que una almohada de cama.",
          },
          {
            label: "Mas ligero que un gato",
            detail: "Aunque parece robusto en el agua, pesa mucho menos que un gato domestico.",
          },
        ],
      },
      fr: {
        displayName: "Canard colvert",
        soundButton: "Sons du canard",
        scientificPronunciation: "AN-us PLAT-ih-RIN-kos",
        aboutBody:
          "Le canard colvert est un visiteur tres courant des etangs, marais, rivieres et parcs urbains. Son large bec lui permet de filtrer la nourriture dans l'eau, et ses plumes impermeables l'aident a flotter et a rester au chaud.",
        keyFacts: [
          "Le colvert bascule vers l'avant pour chercher sa nourriture dans l'eau peu profonde.",
          "Le fameux coin-coin de la femelle est facile a reconnaitre.",
          "Le colvert peut vivre aussi bien dans les zones humides sauvages que dans les parcs de ville.",
        ],
        scienceHighlights: [
          "Une huile speciale provenant d'une glande pres de la queue aide a garder les plumes impermeables.",
          "Le large bec fonctionne comme un filtre a nourriture dans l'eau et la boue.",
        ],
        curiousQuestionAge3To5: "Que crois-tu que le canard ramasse avec son bec ?",
        curiousQuestionAge5To8: "Pourquoi des plumes impermeables seraient-elles utiles sur une eau froide ?",
        curiousQuestionAge8To13: "Comment le bec et les plumes d'un canard travaillent-ils ensemble pour la vie sur l'eau ?",
        unforgettableFact: "Les plumes du colvert sont recouvertes d'huile, alors l'eau glisse dessus.",
        sizeComparisons: [
          {
            label: "Long comme une regle",
            detail: "Un colvert mesure souvent a peu pres la longueur d'une regle d'ecole.",
          },
          {
            label: "Des ailes plus larges qu'un oreiller",
            detail: "Son envergure peut etre plus large qu'un oreiller de lit.",
          },
          {
            label: "Plus leger qu'un chat",
            detail: "Sur l'eau il parait solide, mais il pese bien moins qu'un chat domestique.",
          },
        ],
      },
      zh: {
        displayName: "绿头鸭",
        soundButton: "鸭子声音",
        scientificPronunciation: "AN-us PLAT-ih-RIN-kos",
        aboutBody:
          "绿头鸭是池塘、沼泽、河流和城市公园里最常见的鸭子之一。它扁平的嘴能从水里过滤食物，防水羽毛帮助它漂浮并保持温暖。",
        keyFacts: [
          "绿头鸭会把身体前倾，在浅水里寻找食物。",
          "母鸭经典的“嘎嘎”声最容易被人认出来。",
          "绿头鸭既能生活在野生湿地，也能生活在城市公园。",
        ],
        scienceHighlights: [
          "尾部附近的腺体会分泌油脂，帮助羽毛保持防水。",
          "宽大的喙像过滤器一样，能从水和泥里筛出食物。",
        ],
        curiousQuestionAge3To5: "你觉得鸭子正用嘴在水里捞什么？",
        curiousQuestionAge5To8: "在寒冷的池塘里，防水羽毛为什么这么重要？",
        curiousQuestionAge8To13: "鸭子的嘴和羽毛怎样一起帮助它在水上生活？",
        unforgettableFact: "绿头鸭会给羽毛抹油，所以水会直接从身上滑下来。",
        sizeComparisons: [
          {
            label: "差不多像一把尺子那么长",
            detail: "很多绿头鸭从嘴到尾巴的长度，大约和教室里的尺子差不多。",
          },
          {
            label: "翅膀比枕头还宽",
            detail: "张开翅膀时，宽度可能比床上的枕头还宽。",
          },
          {
            label: "比家猫轻",
            detail: "它在水面上看起来很结实，但重量远远低于一只家猫。",
          },
        ],
      },
    },
    geese: {
      en: {
        displayName: "Geese",
        soundButton: "Geese Sounds",
        scientificPronunciation: "BRAN-tuh kan-uh-DEN-sis",
        aboutBody:
          "Canada geese are strong fliers that travel in noisy flocks. Their honks help the group stay together in the air and on the ground, and their long necks help them reach food in grass and shallow water.",
        keyFacts: [
          "Geese often travel in groups and call to each other while flying.",
          "Their strong wings carry them long distances during migration.",
          "They graze on grasses and also feed in shallow water.",
        ],
        scienceHighlights: [
          "Flying in a V formation can help geese save energy on long trips.",
          "Their broad webbed feet work well for both swimming and walking on soft ground.",
        ],
        curiousQuestionAge3To5: "Why do you think geese call to each other while they fly?",
        curiousQuestionAge5To8: "How might a V shape help a whole flock travel together?",
        curiousQuestionAge8To13: "Why would an animal that migrates need both powerful wings and strong social communication?",
        unforgettableFact: "A flock of geese can save energy by flying in a V shape behind one another.",
        sizeComparisons: [
          {
            label: "As tall as a toddler sitting down",
            detail: "A goose standing upright can seem almost as tall as a seated toddler.",
          },
          {
            label: "Wings wider than a coffee table",
            detail: "A large goose can spread its wings impressively wide for such a familiar bird.",
          },
          {
            label: "Heavier than a gallon of milk",
            detail: "A goose can be surprisingly solid and heavy when you see one up close.",
          },
        ],
      },
      es: {
        displayName: "Gansos",
        soundButton: "Sonidos de gansos",
        scientificPronunciation: "BRAN-tuh kan-uh-DEN-sis",
        aboutBody:
          "Los gansos de Canada son voladores fuertes que viajan en bandadas ruidosas. Sus graznidos ayudan al grupo a mantenerse unido en el aire y en tierra, y sus cuellos largos les ayudan a alcanzar comida en el pasto y en aguas poco profundas.",
        keyFacts: [
          "Los gansos suelen viajar en grupo y llamarse mientras vuelan.",
          "Sus alas potentes los llevan muy lejos durante la migracion.",
          "Pastorean hierbas y tambien se alimentan en aguas poco profundas.",
        ],
        scienceHighlights: [
          "Volar en forma de V puede ayudar a ahorrar energia durante viajes largos.",
          "Sus patas palmeadas funcionan bien tanto para nadar como para caminar sobre suelo blando.",
        ],
        curiousQuestionAge3To5: "Por que crees que los gansos se llaman entre si mientras vuelan?",
        curiousQuestionAge5To8: "Como podria ayudar la forma de V a que toda la bandada viaje unida?",
        curiousQuestionAge8To13: "Por que un animal migratorio necesitara alas potentes y una comunicacion social fuerte?",
        unforgettableFact: "Una bandada de gansos puede ahorrar energia volando en forma de V.",
        sizeComparisons: [
          {
            label: "Tan alto como un nino pequeno sentado",
            detail: "Un ganso erguido puede parecer casi tan alto como un nino pequeno sentado.",
          },
          {
            label: "Alas mas anchas de lo esperado",
            detail: "Un ganso grande puede abrir las alas con una anchura sorprendente para un ave tan conocida.",
          },
          {
            label: "Mas pesado que un galon de leche",
            detail: "De cerca, un ganso puede sentirse mucho mas solido y pesado de lo que parece.",
          },
        ],
      },
      fr: {
        displayName: "Oies",
        soundButton: "Sons des oies",
        scientificPronunciation: "BRAN-tuh kan-uh-DEN-sis",
        aboutBody:
          "Les bernaches du Canada sont de puissants oiseaux migrateurs qui voyagent en groupes bruyants. Leurs cris aident le groupe a rester uni dans le ciel comme au sol, et leur long cou les aide a atteindre la nourriture dans l'herbe et l'eau peu profonde.",
        keyFacts: [
          "Les oies voyagent souvent en groupe et se parlent en volant.",
          "Leurs ailes puissantes les transportent sur de longues distances pendant la migration.",
          "Elles broutent l'herbe et mangent aussi dans l'eau peu profonde.",
        ],
        scienceHighlights: [
          "Voler en formation en V peut aider les oies a economiser de l'energie.",
          "Leurs grands pieds palmes servent bien pour nager et pour marcher sur un sol souple.",
        ],
        curiousQuestionAge3To5: "Pourquoi, a ton avis, les oies se parlent-elles en volant ?",
        curiousQuestionAge5To8: "Comment la forme en V pourrait-elle aider tout un groupe a voyager ensemble ?",
        curiousQuestionAge8To13: "Pourquoi un animal migrateur a-t-il besoin a la fois d'ailes puissantes et d'une forte communication sociale ?",
        unforgettableFact: "Un groupe d'oies peut economiser de l'energie en volant en formation en V.",
        sizeComparisons: [
          {
            label: "Aussi haute qu'un tout-petit assis",
            detail: "Une oie bien droite peut paraitre presque aussi haute qu'un jeune enfant assis.",
          },
          {
            label: "Des ailes tres larges",
            detail: "Une grande oie peut deployer des ailes impressionnantes pour un oiseau si familier.",
          },
          {
            label: "Plus lourde qu'un litre de lait",
            detail: "De pres, une oie peut sembler beaucoup plus lourde qu'on l'imagine.",
          },
        ],
      },
      zh: {
        displayName: "大雁",
        soundButton: "大雁声音",
        scientificPronunciation: "BRAN-tuh kan-uh-DEN-sis",
        aboutBody:
          "加拿大雁是强壮的飞行者，常常成群迁飞，并一路高声鸣叫。它们的叫声帮助队伍在空中和地面上保持联系，长长的脖子则帮助它们在草地和浅水中取食。",
        keyFacts: [
          "大雁常常成群旅行，并在飞行时互相呼叫。",
          "强壮的翅膀能带它们在迁徙时飞很远。",
          "它们会啃食草，也会在浅水里觅食。",
        ],
        scienceHighlights: [
          "排成 V 字队形飞行，能帮助大雁在长途旅行中节省能量。",
          "宽大的蹼足既适合游泳，也适合在柔软地面上行走。",
        ],
        curiousQuestionAge3To5: "你觉得大雁为什么一边飞一边互相叫？",
        curiousQuestionAge5To8: "V 字队形为什么会帮助整群大雁一起飞？",
        curiousQuestionAge8To13: "为什么迁徙动物既需要强壮的翅膀，也需要良好的群体沟通？",
        unforgettableFact: "一群大雁排成 V 字飞行时，可以一起省力。",
        sizeComparisons: [
          {
            label: "像坐着的小朋友那么高",
            detail: "一只站直的大雁，看起来几乎和坐着的小朋友一样高。",
          },
          {
            label: "翅膀非常宽",
            detail: "大雁张开翅膀时，宽度会比很多人想象中更大。",
          },
          {
            label: "比一加仑牛奶还重",
            detail: "近距离看大雁时，你会发现它比外表看起来更结实、更有重量。",
          },
        ],
      },
    },
    "american-bullfrog": {
      en: {
        displayName: "American Bullfrog",
        soundButton: "Bullfrog Sounds",
        scientificPronunciation: "lih-THOB-uh-teez kat-ehs-bee-AY-nee-us",
        aboutBody:
          "The American bullfrog is a powerful wetland frog with a deep booming call. It waits near the water's edge, launches with strong back legs, and can swallow surprisingly large prey.",
        keyFacts: [
          "Bullfrogs give a deep call that sounds a bit like a plucked banjo string.",
          "They stay close to ponds, marshes, and other calm freshwater areas.",
          "A bullfrog can sit still for a long time before striking at prey.",
        ],
        scienceHighlights: [
          "Bullfrogs use strong leg muscles for jumping and swimming.",
          "Their wide mouth and sticky tongue help them grab prey quickly.",
        ],
        curiousQuestionAge3To5: "What do you think a bullfrog is watching while it waits so still?",
        curiousQuestionAge5To8: "Why would a frog need both strong legs and a wide mouth?",
        curiousQuestionAge8To13: "How do a bullfrog's body shape and ambush behavior help it survive in wetlands?",
        unforgettableFact: "A bullfrog can eat things almost as big as its own head.",
        sizeComparisons: [
          {
            label: "Wider than two adult hands",
            detail: "A very large bullfrog can spread across about two adult hands placed side by side.",
          },
          {
            label: "Bigger than many people expect",
            detail: "Bullfrogs are some of the largest frogs that many visitors will ever see nearby.",
          },
          {
            label: "Mouth built for giant bites",
            detail: "Its head and mouth are broad enough to grab prey that seems shockingly large for a frog.",
          },
        ],
      },
      es: {
        displayName: "Rana toro americana",
        soundButton: "Sonidos de rana toro",
        scientificPronunciation: "lih-THOB-uh-teez kat-ehs-bee-AY-nee-us",
        aboutBody:
          "La rana toro americana es una rana de humedal con una llamada profunda y potente. Espera cerca del borde del agua, se impulsa con patas traseras fuertes y puede tragar presas sorprendentemente grandes.",
        keyFacts: [
          "La rana toro produce una llamada profunda que recuerda a una cuerda de banjo pulsada.",
          "Permanece cerca de estanques, marismas y otras aguas dulces tranquilas.",
          "Puede quedarse quieta mucho tiempo antes de lanzarse sobre la presa.",
        ],
        scienceHighlights: [
          "Usa musculosas patas traseras para saltar y nadar.",
          "Su boca ancha y su lengua pegajosa le ayudan a atrapar presas rapido.",
        ],
        curiousQuestionAge3To5: "Que crees que mira una rana toro mientras espera tan quieta?",
        curiousQuestionAge5To8: "Por que una rana necesitara patas fuertes y una boca tan ancha?",
        curiousQuestionAge8To13: "Como ayudan la forma del cuerpo y la caza al acecho a sobrevivir en humedales?",
        unforgettableFact: "Una rana toro puede comer cosas casi tan grandes como su propia cabeza.",
        sizeComparisons: [
          {
            label: "Mas ancha que dos manos adultas",
            detail: "Una rana toro muy grande puede abarcar casi el ancho de dos manos adultas juntas.",
          },
          {
            label: "Mas grande de lo esperado",
            detail: "La mayoria de los visitantes se sorprenden de lo grande que puede ser una rana toro.",
          },
          {
            label: "Boca hecha para bocados enormes",
            detail: "Su cabeza y su boca son lo bastante anchas para atrapar presas enormes para una rana.",
          },
        ],
      },
      fr: {
        displayName: "Ouaouaron d'Amerique",
        soundButton: "Sons de la grenouille",
        scientificPronunciation: "lih-THOB-uh-teez kat-ehs-bee-AY-nee-us",
        aboutBody:
          "L'ouaouaron d'Amerique est une grande grenouille des zones humides au chant tres grave. Il attend pres du bord de l'eau, bondit grace a ses puissantes pattes arriere et peut avaler des proies etonnamment grandes.",
        keyFacts: [
          "Le chant de l'ouaouaron ressemble un peu a la corde grave d'un banjo.",
          "Il reste pres des etangs, des marais et des eaux douces calmes.",
          "Il peut rester immobile longtemps avant d'attraper une proie.",
        ],
        scienceHighlights: [
          "Ses puissants muscles des pattes arriere servent au saut et a la nage.",
          "Sa bouche large et sa langue collante l'aident a saisir tres vite une proie.",
        ],
        curiousQuestionAge3To5: "Que regarde, a ton avis, l'ouaouaron quand il reste si immobile ?",
        curiousQuestionAge5To8: "Pourquoi une grenouille aurait-elle besoin de pattes si fortes et d'une bouche si large ?",
        curiousQuestionAge8To13: "Comment la forme du corps et la chasse a l'affut aident-elles l'ouaouaron a survivre dans les zones humides ?",
        unforgettableFact: "Un ouaouaron peut avaler quelque chose presque aussi gros que sa propre tete.",
        sizeComparisons: [
          {
            label: "Plus large que deux mains",
            detail: "Un tres grand ouaouaron peut s'etendre a peu pres sur deux mains adultes cote a cote.",
          },
          {
            label: "Bien plus grand qu'on l'imagine",
            detail: "Beaucoup de visiteurs sont surpris par la taille reelle d'un ouaouaron.",
          },
          {
            label: "Une bouche faite pour de grosses bouchees",
            detail: "Sa tete et sa bouche sont assez larges pour attraper des proies enormes pour une grenouille.",
          },
        ],
      },
      zh: {
        displayName: "美洲牛蛙",
        soundButton: "牛蛙声音",
        scientificPronunciation: "lih-THOB-uh-teez kat-ehs-bee-AY-nee-us",
        aboutBody:
          "美洲牛蛙是一种体型强壮的湿地青蛙，叫声低沉有力。它会在水边静静等待，靠强壮的后腿突然出击，还能吞下体型非常大的猎物。",
        keyFacts: [
          "牛蛙的低沉叫声有点像被拨动的班卓琴弦。",
          "它常待在池塘、沼泽和其他平静的淡水边。",
          "牛蛙会长时间保持不动，然后突然扑向猎物。",
        ],
        scienceHighlights: [
          "牛蛙靠强壮的后腿来跳跃和游泳。",
          "宽大的嘴和黏性的舌头帮助它迅速抓住猎物。",
        ],
        curiousQuestionAge3To5: "你觉得牛蛙安静等待的时候在看什么？",
        curiousQuestionAge5To8: "为什么一只青蛙需要强壮的腿和很大的嘴？",
        curiousQuestionAge8To13: "牛蛙的体型和伏击式捕猎怎样帮助它在湿地生存？",
        unforgettableFact: "牛蛙能吞下几乎和自己头一样大的东西。",
        sizeComparisons: [
          {
            label: "比两只成年人的手还宽",
            detail: "一只很大的牛蛙张开身体时，宽度差不多能占到两只成年人的手掌。",
          },
          {
            label: "比很多人想象中更大",
            detail: "很多参观者第一次近看牛蛙时，都会惊讶它居然这么大。",
          },
          {
            label: "大嘴专门用来吞大口",
            detail: "它宽宽的头和嘴，让它能够抓住对青蛙来说非常大的猎物。",
          },
        ],
      },
    },
    "great-blue-heron": {
      en: {
        displayName: "Great Blue Heron",
        soundButton: "Heron Sounds",
        scientificPronunciation: "AR-dee-uh hair-OH-dee-us",
        aboutBody:
          "The great blue heron is a patient wetland hunter that stalks fish, frogs, and other prey. Its long legs keep the body above the water, and its neck folds into an S shape before striking like a spring.",
        keyFacts: [
          "Great blue herons often stand very still before stabbing at prey.",
          "They hunt in marshes, shorelines, rivers, and ponds.",
          "Their broad wings help them glide with slow, powerful wingbeats.",
        ],
        scienceHighlights: [
          "The neck folds into a compact S shape so it can shoot forward quickly.",
          "Long toes help spread body weight on soft mud and marsh plants.",
        ],
        curiousQuestionAge3To5: "Why do you think a heron stands so still before it moves?",
        curiousQuestionAge5To8: "How do long legs help a bird hunt in shallow water?",
        curiousQuestionAge8To13: "Why is an S-shaped neck a useful design for a strike-and-wait hunter?",
        unforgettableFact: "A great blue heron can fold its neck like a spring and then launch its beak in a flash.",
        sizeComparisons: [
          {
            label: "As tall as a toddler",
            detail: "A great blue heron standing upright can be almost as tall as a young child.",
          },
          {
            label: "Legs like long kitchen tongs",
            detail: "Those long legs lift the bird's body above the water while it hunts.",
          },
          {
            label: "Huge wings on a narrow body",
            detail: "A heron's wingspan is far larger than its narrow standing body makes it seem.",
          },
        ],
      },
      es: {
        displayName: "Garza azulada",
        soundButton: "Sonidos de garza",
        scientificPronunciation: "AR-dee-uh hair-OH-dee-us",
        aboutBody:
          "La garza azulada es una cazadora paciente de humedales que acecha peces, ranas y otras presas. Sus patas largas mantienen el cuerpo por encima del agua, y su cuello se pliega en forma de S antes de lanzarse como un resorte.",
        keyFacts: [
          "La garza suele quedarse inmovil antes de atacar a la presa.",
          "Caza en marismas, orillas, rios y estanques.",
          "Sus alas amplias le ayudan a planear con aleteos lentos y poderosos.",
        ],
        scienceHighlights: [
          "El cuello se pliega en una S compacta para poder salir disparado hacia adelante.",
          "Los dedos largos ayudan a repartir el peso sobre barro blando y plantas del humedal.",
        ],
        curiousQuestionAge3To5: "Por que crees que una garza se queda tan quieta antes de moverse?",
        curiousQuestionAge5To8: "Como ayudan las patas largas a cazar en aguas poco profundas?",
        curiousQuestionAge8To13: "Por que un cuello en forma de S es util para un cazador que espera y golpea?",
        unforgettableFact: "La garza azulada pliega el cuello como un resorte y lanza el pico en un instante.",
        sizeComparisons: [
          {
            label: "Tan alta como un nino pequeno",
            detail: "Una garza azulada erguida puede ser casi tan alta como un nino pequeno.",
          },
          {
            label: "Patas como pinzas largas de cocina",
            detail: "Sus largas patas mantienen el cuerpo por encima del agua mientras caza.",
          },
          {
            label: "Alas enormes para un cuerpo tan estrecho",
            detail: "La envergadura de la garza es mucho mayor de lo que su cuerpo delgado hace pensar.",
          },
        ],
      },
      fr: {
        displayName: "Grand heron bleu",
        soundButton: "Sons du heron",
        scientificPronunciation: "AR-dee-uh hair-OH-dee-us",
        aboutBody:
          "Le grand heron bleu est un chasseur patient des zones humides qui guette poissons, grenouilles et autres proies. Ses longues pattes gardent son corps au-dessus de l'eau, et son cou se replie en S avant de partir comme un ressort.",
        keyFacts: [
          "Le grand heron bleu reste souvent parfaitement immobile avant de frapper sa proie.",
          "Il chasse dans les marais, sur les rives, dans les rivieres et les etangs.",
          "Ses larges ailes lui permettent de planer avec des battements lents et puissants.",
        ],
        scienceHighlights: [
          "Le cou se replie en S compacte pour pouvoir se detendre tres vite vers l'avant.",
          "Ses longs doigts repartissent le poids sur la boue molle et les plantes des marais.",
        ],
        curiousQuestionAge3To5: "Pourquoi, a ton avis, le heron reste-t-il si immobile avant de bouger ?",
        curiousQuestionAge5To8: "Comment de longues pattes aident-elles un oiseau a chasser dans l'eau peu profonde ?",
        curiousQuestionAge8To13: "Pourquoi un cou en forme de S est-il utile a un chasseur qui attend avant de frapper ?",
        unforgettableFact: "Le grand heron bleu plie son cou comme un ressort puis projette son bec en une fraction de seconde.",
        sizeComparisons: [
          {
            label: "Aussi grand qu'un jeune enfant",
            detail: "Debout bien droit, un grand heron bleu peut presque atteindre la taille d'un petit enfant.",
          },
          {
            label: "Des pattes comme de longues pinces",
            detail: "Ses longues pattes gardent son corps bien au-dessus de l'eau pendant la chasse.",
          },
          {
            label: "Des ailes enormes pour un corps si fin",
            detail: "L'envergure du heron est immense par rapport a son corps etroit quand il attend sans bouger.",
          },
        ],
      },
      zh: {
        displayName: "大蓝鹭",
        soundButton: "苍鹭声音",
        scientificPronunciation: "AR-dee-uh hair-OH-dee-us",
        aboutBody:
          "大蓝鹭是一种非常有耐心的湿地猎手，会悄悄捕捉鱼、青蛙和其他猎物。长腿让身体高高站在水面上方，脖子会先折成 S 形，再像弹簧一样突然伸出。",
        keyFacts: [
          "大蓝鹭常常先一动不动地站着，然后突然刺向猎物。",
          "它会在沼泽、岸边、河流和池塘里捕食。",
          "宽大的翅膀让它能用缓慢而有力的拍翅滑翔。",
        ],
        scienceHighlights: [
          "脖子会折成紧凑的 S 形，这样就能快速向前弹出。",
          "长长的脚趾能把体重分散在软泥和湿地植物上。",
        ],
        curiousQuestionAge3To5: "你觉得苍鹭为什么在动之前要站得那么安静？",
        curiousQuestionAge5To8: "长腿怎样帮助一只鸟在浅水里捕猎？",
        curiousQuestionAge8To13: "为什么 S 形脖子对“等待再出击”的猎手特别有用？",
        unforgettableFact: "大蓝鹭会把脖子像弹簧一样收起来，再在一瞬间把喙弹出去。",
        sizeComparisons: [
          {
            label: "像幼儿一样高",
            detail: "一只站直的大蓝鹭，身高几乎能和一个小朋友差不多。",
          },
          {
            label: "腿像长长的厨房夹子",
            detail: "长腿把身体抬出水面，让它能在浅水里慢慢靠近猎物。",
          },
          {
            label: "身体细，翅膀却特别大",
            detail: "大蓝鹭站着时身体很窄，但展开翅膀后会显得非常巨大。",
          },
        ],
      },
    },
  });

  function normalizeLanguage(value) {
    const candidate = String(value || "").trim().toLowerCase();
    return SUPPORTED_LANGUAGES.some((entry) => entry.code === candidate) ? candidate : "en";
  }

  function getLanguageMeta(language) {
    const normalized = normalizeLanguage(language);
    return SUPPORTED_LANGUAGES.find((entry) => entry.code === normalized) || SUPPORTED_LANGUAGES[0];
  }

  function getByPath(source, path) {
    return String(path || "")
      .split(".")
      .filter(Boolean)
      .reduce((current, key) => (current && key in current ? current[key] : undefined), source);
  }

  function format(template, replacements) {
    return String(template || "").replace(/\{(\w+)\}/g, (_match, key) => {
      return replacements && key in replacements ? String(replacements[key]) : "";
    });
  }

  function t(language, path, replacements) {
    const normalized = normalizeLanguage(language);
    const fallback = getByPath(UI_COPY.en, path);
    const current = getByPath(UI_COPY[normalized], path);
    const template = current === undefined ? fallback : current;
    return typeof template === "string" ? format(template, replacements) : template;
  }

  function localizeAnimal(animal, language) {
    const normalized = normalizeLanguage(language);
    const source = ANIMAL_COPY[animal.folderName] || {};
    const localized = source[normalized] || source.en || {};
    const fallback = source.en || {};
    const performerDefault = t(normalized, "common.museumGuest");

    return {
      ...animal,
      displayName: localized.displayName || fallback.displayName || animal.displayName,
      audioClips: (animal.audioClips || []).map((clip) => ({
        ...clip,
        label:
          clip.kind === "sound"
            ? localized.soundButton || fallback.soundButton || clip.label
            : clip.kind === "facts"
              ? t(normalized, "common.creatureFacts")
              : clip.label,
        performerName:
          clip.kind === "facts" && (!clip.performerName || clip.performerName === "Museum Guest")
            ? performerDefault
            : clip.performerName,
      })),
      about: {
        ...(animal.about || {}),
        scientificPronunciation:
          localized.scientificPronunciation ||
          fallback.scientificPronunciation ||
          animal.about?.scientificPronunciation ||
          "",
        keyFacts: localized.keyFacts || fallback.keyFacts || animal.about?.keyFacts || [],
        scienceHighlights:
          localized.scienceHighlights ||
          fallback.scienceHighlights ||
          animal.about?.scienceHighlights ||
          [],
        curiousQuestionAge3To5:
          localized.curiousQuestionAge3To5 ||
          fallback.curiousQuestionAge3To5 ||
          animal.about?.curiousQuestionAge3To5 ||
          "",
        curiousQuestionAge5To8:
          localized.curiousQuestionAge5To8 ||
          fallback.curiousQuestionAge5To8 ||
          animal.about?.curiousQuestionAge5To8 ||
          "",
        curiousQuestionAge8To13:
          localized.curiousQuestionAge8To13 ||
          fallback.curiousQuestionAge8To13 ||
          animal.about?.curiousQuestionAge8To13 ||
          "",
      },
      aboutBody: localized.aboutBody || fallback.aboutBody || animal.aboutBody || "",
      unforgettableFact: localized.unforgettableFact || fallback.unforgettableFact || "",
      sizeComparisons: localized.sizeComparisons || fallback.sizeComparisons || [],
    };
  }

  window.MuseumI18n = {
    SUPPORTED_LANGUAGES,
    normalizeLanguage,
    getLanguageMeta,
    t,
    format,
    localizeAnimal,
  };
})();
