function show(enabled, useSettingsInsteadOfPreferences) {
    if (useSettingsInsteadOfPreferences) {
        document.getElementsByClassName('open-preferences')[0].innerText = hostT('openSettings');
    }

    if (typeof enabled === "boolean") {
        document.body.classList.toggle(`state-on`, enabled);
        document.body.classList.toggle(`state-off`, !enabled);
    } else {
        document.body.classList.remove(`state-on`);
        document.body.classList.remove(`state-off`);
    }
}

// 由原生注入：更新权限状态文案
function setUnlimitedSitesStatus(hasUnlimitedSites) {
    const el = document.getElementsByClassName('pro-status')[0];
    if (!el) return;
    if (hasUnlimitedSites) {
        el.innerText = hostT('proUnlocked');
        el.classList.add('unlocked');
    } else {
        el.innerText = hostT('proFree');
        el.classList.remove('unlocked');
    }
}

// 由原生注入：商品本地化价格（来自 StoreKit，而非硬编码）
function setPrice(priceStr) {
    const el = document.getElementById('price');
    if (el) { el.innerText = priceStr; }
    const buyBtn = document.querySelector('button.buy-now');
    if (buyBtn && !buyBtn.disabled) { buyBtn.innerText = hostT('buyNow') + ' — ' + priceStr; }
}

// 由原生注入：StoreKit 配置文件没生效（商品加载不到）
function setStoreKitUnavailable() {
    const el = document.getElementById('price');
    if (el) { el.innerText = "—"; }
    const buyBtn = document.querySelector('button.buy-now');
    if (buyBtn) { buyBtn.innerText = hostT('buyNow'); }
    const statusEl = document.getElementsByClassName('pro-status')[0];
    if (statusEl) {
        statusEl.innerText = hostT('storeKitUnavailable');
        statusEl.classList.remove('unlocked');
    }
}

// 由原生注入：Host App 版本号
function setVersion(versionStr) {
    const el = document.getElementsByClassName('version')[0];
    if (el) { el.innerText = "v" + versionStr; }
}

// 由原生注入：购买/恢复进行中
function setBusy(busy, kind) {
    const btn = document.querySelector(kind === 'restore' ? 'button.restore' : 'button.buy-now');
    if (!btn) return;
    if (busy) {
        btn.disabled = true;
        btn.dataset.label = btn.innerText;
        btn.innerText = kind === 'restore' ? hostT('busyRestore') : hostT('busyPurchase');
    } else {
        btn.disabled = false;
        if (btn.dataset.label) { btn.innerText = btn.dataset.label; }
    }
}

// 由原生注入：购买/恢复出错
function showError(message) {
    const el = document.getElementsByClassName('pro-status')[0];
    if (el) {
        el.innerText = "⚠️ " + message;
        el.classList.remove('unlocked');
    }
}

function openPreferences() {
    webkit.messageHandlers.controller.postMessage("open-preferences");
}

function purchase() {
    webkit.messageHandlers.controller.postMessage("purchase");
}

function restorePurchases() {
    webkit.messageHandlers.controller.postMessage("restore");
}

document.querySelector("button.open-preferences").addEventListener("click", openPreferences);
document.querySelector("button.buy-now").addEventListener("click", purchase);
document.querySelector("button.restore").addEventListener("click", restorePurchases);

// ===== 宿主 App 多语言 =====
//
// 文案表按【系统首选语言】选择（由 ViewController.swift 通过 window.__HOST_LANG__ 注入）。
// 语言集合与扩展的 _locales 保持一致；某个语言缺 key 时回退英文。
const HOST_I18N = {};

HOST_I18N.en = {
  tagline: 'Block image lazy loading on any website',
  heroPlaceholder: 'Feature Screenshot',
  priceSubtitle: 'One-time purchase · Lifetime access',
  buyNow: 'Buy Now',
  restore: 'Restore Purchases',
  statusLoading: 'Loading license status…',
  proUnlocked: '✓ Pro: Unlimited websites unlocked. Thank you!',
  proFree: 'Free: up to 3 websites. Upgrade to unlock unlimited.',
  stateUnknown: "You can turn on No Lazy Load's extension in the Extensions section of Safari Settings.",
  stateOn: "No Lazy Load's extension is currently on. You can turn it off in the Extensions section of Safari Settings.",
  stateOff: "No Lazy Load's extension is currently off. You can turn it on in the Extensions section of Safari Settings.",
  openSettings: 'Quit and Open Safari Settings…',
  busyPurchase: 'Processing…',
  busyRestore: 'Restoring…',
  storeKitUnavailable: "⚠️ Failed to load the product. Run this app from Xcode (Cmd+R) — launching it from Finder won't enable the StoreKit test configuration."
};

HOST_I18N.zh = {
  tagline: '拦截任意网站的图片懒加载',
  heroPlaceholder: '功能截图',
  priceSubtitle: '一次购买 · 永久使用',
  buyNow: '立即购买',
  restore: '恢复购买',
  statusLoading: '正在读取授权状态…',
  proUnlocked: '✓ Pro：已解锁无限网站，感谢支持！',
  proFree: '免费版：最多 3 个网站，升级后不限数量。',
  stateUnknown: '你可以在 Safari 设置的「扩展」中开启 No Lazy Load 扩展。',
  stateOn: 'No Lazy Load 扩展目前已开启，你可以在 Safari 设置的「扩展」中关闭它。',
  stateOff: 'No Lazy Load 扩展目前已关闭，你可以在 Safari 设置的「扩展」中开启它。',
  openSettings: '退出并打开 Safari 设置…',
  busyPurchase: '处理中…',
  busyRestore: '正在恢复…',
  storeKitUnavailable: '⚠️ 商品加载失败：请用 Xcode Cmd+R 运行本 App（Finder 双击不会启用 StoreKit 测试配置）。'
};

HOST_I18N.zh_TW = {
  tagline: '攔截任何網站的圖片延遲載入',
  heroPlaceholder: '功能截圖',
  priceSubtitle: '一次購買 · 永久使用',
  buyNow: '立即購買',
  restore: '回復購買',
  statusLoading: '正在讀取授權狀態…',
  proUnlocked: '✓ Pro：已解鎖無限網站，感謝支持！',
  proFree: '免費版：最多 3 個網站，升級後不限數量。',
  stateUnknown: '你可以在 Safari 設定的「擴充功能」中開啟 No Lazy Load 擴充功能。',
  stateOn: 'No Lazy Load 擴充功能目前已開啟，你可以在 Safari 設定的「擴充功能」中關閉它。',
  stateOff: 'No Lazy Load 擴充功能目前已關閉，你可以在 Safari 設定的「擴充功能」中開啟它。',
  openSettings: '結束並打開 Safari 設定…',
  busyPurchase: '處理中…',
  busyRestore: '正在回復…',
  storeKitUnavailable: '⚠️ 商品載入失敗：請用 Xcode Cmd+R 執行本 App（在 Finder 連按兩下不會啟用 StoreKit 測試設定）。'
};

