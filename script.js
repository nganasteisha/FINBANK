/* ============================================================
   FINBANK
   Основна логіка банківського інтерфейсу
   ============================================================ */

const FINBANK = {
    cardsKey: "finbank_cards_v2",
    activeCardKey: "finbank_active_card_v2",
    transactionsKey: "finbank_transactions_v2",
    goalsKey: "finbank_goals_v2",
    settingsKey: "finbank_settings_v2",
    profileKey: "finbank_profile_v2",

    defaultCards: [
        {
            id: "card-main",
            name: "Основна картка",
            number: "5678567856785678",
            type: "Visa",
            holder: "ANASTASIA N",
            expiry: "12/29",
            balance: 15230,
            frozen: false
        }
    ],

    defaultTransactions: [
        {
            id: "start-1",
            cardId: "card-main",
            title: "Сільпо",
            category: "Покупки",
            type: "expense",
            amount: -345,
            recipient: "",
            date: "21.09.2026, 14:32"
        },
        {
            id: "start-2",
            cardId: "card-main",
            title: "Переказ від Олега",
            category: "Переказ",
            type: "income",
            amount: 1000,
            recipient: "Олег",
            date: "21.09.2026, 10:12"
        },
        {
            id: "start-3",
            cardId: "card-main",
            title: "Комунальні послуги",
            category: "Комунальні",
            type: "payment",
            amount: -820.5,
            recipient: "",
            date: "20.09.2026, 18:47"
        },
        {
            id: "start-4",
            cardId: "card-main",
            title: "Зарплата",
            category: "Надходження",
            type: "income",
            amount: 24000,
            recipient: "",
            date: "18.09.2026, 09:20"
        }
    ],

    defaultGoals: [
        {
            id: "goal-1",
            name: "Подорож",
            icon: "✈",
            saved: 12000,
            target: 30000
        },
        {
            id: "goal-2",
            name: "Новий ноутбук",
            icon: "⌨",
            saved: 18500,
            target: 40000
        }
    ],

    defaultProfile: {
        name: "Анастасія",
        accountType: "Особистий рахунок",
        currency: "UAH ₴"
    },

    defaultSettings: {
        hideBalance: false,
        transactionConfirm: true,
        incomeNotifications: true,
        paymentNotifications: true,
        twoFactor: true
    }
};


/* ============================================================
   ДОПОМІЖНІ ФУНКЦІЇ
   ============================================================ */

function money(value, signed = false) {
    const number = Number(value) || 0;

    const formatted = Math.abs(number).toLocaleString("uk-UA", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    if (signed) {
        return `${number >= 0 ? "+" : "−"}${formatted} ₴`;
    }

    return `${formatted} ₴`;
}


function shortMoney(value) {
    const number = Number(value) || 0;

    return Math.abs(number).toLocaleString("uk-UA", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }) + " ₴";
}


function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function currentDate() {
    return new Date().toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


function generateId(prefix = "FB") {
    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;
}


function getLastFour(number) {
    const clean = String(number || "").replace(/\D/g, "");

    return clean.slice(-4).padStart(4, "0");
}


function formatCardNumber(number) {
    const clean = String(number || "").replace(/\D/g, "");

    const groups = clean.match(/.{1,4}/g) || [];

    return groups.join(" ");
}


function maskedCard(number) {
    return `•••• ${getLastFour(number)}`;
}


/* ============================================================
   LOCAL STORAGE
   ============================================================ */

function readStorage(key, fallback) {
    const saved = localStorage.getItem(key);

    if (!saved) {
        localStorage.setItem(key, JSON.stringify(fallback));
        return structuredClone(fallback);
    }

    try {
        const parsed = JSON.parse(saved);

        return parsed;
    } catch {
        localStorage.setItem(key, JSON.stringify(fallback));
        return structuredClone(fallback);
    }
}


function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}


/* ============================================================
   КАРТКИ
   ============================================================ */

function getCards() {
    const cards = readStorage(
        FINBANK.cardsKey,
        FINBANK.defaultCards
    );

    if (!Array.isArray(cards) || cards.length === 0) {
        writeStorage(
            FINBANK.cardsKey,
            FINBANK.defaultCards
        );

        return structuredClone(FINBANK.defaultCards);
    }

    return cards;
}


function saveCards(cards) {
    writeStorage(FINBANK.cardsKey, cards);
}


function getActiveCardId() {
    const cards = getCards();

    const savedId = localStorage.getItem(
        FINBANK.activeCardKey
    );

    if (
        savedId &&
        cards.some(card => card.id === savedId)
    ) {
        return savedId;
    }

    const firstCard = cards[0];

    if (firstCard) {
        localStorage.setItem(
            FINBANK.activeCardKey,
            firstCard.id
        );

        return firstCard.id;
    }

    return null;
}


function setActiveCard(cardId) {
    const cards = getCards();

    const cardExists = cards.some(
        card => card.id === cardId
    );

    if (!cardExists) {
        return false;
    }

    localStorage.setItem(
        FINBANK.activeCardKey,
        cardId
    );

    refreshPageData();

    return true;
}


function getActiveCard() {
    const cards = getCards();

    const activeId = getActiveCardId();

    return (
        cards.find(card => card.id === activeId) ||
        cards[0] ||
        null
    );
}


function getCardById(cardId) {
    const cards = getCards();

    return (
        cards.find(card => card.id === cardId) ||
        null
    );
}


function saveCard(card) {
    const cards = getCards();

    cards.push(card);

    saveCards(cards);

    if (!getActiveCardId()) {
        setActiveCard(card.id);
    }
}


function updateCard(cardId, changes) {
    const cards = getCards();

    const index = cards.findIndex(
        card => card.id === cardId
    );

    if (index === -1) {
        return null;
    }

    cards[index] = {
        ...cards[index],
        ...changes
    };

    saveCards(cards);

    return cards[index];
}


function deleteCard(cardId) {
    const cards = getCards();

    if (cards.length <= 1) {
        showToast(
            "Не можна видалити єдину картку",
            "error"
        );

        return false;
    }

    const filtered = cards.filter(
        card => card.id !== cardId
    );

    saveCards(filtered);

    if (getActiveCardId() === cardId) {
        setActiveCard(filtered[0].id);
    }

    return true;
}


function toggleCardFrozen(cardId) {
    const card = getCardById(cardId);

    if (!card) {
        return;
    }

    updateCard(cardId, {
        frozen: !card.frozen
    });

    refreshPageData();
}


/* ============================================================
   БАЛАНС
   ============================================================ */

function getBalance(cardId = null) {
    const card = cardId
        ? getCardById(cardId)
        : getActiveCard();

    return card ? Number(card.balance) || 0 : 0;
}


function setCardBalance(cardId, value) {
    const card = getCardById(cardId);

    if (!card) {
        return false;
    }

    const newBalance = Number(value);

    if (!Number.isFinite(newBalance)) {
        return false;
    }

    if (newBalance < 0) {
        return false;
    }

    updateCard(cardId, {
        balance: Number(newBalance.toFixed(2))
    });

    refreshPageData();

    return true;
}


function changeCardBalance(cardId, amount) {
    const card = getCardById(cardId);

    if (!card) {
        return {
            success: false,
            message: "Картку не знайдено."
        };
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
        return {
            success: false,
            message: "Некоректна сума."
        };
    }

    const newBalance =
        Number(card.balance) + numericAmount;

    if (newBalance < 0) {
        return {
            success: false,
            message: "Недостатньо коштів на картці."
        };
    }

    updateCard(cardId, {
        balance: Number(newBalance.toFixed(2))
    });

    refreshPageData();

    return {
        success: true,
        balance: newBalance
    };
}


/* ============================================================
   ТРАНЗАКЦІЇ
   ============================================================ */

