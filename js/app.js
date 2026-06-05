// Produtos padrão
const products = JSON.parse(localStorage.getItem("products")) || {
  lanche: { name: "Lanche", price: 7.0, emoji: "🍔" },
  refrigerante: { name: "Refrigerante", price: 3.0, emoji: "🥤" },
  agua: { name: "Água Mineral", price: 2.0, emoji: "💧" },
  refeicao: { name: "Refeição", price: 10.0, emoji: "🍽️" },
}

// Configurações PIX padrão
let pixSettings = JSON.parse(localStorage.getItem("pixSettings")) || {
  key: "+5583996159696",
  name: "JOSE RONALDO M DA COSTA",
  city: "PIANCO",
}

// Estado atual do carrinho
let currentCart = {}

// Valor recebido em dinheiro
let receivedMoney = 0

// Dados históricos
let salesHistory = JSON.parse(localStorage.getItem("festa-santo-antonio-2025")) || {
  totalFichas: 0,
  totalValor: 0,
}

// Variáveis dos modais
let reportModal, productManagerModal, productFormModal, pixModal, settingsMenuModal, pixSettingsModal
let editingProductId = null

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  reportModal = new bootstrap.Modal(document.getElementById("reportModal"))
  productManagerModal = new bootstrap.Modal(document.getElementById("productManagerModal"))
  productFormModal = new bootstrap.Modal(document.getElementById("productFormModal"))
  pixModal = new bootstrap.Modal(document.getElementById("pixModal"))
  settingsMenuModal = new bootstrap.Modal(document.getElementById("settingsMenuModal"))
  pixSettingsModal = new bootstrap.Modal(document.getElementById("pixSettingsModal"))

  initializeCart()
  renderProducts()
  updateCartDisplay()
  updatePaymentSection()
})

// Inicializar carrinho baseado nos produtos
function initializeCart() {
  currentCart = {}
  for (const productId in products) {
    currentCart[productId] = 0
    if (!salesHistory[productId]) {
      salesHistory[productId] = { fichas: 0, valor: 0 }
    }
  }
}

// Renderizar produtos
function renderProducts() {
  const grid = document.getElementById("products-grid")
  let html = ""

  for (const productId in products) {
    const product = products[productId]
    html += `
            <div class="product-card" onclick="addToCart('${productId}')">
                <div class="product-image">${product.emoji}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">R$ ${product.price.toFixed(2).replace(".", ",")}</div>
            </div>
        `
  }

  grid.innerHTML = html
}

// Adicionar ao carrinho
function addToCart(productId) {
  if (!currentCart[productId]) currentCart[productId] = 0
  currentCart[productId]++
  updateCartDisplay()
  updatePaymentSection()

  if (navigator.vibrate) {
    navigator.vibrate(50)
  }
}

// Atualizar quantidade no carrinho
function updateCartQuantity(productId, change) {
  const newQty = Math.max(0, (currentCart[productId] || 0) + change)
  currentCart[productId] = newQty
  updateCartDisplay()
  updatePaymentSection()

  if (navigator.vibrate && change !== 0) {
    navigator.vibrate(50)
  }
}

// Atualizar exibição do carrinho
function updateCartDisplay() {
  const cartItems = document.getElementById("cart-items")
  const cartCount = document.getElementById("cart-count")
  let html = ""
  let totalItems = 0

  const hasItems = Object.values(currentCart).some((qty) => qty > 0)

  if (!hasItems) {
    html = '<div class="empty-cart">Escolha uma ficha</div>'
    totalItems = 0
  } else {
    for (const productId in currentCart) {
      const qty = currentCart[productId]
      if (qty > 0 && products[productId]) {
        totalItems += qty
        const product = products[productId]
        html += `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${product.name}</div>
                            <div class="cart-item-price">R$ ${product.price.toFixed(2).replace(".", ",")} x ${qty}</div>
                        </div>
                        <div class="cart-controls">
                            <button class="btn btn-outline-danger btn-sm btn-quantity" onclick="updateCartQuantity('${productId}', -1)">−</button>
                            <div class="quantity">${qty}</div>
                            <button class="btn btn-outline-success btn-sm btn-quantity" onclick="updateCartQuantity('${productId}', 1)">+</button>
                        </div>
                    </div>
                `
      }
    }
  }

  cartItems.innerHTML = html
  cartCount.textContent = totalItems
}