HOST_I18N.zh_HK = {
  tagline: '攔截任何網站的圖片延遲載入',
  heroPlaceholder: '功能截圖',
  priceSubtitle: '一次購買 · 永久使用',
  buyNow: '立即購買',
  restore: '恢復購買',
  statusLoading: '正在讀取授權狀態…',
  proUnlocked: '✓ Pro：已解鎖無限網站，感謝支持！',
  proFree: '免費版：最多 3 個網站，升級後不限數量。',
  stateUnknown: '你可以在 Safari 設定的「擴充功能」中開啟 No Lazy Load 擴充功能。',
  stateOn: 'No Lazy Load 擴充功能目前已開啟，你可以在 Safari 設定的「擴充功能」中關閉它。',
  stateOff: 'No Lazy Load 擴充功能目前已關閉，你可以在 Safari 設定的「擴充功能」中開啟它。',
  openSettings: '結束並開啟 Safari 設定…',
  busyPurchase: '處理中…',
  busyRestore: '正在恢復…'
};

HOST_I18N.ja = {
  tagline: 'あらゆるサイトの画像遅延読み込みをブロック',
  heroPlaceholder: '機能スクリーンショット',
  priceSubtitle: '買い切り · 永続ライセンス',
  buyNow: '今すぐ購入',
  restore: '購入を復元',
  statusLoading: 'ライセンス状態を読み込み中…',
  proUnlocked: '✓ Pro：無制限のサイトが利用可能になりました。ありがとうございます！',
  proFree: '無料版：3 サイトまで。アップグレードで無制限になります。',
  stateUnknown: 'Safari の設定の「機能拡張」で No Lazy Load の機能拡張をオンにできます。',
  stateOn: 'No Lazy Load の機能拡張は現在オンです。Safari の設定の「機能拡張」でオフにできます。',
  stateOff: 'No Lazy Load の機能拡張は現在オフです。Safari の設定の「機能拡張」でオンにできます。',
  openSettings: '終了して Safari の設定を開く…',
  busyPurchase: '処理中…',
  busyRestore: '復元中…'
};

HOST_I18N.ko = {
  tagline: '모든 웹사이트의 이미지 지연 로딩을 차단',
  heroPlaceholder: '기능 스크린샷',
  priceSubtitle: '1회 구매 · 평생 사용',
  buyNow: '지금 구매',
  restore: '구매 복원',
  statusLoading: '라이선스 상태 불러오는 중…',
  proUnlocked: '✓ Pro: 무제한 웹사이트가 열렸습니다. 감사합니다!',
  proFree: '무료 버전: 최대 3개 사이트. 업그레이드하면 무제한입니다.',
  stateUnknown: 'Safari 설정의 ‘확장 프로그램’에서 No Lazy Load 확장을 켤 수 있습니다.',
  stateOn: 'No Lazy Load 확장이 현재 켜져 있습니다. Safari 설정의 ‘확장 프로그램’에서 끌 수 있습니다.',
  stateOff: 'No Lazy Load 확장이 현재 꺼져 있습니다. Safari 설정의 ‘확장 프로그램’에서 켤 수 있습니다.',
  openSettings: '종료하고 Safari 설정 열기…',
  busyPurchase: '처리 중…',
  busyRestore: '복원 중…'
};

HOST_I18N.de = {
  tagline: 'Bild-Lazy-Loading auf jeder Website blockieren',
  heroPlaceholder: 'Funktions-Screenshot',
  priceSubtitle: 'Einmalkauf · dauerhafte Lizenz',
  buyNow: 'Jetzt kaufen',
  restore: 'Käufe wiederherstellen',
  statusLoading: 'Lizenzstatus wird geladen…',
  proUnlocked: '✓ Pro: Unbegrenzte Websites freigeschaltet. Vielen Dank!',
  proFree: 'Kostenlos: bis zu 3 Websites. Upgrade für unbegrenzte Nutzung.',
  stateUnknown: 'Du kannst die Erweiterung von No Lazy Load in den Einstellungen von Safari unter „Erweiterungen“ aktivieren.',
  stateOn: 'Die Erweiterung von No Lazy Load ist derzeit aktiv. Du kannst sie in den Einstellungen von Safari unter „Erweiterungen“ deaktivieren.',
  stateOff: 'Die Erweiterung von No Lazy Load ist derzeit inaktiv. Du kannst sie in den Einstellungen von Safari unter „Erweiterungen“ aktivieren.',
  openSettings: 'Beenden und Safari-Einstellungen öffnen…',
  busyPurchase: 'Wird verarbeitet…',
  busyRestore: 'Wird wiederhergestellt…'
};

HOST_I18N.fr = {
  tagline: 'Bloquer le chargement différé des images sur tous les sites',
  heroPlaceholder: 'Capture d’écran',
  priceSubtitle: 'Achat unique · accès à vie',
  buyNow: 'Acheter',
  restore: 'Restaurer les achats',
  statusLoading: 'Chargement de l’état de la licence…',
  proUnlocked: '✓ Pro : sites illimités débloqués. Merci !',
  proFree: 'Gratuit : jusqu’à 3 sites. Passez à Pro pour ne plus avoir de limite.',
  stateUnknown: 'Vous pouvez activer l’extension No Lazy Load dans la section « Extensions » des réglages de Safari.',
  stateOn: 'L’extension No Lazy Load est actuellement activée. Vous pouvez la désactiver dans la section « Extensions » des réglages de Safari.',
  stateOff: 'L’extension No Lazy Load est actuellement désactivée. Vous pouvez l’activer dans la section « Extensions » des réglages de Safari.',
  openSettings: 'Quitter et ouvrir les réglages de Safari…',
  busyPurchase: 'Traitement…',
  busyRestore: 'Restauration…'
};