function getTransactions() {
    const transactions = readStorage(
        FINBANK.transactionsKey,
        FINBANK.defaultTransactions
    );

    if (!Array.isArray(transactions)) {
        writeStorage(
            FINBANK.transactionsKey,
            FINBANK.defaultTransactions
        );

        return structuredClone(
            FINBANK.defaultTransactions
        );
    }

    return transactions;
}


function saveTransactions(transactions) {
    writeStorage(
        FINBANK.transactionsKey,
        transactions
    );
}


function addTransaction(transaction) {
    const transactions = getTransactions();

    const newTransaction = {
        id: transaction.id || generateId("FB"),
        cardId:
            transaction.cardId ||
            getActiveCardId(),
        title:
            transaction.title ||
            "Операція",
        category:
            transaction.category ||
            "Операція",
        type:
            transaction.type ||
            "expense",
        amount:
            Number(transaction.amount) || 0,
        recipient:
            transaction.recipient || "",
        date:
            transaction.date || currentDate()
    };

    transactions.unshift(newTransaction);

    saveTransactions(transactions);

    return newTransaction;
}


function getTransactionsForCard(cardId) {
    return getTransactions().filter(
        transaction =>
            transaction.cardId === cardId
    );
}


/* ============================================================
   ЦІЛІ
   ============================================================ */

function getGoals() {
    const goals = readStorage(
        FINBANK.goalsKey,
        FINBANK.defaultGoals
    );

    return Array.isArray(goals)
        ? goals
        : structuredClone(FINBANK.defaultGoals);
}


function saveGoals(goals) {
    writeStorage(
        FINBANK.goalsKey,
        goals
    );
}


/* ============================================================
   ПРОФІЛЬ
   ============================================================ */

function getProfile() {
    return readStorage(
        FINBANK.profileKey,
        FINBANK.defaultProfile
    );
}


function saveProfile(profile) {
    writeStorage(
        FINBANK.profileKey,
        profile
    );
}


/* ============================================================
   НАЛАШТУВАННЯ
   ============================================================ */

function getSettings() {
    return readStorage(
        FINBANK.settingsKey,
        FINBANK.defaultSettings
    );
}


function saveSettings(settings) {
    writeStorage(
        FINBANK.settingsKey,
        settings
    );
}


/* ============================================================
   TOAST
   ============================================================ */