// Adicionar dinheiro recebido
function addMoney(value) {
  receivedMoney += value
  updatePaymentSection()

  if (navigator.vibrate) {
    navigator.vibrate(50)
  }
}

// Limpar dinheiro recebido
function clearMoney() {
  receivedMoney = 0
  updatePaymentSection()
}

// Atualizar seção de pagamento
function updatePaymentSection() {
  let totalValor = 0

  for (const productId in currentCart) {
    if (products[productId]) {
      totalValor += currentCart[productId] * products[productId].price
    }
  }

  document.getElementById("total-valor").textContent = formatCurrency(totalValor)

  // Atualizar exibição do valor recebido e troco
  const paymentSummary = document.getElementById("payment-summary")
  const receivedDisplay = document.getElementById("valor-recebido-display")
  const trocoDisplay = document.getElementById("troco-valor")

  if (receivedMoney > 0) {
    paymentSummary.style.display = "block"
    receivedDisplay.textContent = formatCurrency(receivedMoney)

    const change = receivedMoney - totalValor
    trocoDisplay.textContent = formatCurrency(Math.abs(change))

    if (change >= 0) {
      trocoDisplay.classList.remove("negative")
      trocoDisplay.parentElement.querySelector(".payment-label").textContent = "Troco:"
    } else {
      trocoDisplay.classList.add("negative")
      trocoDisplay.parentElement.querySelector(".payment-label").textContent = "Falta:"
    }
  } else {
    paymentSummary.style.display = "none"
  }
}

// Formatar moeda
function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

// Cancelar pedido
function cancelOrder() {
  for (const productId in currentCart) {
    currentCart[productId] = 0
  }
  receivedMoney = 0
  updateCartDisplay()
  updatePaymentSection()
}

// Finalizar pedido
function finishOrder() {
  const hasItems = Object.values(currentCart).some((qty) => qty > 0)
  if (!hasItems) {
    return
  }

  saveSaleToHistory()

  for (const productId in currentCart) {
    currentCart[productId] = 0
  }
  receivedMoney = 0
  updateCartDisplay()
  updatePaymentSection()
}

// Salvar venda no histórico
function saveSaleToHistory() {
  for (const productId in currentCart) {
    const qty = currentCart[productId]
    if (qty > 0 && products[productId]) {
      const valor = qty * products[productId].price

      if (!salesHistory[productId]) {
        salesHistory[productId] = { fichas: 0, valor: 0 }
      }

      salesHistory[productId].fichas += qty
      salesHistory[productId].valor += valor
      salesHistory.totalFichas += qty
      salesHistory.totalValor += valor
    }
  }

  localStorage.setItem("festa-santo-antonio-2025", JSON.stringify(salesHistory))
}

// Mostrar relatório
function showReport() {
  const content = document.getElementById("reportContent")

  let html = '<div class="text-center mb-4">'
  html += '<h3 class="text-success">Valor Total</h3>'
  html += `<h2 class="text-success fw-bold">${formatCurrency(salesHistory.totalValor)}</h2>`
  html += "</div>"

  for (const productId in products) {
    const product = products[productId]
    const data = salesHistory[productId] || { fichas: 0, valor: 0 }
    html += '<div class="report-item">'
    html += `<h5>${product.emoji} ${product.name} (R$ ${product.price.toFixed(2).replace(".", ",")})</h5>`
    html += `<div class="report-detail"><span>Fichas Vendidas:</span><strong>${data.fichas}</strong></div>`
    html += `<div class="report-detail"><span>Valor Arrecadado:</span><strong>${formatCurrency(data.valor)}</strong></div>`
    html += "</div>"
  }

  html += '<div class="mt-3 d-grid">'
  html += '<button class="btn btn-danger" onclick="resetHistory()">Apagar</button>'
  html += "</div>"

  content.innerHTML = html
  reportModal.show()
}