HOST_I18N.es = {
  tagline: 'Bloquea la carga diferida de imágenes en cualquier sitio',
  heroPlaceholder: 'Captura de pantalla',
  priceSubtitle: 'Compra única · acceso de por vida',
  buyNow: 'Comprar ahora',
  restore: 'Restaurar compras',
  statusLoading: 'Cargando el estado de la licencia…',
  proUnlocked: '✓ Pro: sitios ilimitados desbloqueados. ¡Gracias!',
  proFree: 'Gratis: hasta 3 sitios. Actualiza para tener sitios ilimitados.',
  stateUnknown: 'Puedes activar la extensión de No Lazy Load en la sección «Extensiones» de los ajustes de Safari.',
  stateOn: 'La extensión de No Lazy Load está activada. Puedes desactivarla en la sección «Extensiones» de los ajustes de Safari.',
  stateOff: 'La extensión de No Lazy Load está desactivada. Puedes activarla en la sección «Extensiones» de los ajustes de Safari.',
  openSettings: 'Salir y abrir los ajustes de Safari…',
  busyPurchase: 'Procesando…',
  busyRestore: 'Restaurando…'
};

HOST_I18N.pt = {
  tagline: 'Bloqueie o carregamento preguiçoso de imagens em qualquer site',
  heroPlaceholder: 'Captura de tela',
  priceSubtitle: 'Compra única · acesso vitalício',
  buyNow: 'Comprar agora',
  restore: 'Restaurar compras',
  statusLoading: 'Carregando o status da licença…',
  proUnlocked: '✓ Pro: sites ilimitados desbloqueados. Obrigado!',
  proFree: 'Grátis: até 3 sites. Faça upgrade para não ter limite.',
  stateUnknown: 'Você pode ativar a extensão do No Lazy Load em «Extensões» nos ajustes do Safari.',
  stateOn: 'A extensão do No Lazy Load está ativada. Você pode desativá-la em «Extensões» nos ajustes do Safari.',
  stateOff: 'A extensão do No Lazy Load está desativada. Você pode ativá-la em «Extensões» nos ajustes do Safari.',
  openSettings: 'Sair e abrir os ajustes do Safari…',
  busyPurchase: 'Processando…',
  busyRestore: 'Restaurando…'
};

HOST_I18N.it = {
  tagline: 'Blocca il caricamento lazy delle immagini su qualsiasi sito',
  heroPlaceholder: 'Screenshot',
  priceSubtitle: 'Acquisto una tantum · licenza a vita',
  buyNow: 'Acquista ora',
  restore: 'Ripristina acquisti',
  statusLoading: 'Caricamento stato licenza…',
  proUnlocked: '✓ Pro: siti illimitati sbloccati. Grazie!',
  proFree: 'Gratis: fino a 3 siti. Aggiorna per non avere limiti.',
  stateUnknown: 'Puoi attivare l’estensione di No Lazy Load in «Estensioni» nelle impostazioni di Safari.',
  stateOn: 'L’estensione di No Lazy Load è attiva. Puoi disattivarla in «Estensioni» nelle impostazioni di Safari.',
  stateOff: 'L’estensione di No Lazy Load è disattivata. Puoi attivarla in «Estensioni» nelle impostazioni di Safari.',
  openSettings: 'Esci e apri le impostazioni di Safari…',
  busyPurchase: 'Elaborazione…',
  busyRestore: 'Ripristino…'
};

HOST_I18N.nl = {
  tagline: 'Blokkeer lazy loading van afbeeldingen op elke website',
  heroPlaceholder: 'Functieschermafbeelding',
  priceSubtitle: 'Eenmalige aankoop · levenslange licentie',
  buyNow: 'Nu kopen',
  restore: 'Aankopen herstellen',
  statusLoading: 'Licentiestatus laden…',
  proUnlocked: '✓ Pro: onbeperkt aantal websites ontgrendeld. Bedankt!',
  proFree: 'Gratis: maximaal 3 websites. Upgrade voor onbeperkt gebruik.',
  stateUnknown: 'Je kunt de extensie van No Lazy Load aanzetten in ‘Extensies’ in de Safari-instellingen.',
  stateOn: 'De extensie van No Lazy Load staat aan. Je kunt hem uitzetten in ‘Extensies’ in de Safari-instellingen.',
  stateOff: 'De extensie van No Lazy Load staat uit. Je kunt hem aanzetten in ‘Extensies’ in de Safari-instellingen.',
  openSettings: 'Afsluiten en Safari-instellingen openen…',
  busyPurchase: 'Verwerken…',
  busyRestore: 'Herstellen…'
};

HOST_I18N.da = {
  tagline: 'Bloker lazyindlæsning af billeder på alle websites',
  heroPlaceholder: 'Funktionsskærmbillede',
  priceSubtitle: 'Engangskøb · livstidslicens',
  buyNow: 'Køb nu',
  restore: 'Gendan køb',
  statusLoading: 'Indlæser licensstatus…',
  proUnlocked: '✓ Pro: Ubegrænsede websites låst op. Tak!',
  proFree: 'Gratis: op til 3 websites. Opgrader for ubegrænset.',
  stateUnknown: 'Du kan slå No Lazy Loads udvidelse til under «Udvidelser» i Safari-indstillingerne.',
  stateOn: 'No Lazy Loads udvidelse er slået til. Du kan slå den fra under «Udvidelser» i Safari-indstillingerne.',
  stateOff: 'No Lazy Loads udvidelse er slået fra. Du kan slå den til under «Udvidelser» i Safari-indstillingerne.',
  openSettings: 'Afslut og åbn Safari-indstillinger…',
  busyPurchase: 'Behandler…',
  busyRestore: 'Gendanner…'
};

HOST_I18N.sv = {
  tagline: 'Blockera lazy loading av bilder på alla webbplatser',
  heroPlaceholder: 'Funktionsskärmbild',
  priceSubtitle: 'Engångsköp · livstidslicens',
  buyNow: 'Köp nu',
  restore: 'Återställ köp',
  statusLoading: 'Laddar licensstatus…',
  proUnlocked: '✓ Pro: Obegränsat antal webbplatser upplåsta. Tack!',
  proFree: 'Gratis: upp till 3 webbplatser. Uppgradera för obegränsat.',
  stateUnknown: 'Du kan slå på No Lazy Loads tillägg under ”Tillägg” i Safari-inställningarna.',
  stateOn: 'No Lazy Loads tillägg är på. Du kan slå av det under ”Tillägg” i Safari-inställningarna.',
  stateOff: 'No Lazy Loads tillägg är av. Du kan slå på det under ”Tillägg” i Safari-inställningarna.',
  openSettings: 'Avsluta och öppna Safari-inställningar…',
  busyPurchase: 'Bearbetar…',
  busyRestore: 'Återställer…'
};