function showToast(message, type = "success") {
    const oldToast =
        document.querySelector(".finbank-toast");

    if (oldToast) {
        oldToast.remove();
    }

    const toast = document.createElement("div");

    toast.className =
        `finbank-toast finbank-toast-${type}`;

    toast.innerHTML = `
        <span class="toast-icon">
            ${type === "error" ? "!" : "✓"}
        </span>

        <span>${escapeHTML(message)}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 20);

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 250);
    }, 2800);
}


/* ============================================================
   МОДАЛЬНІ ВІКНА
   ============================================================ */

function closeModal() {
    const modal =
        document.querySelector(".finbank-modal-overlay");

    if (modal) {
        modal.remove();
        document.body.classList.remove("modal-open");
    }
}


function createModal(content) {
    closeModal();

    const overlay =
        document.createElement("div");

    overlay.className =
        "finbank-modal-overlay";

    overlay.innerHTML = `
        <div class="finbank-modal">

            ${content}

        </div>
    `;

    overlay.addEventListener("click", event => {
        if (
            event.target === overlay
        ) {
            closeModal();
        }
    });

    document.body.appendChild(overlay);

    document.body.classList.add("modal-open");

    const closeButton =
        overlay.querySelector("[data-close-modal]");

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeModal
        );
    }

    return overlay;
}


/* ============================================================
   ПРОФІЛЬ
   ============================================================ */

function openProfile() {
    const profile = getProfile();
    const card = getActiveCard();

    const overlay = createModal(`
        <div class="finbank-modal-head">

            <div>
                <span class="modal-overline">
                    FINBANK
                </span>

                <h2>Профіль</h2>
            </div>

            <button
                type="button"
                class="finbank-modal-close"
                data-close-modal
            >
                ×
            </button>

        </div>

        <div class="finbank-modal-body">

            <div class="profile-modal-card">

                <div class="profile-modal-avatar">
                    ${escapeHTML(
                        profile.name.charAt(0)
                    )}
                </div>

                <div>
                    <strong>
                        ${escapeHTML(profile.name)}
                    </strong>

                    <span>
                        ${escapeHTML(
                            profile.accountType
                        )}
                    </span>
                </div>

            </div>


            <div class="modal-info-list">

                <div>
                    <span>Ім'я</span>
                    <strong>
                        ${escapeHTML(profile.name)}
                    </strong>
                </div>

                <div>
                    <span>Тип рахунку</span>
                    <strong>
                        ${escapeHTML(
                            profile.accountType
                        )}
                    </strong>
                </div>

                <div>
                    <span>Активна картка</span>
                    <strong>
                        ${
                            card
                                ? maskedCard(card.number)
                                : "—"
                        }
                    </strong>
                </div>

                <div>
                    <span>Валюта</span>
                    <strong>
                        ${escapeHTML(profile.currency)}
                    </strong>
                </div>

            </div>

            <button
                type="button"
                class="primary-button modal-primary-button"
                id="openSettingsFromProfile"
            >
                Налаштування →
            </button>

        </div>
    `);

    const settingsButton =
        overlay.querySelector(
            "#openSettingsFromProfile"
        );

    if (settingsButton) {
        settingsButton.addEventListener(
            "click",
            openSettings
        );
    }
}


/* ============================================================
   НАЛАШТУВАННЯ
   ============================================================ */

function openSettings() {
    const settings = getSettings();

    const overlay = createModal(`
        <div class="finbank-modal-head">

            <div>
                <span class="modal-overline">
                    FINBANK
                </span>

                <h2>Налаштування</h2>
            </div>

            <button
                type="button"
                class="finbank-modal-close"
                data-close-modal
            >
                ×
            </button>

        </div>

        <div class="finbank-modal-body">

            <section class="settings-section">

                <div class="settings-section-head">
                    <div>
                        <h3>Особисті дані</h3>
                        <p>
                            Дані вашого рахунку
                        </p>
                    </div>
                </div>

                <div class="settings-field">

                    <label for="settingsName">
                        Ім'я
                    </label>

                    <input
                        id="settingsName"
                        class="modal-input"
                        type="text"
                        value="${escapeHTML(
                            getProfile().name
                        )}"
                    >

                </div>

                <button
                    type="button"
                    class="secondary-button"
                    id="saveProfileSettings"
                >
                    Зберегти дані
                </button>

            </section>


            <section class="settings-section">

                <div class="settings-section-head">
                    <div>
                        <h3>Безпека</h3>
                        <p>
                            Керуйте безпекою рахунку
                        </p>
                    </div>
                </div>


                <div class="settings-toggle-row">

                    <div>
                        <strong>
                            Підтвердження операцій
                        </strong>

                        <small>
                            Показувати підтвердження
                            перед виконанням
                        </small>
                    </div>

                    <button
                        type="button"
                        class="settings-toggle ${
                            settings.transactionConfirm
                                ? "active"
                                : ""
                        }"
                        data-setting="transactionConfirm"
                    >
                        <span></span>
                    </button>

                </div>


                <div class="settings-toggle-row">

                    <div>
                        <strong>
                            Двофакторна автентифікація
                        </strong>

                        <small>
                            Додатковий захист рахунку
                        </small>
                    </div>

                    <button
                        type="button"
                        class="settings-toggle ${
                            settings.twoFactor
                                ? "active"
                                : ""
                        }"
                        data-setting="twoFactor"
                    >
                        <span></span>
                    </button>

                </div>

            </section>


            <section class="settings-section">

                <div class="settings-section-head">
                    <div>
                        <h3>Сповіщення</h3>
                        <p>
                            Керування повідомленнями
                        </p>
                    </div>
                </div>


                <div class="settings-toggle-row">

                    <div>
                        <strong>
                            Надходження коштів
                        </strong>

                        <small>
                            Повідомляти про нові надходження
                        </small>
                    </div>

                    <button
                        type="button"
                        class="settings-toggle ${
                            settings.incomeNotifications
                                ? "active"
                                : ""
                        }"
                        data-setting="incomeNotifications"
                    >
                        <span></span>
                    </button>

                </div>


                <div class="settings-toggle-row">

                    <div>
                        <strong>
                            Оплати
                        </strong>

                        <small>
                            Повідомляти про виконані платежі
                        </small>
                    </div>

                    <button
                        type="button"
                        class="settings-toggle ${
                            settings.paymentNotifications
                                ? "active"
                                : ""
                        }"
                        data-setting="paymentNotifications"
                    >
                        <span></span>
                    </button>

                </div>

            </section>


            <section class="settings-section">

                <div class="settings-toggle-row">

                    <div>
                        <strong>
                            Приховувати баланс
                        </strong>

                        <small>
                            Приховати суми на головній
                        </small>
                    </div>

                    <button
                        type="button"
                        class="settings-toggle ${
                            settings.hideBalance
                                ? "active"
                                : ""
                        }"
                        data-setting="hideBalance"
                    >
                        <span></span>
                    </button>

                </div>

            </section>

        </div>
    `);


    const saveProfileButton =
        overlay.querySelector(
            "#saveProfileSettings"
        );

    saveProfileButton?.addEventListener(
        "click",
        () => {
            const input =
                overlay.querySelector(
                    "#settingsName"
                );

            const profile = getProfile();

            const newName =
                input.value.trim();

            if (!newName) {
                showToast(
                    "Введіть ім'я.",
                    "error"
                );

                return;
            }

            profile.name = newName;

            saveProfile(profile);

            showToast(
                "Дані профілю збережено."
            );

            openSettings();
        }
    );


    overlay
        .querySelectorAll("[data-setting]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const setting =
                        button.dataset.setting;

                    const current =
                        getSettings();

                    current[setting] =
                        !current[setting];

                    saveSettings(current);

                    button.classList.toggle(
                        "active",
                        current[setting]
                    );

                    refreshPageData();
                }
            );

        });
}


/* ============================================================
   ПІДТРИМКА
   ============================================================ */

function openSupport() {
    const overlay = createModal(`
        <div class="finbank-modal-head">

            <div>
                <span class="modal-overline">
                    FINBANK
                </span>

                <h2>Підтримка</h2>
            </div>

            <button
                type="button"
                class="finbank-modal-close"
                data-close-modal
            >
                ×
            </button>

        </div>

        <div class="finbank-modal-body">

            <div class="support-grid">

                <div class="support-item">
                    <span>01</span>
                    <strong>Чат підтримки</strong>
                    <small>
                        Отримайте допомогу щодо рахунку
                    </small>
                </div>

                <div class="support-item">
                    <span>02</span>
                    <strong>Безпека</strong>
                    <small>
                        Якщо ви помітили підозрілу операцію
                    </small>
                </div>

                <div class="support-item">
                    <span>03</span>
                    <strong>Платежі</strong>
                    <small>
                        Допомога з оплатами та переказами
                    </small>
                </div>

            </div>


            <form
                class="support-form"
                id="supportForm"
            >

                <label for="supportMessage">
                    Ваше повідомлення
                </label>

                <textarea
                    id="supportMessage"
                    rows="4"
                    placeholder="Напишіть, що сталося..."
                ></textarea>

                <button
                    type="submit"
                    class="primary-button"
                >
                    Надіслати повідомлення
                </button>

            </form>

        </div>
    `);


    const form =
        overlay.querySelector("#supportForm");

    form?.addEventListener(
        "submit",
        event => {
            event.preventDefault();

            const message =
                overlay.querySelector(
                    "#supportMessage"
                ).value.trim();

            if (!message) {
                showToast(
                    "Напишіть повідомлення.",
                    "error"
                );

                return;
            }

            showToast(
                "Повідомлення надіслано."
            );

            closeModal();
        }
    );
}


/* ============================================================
   НАВІГАЦІЯ
   ============================================================ */

function initNavigation() {

    const currentPage =
        location.pathname
            .split("/")
            .pop()
            .toLowerCase() || "index.html";


    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            const href =
                item.getAttribute("href");

            if (!href || href === "#") {
                return;
            }

            const fileName =
                href.split("?")[0];

            item.classList.toggle(
                "active",
                fileName === currentPage
            );

        });


    document
        .querySelectorAll("[data-action]")
        .forEach(element => {

            element.addEventListener(
                "click",
                event => {

                    const action =
                        element.dataset.action;

                    if (
                        action === "profile" ||
                        action === "settings" ||
                        action === "support"
                    ) {
                        event.preventDefault();
                    }

                    if (action === "profile") {
                        openProfile();
                    }

                    if (action === "settings") {
                        openSettings();
                    }

                    if (action === "support") {
                        openSupport();
                    }

                }
            );

        });
}


/* ============================================================
   TOP BAR
   ============================================================ */

function renderTopProfile() {
    const profile = getProfile();
    const activeCard = getActiveCard();

    document
        .querySelectorAll(".profile-info strong")
        .forEach(element => {
            element.textContent = profile.name;
        });


    document
        .querySelectorAll(".profile-info small")
        .forEach(element => {
            element.textContent =
                profile.accountType;
        });


    document
        .querySelectorAll(".profile-avatar")
        .forEach(element => {

            if (
                element.closest(
                    ".profile-modal-avatar"
                )
            ) {
                return;
            }

            element.textContent =
                profile.name
                    .charAt(0)
                    .toUpperCase();

        });


    document
        .querySelectorAll("[data-active-card-number]")
        .forEach(element => {

            element.textContent =
                activeCard
                    ? maskedCard(activeCard.number)
                    : "—";

        });
}


/* ============================================================
   ПРИБИРАЄМО СТАРІ ПОШУК / СПОВІЩЕННЯ
   ============================================================ */

function removeOldTopButtons() {

    document
        .querySelectorAll(".top-bar .icon-button")
        .forEach(button => {

            const label =
                (
                    button.getAttribute(
                        "aria-label"
                    ) || ""
                ).toLowerCase();

            if (
                label.includes("пошук") ||
                label.includes("сповіщ")
            ) {
                button.remove();
            }

        });
}


/* ============================================================
   БАЛАНС НА ГОЛОВНІЙ
   ============================================================ */

function updateBalance() {

    const activeCard = getActiveCard();

    if (!activeCard) {
        return;
    }

    const settings = getSettings();

    const balanceElements = [
        document.getElementById(
            "balanceValue"
        ),
        document.getElementById(
            "overviewBalance"
        )
    ];


    balanceElements.forEach(element => {

        if (!element) {
            return;
        }

        if (settings.hideBalance) {
            element.textContent =
                "••••••";
        } else {
            element.textContent =
                Number(
                    activeCard.balance
                ).toLocaleString(
                    "uk-UA",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );
        }

    });


    document
        .querySelectorAll(
            "[data-active-card-balance]"
        )
        .forEach(element => {

            element.textContent =
                settings.hideBalance
                    ? "•••••• ₴"
                    : money(
                        activeCard.balance
                    );

        });


    document
        .querySelectorAll(
            "[data-active-card-number]"
        )
        .forEach(element => {
            element.textContent =
                maskedCard(
                    activeCard.number
                );
        });


    document
        .querySelectorAll(
            "[data-active-card-name]"
        )
        .forEach(element => {
            element.textContent =
                activeCard.name;
        });
}


/* ============================================================
   БАЛАНС TOGGLE
   ============================================================ */

function initBalanceToggle() {

    const button =
        document.querySelector(
            ".balance-toggle"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            const settings =
                getSettings();

            settings.hideBalance =
                !settings.hideBalance;

            saveSettings(settings);

            updateBalance();

            button.classList.toggle(
                "active",
                settings.hideBalance
            );

        }
    );
}


/* ============================================================
   ОСТАННІ ОПЕРАЦІЇ
   ============================================================ */

function renderRecentTransactions() {

    const container =
        document.getElementById(
            "recentTransactions"
        );

    if (!container) {
        return;
    }

    const activeCard =
        getActiveCard();

    if (!activeCard) {
        container.innerHTML = "";
        return;
    }

    const transactions =
        getTransactionsForCard(
            activeCard.id
        ).slice(0, 5);


    if (!transactions.length) {

        container.innerHTML = `
            <div class="empty-state">
                Поки немає операцій
            </div>
        `;

        return;
    }


    container.innerHTML =
        transactions
            .map(transaction => {

                const positive =
                    Number(
                        transaction.amount
                    ) >= 0;

                return `
                    <div class="transaction">

                        <div class="
                            transaction-icon
                            ${
                                positive
                                    ? "income"
                                    : "expense"
                            }
                        ">
                            ${
                                positive
                                    ? "↑"
                                    : "↓"
                            }
                        </div>

                        <div class="transaction-info">

                            <strong>
                                ${escapeHTML(
                                    transaction.title
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    transaction.date
                                )}
                            </span>

                        </div>

                        <div class="
                            transaction-amount
                            ${
                                positive
                                    ? "positive"
                                    : "negative"
                            }
                        ">
                            ${money(
                                transaction.amount,
                                true
                            )}
                        </div>

                    </div>
                `;

            })
            .join("");
}


/* ============================================================
   ЦІЛІ
   ============================================================ */

function renderGoals() {

    const container =
        document.getElementById(
            "goalsList"
        );

    if (!container) {
        return;
    }

    const goals =
        getGoals();


    if (!goals.length) {

        container.innerHTML = `
            <div class="empty-goals">
                <strong>
                    Поки немає цілей
                </strong>

                <span>
                    Додайте фінансову ціль
                </span>
            </div>
        `;

        return;
    }


    container.innerHTML =
        goals
            .map(goal => {

                const saved =
                    Number(goal.saved) || 0;

                const target =
                    Number(goal.target) || 1;

                const percent =
                    Math.min(
                        100,
                        Math.round(
                            saved / target * 100
                        )
                    );


                return `
                    <div
                        class="goal"
                        data-goal-id="${escapeHTML(
                            goal.id
                        )}"
                    >

                        <div class="goal-icon">
                            ${escapeHTML(
                                goal.icon || "₴"
                            )}
                        </div>

                        <div class="goal-info">

                            <strong>
                                ${escapeHTML(
                                    goal.name
                                )}
                            </strong>

                            <span>
                                ${money(saved)}
                                з
                                ${money(target)}
                            </span>

                            <div class="progress">
                                <div
                                    class="progress-bar"
                                    style="
                                        width: ${percent}%;
                                    "
                                ></div>
                            </div>

                        </div>

                        <strong class="goal-percent">
                            ${percent}%
                        </strong>

                        <button
                            type="button"
                            class="goal-delete"
                            data-delete-goal="${
                                escapeHTML(goal.id)
                            }"
                            aria-label="Видалити ціль"
                        >
                            ×
                        </button>

                    </div>
                `;

            })
            .join("");


    container
        .querySelectorAll(
            "[data-delete-goal]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        button.dataset.deleteGoal;

                    const goals =
                        getGoals().filter(
                            goal =>
                                goal.id !== id
                        );

                    saveGoals(goals);

                    renderGoals();

                    showToast(
                        "Ціль видалено."
                    );

                }
            );

        });
}


/* ============================================================
   ДОДАВАННЯ ЦІЛІ
   ============================================================ */

function initGoals() {

    const button =
        document.getElementById(
            "addGoalButton"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            const overlay = createModal(`
                <div class="finbank-modal-head">

                    <div>
                        <span class="modal-overline">
                            FINBANK
                        </span>

                        <h2>
                            Нова ціль
                        </h2>
                    </div>

                    <button
                        type="button"
                        class="finbank-modal-close"
                        data-close-modal
                    >
                        ×
                    </button>

                </div>

                <div class="finbank-modal-body">

                    <form
                        id="goalForm"
                        class="support-form"
                    >

                        <label for="goalName">
                            Назва цілі
                        </label>

                        <input
                            id="goalName"
                            class="modal-input"
                            type="text"
                            placeholder="Наприклад, подорож"
                        >

                        <label for="goalTarget">
                            Необхідна сума
                        </label>

                        <input
                            id="goalTarget"
                            class="modal-input"
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="30000"
                        >

                        <label for="goalSaved">
                            Уже накопичено
                        </label>

                        <input
                            id="goalSaved"
                            class="modal-input"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                        >

                        <button
                            type="submit"
                            class="primary-button"
                        >
                            Додати ціль
                        </button>

                    </form>

                </div>
            `);


            const form =
                overlay.querySelector(
                    "#goalForm"
                );


            form?.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    const name =
                        overlay.querySelector(
                            "#goalName"
                        ).value.trim();

                    const target =
                        Number(
                            overlay.querySelector(
                                "#goalTarget"
                            ).value
                        );

                    const saved =
                        Number(
                            overlay.querySelector(
                                "#goalSaved"
                            ).value
                        ) || 0;


                    if (!name) {
                        showToast(
                            "Введіть назву цілі.",
                            "error"
                        );

                        return;
                    }

                    if (
                        !target ||
                        target <= 0
                    ) {
                        showToast(
                            "Введіть правильну суму.",
                            "error"
                        );

                        return;
                    }

                    const goals =
                        getGoals();

                    goals.push({
                        id: generateId("GOAL"),
                        name,
                        icon: "₴",
                        saved:
                            Math.min(
                                saved,
                                target
                            ),
                        target
                    });

                    saveGoals(goals);

                    closeModal();

                    renderGoals();

                    showToast(
                        "Ціль додано."
                    );

                }
            );

        }
    );
}


/* ============================================================
   ВИБІР КАРТКИ
   ============================================================ */

function renderCardSelector(
    container,
    selectedId,
    callback
) {
    if (!container) {
        return;
    }

    const cards = getCards();

    container.innerHTML =
        cards
            .map(card => {

                const selected =
                    card.id === selectedId;

                return `
                    <button
                        type="button"
                        class="
                            card-selector
                            ${
                                selected
                                    ? "selected"
                                    : ""
                            }
                        "
                        data-card-id="${escapeHTML(
                            card.id
                        )}"
                    >

                        <span class="card-selector-icon">
                            ${card.type === "Visa"
                                ? "V"
                                : "C"}
                        </span>

                        <span class="card-selector-info">

                            <strong>
                                ${escapeHTML(
                                    card.name
                                )}
                            </strong>

                            <small>
                                ${maskedCard(
                                    card.number
                                )}
                                ·
                                ${money(
                                    card.balance
                                )}
                            </small>

                        </span>

                        <span class="card-selector-check">
                            ${
                                selected
                                    ? "✓"
                                    : ""
                            }
                        </span>

                    </button>
                `;

            })
            .join("");


    container
        .querySelectorAll(
            "[data-card-id]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const cardId =
                        button.dataset.cardId;

                    callback(cardId);

                }
            );

        });
}


/* ============================================================
   ПЕРЕКАЗ
   ============================================================ */

function initTransfer() {

    const form =
        document.getElementById(
            "transferForm"
        );

    if (!form) {
        return;
    }


    let selectedCardId =
        sessionStorage.getItem(
            "transferCard"
        ) ||
        getActiveCardId();


    let recipientType =
        "card";


    const recipientInput =
        document.getElementById(
            "recipient"
        );

    const amountInput =
        document.getElementById(
            "amount"
        );

    const commentInput =
        document.getElementById(
            "comment"
        );

    const characterCount =
        document.getElementById(
            "characterCount"
        );


    /* --------------------------------------------------------
       ВИБІР ТИПУ ОТРИМУВАЧА
       -------------------------------------------------------- */

    document
        .querySelectorAll(
            ".recipient-tab"
        )
        .forEach(tab => {

            tab.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".recipient-tab"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );

                    tab.classList.add(
                        "active"
                    );

                    recipientType =
                        tab.dataset.type ||
                        "card";


                    const label =
                        document.querySelector(
                            'label[for="recipient"]'
                        );

                    const help =
                        document.getElementById(
                            "recipientHelp"
                        );


                    if (recipientType === "phone") {

                        if (label) {
                            label.textContent =
                                "Номер телефону";
                        }

                        if (recipientInput) {
                            recipientInput.placeholder =
                                "+380 00 000 00 00";
                        }

                        if (help) {
                            help.textContent =
                                "Введіть номер телефону отримувача.";
                        }

                    } else if (
                        recipientType === "iban"
                    ) {

                        if (label) {
                            label.textContent =
                                "IBAN";
                        }

                        if (recipientInput) {
                            recipientInput.placeholder =
                                "UA00 0000 0000 0000 0000 0000 000";
                        }

                        if (help) {
                            help.textContent =
                                "Введіть IBAN отримувача.";
                        }

                    } else {

                        if (label) {
                            label.textContent =
                                "Номер картки";
                        }

                        if (recipientInput) {
                            recipientInput.placeholder =
                                "0000 0000 0000 0000";
                        }

                        if (help) {
                            help.textContent =
                                "Введіть 16 цифр номера картки.";
                        }

                    }

                }
            );

        });


    /* --------------------------------------------------------
       ЗБЕРЕЖЕНІ ОТРИМУВАЧІ
       -------------------------------------------------------- */

    const recipientPreview =
        document.getElementById(
            "recipientPreview"
        );


    if (recipientPreview) {

        recipientPreview.innerHTML = `
            <div class="saved-recipient-card">

                <div class="saved-recipient-icon">
                    А
                </div>

                <div>
                    <strong>
                        Анна Коваль
                    </strong>

                    <span>
                        Картка •••• 4321
                    </span>
                </div>

                <button
                    type="button"
                    class="saved-recipient-select"
                    id="selectAnna"
                >
                    Вибрати
                </button>

            </div>
        `;


        const selectAnna =
            document.getElementById(
                "selectAnna"
            );


        selectAnna?.addEventListener(
            "click",
            () => {

                if (recipientInput) {
                    recipientInput.value =
                        "4321432143214321";
                }

                recipientPreview
                    .querySelector(
                        ".saved-recipient-card"
                    )
                    ?.classList.add(
                        "selected"
                    );

                showToast(
                    "Отримувача Анну Коваль вибрано."
                );

            }
        );

    }


    /* --------------------------------------------------------
       ВИБІР КАРТКИ
       -------------------------------------------------------- */

    const cardSelector =
        document.getElementById(
            "transferCardSelector"
        );


    if (cardSelector) {

        renderCardSelector(
            cardSelector,
            selectedCardId,
            cardId => {

                selectedCardId =
                    cardId;

                sessionStorage.setItem(
                    "transferCard",
                    cardId
                );

                renderCardSelector(
                    cardSelector,
                    selectedCardId,
                    newId => {
                        selectedCardId =
                            newId;

                        sessionStorage.setItem(
                            "transferCard",
                            newId
                        );

                        renderCardSelector(
                            cardSelector,
                            newId,
                            arguments
                        );
                    }
                );

            }
        );

    }


    /* --------------------------------------------------------
       ШВИДКІ СУМИ
       -------------------------------------------------------- */

    document
        .querySelectorAll(
            ".quick-amounts button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const amount =
                        button.dataset.amount;

                    if (amountInput) {
                        amountInput.value =
                            amount;
                    }

                    updateTransferSummary();

                }
            );

        });


    /* --------------------------------------------------------
       КОМЕНТАР
       -------------------------------------------------------- */

    commentInput?.addEventListener(
        "input",
        () => {

            if (characterCount) {

                characterCount.textContent =
                    `${commentInput.value.length}/200`;

            }

        }
    );


    /* --------------------------------------------------------
       СУМА
       -------------------------------------------------------- */

    amountInput?.addEventListener(
        "input",
        updateTransferSummary
    );


    function updateTransferSummary() {

        const amount =
            Number(
                amountInput?.value
            ) || 0;


        const summary =
            document.getElementById(
                "summaryAmount"
            );

        const total =
            document.getElementById(
                "totalAmount"
            );


        if (summary) {
            summary.textContent =
                money(amount);
        }

        if (total) {
            total.textContent =
                money(amount);
        }

    }


    /* --------------------------------------------------------
       SUBMIT
       -------------------------------------------------------- */

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const recipient =
                recipientInput
                    ?.value.trim() || "";


            const amount =
                Number(
                    amountInput?.value
                ) || 0;


            const comment =
                commentInput
                    ?.value.trim() || "";


            const card =
                getCardById(
                    selectedCardId
                );


            if (!card) {
                showToast(
                    "Виберіть картку для переказу.",
                    "error"
                );

                return;
            }


            if (card.frozen) {
                showToast(
                    "Ця картка заблокована.",
                    "error"
                );

                return;
            }


            if (!recipient) {
                showToast(
                    "Вкажіть отримувача.",
                    "error"
                );

                recipientInput?.focus();

                return;
            }


            if (
                !amount ||
                amount <= 0
            ) {
                showToast(
                    "Вкажіть суму переказу.",
                    "error"
                );

                amountInput?.focus();

                return;
            }


            if (
                amount >
                Number(card.balance)
            ) {
                showToast(
                    "Недостатньо коштів на картці.",
                    "error"
                );

                return;
            }


            sessionStorage.setItem(
                "transferRecipient",
                recipient
            );

            sessionStorage.setItem(
                "transferAmount",
                String(amount)
            );

            sessionStorage.setItem(
                "transferComment",
                comment
            );

            sessionStorage.setItem(
                "transferCard",
                card.id
            );

            sessionStorage.setItem(
                "transferRecipientType",
                recipientType
            );


            window.location.href =
                "confirm.html";

        }
    );
}


/* ============================================================
   ПІДТВЕРДЖЕННЯ ПЕРЕКАЗУ
   ============================================================ */

function initConfirm() {

    const button =
        document.getElementById(
            "confirmTransfer"
        );

    if (!button) {
        return;
    }


    const recipient =
        sessionStorage.getItem(
            "transferRecipient"
        ) || "";


    const amount =
        Number(
            sessionStorage.getItem(
                "transferAmount"
            )
        ) || 0;


    const comment =
        sessionStorage.getItem(
            "transferComment"
        ) || "";


    const cardId =
        sessionStorage.getItem(
            "transferCard"
        ) ||
        getActiveCardId();


    const card =
        getCardById(cardId);


    const recipientName =
        recipient === "4321432143214321"
            ? "Анна Коваль"
            : recipient;


    const recipientElement =
        document.getElementById(
            "confirmRecipient"
        );

    const amountElement =
        document.getElementById(
            "confirmAmount"
        );

    const detailAmount =
        document.getElementById(
            "detailAmount"
        );

    const detailTotal =
        document.getElementById(
            "detailTotal"
        );

    const commentSection =
        document.getElementById(
            "commentSection"
        );

    const commentElement =
        document.getElementById(
            "confirmComment"
        );


    if (recipientElement) {
        recipientElement.textContent =
            recipientName;
    }

    if (amountElement) {
        amountElement.textContent =
            money(amount);
    }

    if (detailAmount) {
        detailAmount.textContent =
            money(amount);
    }

    if (detailTotal) {
        detailTotal.textContent =
            money(amount);
    }


    if (
        commentSection &&
        commentElement
    ) {

        if (comment) {
            commentSection.style.display =
                "";

            commentElement.textContent =
                comment;
        } else {
            commentSection.style.display =
                "none";
        }

    }


    document
        .querySelectorAll(
            "[data-transfer-source-card]"
        )
        .forEach(element => {

            element.textContent =
                card
                    ? `${card.name} ${maskedCard(
                        card.number
                    )}`
                    : "—";

        });


    button.addEventListener(
        "click",
        () => {

            const processed =
                sessionStorage.getItem(
                    "transferProcessed"
                );


            if (processed === "true") {

                window.location.href =
                    "success.html";

                return;
            }


            const selectedCard =
                getCardById(cardId);


            if (!selectedCard) {

                showToast(
                    "Картку не знайдено.",
                    "error"
                );

                return;
            }


            if (selectedCard.frozen) {

                showToast(
                    "Ця картка заблокована.",
                    "error"
                );

                return;
            }


            if (
                amount <= 0 ||
                amount >
                Number(
                    selectedCard.balance
                )
            ) {

                showToast(
                    "Недостатньо коштів.",
                    "error"
                );

                return;
            }


            const result =
                changeCardBalance(
                    cardId,
                    -amount
                );


            if (!result.success) {

                showToast(
                    result.message,
                    "error"
                );

                return;
            }


            const transaction =
                addTransaction({
                    cardId,
                    title:
                        `Переказ ${recipientName}`,
                    category:
                        "Переказ",
                    type:
                        "expense",
                    amount:
                        -amount,
                    recipient:
                        recipientName,
                    date:
                        currentDate()
                });


            sessionStorage.setItem(
                "transferProcessed",
                "true"
            );

            sessionStorage.setItem(
                "completedAmount",
                String(amount)
            );

            sessionStorage.setItem(
                "completedRecipient",
                recipientName
            );

            sessionStorage.setItem(
                "completedTransactionId",
                transaction.id
            );

            sessionStorage.setItem(
                "completedDate",
                transaction.date
            );

            sessionStorage.setItem(
                "completedCardId",
                cardId
            );


            window.location.href =
                "success.html";

        }
    );
}


/* ============================================================
   SUCCESS
   ============================================================ */

function initSuccess() {

    const amount =
        Number(
            sessionStorage.getItem(
                "completedAmount"
            )
        ) || 0;


    const recipient =
        sessionStorage.getItem(
            "completedRecipient"
        ) || "Отримувач";


    const transactionId =
        sessionStorage.getItem(
            "completedTransactionId"
        ) || "—";


    const date =
        sessionStorage.getItem(
            "completedDate"
        ) || currentDate();


    const cardId =
        sessionStorage.getItem(
            "completedCardId"
        );


    const card =
        getCardById(cardId);


    const amountElement =
        document.getElementById(
            "successAmount"
        );

    const recipientElement =
        document.getElementById(
            "successRecipient"
        );

    const dateElement =
        document.getElementById(
            "successDate"
        );

    const transactionElement =
        document.getElementById(
            "transactionId"
        );


    if (amountElement) {
        amountElement.textContent =
            money(amount);
    }

    if (recipientElement) {
        recipientElement.textContent =
            recipient;
    }

    if (dateElement) {
        dateElement.textContent =
            date;
    }

    if (transactionElement) {
        transactionElement.textContent =
            transactionId;
    }


    document
        .querySelectorAll(
            "[data-success-source-card]"
        )
        .forEach(element => {

            element.textContent =
                card
                    ? `${card.name} ${maskedCard(
                        card.number
                    )}`
                    : "—";

        });


    const copyButton =
        document.getElementById(
            "copyTransactionId"
        );


    copyButton?.addEventListener(
        "click",
        async () => {

            try {

                await navigator.clipboard.writeText(
                    transactionId
                );

                showToast(
                    "Номер операції скопійовано."
                );

            } catch {

                showToast(
                    "Не вдалося скопіювати.",
                    "error"
                );

            }

        }
    );


    const saveReceipt =
        document.getElementById(
            "saveReceipt"
        );


    saveReceipt?.addEventListener(
        "click",
        () => {

            const receipt = `