// Resetar histórico
function resetHistory() {
  if (confirm("Deseja limpar todo o histórico de vendas? Esta ação não pode ser desfeita.")) {
    salesHistory = { totalFichas: 0, totalValor: 0 }
    for (const productId in products) {
      salesHistory[productId] = { fichas: 0, valor: 0 }
    }
    localStorage.setItem("festa-santo-antonio-2025", JSON.stringify(salesHistory))
    reportModal.hide()
    alert("Histórico limpo com sucesso!")
  }
}

// Menu de Configurações
function showSettingsMenu() {
  settingsMenuModal.show()
}

// Configurações PIX
function showPixSettings() {
  settingsMenuModal.hide()

  // Carregar configurações atuais
  document.getElementById("pixKey").value = pixSettings.key
  document.getElementById("pixName").value = pixSettings.name
  document.getElementById("pixCity").value = pixSettings.city

  pixSettingsModal.show()
}

// Mostrar relatório a partir do menu
function showReportFromMenu() {
  settingsMenuModal.hide()
  showReport()
}

function savePixSettings() {
  const key = document.getElementById("pixKey").value.trim()
  const name = document.getElementById("pixName").value.trim().toUpperCase()
  const city = document.getElementById("pixCity").value.trim().toUpperCase()

  if (!key || !name || !city) {
    alert("Preencha todos os campos!")
    return
  }

  pixSettings = { key, name, city }
  localStorage.setItem("pixSettings", JSON.stringify(pixSettings))

  pixSettingsModal.hide()
  alert("Configurações PIX salvas com sucesso!")
}

// Gerenciamento de Produtos
function showProductManager() {
  settingsMenuModal.hide()
  renderProductsList()
  productManagerModal.show()
}

function renderProductsList() {
  const list = document.getElementById("productsList")
  let html = ""

  for (const productId in products) {
    const product = products[productId]
    html += `
            <div class="card mb-2">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <span class="me-2">${product.emoji}</span>
                        <strong>${product.name}</strong>
                        <br>
                        <small class="text-muted">R$ ${product.price.toFixed(2).replace(".", ",")}</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct('${productId}')">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${productId}')">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `
  }

  list.innerHTML = html
}

function showAddProductForm() {
  editingProductId = null
  document.getElementById("productFormTitle").textContent = "Adicionar Produto"
  document.getElementById("productForm").reset()
  productFormModal.show()
}

function editProduct(productId) {
  editingProductId = productId
  const product = products[productId]
  document.getElementById("productFormTitle").textContent = "Editar Produto"
  document.getElementById("productEmoji").value = product.emoji
  document.getElementById("productName").value = product.name
  document.getElementById("productPrice").value = product.price
  productFormModal.show()
}

function saveProduct() {
  const emoji = document.getElementById("productEmoji").value.trim()
  const name = document.getElementById("productName").value.trim()
  const price = Number.parseFloat(document.getElementById("productPrice").value)

  if (!emoji || !name || !price || price <= 0) {
    alert("Preencha todos os campos corretamente!")
    return
  }

  if (editingProductId) {
    // Editando produto existente
    products[editingProductId] = { emoji, name, price }
  } else {
    // Adicionando novo produto
    const productId = name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
    products[productId] = { emoji, name, price }
    currentCart[productId] = 0
    salesHistory[productId] = { fichas: 0, valor: 0 }
  }

  localStorage.setItem("products", JSON.stringify(products))
  localStorage.setItem("festa-santo-antonio-2025", JSON.stringify(salesHistory))

  renderProducts()
  renderProductsList()
  updateCartDisplay()
  updatePaymentSection()
  productFormModal.hide()
}

function deleteProduct(productId) {
  if (confirm("Deseja excluir este produto?")) {
    delete products[productId]
    delete currentCart[productId]
    delete salesHistory[productId]

    localStorage.setItem("products", JSON.stringify(products))
    localStorage.setItem("festa-santo-antonio-2025", JSON.stringify(salesHistory))

    renderProducts()
    renderProductsList()
    updateCartDisplay()
    updatePaymentSection()
  }
}