HOST_I18N.nb = {
  tagline: 'Blokker lazy loading av bilder på alle nettsteder',
  heroPlaceholder: 'Funksjonsskjermbilde',
  priceSubtitle: 'Engangskjøp · livstidslisens',
  buyNow: 'Kjøp nå',
  restore: 'Gjenopprett kjøp',
  statusLoading: 'Laster lisensstatus…',
  proUnlocked: '✓ Pro: Ubegrenset antall nettsteder låst opp. Takk!',
  proFree: 'Gratis: opptil 3 nettsteder. Oppgrader for ubegrenset.',
  stateUnknown: 'Du kan slå på No Lazy Load-utvidelsen under «Utvidelser» i Safari-innstillingene.',
  stateOn: 'No Lazy Load-utvidelsen er på. Du kan slå den av under «Utvidelser» i Safari-innstillingene.',
  stateOff: 'No Lazy Load-utvidelsen er av. Du kan slå den på under «Utvidelser» i Safari-innstillingene.',
  openSettings: 'Avslutt og åpne Safari-innstillinger…',
  busyPurchase: 'Behandler…',
  busyRestore: 'Gjenoppretter…'
};

HOST_I18N.fi = {
  tagline: 'Estä kuvien lazy loading kaikilla sivustoilla',
  heroPlaceholder: 'Kuvakaappaus',
  priceSubtitle: 'Kertamaksu · pysyvä lisenssi',
  buyNow: 'Osta nyt',
  restore: 'Palauta ostokset',
  statusLoading: 'Ladataan lisenssin tilaa…',
  proUnlocked: '✓ Pro: Rajattomat sivustot käytössä. Kiitos!',
  proFree: 'Ilmainen: enintään 3 sivustoa. Päivitä saadaksesi rajattomasti.',
  stateUnknown: 'Voit ottaa No Lazy Load -laajennuksen käyttöön Safarin asetusten ”Laajennukset”-osiossa.',
  stateOn: 'No Lazy Load -laajennus on käytössä. Voit poistaa sen käytöstä Safarin asetusten ”Laajennukset”-osiossa.',
  stateOff: 'No Lazy Load -laajennus ei ole käytössä. Voit ottaa sen käyttöön Safarin asetusten ”Laajennukset”-osiossa.',
  openSettings: 'Lopeta ja avaa Safarin asetukset…',
  busyPurchase: 'Käsitellään…',
  busyRestore: 'Palautetaan…'
};

HOST_I18N.pl = {
  tagline: 'Blokuj leniwe ładowanie obrazów na każdej stronie',
  heroPlaceholder: 'Zrzut ekranu',
  priceSubtitle: 'Jednorazowy zakup · dożywotnia licencja',
  buyNow: 'Kup teraz',
  restore: 'Przywróć zakupy',
  statusLoading: 'Wczytywanie stanu licencji…',
  proUnlocked: '✓ Pro: Odblokowano nieograniczoną liczbę stron. Dziękujemy!',
  proFree: 'Wersja darmowa: do 3 stron. Ulepsz, aby usunąć limit.',
  stateUnknown: 'Rozszerzenie No Lazy Load możesz włączyć w sekcji „Rozszerzenia” w ustawieniach Safari.',
  stateOn: 'Rozszerzenie No Lazy Load jest włączone. Możesz je wyłączyć w sekcji „Rozszerzenia” w ustawieniach Safari.',
  stateOff: 'Rozszerzenie No Lazy Load jest wyłączone. Możesz je włączyć w sekcji „Rozszerzenia” w ustawieniach Safari.',
  openSettings: 'Zakończ i otwórz ustawienia Safari…',
  busyPurchase: 'Przetwarzanie…',
  busyRestore: 'Przywracanie…'
};

HOST_I18N.cs = {
  tagline: 'Blokujte líné načítání obrázků na jakémkoli webu',
  heroPlaceholder: 'Snímek obrazovky',
  priceSubtitle: 'Jednorázový nákup · doživotní licence',
  buyNow: 'Koupit nyní',
  restore: 'Obnovit nákupy',
  statusLoading: 'Načítání stavu licence…',
  proUnlocked: '✓ Pro: Neomezený počet webů odemčen. Děkujeme!',
  proFree: 'Zdarma: až 3 weby. Upgradujte pro neomezený počet.',
  stateUnknown: 'Rozšíření No Lazy Load můžete zapnout v části „Rozšíření“ v nastavení Safari.',
  stateOn: 'Rozšíření No Lazy Load je zapnuté. Můžete ho vypnout v části „Rozšíření“ v nastavení Safari.',
  stateOff: 'Rozšíření No Lazy Load je vypnuté. Můžete ho zapnout v části „Rozšíření“ v nastavení Safari.',
  openSettings: 'Ukončit a otevřít nastavení Safari…',
  busyPurchase: 'Zpracování…',
  busyRestore: 'Obnovování…'
};

HOST_I18N.sk = {
  tagline: 'Blokujte lazy načítavanie obrázkov na každej stránke',
  heroPlaceholder: 'Snímka obrazovky',
  priceSubtitle: 'Jednorazový nákup · doživotná licencia',
  buyNow: 'Kúpiť teraz',
  restore: 'Obnoviť nákupy',
  statusLoading: 'Načítava sa stav licencie…',
  proUnlocked: '✓ Pro: Neobmedzený počet stránok odomknutý. Ďakujeme!',
  proFree: 'Zadarmo: až 3 stránky. Upgradujte pre neobmedzený počet.',
  stateUnknown: 'Rozšírenie No Lazy Load môžete zapnúť v časti „Rozšírenia“ v nastaveniach Safari.',
  stateOn: 'Rozšírenie No Lazy Load je zapnuté. Môžete ho vypnúť v časti „Rozšírenia“ v nastaveniach Safari.',
  stateOff: 'Rozšírenie No Lazy Load je vypnuté. Môžete ho zapnúť v časti „Rozšírenia“ v nastaveniach Safari.',
  openSettings: 'Ukončiť a otvoriť nastavenia Safari…',
  busyPurchase: 'Spracúva sa…',
  busyRestore: 'Obnovuje sa…'
};

