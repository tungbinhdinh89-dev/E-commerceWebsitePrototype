// Progressive enhancement: normal GET forms/links work when JavaScript is unavailable.
const form = document.querySelector('#catalog-search')
if (form) {
  const status = document.querySelector('#catalog-status')
  const results = document.querySelector('#catalog-results')
  const pagination = document.querySelector('#catalog-pagination')
  let pending
  const element = (tag, text, className) => {
    const node = document.createElement(tag)
    if (text !== undefined) node.textContent = text
    if (className) node.className = className
    return node
  }
  const pageLink = (label, page, query) => {
    const link = element('a', label)
    link.href = `/products?${new URLSearchParams({ q: query, page: String(page) })}`
    return link
  }
  async function search(url, updateHistory = true) {
    pending?.abort()
    const controller = new AbortController()
    pending = controller
    results.setAttribute('aria-busy', 'true')
    status.textContent = 'Đang tìm sản phẩm...'
    try {
      const response = await fetch(`/api/products${url.search}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
      const payload = await response.json()
      if (!response.ok || !payload.success) throw new Error(payload.message || 'Không thể tải sản phẩm. Vui lòng thử lại.')
      const { items, query, pagination: page } = payload.data
      const cards = items.map((product) => {
        const card = element('article', undefined, 'product-card')
        const link = element('a')
        link.href = `/products/${encodeURIComponent(product.slug)}`
        if (product.image) {
          const image = element('img')
          image.src = product.image
          image.alt = product.name
          image.width = 360
          image.height = 250
          image.loading = 'lazy'
          link.append(image)
        }
        link.append(element('span', product.category, 'category'), element('h2', product.name))
        card.append(link, element('p', `${new Intl.NumberFormat('vi-VN').format(Number(product.price))} ₫`, 'price'), element('p', product.stock > 0 ? 'Còn hàng' : 'Tạm hết hàng'))
        return card
      })
      results.replaceChildren(...(cards.length ? cards : [element('p', 'Không tìm thấy sản phẩm phù hợp.')]))
      const links = []
      if (page.page > 1) links.push(pageLink('← Trang trước', page.page - 1, query))
      links.push(element('span', `Trang ${page.page} / ${Math.max(1, page.totalPages)}`))
      if (page.page < page.totalPages) links.push(pageLink('Trang sau →', page.page + 1, query))
      pagination.replaceChildren(...links)
      status.textContent = `${page.total} sản phẩm`
      form.elements.q.value = query
      if (updateHistory) history.pushState(null, '', url)
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = 'Không thể tải sản phẩm. Vui lòng thử lại.'
    } finally {
      if (pending === controller) results.removeAttribute('aria-busy')
    }
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    if (!form.reportValidity()) return
    const url = new URL(form.action)
    url.search = new URLSearchParams(new FormData(form)).toString()
    search(url)
  })
  pagination.addEventListener('click', (event) => {
    const link = event.target.closest('a')
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    search(new URL(link.href))
  })
  window.addEventListener('popstate', () => search(new URL(location.href), false))
}