// Gerar QR Code PIX
function showPixQRCode() {
  const totalElement = document.getElementById("total-valor")
  const totalValue =
    Number.parseFloat(totalElement.textContent.replace("R$", "").replace(".", "").replace(",", ".")) || 0

  if (totalValue <= 0) {
    alert("Adicione itens ao carrinho para gerar o PIX!")
    return
  }

  addAguardando()
  document.getElementById("pixValue").textContent = formatCurrency(totalValue)

  // Gerar resumo da compra
  generatePixSummary()

  generatePixQRCode(totalValue)
  pixModal.show()
}

function generatePixSummary() {
  const summaryElement = document.getElementById("pixSummary")
  let summaryHtml = '<div class="d-flex justify-content-center flex-wrap gap-2 text-muted mb-2">'

  for (const productId in currentCart) {
    const qty = currentCart[productId]
    if (qty > 0 && products[productId]) {
      const product = products[productId]
      summaryHtml += `<span class="badge bg-light text-dark border">${product.emoji} ${product.name}: ${qty}</span>`
    }
  }

  summaryHtml += "</div>"
  summaryElement.innerHTML = summaryHtml
}

function generatePixQRCode(valor) {
  const payload = gerarPayloadPix(valor)

  const qrCodeElement = document.getElementById("qrcode")
  qrCodeElement.innerHTML = ""

  new QRCode(qrCodeElement, {
    text: payload,
    width: 350,
    height: 350,
    colorDark: "#000000",
    colorLight: "#ffffff",
  })
}

// Funções PIX (usando configurações dinâmicas)
function gerarPayloadPix(valor) {
  function format(id, value) {
    const size = value.length.toString().padStart(2, "0")
    return id + size + value
  }

  const chave = pixSettings.key
  const merchantAccountInfo = format("26", format("00", "br.gov.bcb.pix") + format("01", chave))
  const additionalDataField = format("62", format("05", "***"))

  const payloadSemCRC =
    format("00", "01") +
    merchantAccountInfo +
    format("52", "0000") +
    format("53", "986") +
    format("54", valor.toFixed(2)) +
    format("58", "BR") +
    format("59", pixSettings.name) +
    format("60", pixSettings.city) +
    additionalDataField +
    "6304"

  const crc = calcularCRC16(payloadSemCRC)
  return payloadSemCRC + crc
}

function calcularCRC16(str) {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
    }
    crc &= 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

function confirmarPix(texto) {
  document.getElementById("aguardando").style.display = "none"
  document.getElementById("pixValue").style.display = "none"
  const divQrcode = document.getElementById("qrcode")

  if (!document.getElementById("pixMensagemConfirmada")) {
    const regex = /R\$ (\d+,\d{2}) de (.+)$/i
    const match = texto.match(regex)
    const novaMensagem = document.createElement("div")
    novaMensagem.id = "pixMensagemConfirmada"
    if (match === null) {
      novaMensagem.innerHTML = `
                <p style="margin-top:10px;font-size: 18px;">
                    <em> ${texto}</em>
                </p>
            `
    } else {
      novaMensagem.innerHTML = `
                <p style="margin-top:10px; text-align: left;font-size: 18px;">
                    <strong>Valor Recebido:</strong><em> R$ ${match[1]}</em><br>
                    <strong>Nome:</strong><em> ${match[2]}</em>
                </p>
            `
    }

    divQrcode.innerHTML =
      '<img src="./img/pix-sucesso.png" alt="PIX Recebido" style="width:300px;height:auto;margin-bottom:10px;">'
    divQrcode.parentElement.appendChild(novaMensagem)
  }
}

function addAguardando() {
  document.getElementById("pixValue").style.display = "block"
  const awaiting = document.getElementById("aguardando")
  document.getElementById("pixMensagemConfirmada")?.remove()
  if (awaiting.style.display === "none") {
    awaiting.style.display = "block"
  }
}

var bootstrap = window.bootstrap
var QRCode = window.QRCode