HOST_I18N.hu = {
  tagline: 'Képek lazy loading blokkolása minden weboldalon',
  heroPlaceholder: 'Képernyőkép',
  priceSubtitle: 'Egyszeri vásárlás · örökös licenc',
  buyNow: 'Vásárlás',
  restore: 'Vásárlások visszaállítása',
  statusLoading: 'Licencállapot betöltése…',
  proUnlocked: '✓ Pro: Korlátlan weboldal feloldva. Köszönjük!',
  proFree: 'Ingyenes: legfeljebb 3 weboldal. Frissíts a korlátlan használathoz.',
  stateUnknown: 'A No Lazy Load kiterjesztését a Safari beállításainak „Kiterjesztések” szakaszában kapcsolhatod be.',
  stateOn: 'A No Lazy Load kiterjesztése be van kapcsolva. A Safari beállításainak „Kiterjesztések” szakaszában kapcsolhatod ki.',
  stateOff: 'A No Lazy Load kiterjesztése ki van kapcsolva. A Safari beállításainak „Kiterjesztések” szakaszában kapcsolhatod be.',
  openSettings: 'Kilépés és a Safari beállításainak megnyitása…',
  busyPurchase: 'Feldolgozás…',
  busyRestore: 'Visszaállítás…'
};

HOST_I18N.ro = {
  tagline: 'Blochează încărcarea lentă a imaginilor pe orice site',
  heroPlaceholder: 'Captură de ecran',
  priceSubtitle: 'Achiziție unică · licență pe viață',
  buyNow: 'Cumpără acum',
  restore: 'Restaurează achizițiile',
  statusLoading: 'Se încarcă starea licenței…',
  proUnlocked: '✓ Pro: Site-uri nelimitate deblocate. Mulțumim!',
  proFree: 'Gratuit: până la 3 site-uri. Fă upgrade pentru nelimitat.',
  stateUnknown: 'Poți activa extensia No Lazy Load din secțiunea „Extensii” a setărilor Safari.',
  stateOn: 'Extensia No Lazy Load este activată. O poți dezactiva din secțiunea „Extensii” a setărilor Safari.',
  stateOff: 'Extensia No Lazy Load este dezactivată. O poți activa din secțiunea „Extensii” a setărilor Safari.',
  openSettings: 'Ieși și deschide setările Safari…',
  busyPurchase: 'Se procesează…',
  busyRestore: 'Se restaurează…'
};

HOST_I18N.bg = {
  tagline: 'Блокирай ленивото зареждане на изображения на всеки сайт',
  heroPlaceholder: 'Екранна снимка',
  priceSubtitle: 'Еднократна покупка · доживотен лиценз',
  buyNow: 'Купи сега',
  restore: 'Възстанови покупките',
  statusLoading: 'Зареждане на статуса на лиценза…',
  proUnlocked: '✓ Pro: Отключени неограничени сайтове. Благодарим!',
  proFree: 'Безплатно: до 3 сайта. Надгради за неограничен брой.',
  stateUnknown: 'Можеш да включиш разширението на No Lazy Load от раздел „Разширения“ в настройките на Safari.',
  stateOn: 'Разширението на No Lazy Load е включено. Можеш да го изключиш от раздел „Разширения“ в настройките на Safari.',
  stateOff: 'Разширението на No Lazy Load е изключено. Можеш да го включиш от раздел „Разширения“ в настройките на Safari.',
  openSettings: 'Изход и отваряне на настройките на Safari…',
  busyPurchase: 'Обработва се…',
  busyRestore: 'Възстановяване…'
};

HOST_I18N.ru = {
  tagline: 'Блокируйте ленивую загрузку изображений на любых сайтах',
  heroPlaceholder: 'Скриншот',
  priceSubtitle: 'Разовая покупка · бессрочная лицензия',
  buyNow: 'Купить',
  restore: 'Восстановить покупки',
  statusLoading: 'Загрузка статуса лицензии…',
  proUnlocked: '✓ Pro: Неограниченное число сайтов разблокировано. Спасибо!',
  proFree: 'Бесплатно: до 3 сайтов. Обновитесь, чтобы снять ограничение.',
  stateUnknown: 'Включить расширение No Lazy Load можно в разделе «Расширения» в настройках Safari.',
  stateOn: 'Расширение No Lazy Load включено. Отключить его можно в разделе «Расширения» в настройках Safari.',
  stateOff: 'Расширение No Lazy Load выключено. Включить его можно в разделе «Расширения» в настройках Safari.',
  openSettings: 'Выйти и открыть настройки Safari…',
  busyPurchase: 'Обработка…',
  busyRestore: 'Восстановление…'
};

HOST_I18N.uk = {
  tagline: 'Блокуйте відкладене завантаження зображень на будь-яких сайтах',
  heroPlaceholder: 'Скриншот',
  priceSubtitle: 'Одноразова покупка · довічна ліцензія',
  buyNow: 'Купити',
  restore: 'Відновити покупки',
  statusLoading: 'Завантаження стану ліцензії…',
  proUnlocked: '✓ Pro: Розблоковано необмежену кількість сайтів. Дякуємо!',
  proFree: 'Безкоштовно: до 3 сайтів. Оновіть, щоб зняти обмеження.',
  stateUnknown: 'Увімкнути розширення No Lazy Load можна в розділі «Розширення» в налаштуваннях Safari.',
  stateOn: 'Розширення No Lazy Load увімкнено. Вимкнути його можна в розділі «Розширення» в налаштуваннях Safari.',
  stateOff: 'Розширення No Lazy Load вимкнено. Увімкнути його можна в розділі «Розширення» в налаштуваннях Safari.',
  openSettings: 'Вийти й відкрити налаштування Safari…',
  busyPurchase: 'Обробка…',
  busyRestore: 'Відновлення…'
};

HOST_I18N.el = {
  tagline: 'Αποκλείστε το lazy loading εικόνων σε κάθε ιστότοπο',
  heroPlaceholder: 'Στιγμιότυπο οθόνης',
  priceSubtitle: 'Εφάπαξ αγορά · ισόβια άδεια',
  buyNow: 'Αγορά τώρα',
  restore: 'Επαναφορά αγορών',
  statusLoading: 'Φόρτωση κατάστασης άδειας…',
  proUnlocked: '✓ Pro: Ξεκλειδώθηκαν απεριόριστοι ιστότοποι. Ευχαριστούμε!',
  proFree: 'Δωρεάν: έως 3 ιστότοποι. Αναβαθμίστε για απεριόριστους.',
  stateUnknown: 'Μπορείτε να ενεργοποιήσετε την επέκταση του No Lazy Load στην ενότητα «Επεκτάσεις» των ρυθμίσεων του Safari.',
  stateOn: 'Η επέκταση του No Lazy Load είναι ενεργή. Μπορείτε να την απενεργοποιήσετε στην ενότητα «Επεκτάσεις» των ρυθμίσεων του Safari.',
  stateOff: 'Η επέκταση του No Lazy Load είναι ανενεργή. Μπορείτε να την ενεργοποιήσετε στην ενότητα «Επεκτάσεις» των ρυθμίσεων του Safari.',
  openSettings: 'Έξοδος και άνοιγμα ρυθμίσεων Safari…',
  busyPurchase: 'Επεξεργασία…',
  busyRestore: 'Επαναφορά…'
};

