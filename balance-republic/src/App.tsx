import { FormEvent, useMemo, useState } from "react"

type Expense = {
  id: number
  merchant: string
  category: string
  amount: number
  date: string
  type: "expense" | "income"
}

type Holding = {
  id: number
  name: string
  ticker: string
  value: number
  change: string
  logo: string
  tone: string
}

const initialExpenses: Expense[] = [
  {
    id: 0,
    merchant: "Salario",
    category: "Salario",
    amount: 2850,
    date: "1 mar",
    type: "income",
  },
  {
    id: 1,
    merchant: "Mercadona",
    category: "Comida",
    amount: 64.2,
    date: "Hoy",
    type: "expense",
  },
  {
    id: 2,
    merchant: "Café Federal",
    category: "Comida",
    amount: 4.8,
    date: "Hoy",
    type: "expense",
  },
  {
    id: 3,
    merchant: "Iberdrola",
    category: "Hogar",
    amount: 52.34,
    date: "Ayer",
    type: "expense",
  },
]

const holdings: Holding[] = [
  {
    id: 1,
    name: "MSCI World",
    ticker: "Amundi · ETF",
    value: 3240.8,
    change: "+12,8 %",
    logo: "W",
    tone: "world",
  },
  {
    id: 2,
    name: "Apple",
    ticker: "AAPL · Acción",
    value: 1864.25,
    change: "+8,4 %",
    logo: "A",
    tone: "apple",
  },
  {
    id: 3,
    name: "Bitcoin",
    ticker: "BTC · Cripto",
    value: 975.12,
    change: "+21,6 %",
    logo: "₿",
    tone: "bitcoin",
  },
]

function Icon({
  name,
  size = 17,
}: {
  name: "search" | "arrow" | "chevron" | "close" | "receipt"
  size?: number
}) {
  const paths = {
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.6" />
        <path d="m16 16 4 4" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14M14 7l5 5-5 5" />
      </>
    ),
    chevron: <path d="m9 7 5 5-5 5" />,
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function money(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value)
}