FINBANK
Підтвердження переказу

Отримувач: ${recipient}
Сума: ${money(amount)}
Картка: ${
                card
                    ? maskedCard(card.number)
                    : "—"
            }
Дата: ${date}
Номер операції: ${transactionId}
            `.trim();


            const blob =
                new Blob(
                    [receipt],
                    {
                        type:
                            "text/plain;charset=utf-8"
                    }
                );


            const url =
                URL.createObjectURL(blob);


            const link =
                document.createElement("a");

            link.href = url;

            link.download =
                `FinBank-${transactionId}.txt`;

            document.body.appendChild(link);

            link.click();

            link.remove();

            URL.revokeObjectURL(url);

        }
    );

}


/* ============================================================
   КАРТКИ
   ============================================================ */

function initCards() {

    const addButton =
        document.getElementById(
            "addCardButton"
        );


    renderCardsPage();


    addButton?.addEventListener(
        "click",
        openAddCardModal
    );


    document.addEventListener(
        "click",
        event => {

            const select =
                event.target.closest(
                    "[data-select-card]"
                );


            if (select) {

                const cardId =
                    select.dataset.selectCard;

                setActiveCard(cardId);

                renderCardsPage();

                showToast(
                    "Картку вибрано."
                );

            }


            const freeze =
                event.target.closest(
                    "[data-freeze-card]"
                );


            if (freeze) {

                const cardId =
                    freeze.dataset.freezeCard;

                toggleCardFrozen(cardId);

                renderCardsPage();

            }


            const deleteButton =
                event.target.closest(
                    "[data-delete-card]"
                );


            if (deleteButton) {

                const cardId =
                    deleteButton.dataset.deleteCard;

                if (
                    deleteCard(cardId)
                ) {

                    renderCardsPage();

                    showToast(
                        "Картку видалено."
                    );

                }

            }

        }
    );
}


/* ============================================================
   ВІКНО ДОДАВАННЯ КАРТКИ
   ============================================================ */

function openAddCardModal() {

    const overlay = createModal(`
        <div class="finbank-modal-head">

            <div>
                <span class="modal-overline">
                    FINBANK
                </span>

                <h2>
                    Додати картку
                </h2>
            </div>

            <button
                type="button"
                class="finbank-modal-close"
                data-close-modal
            >
                ×
            </button>

        </div>

        <div class="finbank-modal-body">

            <form
                class="support-form"
                id="newCardForm"
            >

                <label for="newCardName">
                    Назва картки
                </label>

                <input
                    id="newCardName"
                    class="modal-input"
                    type="text"
                    placeholder="Наприклад, Додаткова картка"
                >


                <label for="newCardNumber">
                    Номер картки
                </label>

                <input
                    id="newCardNumber"
                    class="modal-input"
                    type="text"
                    inputmode="numeric"
                    maxlength="19"
                    placeholder="0000 0000 0000 0000"
                >


                <label for="newCardType">
                    Тип картки
                </label>

                <select
                    id="newCardType"
                    class="modal-input"
                >
                    <option value="Visa">
                        Visa
                    </option>

                    <option value="Mastercard">
                        Mastercard
                    </option>
                </select>


                <label for="newCardBalance">
                    Початковий баланс
                </label>

                <input
                    id="newCardBalance"
                    class="modal-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value="0"
                >


                <button
                    type="submit"
                    class="primary-button"
                >
                    Додати картку
                </button>

            </form>

        </div>
    `);


    const numberInput =
        overlay.querySelector(
            "#newCardNumber"
        );


    numberInput?.addEventListener(
        "input",
        () => {

            const digits =
                numberInput.value
                    .replace(/\D/g, "")
                    .slice(0, 16);

            numberInput.value =
                digits
                    .replace(
                        /(.{4})/g,
                        "$1 "
                    )
                    .trim();

        }
    );


    const form =
        overlay.querySelector(
            "#newCardForm"
        );


    form?.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const name =
                overlay.querySelector(
                    "#newCardName"
                ).value.trim();


            const number =
                overlay.querySelector(
                    "#newCardNumber"
                ).value
                    .replace(/\D/g, "");


            const type =
                overlay.querySelector(
                    "#newCardType"
                ).value;


            const balance =
                Number(
                    overlay.querySelector(
                        "#newCardBalance"
                    ).value
                ) || 0;


            if (!name) {

                showToast(
                    "Введіть назву картки.",
                    "error"
                );

                return;
            }


            if (
                number.length !== 16
            ) {

                showToast(
                    "Номер картки має містити 16 цифр.",
                    "error"
                );

                return;
            }


            if (balance < 0) {

                showToast(
                    "Баланс не може бути від'ємним.",
                    "error"
                );

                return;
            }


            const cards =
                getCards();


            if (
                cards.some(
                    card =>
                        card.number === number
                )
            ) {

                showToast(
                    "Така картка вже додана.",
                    "error"
                );

                return;
            }


            const newCard = {

                id:
                    generateId("CARD"),

                name,

                number,

                type,

                holder:
                    "ANASTASIA N",

                expiry:
                    "12/29",

                balance:
                    Number(
                        balance.toFixed(2)
                    ),

                frozen:
                    false

            };


            saveCard(newCard);

            setActiveCard(
                newCard.id
            );

            closeModal();

            renderCardsPage();

            showToast(
                "Нову картку додано."
            );

        }
    );
}


/* ============================================================
   РЕНДЕР СТОРІНКИ КАРТОК
   ============================================================ */

function renderCardsPage() {

    const container =
        document.querySelector(
            "[data-cards-container]"
        );


    if (!container) {
        return;
    }


    const cards =
        getCards();


    const activeId =
        getActiveCardId();


    container.innerHTML =
        cards
            .map(card => {

                const active =
                    card.id === activeId;


                return `
                    <article
                        class="
                            bank-card-item
                            ${
                                active
                                    ? "active"
                                    : ""
                            }
                        "
                    >

                        <div class="bank-card-visual">

                            <div class="bank-card-top">

                                <strong>
                                    FinBank
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        card.type
                                    )}
                                </span>

                            </div>


                            <div class="bank-card-number">
                                ${maskedCard(
                                    card.number
                                )}
                            </div>


                            <div class="bank-card-bottom">

                                <div>
                                    <small>
                                        ВЛАСНИК
                                    </small>

                                    <strong>
                                        ${escapeHTML(
                                            card.holder
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <small>
                                        ДІЙСНА ДО
                                    </small>

                                    <strong>
                                        ${escapeHTML(
                                            card.expiry
                                        )}
                                    </strong>
                                </div>

                            </div>

                        </div>


                        <div class="bank-card-details">

                            <div class="bank-card-heading">

                                <div>
                                    <small>
                                        ${
                                            active
                                                ? "АКТИВНА КАРТКА"
                                                : "КАРТКА"
                                        }
                                    </small>

                                    <h2>
                                        ${escapeHTML(
                                            card.name
                                        )}
                                    </h2>

                                    <span>
                                        ${card.type}
                                        ${maskedCard(
                                            card.number
                                        )}
                                    </span>
                                </div>

                                ${
                                    active
                                        ? `
                                            <span class="
                                                active-badge
                                            ">
                                                Активна
                                            </span>
                                        `
                                        : ""
                                }

                            </div>


                            <div class="bank-card-balance">

                                <span>
                                    Баланс картки
                                </span>

                                <strong>
                                    ${money(
                                        card.balance
                                    )}
                                </strong>

                            </div>


                            <div class="bank-card-actions">

                                ${
                                    active
                                        ? ""
                                        : `
                                            <button
                                                type="button"
                                                class="secondary-button"
                                                data-select-card="${
                                                    escapeHTML(
                                                        card.id
                                                    )
                                                }"
                                            >
                                                Зробити основною
                                            </button>
                                        `
                                }


                                <a
                                    href="
                                        card.html?id=${
                                            encodeURIComponent(
                                                card.id
                                            )
                                        }
                                    "
                                    class="secondary-button"
                                >
                                    Відкрити картку
                                </a>


                                <button
                                    type="button"
                                    class="secondary-button"
                                    data-freeze-card="${
                                        escapeHTML(
                                            card.id
                                        )
                                    }"
                                >
                                    ${
                                        card.frozen
                                            ? "Розблокувати"
                                            : "Заблокувати"
                                    }
                                </button>


                                ${
                                    cards.length > 1
                                        ? `
                                            <button
                                                type="button"
                                                class="danger-button"
                                                data-delete-card="${
                                                    escapeHTML(
                                                        card.id
                                                    )
                                                }"
                                            >
                                                Видалити
                                            </button>
                                        `
                                        : ""
                                }

                            </div>

                        </div>

                    </article>
                `;

            })
            .join("");
}


/* ============================================================
   ПЛАТЕЖІ
   ============================================================ */

function initPayments() {

    const paymentForm =
        document.getElementById(
            "paymentForm"
        );


    const providerGrid =
        document.getElementById(
            "providersGrid"
        );


    if (!paymentForm) {
        return;
    }


    let selectedProvider =
        null;


    let selectedCardId =
        getActiveCardId();


    /* --------------------------------------------------------
       ПОШУК ПОСЛУГ
       -------------------------------------------------------- */

    const search =
        document.getElementById(
            "paymentSearch"
        );


    search?.addEventListener(
        "input",
        () => {

            const value =
                search.value
                    .trim()
                    .toLowerCase();


            document
                .querySelectorAll(
                    ".provider-card"
                )
                .forEach(card => {

                    const text =
                        card.textContent
                            .toLowerCase();

                    card.style.display =
                        !value ||
                        text.includes(value)
                            ? ""
                            : "none";

                });

        }
    );


    /* --------------------------------------------------------
       ПРОВАЙДЕРИ
       -------------------------------------------------------- */

    providerGrid
        ?.querySelectorAll(
            "[data-provider]"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    selectedProvider = {
                        name:
                            card.dataset.provider,
                        category:
                            card.dataset.category ||
                            "Платіж"
                    };


                    providerGrid
                        .querySelectorAll(
                            ".provider-card"
                        )
                        .forEach(item =>
                            item.classList.remove(
                                "selected"
                            )
                        );


                    card.classList.add(
                        "selected"
                    );


                    const selected =
                        document.getElementById(
                            "selectedProvider"
                        );


                    if (selected) {
                        selected.textContent =
                            selectedProvider.name;
                    }

                }
            );

        });


    /* --------------------------------------------------------
       ВИБІР КАРТКИ
       -------------------------------------------------------- */

    const selector =
        document.getElementById(
            "paymentCardSelector"
        );


    if (selector) {

        renderCardSelector(
            selector,
            selectedCardId,
            cardId => {

                selectedCardId =
                    cardId;

                renderCardSelector(
                    selector,
                    selectedCardId,
                    id => {
                        selectedCardId = id;
                    }
                );

            }
        );

    }


    /* --------------------------------------------------------
       ОПЛАТА
       -------------------------------------------------------- */

    paymentForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const providerName =
                selectedProvider?.name ||
                document.getElementById(
                    "selectedProvider"
                )?.textContent?.trim();


            const paymentNumber =
                document.getElementById(
                    "paymentNumber"
                )?.value.trim() || "";


            const amount =
                Number(
                    document.getElementById(
                        "paymentAmount"
                    )?.value
                ) || 0;


            const card =
                getCardById(
                    selectedCardId
                );


            if (
                !providerName ||
                providerName ===
                    "Оберіть послугу"
            ) {

                showToast(
                    "Виберіть послугу.",
                    "error"
                );

                return;
            }


            if (!paymentNumber) {

                showToast(
                    "Введіть номер рахунку або телефону.",
                    "error"
                );

                return;
            }


            if (
                !amount ||
                amount <= 0
            ) {

                showToast(
                    "Введіть суму платежу.",
                    "error"
                );

                return;
            }


            if (!card) {

                showToast(
                    "Виберіть картку.",
                    "error"
                );

                return;
            }


            if (card.frozen) {

                showToast(
                    "Ця картка заблокована.",
                    "error"
                );

                return;
            }


            if (
                amount >
                Number(card.balance)
            ) {

                showToast(
                    "Недостатньо коштів на картці.",
                    "error"
                );

                return;
            }


            const result =
                changeCardBalance(
                    selectedCardId,
                    -amount
                );


            if (!result.success) {

                showToast(
                    result.message,
                    "error"
                );

                return;
            }


            addTransaction({

                cardId:
                    selectedCardId,

                title:
                    providerName,

                category:
                    selectedProvider?.category ||
                    "Платіж",

                type:
                    "payment",

                amount:
                    -amount,

                recipient:
                    paymentNumber,

                date:
                    currentDate()

            });


            showToast(
                `Оплату ${providerName} виконано.`
            );


            paymentForm.reset();


            const selected =
                document.getElementById(
                    "selectedProvider"
                );


            if (selected) {
                selected.textContent =
                    "Оберіть послугу";
            }


            selectedProvider = null;


            providerGrid
                ?.querySelectorAll(
                    ".provider-card"
                )
                .forEach(item =>
                    item.classList.remove(
                        "selected"
                    )
                );


            refreshPageData();

        }
    );
}


/* ============================================================
   ІСТОРІЯ
   ============================================================ */

function initHistory() {

    const list =
        document.getElementById(
            "operationsList"
        );


    if (!list) {
        return;
    }


    let currentFilter = "all";


    function render() {

        const searchInput =
            document.getElementById(
                "historySearch"
            );


        const search =
            searchInput?.value
                .trim()
                .toLowerCase() || "";


        const activeCard =
            getActiveCard();


        let transactions =
            getTransactions();


        if (activeCard) {

            transactions =
                transactions.filter(
                    transaction =>
                        transaction.cardId ===
                        activeCard.id
                );

        }


        if (currentFilter === "income") {

            transactions =
                transactions.filter(
                    transaction =>
                        Number(
                            transaction.amount
                        ) > 0
                );

        }


        if (
            currentFilter ===
            "expense"
        ) {

            transactions =
                transactions.filter(
                    transaction =>
                        Number(
                            transaction.amount
                        ) < 0
                );

        }


        if (search) {

            transactions =
                transactions.filter(
                    transaction => {

                        const text =
                            `
                            ${transaction.title}
                            ${transaction.category}
                            ${transaction.recipient}
                            ${transaction.date}
                            `
                                .toLowerCase();

                        return text.includes(
                            search
                        );

                    }
                );

        }


        if (!transactions.length) {

            list.innerHTML = "";

            const noResults =
                document.getElementById(
                    "historyNoResults"
                );

            if (noResults) {
                noResults.style.display =
                    "block";
            }

            return;
        }


        const noResults =
            document.getElementById(
                "historyNoResults"
            );

        if (noResults) {
            noResults.style.display =
                "none";
        }


        list.innerHTML =
            transactions
                .map(transaction => {

                    const positive =
                        Number(
                            transaction.amount
                        ) >= 0;


                    return `
                        <div class="
                            operation-item
                            ${
                                positive
                                    ? "income"
                                    : "expense"
                            }
                        ">

                            <div class="
                                operation-icon
                                ${
                                    positive
                                        ? "income"
                                        : "expense"
                                }
                            ">
                                ${
                                    positive
                                        ? "↑"
                                        : "↓"
                                }
                            </div>


                            <div class="
                                operation-main
                            ">

                                <strong>
                                    ${escapeHTML(
                                        transaction.title
                                    )}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        transaction.category
                                    )}
                                </span>

                                <small>
                                    ${escapeHTML(
                                        transaction.date
                                    )}
                                </small>

                            </div>


                            <div class="
                                operation-right
                                ${
                                    positive
                                        ? "positive"
                                        : "negative"
                                }
                            ">

                                <strong>
                                    ${money(
                                        transaction.amount,
                                        true
                                    )}
                                </strong>

                                <small>
                                    ${
                                        positive
                                            ? "Зараховано"
                                            : "Виконано"
                                    }
                                </small>

                            </div>

                        </div>
                    `;

                })
                .join("");


        const count =
            document.getElementById(
                "operationCount"
            );


        if (count) {
            count.textContent =
                `${transactions.length} ${
                    transactions.length === 1
                        ? "операція"
                        : "операцій"
                }`;
        }

    }


    document
        .querySelectorAll(
            "[data-history-filter]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    currentFilter =
                        button.dataset
                            .historyFilter ||
                        "all";


                    document
                        .querySelectorAll(
                            "[data-history-filter]"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    render();

                }
            );

        });


    document
        .getElementById(
            "historySearch"
        )
        ?.addEventListener(
            "input",
            render
        );


    document
        .getElementById(
            "exportHistory"
        )
        ?.addEventListener(
            "click",
            exportHistory
        );


    render();
}


/* ============================================================
   ЕКСПОРТ ІСТОРІЇ
   ============================================================ */

function exportHistory() {

    const transactions =
        getTransactions();


    if (!transactions.length) {

        showToast(
            "Немає операцій для експорту.",
            "error"
        );

        return;
    }


    const rows = [
        [
            "Дата",
            "Операція",
            "Категорія",
            "Сума",
            "Отримувач",
            "Картка"
        ]
    ];


    transactions.forEach(transaction => {

        const card =
            getCardById(
                transaction.cardId
            );


        rows.push([
            transaction.date,
            transaction.title,
            transaction.category,
            transaction.amount,
            transaction.recipient || "",
            card
                ? maskedCard(card.number)
                : ""
        ]);

    });


    const csv =
        rows
            .map(row =>
                row
                    .map(value =>
                        `"${String(value)
                            .replaceAll('"', '""')}"`
                    )
                    .join(";")
            )
            .join("\n");


    const blob =
        new Blob(
            ["\uFEFF" + csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "FinBank-history.csv";


    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);


    showToast(
        "Історію експортовано."
    );
}


/* ============================================================
   ОНОВЛЕННЯ ВСІХ ЕЛЕМЕНТІВ
   ============================================================ */

function refreshPageData() {

    renderTopProfile();

    updateBalance();

    renderRecentTransactions();

    renderFinancialOverview();

    renderGoals();

    renderCardsPage();

}


/* ============================================================
   ESC ДЛЯ МОДАЛЬНОГО ВІКНА
   ============================================================ */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {
            closeModal();
        }

    }
);


/* ============================================================
   START
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        getCards();
        getTransactions();
        getGoals();
        getProfile();
        getSettings();
        getActiveCardId();


        initNavigation();

        removeOldTopButtons();

        renderTopProfile();

        updateBalance();

        initBalanceToggle();

        renderRecentTransactions();

        renderGoals();

        initGoals();

        initTransfer();

        initConfirm();

        initSuccess();

        initCards();

        initPayments();

        initHistory();

    }
);