HOST_I18N.he = {
  tagline: 'חסימת טעינה עצלה של תמונות בכל אתר',
  heroPlaceholder: 'צילום מסך',
  priceSubtitle: 'רכישה חד־פעמית · רישיון לכל החיים',
  buyNow: 'קנה עכשיו',
  restore: 'שחזור רכישות',
  statusLoading: 'טוען מצב רישיון…',
  proUnlocked: '✓ Pro: אתרים ללא הגבלה נפתחו. תודה!',
  proFree: 'חינם: עד 3 אתרים. שדרג כדי להסיר את המגבלה.',
  stateUnknown: 'אפשר להפעיל את התוסף של No Lazy Load בקטע ״הרחבות״ בהגדרות Safari.',
  stateOn: 'התוסף של No Lazy Load פעיל כעת. אפשר לכבות אותו בקטע ״הרחבות״ בהגדרות Safari.',
  stateOff: 'התוסף של No Lazy Load כבוי כעת. אפשר להפעיל אותו בקטע ״הרחבות״ בהגדרות Safari.',
  openSettings: 'יציאה ופתיחת הגדרות Safari…',
  busyPurchase: 'מעבד…',
  busyRestore: 'משחזר…'
};

HOST_I18N.ar = {
  tagline: 'احجب التحميل الكسول للصور في أي موقع',
  heroPlaceholder: 'لقطة شاشة',
  priceSubtitle: 'شراء لمرة واحدة · ترخيص مدى الحياة',
  buyNow: 'اشترِ الآن',
  restore: 'استعادة المشتريات',
  statusLoading: 'جارٍ تحميل حالة الترخيص…',
  proUnlocked: '✓ Pro: تم فتح مواقع غير محدودة. شكرًا لك!',
  proFree: 'مجانًا: حتى 3 مواقع. قم بالترقية لإزالة الحد.',
  stateUnknown: 'يمكنك تشغيل إضافة No Lazy Load من قسم «الإضافات» في إعدادات Safari.',
  stateOn: 'إضافة No Lazy Load مفعّلة حاليًا. يمكنك إيقافها من قسم «الإضافات» في إعدادات Safari.',
  stateOff: 'إضافة No Lazy Load متوقفة حاليًا. يمكنك تشغيلها من قسم «الإضافات» في إعدادات Safari.',
  openSettings: 'إنهاء وفتح إعدادات Safari…',
  busyPurchase: 'جارٍ المعالجة…',
  busyRestore: 'جارٍ الاستعادة…'
};

HOST_I18N.fa = {
  tagline: 'جلوگیری از بارگذاری تنبل تصاویر در همه سایتها',
  heroPlaceholder: 'تصویر محیط برنامه',
  priceSubtitle: 'خرید یکباره · لایسنس دائمی',
  buyNow: 'همین حالا بخرید',
  restore: 'بازیابی خریدها',
  statusLoading: 'در حال بارگذاری وضعیت لایسنس…',
  proUnlocked: '✓ Pro: سایتهای نامحدود فعال شد. سپاسگزاریم!',
  proFree: 'رایگان: تا ۳ سایت. برای رفع محدودیت ارتقا دهید.',
  stateUnknown: 'میتوانید افزونه No Lazy Load را در بخش «افزونهها» در تنظیمات Safari روشن کنید.',
  stateOn: 'افزونه No Lazy Load اکنون روشن است. میتوانید آن را در بخش «افزونهها» در تنظیمات Safari خاموش کنید.',
  stateOff: 'افزونه No Lazy Load اکنون خاموش است. میتوانید آن را در بخش «افزونهها» در تنظیمات Safari روشن کنید.',
  openSettings: 'خروج و باز کردن تنظیمات Safari…',
  busyPurchase: 'در حال پردازش…',
  busyRestore: 'در حال بازیابی…'
};

HOST_I18N.ur = {
  tagline: 'کسی بھی ویب سائٹ پر تصاویر کی سست لوڈنگ روکیں',
  heroPlaceholder: 'فیچر اسکرین شاٹ',
  priceSubtitle: 'ایک بار خرید · تاحیات لائسنس',
  buyNow: 'ابھی خریدیں',
  restore: 'خریداری بحال کریں',
  statusLoading: 'لائسنس کی حالت لوڈ ہو رہی ہے…',
  proUnlocked: '✓ Pro: لامحدود ویب سائٹس کھل گئیں۔ شکریہ!',
  proFree: 'مفت: زیادہ سے زیادہ 3 ویب سائٹس۔ لامحدود کے لیے اپ گریڈ کریں۔',
  stateUnknown: 'آپ Safari کی ترتیبات میں «ایکسٹینشنز» کے حصے سے No Lazy Load کی ایکسٹینشن آن کر سکتے ہیں۔',
  stateOn: 'No Lazy Load کی ایکسٹینشن اس وقت آن ہے۔ آپ اسے Safari کی ترتیبات میں «ایکسٹینشنز» سے بند کر سکتے ہیں۔',
  stateOff: 'No Lazy Load کی ایکسٹینشن اس وقت بند ہے۔ آپ اسے Safari کی ترتیبات میں «ایکسٹینشنز» سے آن کر سکتے ہیں۔',
  openSettings: 'بند کریں اور Safari کی ترتیبات کھولیں…',
  busyPurchase: 'کارروائی جاری ہے…',
  busyRestore: 'بحالی جاری ہے…'
};