export default function App() {
  const [activePage, setActivePage] =
    useState<"expenses" | "movements" | "investments">("expenses")
  const [period, setPeriod] = useState("1M")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [recordType, setRecordType] = useState<"expense" | "income">("expense")
  const [limitsOpen, setLimitsOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileEditOpen, setProfileEditOpen] = useState(false)
  const [profileName, setProfileName] = useState("Lucía Martín")
  const [profileEmail, setProfileEmail] = useState("lucia@correo.es")
  const [notifications, setNotifications] = useState(true)
  const [biometrics, setBiometrics] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [hideAmounts, setHideAmounts] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [expenses, setExpenses] = useState(initialExpenses)
  const [categoryLimits, setCategoryLimits] = useState({
    Comida: 450,
    Ocio: 200,
    Hogar: 500,
    Transporte: 180,
    Otros: 150,
  })

  const total = useMemo(
    () =>
      expenses
        .filter((expense) => expense.type === "expense")
        .reduce((sum, expense) => sum + expense.amount, 0) + 1480.06,
    [expenses],
  )
  const totalIncome = useMemo(
    () =>
      expenses
        .filter((expense) => expense.type === "income")
        .reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  )

  const categoryMetrics = useMemo(() => {
    const historical: Record<string, number> = {
      Alimentación: 278.6,
      Restaurantes: 179.4,
      Hogar: 448.06,
      Transporte: 310,
      Otros: 264,
    }
    expenses
      .filter((expense) => expense.type === "expense")
      .forEach((expense) => {
        historical[expense.category] =
          (historical[expense.category] || 0) + expense.amount
      })
    return Object.entries(historical)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [expenses])

  const visibleExpenses = expenses.filter((expense) =>
    `${expense.merchant} ${expense.category}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const merchant = String(data.get("merchant") || "")
    const amount = Number(data.get("amount"))
    const category = String(data.get("category") || "Otros")
    if (!merchant || !amount) return

    setExpenses((current) => [
      {
        id: Date.now(),
        merchant,
        amount,
        category,
        date: "Ahora",
        type: recordType,
      },
      ...current,
    ])
    setSheetOpen(false)
  }

  function updateLimits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setCategoryLimits(
      (current) =>
        Object.fromEntries(
          Object.keys(current).map((category) => [
            category,
            Number(data.get(category)) || 0,
          ]),
        ) as typeof current,
    )
    setLimitsOpen(false)
  }

  function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") || "")
    const email = String(data.get("email") || "")
    if (!name || !email) return
    setProfileName(name)
    setProfileEmail(email)
    setProfileEditOpen(false)
  }

  function exportData() {
    const contents = JSON.stringify(
      {
        profile: { name: profileName, email: profileEmail },
        expenses,
        categoryLimits,
        investments: holdings,
      },
      null,
      2,
    )
    const url = URL.createObjectURL(
      new Blob([contents], { type: "application/json" }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = "mis-datos-financieros.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const initials = profileName
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  const displayMoney = (value: number) =>
    hideAmounts ? "•••• €" : money(value)

  return (
    <div className={`stage ${darkMode ? "dark" : ""}`}>
      <div className="phone">
        <main className="screen-content">
          <header className="app-header">
            <div className="tabs">
              <button
                className={activePage === "expenses" ? "active" : ""}
                onClick={() => {
                  setActivePage("expenses")
                  setQuery("")
                }}
              >
                Gastos
              </button>
              <button
                className={activePage === "movements" ? "active" : ""}
                onClick={() => {
                  setActivePage("movements")
                  setQuery("")
                }}
              >
                Movimientos
              </button>
              <button
                className={activePage === "investments" ? "active" : ""}
                onClick={() => {
                  setActivePage("investments")
                  setQuery("")
                }}
              >
                Inversiones
              </button>
            </div>
            <button
              className="avatar-button"
              aria-label="Abrir perfil"
              onClick={() => setProfileOpen(true)}
            >
              {initials}
            </button>
          </header>

          {searchOpen && (
            <div className="search-bar">
              <Icon name="search" size={15} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar movimientos"
              />
              <button
                onClick={() => setSearchOpen(false)}
                aria-label="Cerrar búsqueda"
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          )}

          <section className={`overview ${activePage}`}>
            <div className="overview-label">
              <span>
                {activePage === "expenses"
                  ? "Gastos de marzo"
                  : activePage === "movements"
                    ? "Balance de marzo"
                    : "Valor de la cartera"}
              </span>
              <button aria-label="Cambiar mes">⌄</button>
            </div>
            <div className="amount-line">
              <h1>
                {activePage === "expenses"
                  ? displayMoney(total)
                  : activePage === "movements"
                    ? displayMoney(totalIncome - total)
                    : hideAmounts
                      ? "•••• €"
                      : "10.840,12 €"}
              </h1>
              <span className="change">
                {activePage === "expenses"
                  ? "− 8,2 %"
                  : activePage === "movements"
                    ? "+ 43,8 %"
                    : "+ 24,83 %"}
              </span>
            </div>
            <p>
              {activePage === "expenses"
                ? "frente al mes pasado"
                : activePage === "movements"
                  ? "de tus ingresos disponibles"
                  : hideAmounts
                    ? "Rentabilidad desde el inicio"
                    : "+2.159,48 € desde el inicio"}
            </p>
          </section>

          <div
            className="periods"
            role="tablist"
            aria-label="Periodo de la gráfica"
          >
            {["1D", "1S", "1M", "1A", "Máx"].map((item) => (
              <button
                className={period === item ? "active" : ""}
                onClick={() => setPeriod(item)}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>

          <section
            className={`graph ${
              activePage === "movements" ? "category-graph" : ""
            }`}
            aria-label={`${
              activePage === "expenses"
                ? "Gastos"
                : activePage === "movements"
                  ? "Gastos por categoría"
                  : "Inversiones"
            } durante ${period}`}
          >
            {activePage === "movements" ? (
              <div className="category-metrics">
                <div className="category-metrics-title">
                  <strong>Gastos por categoría</strong>
                  <span>{displayMoney(total)}</span>
                </div>
                {categoryMetrics.slice(0, 4).map((category) => {
                  const limit =
                    categoryLimits[
                      (category.name as keyof typeof categoryLimits)
                    ] || 0
                  const exceeded = limit > 0 && category.amount > limit
                  return (
                    <div
                      className={`category-metric ${
                        exceeded ? "exceeded" : ""
                      }`}
                      key={category.name}
                    >
                      <div>
                        <span>{category.name}</span>
                        <strong>{displayMoney(category.amount)}</strong>
                      </div>
                      {exceeded && (
                        <p className="category-alert">
                          Tope superado por{" "}
                          {displayMoney(category.amount - limit)}
                        </p>
                      )}
                      <i>
                        <b
                          style={{
                            width: `${Math.min(100, limit ? (category.amount / limit) * 100 : 0)}%`,
                          }}
                        />
                      </i>
                    </div>
                  )
                })}
              </div>
            ) : (
              <svg viewBox="0 0 390 190" preserveAspectRatio="none">
                <path className="baseline" d="M0 145H390" />
                <path
                  className="spend-line"
                  d={
                    activePage === "expenses"
                      ? "M0 149 L11 176 L23 108 L35 85 L47 79 L59 115 L71 109 L83 58 L95 111 L107 119 L119 107 L131 130 L143 122 L155 136 L167 135 L179 155 L191 138 L203 147 L215 143 L227 124 L239 117 L251 132 L263 95 L275 109 L287 67 L299 84 L311 53 L323 76 L335 62 L347 20 L359 52 L371 35 L390 8"
                      : "M0 162 L12 128 L24 115 L36 109 L48 119 L60 86 L72 78 L84 96 L96 91 L108 80 L120 104 L132 88 L144 93 L156 79 L168 108 L180 120 L192 111 L204 125 L216 118 L228 96 L240 82 L252 104 L264 88 L276 64 L288 73 L300 47 L312 66 L324 40 L336 57 L348 29 L360 43 L374 20 L390 31"
                  }
                />
              </svg>
            )}
          </section>

          <section className="summary-grid">
            {activePage === "expenses" ? (
              <>
                <button>
                  <span>Gastos</span>
                  <strong>{displayMoney(total)}</strong>
                </button>
                <button>
                  <span>Disponible</span>
                  <strong>{displayMoney(totalIncome - total)}</strong>
                </button>
                <button onClick={() => setLimitsOpen(true)}>
                  <span>Categorías</span>
                  <strong>{Object.keys(categoryLimits).length}</strong>
                </button>
              </>
            ) : activePage === "movements" ? (
              <>
                <button>
                  <span>Ingresos</span>
                  <strong className="positive">
                    {displayMoney(totalIncome)}
                  </strong>
                </button>
                <button>
                  <span>Gastos</span>
                  <strong>{displayMoney(total)}</strong>
                </button>
                <button>
                  <span>Ahorro</span>
                  <strong>{displayMoney(totalIncome - total)}</strong>
                </button>
              </>
            ) : (
              <>
                <button>
                  <span>Planes de inversión</span>
                  <strong>{hideAmounts ? "•••• €" : "100 €"}</strong>
                </button>
                <button>
                  <span>Rentabilidad</span>
                  <strong className="positive">
                    {hideAmounts ? "•••• €" : "+2.159 €"}
                  </strong>
                </button>
                <button>
                  <span>Posiciones</span>
                  <strong>3</strong>
                </button>
              </>
            )}
          </section>

          {activePage !== "investments" ? (
            <section className="movements">
              <div className="section-title">
                <h2>
                  {activePage === "movements"
                    ? "Todos los movimientos"
                    : "Últimos gastos"}
                </h2>
                <button>Ordenar por⌄</button>
              </div>
              <div className="movement-list">
                {visibleExpenses
                  .filter(
                    (expense) =>
                      activePage === "movements" || expense.type === "expense",
                  )
                  .map((expense) => (
                    <button
                      className="movement"
                      key={expense.id}
                      onClick={() => setSelectedExpense(expense)}
                    >
                      <span className="movement-icon">
                        <Icon name="receipt" size={16} />
                      </span>
                      <span className="movement-info">
                        <strong>{expense.merchant}</strong>
                        <small>
                          {expense.category} · {expense.date}
                        </small>
                      </span>
                      <strong
                        className={`movement-amount ${
                          expense.type === "income" ? "income" : ""
                        }`}
                      >
                        {expense.type === "income" ? "+" : "−"}
                        {displayMoney(expense.amount)}
                      </strong>
                      <Icon name="chevron" size={14} />
                    </button>
                  ))}
              </div>
            </section>
          ) : (
            <section className="movements portfolio">
              <div className="section-title">
                <h2>Inversiones</h2>
                <button>Ordenar por⌄</button>
              </div>
              <div className="movement-list">
                {holdings
                  .filter((holding) =>
                    holding.name.toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((holding) => (
                    <button
                      className="movement"
                      key={holding.id}
                      onClick={() => setSelectedHolding(holding)}
                    >
                      <span className={`asset-logo ${holding.tone}`}>
                        {holding.logo}
                      </span>
                      <span className="movement-info">
                        <strong>{holding.name}</strong>
                        <small>{holding.ticker}</small>
                      </span>
                      <span className="holding-value">
                        <strong>{displayMoney(holding.value)}</strong>
                        <small>{holding.change}</small>
                      </span>
                      <Icon name="chevron" size={14} />
                    </button>
                  ))}
              </div>
            </section>
          )}
        </main>

        <div className="bottom-actions">
          {activePage === "movements" ? (
            <>
              <button
                onClick={() => {
                  setRecordType("expense")
                  setSheetOpen(true)
                }}
              >
                Gasto
                <span className="action-symbol">−</span>
              </button>
              <button
                onClick={() => {
                  setRecordType("income")
                  setSheetOpen(true)
                }}
              >
                Ingreso
                <span className="action-symbol">+</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setSearchOpen(true)}>
                {activePage === "expenses" ? "Analizar" : "Buscar"}
                <Icon name="search" size={16} />
              </button>
              <button
                onClick={() =>
                  activePage === "expenses"
                    ? setSheetOpen(true)
                    : setSelectedHolding(holdings[0])
                }
              >
                {activePage === "expenses" ? "Añadir" : "Invertir"}
                <Icon name="arrow" size={16} />
              </button>
            </>
          )}
        </div>
        <div className="home-indicator" />

        {profileOpen && (
          <section className="profile-page" aria-label="Perfil">
            <header className="profile-header">
              <button
                className="profile-back"
                onClick={() => setProfileOpen(false)}
                aria-label="Volver"
              >
                <Icon name="arrow" size={18} />
              </button>
              <strong>Perfil</strong>
              <button
                className="profile-edit"
                onClick={() => setProfileEditOpen(true)}
              >
                Editar
              </button>
            </header>

            <div className="profile-identity">
              <span className="profile-avatar">{initials}</span>
              <h1>{profileName}</h1>
              <p>{profileEmail}</p>
              <span className="verified">Cuenta verificada</span>
            </div>

            <div className="profile-balance">
              <span>Patrimonio total</span>
              <strong>{hideAmounts ? "•••• €" : "12.840,12 €"}</strong>
              <small>+18,4 % este año</small>
            </div>

            <div className="settings-group">
              <p>CUENTA</p>
              <button onClick={() => setProfileEditOpen(true)}>
                <span>
                  <strong>Datos personales</strong>
                  <small>Nombre, correo y contacto</small>
                </span>
                <Icon name="chevron" size={15} />
              </button>
              <div className="setting-toggle">
                <span>
                  <strong>Gastos del mes</strong>
                  <small>{displayMoney(total)}</small>
                </span>
                <strong className="setting-value">EUR</strong>
              </div>
              <button onClick={() => setLimitsOpen(true)}>
                <span>
                  <strong>Topes por categoría</strong>
                  <small>
                    {Object.keys(categoryLimits).length} categorías configuradas
                  </small>
                </span>
                <Icon name="chevron" size={15} />
              </button>
            </div>

            <div className="settings-group">
              <p>PREFERENCIAS</p>
              <div className="setting-toggle">
                <span>
                  <strong>Notificaciones</strong>
                  <small>Alertas de gastos y presupuesto</small>
                </span>
                <button
                  className={`switch ${notifications ? "on" : ""}`}
                  onClick={() => setNotifications(!notifications)}
                  role="switch"
                  aria-checked={notifications}
                  aria-label="Activar notificaciones"
                >
                  <i />
                </button>
              </div>
              <div className="setting-toggle">
                <span>
                  <strong>Ocultar importes</strong>
                  <small>Protege tus cifras de miradas ajenas</small>
                </span>
                <button
                  className={`switch ${hideAmounts ? "on" : ""}`}
                  onClick={() => setHideAmounts(!hideAmounts)}
                  role="switch"
                  aria-checked={hideAmounts}
                  aria-label="Ocultar importes"
                >
                  <i />
                </button>
              </div>
              <div className="setting-toggle">
                <span>
                  <strong>Modo oscuro</strong>
                  <small>Reduce el brillo de la interfaz</small>
                </span>
                <button
                  className={`switch ${darkMode ? "on" : ""}`}
                  onClick={() => setDarkMode(!darkMode)}
                  role="switch"
                  aria-checked={darkMode}
                  aria-label="Activar modo oscuro"
                >
                  <i />
                </button>
              </div>
              <div className="setting-toggle">
                <span>
                  <strong>Acceso biométrico</strong>
                  <small>Protege el acceso a la aplicación</small>
                </span>
                <button
                  className={`switch ${biometrics ? "on" : ""}`}
                  onClick={() => setBiometrics(!biometrics)}
                  role="switch"
                  aria-checked={biometrics}
                  aria-label="Activar acceso biométrico"
                >
                  <i />
                </button>
              </div>
            </div>

            <button className="export-button" onClick={exportData}>
              Exportar mis datos
              <Icon name="arrow" size={16} />
            </button>
            <p className="app-version">Versión 1.0.0</p>
          </section>
        )}

        {sheetOpen && (
          <div className="sheet-layer" onMouseDown={() => setSheetOpen(false)}>
            <section
              className="bottom-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="sheet-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div className={`sheet-icon ${recordType}`}>€</div>
              <button
                className="sheet-close"
                onClick={() => setSheetOpen(false)}
                aria-label="Cerrar"
              >
                <Icon name="close" size={18} />
              </button>
              <div className="record-tabs">
                <button
                  className={recordType === "expense" ? "active" : ""}
                  onClick={() => setRecordType("expense")}
                  type="button"
                >
                  Gasto
                </button>
                <button
                  className={recordType === "income" ? "active" : ""}
                  onClick={() => setRecordType("income")}
                  type="button"
                >
                  Ingreso
                </button>
              </div>
              <h2 id="sheet-title">
                Añade {recordType === "expense" ? "un gasto" : "un ingreso"}
              </h2>
              <p>
                {recordType === "expense"
                  ? "Registra el movimiento para mantener tu presupuesto actualizado."
                  : "Añade el dinero recibido para tener una visión completa de tus finanzas."}
              </p>
              <form onSubmit={addExpense}>
                <label>
                  Concepto
                  <input
                    name="merchant"
                    placeholder={
                      recordType === "expense"
                        ? "Nombre del comercio"
                        : "Empresa o concepto"
                    }
                    required
                    autoFocus
                  />
                </label>
                <div className="sheet-row">
                  <label>
                    Importe
                    <input
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0,00 €"
                      required
                    />
                  </label>
                  <label>
                    Categoría
                    <select name="category">
                      {recordType === "expense" ? (
                        <>
                          <option>Alimentación</option>
                          <option>Restaurantes</option>
                          <option>Hogar</option>
                          <option>Transporte</option>
                          <option>Otros</option>
                        </>
                      ) : (
                        <>
                          <option>Nómina</option>
                          <option>Freelance</option>
                          <option>Rendimientos</option>
                          <option>Otros ingresos</option>
                        </>
                      )}
                    </select>
                  </label>
                </div>
                <button className="sheet-submit" type="submit">
                  Guardar
                  <Icon name="arrow" size={16} />
                </button>
              </form>
            </section>
          </div>
        )}

        {limitsOpen && (
          <div className="sheet-layer" onMouseDown={() => setLimitsOpen(false)}>
            <section
              className="bottom-sheet limits-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="limits-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div className="sheet-icon limits">%</div>
              <button
                className="sheet-close"
                onClick={() => setLimitsOpen(false)}
                aria-label="Cerrar"
              >
                <Icon name="close" size={18} />
              </button>
              <h2 id="limits-title">Topes por categoría</h2>
              <p>Define cuánto quieres gastar como máximo cada mes.</p>
              <form onSubmit={updateLimits}>
                <div className="limits-list">
                  {Object.entries(categoryLimits).map(([category, limit]) => {
                    const spent = expenses
                      .filter(
                        (expense) =>
                          expense.type === "expense" &&
                          expense.category === category,
                      )
                      .reduce((sum, expense) => sum + expense.amount, 0)
                    return (
                      <label className="limit-row" key={category}>
                        <span>
                          <strong>{category}</strong>
                          <small>
                            {displayMoney(spent)} gastados ·{" "}
                            {Math.min(100, Math.round((spent / limit) * 100))}%
                          </small>
                        </span>
                        <span className="limit-input">
                          <input
                            name={category}
                            type="number"
                            min="0"
                            step="10"
                            defaultValue={limit}
                          />
                          <i>€</i>
                        </span>
                      </label>
                    )
                  })}
                </div>
                <button className="sheet-submit limits-submit" type="submit">
                  Guardar topes
                  <Icon name="arrow" size={16} />
                </button>
              </form>
            </section>
          </div>
        )}

        {profileEditOpen && (
          <div
            className="sheet-layer profile-edit-layer"
            onMouseDown={() => setProfileEditOpen(false)}
          >
            <section
              className="bottom-sheet profile-edit-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-edit-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div className="profile-edit-avatar">{initials}</div>
              <button
                className="sheet-close"
                onClick={() => setProfileEditOpen(false)}
                aria-label="Cerrar"
              >
                <Icon name="close" size={18} />
              </button>
              <h2 id="profile-edit-title">Datos personales</h2>
              <p>Actualiza la información visible en tu perfil.</p>
              <form onSubmit={updateProfile}>
                <label>
                  Nombre completo
                  <input
                    name="name"
                    defaultValue={profileName}
                    required
                    autoFocus
                  />
                </label>
                <label>
                  Correo electrónico
                  <input
                    name="email"
                    type="email"
                    defaultValue={profileEmail}
                    required
                  />
                </label>
                <button className="sheet-submit" type="submit">
                  Guardar cambios
                  <Icon name="arrow" size={16} />
                </button>
              </form>
            </section>
          </div>
        )}

        {selectedExpense && (
          <div
            className="sheet-layer"
            onMouseDown={() => setSelectedExpense(null)}
          >
            <section
              className="bottom-sheet detail-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="detail-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="sheet-handle" />
              <div className="detail-merchant-icon">
                <Icon name="receipt" size={19} />
              </div>
              <button
                className="sheet-close"
                onClick={() => setSelectedExpense(null)}
                aria-label="Cerrar"
              >
                <Icon name="close" size={18} />
              </button>
              <p className="detail-kicker">
                {selectedExpense.type === "income"
                  ? "INGRESO RECIBIDO"
                  : "PAGO COMPLETADO"}
              </p>
              <h2 id="detail-title">{selectedExpense.merchant}</h2>
              <strong className="detail-amount">
                {selectedExpense.type === "income" ? "+" : "−"}
                {displayMoney(selectedExpense.amount)}
              </strong>
              <div className="detail-list">
                <div>
                  <span>Fecha</span>
                  <strong>{selectedExpense.date}, 12:48</strong>
                </div>
                <div>
                  <span>Categoría</span>
                  <strong>{selectedExpense.category}</strong>
                </div>
                <div>
                  <span>Método</span>
                  <strong>
                    {selectedExpense.type === "income"
                      ? "Transferencia"
                      : "Tarjeta ·· 2048"}
                  </strong>
                </div>
                <div>
                  <span>Estado</span>
                  <strong className="detail-status">Completado</strong>
                </div>
              </div>
              <button
                className="detail-action"
                onClick={() => setSelectedExpense(null)}
              >
                Cerrar detalle
                <Icon name="arrow" size={16} />
              </button>
            </section>
          </div>
        )}

        {selectedHolding && (
          <div
            className="sheet-layer"
            onMouseDown={() => setSelectedHolding(null)}
          >
            <section
              className="bottom-sheet detail-sheet investment-detail"
              role="dialog"
              aria-modal="true"
              aria-labelledby="asset-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="sheet-handle" />
              <span className={`asset-logo large ${selectedHolding.tone}`}>
                {selectedHolding.logo}
              </span>
              <button
                className="sheet-close"
                onClick={() => setSelectedHolding(null)}
                aria-label="Cerrar"
              >
                <Icon name="close" size={18} />
              </button>
              <p className="detail-kicker">{selectedHolding.ticker}</p>
              <h2 id="asset-title">{selectedHolding.name}</h2>
              <strong className="detail-amount">
                {displayMoney(selectedHolding.value)}
              </strong>
              <div className="detail-list">
                <div>
                  <span>Rentabilidad</span>
                  <strong className="detail-status">
                    {selectedHolding.change}
                  </strong>
                </div>
                <div>
                  <span>Invertido</span>
                  <strong>{displayMoney(selectedHolding.value * 0.88)}</strong>
                </div>
                <div>
                  <span>Plan mensual</span>
                  <strong>{hideAmounts ? "•••• €" : "100 €"}</strong>
                </div>
              </div>
              <button
                className="detail-action"
                onClick={() => setSelectedHolding(null)}
              >
                Cerrar detalle
                <Icon name="arrow" size={16} />
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