HOST_I18N.ps = {
  tagline: 'په هر وېبپاڼه کې د انځورونو تنبل بارول بند کړئ',
  heroPlaceholder: 'د ځانګړنې سکرین شاټ',
  priceSubtitle: 'یوځله پیرود · تلپاتې جواز',
  buyNow: 'اوس وپیرئ',
  restore: 'پیرودونه بحال کړئ',
  statusLoading: 'د جواز حالت بارېږي…',
  proUnlocked: '✓ Pro: بېشمېره وېبپاڼې خلاصې شوې. مننه!',
  proFree: 'وړیا: تر 3 وېبپاڼو. د بېحد له منځه وړلو لپاره لوړ کړئ.',
  stateUnknown: 'تاسو کولی شئ د No Lazy Load غځوننه د Safari تنظیماتو «غځونې» برخه کې فعاله کړئ.',
  stateOn: 'د No Lazy Load غځوننه اوس فعاله ده. تاسو یې د Safari تنظیماتو «غځونې» برخه کې بنده کولی شئ.',
  stateOff: 'د No Lazy Load غځوننه اوس بنده ده. تاسو یې د Safari تنظیماتو «غځونې» برخه کې فعاله کولی شئ.',
  openSettings: 'وتل او د Safari تنظیمات پرانیستل…',
  busyPurchase: 'پروسس کېږي…',
  busyRestore: 'بحالېږي…'
};

HOST_I18N.hi = {
  tagline: 'किसी भी वेबसाइट पर छवियों की लेज़ी लोडिंग रोकें',
  heroPlaceholder: 'फ़ीचर स्क्रीनशॉट',
  priceSubtitle: 'एकमुश्त खरीद · आजीवन लाइसेंस',
  buyNow: 'अभी खरीदें',
  restore: 'खरीदारी बहाल करें',
  statusLoading: 'लाइसेंस स्थिति लोड हो रही है…',
  proUnlocked: '✓ Pro: असीमित वेबसाइटें अनलॉक हुईं। धन्यवाद!',
  proFree: 'मुफ़्त: अधिकतम 3 वेबसाइटें। असीमित के लिए अपग्रेड करें।',
  stateUnknown: 'आप Safari सेटिंग्स के “एक्सटेंशन” में No Lazy Load एक्सटेंशन चालू कर सकते हैं।',
  stateOn: 'No Lazy Load एक्सटेंशन अभी चालू है। आप इसे Safari सेटिंग्स के “एक्सटेंशन” में बंद कर सकते हैं।',
  stateOff: 'No Lazy Load एक्सटेंशन अभी बंद है। आप इसे Safari सेटिंग्स के “एक्सटेंशन” में चालू कर सकते हैं।',
  openSettings: 'बंद करें और Safari सेटिंग्स खोलें…',
  busyPurchase: 'प्रोसेस हो रहा है…',
  busyRestore: 'बहाल हो रहा है…'
};

HOST_I18N.th = {
  tagline: 'บล็อกการโหลดรูปภาพแบบเลื่อนในทุกเว็บไซต์',
  heroPlaceholder: 'ภาพหน้าจอฟีเจอร์',
  priceSubtitle: 'ซื้อครั้งเดียว · ใช้ได้ตลอดชีพ',
  buyNow: 'ซื้อเลย',
  restore: 'กู้คืนการซื้อ',
  statusLoading: 'กำลังโหลดสถานะไลเซนส์…',
  proUnlocked: '✓ Pro: ปลดล็อกเว็บไซต์ไม่จำกัดแล้ว ขอบคุณ!',
  proFree: 'ฟรี: สูงสุด 3 เว็บไซต์ อัปเกรดเพื่อไม่จำกัด',
  stateUnknown: 'คุณเปิดส่วนขยาย No Lazy Load ได้ที่ «ส่วนขยาย» ในการตั้งค่า Safari',
  stateOn: 'ส่วนขยาย No Lazy Load เปิดอยู่ คุณปิดได้ที่ «ส่วนขยาย» ในการตั้งค่า Safari',
  stateOff: 'ส่วนขยาย No Lazy Load ปิดอยู่ คุณเปิดได้ที่ «ส่วนขยาย» ในการตั้งค่า Safari',
  openSettings: 'ออกและเปิดการตั้งค่า Safari…',
  busyPurchase: 'กำลังดำเนินการ…',
  busyRestore: 'กำลังกู้คืน…'
};

HOST_I18N.vi = {
  tagline: 'Chặn tải hình ảnh theo kiểu lazy trên mọi trang web',
  heroPlaceholder: 'Ảnh chụp tính năng',
  priceSubtitle: 'Mua một lần · dùng trọn đời',
  buyNow: 'Mua ngay',
  restore: 'Khôi phục giao dịch',
  statusLoading: 'Đang tải trạng thái bản quyền…',
  proUnlocked: '✓ Pro: Đã mở khoá không giới hạn trang web. Cảm ơn bạn!',
  proFree: 'Miễn phí: tối đa 3 trang web. Nâng cấp để không giới hạn.',
  stateUnknown: 'Bạn có thể bật tiện ích No Lazy Load trong mục “Tiện ích” của cài đặt Safari.',
  stateOn: 'Tiện ích No Lazy Load đang bật. Bạn có thể tắt trong mục “Tiện ích” của cài đặt Safari.',
  stateOff: 'Tiện ích No Lazy Load đang tắt. Bạn có thể bật trong mục “Tiện ích” của cài đặt Safari.',
  openSettings: 'Thoát và mở cài đặt Safari…',
  busyPurchase: 'Đang xử lý…',
  busyRestore: 'Đang khôi phục…'
};

HOST_I18N.id = {
  tagline: 'Blokir lazy loading gambar di semua situs web',
  heroPlaceholder: 'Tangkapan layar fitur',
  priceSubtitle: 'Beli sekali · akses selamanya',
  buyNow: 'Beli sekarang',
  restore: 'Pulihkan pembelian',
  statusLoading: 'Memuat status lisensi…',
  proUnlocked: '✓ Pro: Situs web tanpa batas telah dibuka. Terima kasih!',
  proFree: 'Gratis: hingga 3 situs web. Tingkatkan untuk tanpa batas.',
  stateUnknown: 'Anda dapat mengaktifkan ekstensi No Lazy Load di bagian “Ekstensi” pada pengaturan Safari.',
  stateOn: 'Ekstensi No Lazy Load sedang aktif. Anda dapat menonaktifkannya di bagian “Ekstensi” pada pengaturan Safari.',
  stateOff: 'Ekstensi No Lazy Load sedang nonaktif. Anda dapat mengaktifkannya di bagian “Ekstensi” pada pengaturan Safari.',
  openSettings: 'Keluar dan buka pengaturan Safari…',
  busyPurchase: 'Memproses…',
  busyRestore: 'Memulihkan…'
};

HOST_I18N.tr = {
  tagline: 'Tüm sitelerde resimlerin lazy loading yüklemesini engelleyin',
  heroPlaceholder: 'Özellik ekran görüntüsü',
  priceSubtitle: 'Tek seferlik satın alma · ömür boyu lisans',
  buyNow: 'Şimdi satın al',
  restore: 'Satın alımları geri yükle',
  statusLoading: 'Lisans durumu yükleniyor…',
  proUnlocked: '✓ Pro: Sınırsız site açıldı. Teşekkürler!',
  proFree: 'Ücretsiz: 3 siteye kadar. Sınırsız için yükseltin.',
  stateUnknown: 'No Lazy Load uzantısını Safari ayarlarının “Uzantılar” bölümünden açabilirsiniz.',
  stateOn: 'No Lazy Load uzantısı açık. Safari ayarlarının “Uzantılar” bölümünden kapatabilirsiniz.',
  stateOff: 'No Lazy Load uzantısı kapalı. Safari ayarlarının “Uzantılar” bölümünden açabilirsiniz.',
  openSettings: 'Çık ve Safari ayarlarını aç…',
  busyPurchase: 'İşleniyor…',
  busyRestore: 'Geri yükleniyor…'
};

HOST_I18N.ca = {
  tagline: 'Bloqueja la càrrega diferida d’imatges a qualsevol lloc web',
  heroPlaceholder: 'Captura de pantalla',
  priceSubtitle: 'Compra única · accés de per vida',
  buyNow: 'Compra ara',
  restore: 'Restaura les compres',
  statusLoading: 'S’està carregant l’estat de la llicència…',
  proUnlocked: '✓ Pro: Llocs web il·limitats desbloquejats. Gràcies!',
  proFree: 'Gratuït: fins a 3 llocs web. Actualitza per tenir-ne sense límit.',
  stateUnknown: 'Pots activar l’extensió de No Lazy Load a la secció «Extensions» dels ajustos del Safari.',
  stateOn: 'L’extensió de No Lazy Load està activada. Pots desactivar-la a la secció «Extensions» dels ajustos del Safari.',
  stateOff: 'L’extensió de No Lazy Load està desactivada. Pots activar-la a la secció «Extensions» dels ajustos del Safari.',
  openSettings: 'Surt i obre els ajustos del Safari…',
  busyPurchase: 'S’està processant…',
  busyRestore: 'S’està restaurant…'
};

HOST_I18N.hr = {
  tagline: 'Blokirajte lijeno učitavanje slika na svim web-lokacijama',
  heroPlaceholder: 'Snimka zaslona',
  priceSubtitle: 'Jednokratna kupnja · doživotna licenca',
  buyNow: 'Kupi sada',
  restore: 'Vrati kupnje',
  statusLoading: 'Učitavanje statusa licence…',
  proUnlocked: '✓ Pro: Neograničene web-lokacije otključane. Hvala!',
  proFree: 'Besplatno: do 3 web-lokacije. Nadogradite za neograničeno.',
  stateUnknown: 'No Lazy Load proširenje možete uključiti u odjeljku „Proširenja” u Safarijevim postavkama.',
  stateOn: 'No Lazy Load proširenje je uključeno. Možete ga isključiti u odjeljku „Proširenja” u Safarijevim postavkama.',
  stateOff: 'No Lazy Load proširenje je isključeno. Možete ga uključiti u odjeljku „Proširenja” u Safarijevim postavkama.',
  openSettings: 'Zatvori i otvori Safarijeve postavke…',
  busyPurchase: 'Obrada…',
  busyRestore: 'Vraćanje…'
};

// 语言代码别名：把系统的 BCP-47 语言标签映射到本表的 key
const HOST_LANG_ALIASES = {
  no: 'nb', nb_no: 'nb', iw: 'he', in: 'id',
  'pt-br': 'pt', 'pt-pt': 'pt',
  'zh-cn': 'zh', 'zh-sg': 'zh', 'zh-hans': 'zh',
  'zh-tw': 'zh_TW', 'zh-hant': 'zh_TW',
  'zh-hk': 'zh_HK', 'zh-mo': 'zh_HK'
};

// 繁体中文本地化不全时优先回退简体，再回退英文
const HOST_I18N_FALLBACK = { zh_TW: ['zh'], zh_HK: ['zh'] };

let hostLang = 'en';

(function resolveHostLang() {
  let raw = (typeof window !== 'undefined' && window.__HOST_LANG__) ||
            (typeof navigator !== 'undefined' && (navigator.language ||
              (navigator.languages && navigator.languages[0]))) || 'en';
  const tag = String(raw).replace(/_/g, '-').toLowerCase();
  let code;
  if (tag.indexOf('zh') === 0) {
    // 中文要区分简繁：HK/MO 优先，其次 TW/Hant
    if (tag.indexOf('-hk') >= 0 || tag.indexOf('-mo') >= 0) code = 'zh_HK';
    else if (tag.indexOf('-tw') >= 0 || tag.indexOf('hant') >= 0) code = 'zh_TW';
    else code = 'zh';
  } else {
    code = HOST_LANG_ALIASES[tag] || HOST_LANG_ALIASES[tag.split('-')[0]] || tag.split('-')[0];
  }
  hostLang = HOST_I18N[code] ? code : 'en';
})();

function hostT(key) {
  const chain = [hostLang].concat(HOST_I18N_FALLBACK[hostLang] || ['en']);
  for (let i = 0; i < chain.length; i++) {
    const table = HOST_I18N[chain[i]];
    if (table && table[key]) return table[key];
  }
  return HOST_I18N.en[key] || key;
}

// 把 data-i18n 标记的静态文案替换成当前语言
function applyHostI18n() {
  document.documentElement.lang = hostLang.replace('_', '-');
  // 阿拉伯语 / 希伯来语 / 波斯语 / 乌尔都语 / 普什图语 为从右到左排版
  document.documentElement.dir = ['ar', 'he', 'fa', 'ur', 'ps'].indexOf(hostLang) >= 0 ? 'rtl' : 'ltr';
  const nodes = document.querySelectorAll('[data-i18n]');
  for (let i = 0; i < nodes.length; i++) {
    const key = nodes[i].getAttribute('data-i18n');
    const text = key ? hostT(key) : '';
    if (text) nodes[i].textContent = text;
  }
}

applyHostI18n();

