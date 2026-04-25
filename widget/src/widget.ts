/**
 * FitAI Embeddable Try-On Widget
 * 
 * Usage:
 * <script src="https://cdn.fitai.in/widget.js" data-brand-id="abc123" async></script>
 * 
 * Mark product images with the data-fitai-garment attribute:
 * <img src="shirt.jpg" data-fitai-garment />
 * <img src="pants.jpg" data-fitai-garment />
 * 
 * OR pass a direct URL:
 * <script src="..." data-brand-id="abc" data-garment-url="https://..." async></script>
 */

const SUPABASE_URL = 'https://vcjshbykllrhuodzaguf.supabase.co'

interface WidgetConfig {
  brandApiKey: string
  garmentUrl?: string
  targetSelector?: string
  category?: string
}

interface BrandTheme {
  primaryColor: string
  buttonText: string
  position: string
}

function getScriptConfig(): WidgetConfig | null {
  const script = document.currentScript as HTMLScriptElement | null
  if (!script) {
    // Fallback: find our script tag
    const scripts = document.querySelectorAll('script[data-brand-id]')
    const el = scripts[scripts.length - 1] as HTMLScriptElement | null
    if (!el) return null
    return {
      brandApiKey: el.dataset.brandId || '',
      garmentUrl: el.dataset.garmentUrl,
      targetSelector: el.dataset.target,
      category: el.dataset.category,
    }
  }
  return {
    brandApiKey: script.dataset.brandId || '',
    garmentUrl: script.dataset.garmentUrl,
    targetSelector: script.dataset.target,
    category: script.dataset.category,
  }
}

// getGarmentImageUrl removed — widget now handles multiple images via querySelectorAll

function createStyles(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

    .fitai-btn {
      font-family: 'DM Sans', sans-serif;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.5px;
      transition: opacity 0.2s, transform 0.2s;
    }
    .fitai-btn:hover { opacity: 0.9; transform: translateY(-1px); }
    .fitai-btn:active { transform: translateY(0); }

    .fitai-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      opacity: 0;
      transition: opacity 0.3s;
      font-family: 'DM Sans', sans-serif;
    }
    .fitai-overlay.active { opacity: 1; }

    .fitai-modal {
      background: #1a1816;
      color: #f5efe6;
      border-radius: 8px;
      width: 90%;
      max-width: 440px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 32px;
      position: relative;
    }

    .fitai-close {
      position: absolute;
      top: 12px;
      right: 12px;
      background: none;
      border: none;
      color: #f5efe6;
      font-size: 24px;
      cursor: pointer;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s;
    }
    .fitai-close:hover { background: rgba(255,255,255,0.1); }

    .fitai-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .fitai-subtitle {
      font-size: 13px;
      color: #9a8e7f;
      margin-bottom: 24px;
    }

    .fitai-dropzone {
      border: 2px dashed #3a3530;
      border-radius: 6px;
      padding: 40px 20px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
    }
    .fitai-dropzone:hover, .fitai-dropzone.dragging {
      border-color: var(--fitai-primary, #c4653a);
      background: rgba(196,101,58,0.05);
    }
    .fitai-dropzone-icon {
      font-size: 32px;
      margin-bottom: 12px;
      color: #9a8e7f;
    }
    .fitai-dropzone-text { font-size: 14px; color: #f5efe6; }
    .fitai-dropzone-hint { font-size: 12px; color: #9a8e7f; margin-top: 4px; }

    .fitai-preview {
      width: 100%;
      max-height: 300px;
      object-fit: contain;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .fitai-generate-btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      letter-spacing: 0.5px;
      transition: opacity 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .fitai-generate-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .fitai-loading {
      text-align: center;
      padding: 40px 0;
    }
    .fitai-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #3a3530;
      border-top-color: var(--fitai-primary, #c4653a);
      border-radius: 50%;
      animation: fitai-spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes fitai-spin { to { transform: rotate(360deg); } }
    .fitai-loading-text { font-size: 14px; color: #9a8e7f; }

    .fitai-result-img {
      width: 100%;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .fitai-actions {
      display: flex;
      gap: 8px;
    }
    .fitai-actions button {
      flex: 1;
      padding: 12px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
      font-family: 'DM Sans', sans-serif;
    }

    .fitai-error {
      background: rgba(200,50,50,0.15);
      color: #e88;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 13px;
      margin-bottom: 16px;
    }

    .fitai-branding {
      text-align: center;
      margin-top: 20px;
      font-size: 11px;
      color: #6a6055;
    }
    .fitai-branding a { color: #9a8e7f; text-decoration: none; }
    .fitai-branding a:hover { text-decoration: underline; }
  `
}

async function toDataUri(url: string, maxDim = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas not available'))
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = url
  })
}

class FitAIWidget {
  private config: WidgetConfig
  private theme: BrandTheme = { primaryColor: '#c4653a', buttonText: '✨ Try On', position: 'inline' }
  private brandId: string | null = null

  constructor(config: WidgetConfig) {
    this.config = config
  }

  async init() {
    // 1. Validate brand
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/brand-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-brand-api-key': this.config.brandApiKey,
        },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        console.error('[FitAI] Brand validation failed:', await res.text())
        return
      }
      const data = await res.json()
      this.brandId = data.brand_id
      if (data.theme) {
        this.theme = { ...this.theme, ...data.theme }
      }
    } catch (e) {
      console.error('[FitAI] Failed to validate brand:', e)
      return
    }

    // 2. Find garment images and inject buttons
    if (this.config.garmentUrl) {
      // Single direct URL mode — one button
      this.injectButton(this.config.garmentUrl, null, this.config.category || 'auto')
    } else {
      // Auto-detect mode — find ALL images with data-fitai-garment attribute
      const elements = document.querySelectorAll('[data-fitai-garment]')
      if (elements.length === 0) {
        console.error('[FitAI] No images found with data-fitai-garment attribute. Add data-fitai-garment to your product images.')
        return
      }
      elements.forEach((el) => {
        const imgEl = el as HTMLImageElement
        const url = imgEl.src || imgEl.getAttribute('data-src') || null
        const category = imgEl.getAttribute('data-fitai-category') || 'auto'
        if (url) {
          this.injectButton(url, imgEl, category)
        }
      })
    }
  }

  private injectButton(garmentUrl: string, anchorEl: HTMLElement | null, category: string) {
    const primary = this.theme.primaryColor || '#c4653a'
    const host = document.createElement('div')
    host.className = 'fitai-widget-host'
    const shadow = host.attachShadow({ mode: 'closed' })

    const style = document.createElement('style')
    style.textContent = createStyles()
    shadow.appendChild(style)

    const btn = document.createElement('button')
    btn.className = 'fitai-btn'
    btn.style.cssText = `background:${primary};color:#fff;`
    btn.innerHTML = this.theme.buttonText || '✨ Try On'
    btn.addEventListener('click', () => this.openModal(garmentUrl, category))
    shadow.appendChild(btn)

    // Insert the button
    if (this.config.targetSelector) {
      const target = document.querySelector(this.config.targetSelector)
      if (target) {
        target.appendChild(host)
        return
      }
    }

    // Insert after the anchor element (the garment image)
    if (anchorEl && anchorEl.parentElement) {
      anchorEl.parentElement.insertBefore(host, anchorEl.nextSibling)
      return
    }

    // Last fallback
    document.body.appendChild(host)
  }

  private openModal(garmentUrl: string, category: string) {
    const primary = this.theme.primaryColor || '#c4653a'
    const overlay = document.createElement('div')
    overlay.className = 'fitai-overlay'

    const style = document.createElement('style')
    style.textContent = createStyles()

    const modal = document.createElement('div')
    modal.className = 'fitai-modal'
    modal.style.setProperty('--fitai-primary', primary)

    overlay.appendChild(modal)

    const modalHost = document.createElement('div')
    modalHost.style.cssText = 'position:fixed;inset:0;z-index:999999;'
    const modalShadow = modalHost.attachShadow({ mode: 'closed' })
    modalShadow.appendChild(style)
    modalShadow.appendChild(overlay)
    document.body.appendChild(modalHost)

    requestAnimationFrame(() => overlay.classList.add('active'))

    this.renderUploadStep(modal, overlay, modalHost, primary, garmentUrl, category)
  }

  private renderUploadStep(modal: HTMLElement, overlay: HTMLElement, modalHost: HTMLElement, primary: string, garmentUrl: string, category: string) {
    modal.innerHTML = `
      <button class="fitai-close">&times;</button>
      <div class="fitai-title">Virtual Try-On</div>
      <div class="fitai-subtitle">Upload a front-facing photo to see how this looks on you</div>
      <div id="fitai-content"></div>
      <div class="fitai-branding">Powered by <a href="https://fitai.in" target="_blank">FitAI</a></div>
    `

    const close = modal.querySelector('.fitai-close')!
    close.addEventListener('click', () => this.closeModal(overlay, modalHost))
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal(overlay, modalHost)
    })

    const content = modal.querySelector('#fitai-content')!
    this.renderDropzone(content as HTMLElement, primary, (dataUri) => {
      this.renderPhotoPreview(content as HTMLElement, primary, dataUri, overlay, modalHost, garmentUrl, category)
    })
  }

  private renderDropzone(container: HTMLElement, primary: string, onPhoto: (dataUri: string) => void) {
    container.innerHTML = `
      <div class="fitai-dropzone" id="fitai-drop">
        <div class="fitai-dropzone-icon">📷</div>
        <div class="fitai-dropzone-text">Tap to upload your photo</div>
        <div class="fitai-dropzone-hint">JPG, PNG up to 10MB</div>
        <input type="file" accept="image/*" style="display:none" id="fitai-file">
      </div>
    `

    const dropzone = container.querySelector('#fitai-drop') as HTMLElement
    const fileInput = container.querySelector('#fitai-file') as HTMLInputElement

    dropzone.addEventListener('click', () => fileInput.click())
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragging') })
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragging'))
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault()
      dropzone.classList.remove('dragging')
      const file = (e as DragEvent).dataTransfer?.files?.[0]
      if (file) this.processFile(file, onPhoto)
    })
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0]
      if (file) this.processFile(file, onPhoto)
    })
  }

  private async processFile(file: File, onPhoto: (dataUri: string) => void) {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    try {
      const dataUri = await toDataUri(url)
      onPhoto(dataUri)
    } catch (e) {
      console.error('[FitAI] Failed to process image:', e)
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  private renderPhotoPreview(container: HTMLElement, primary: string, photoDataUri: string, overlay: HTMLElement, modalHost: HTMLElement, garmentUrl: string, category: string) {
    container.innerHTML = `
      <img class="fitai-preview" src="${photoDataUri}" alt="Your photo">
      <div id="fitai-error-container"></div>
      <button class="fitai-generate-btn" id="fitai-generate" style="background:${primary};color:#fff;">
        ✨ Generate Try-On
      </button>
      <div style="text-align:center;margin-top:8px;">
        <button id="fitai-retake" style="background:none;border:none;color:#9a8e7f;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;">Change photo</button>
      </div>
    `

    const retake = container.querySelector('#fitai-retake')!
    retake.addEventListener('click', () => {
      this.renderDropzone(container, primary, (dataUri) => {
        this.renderPhotoPreview(container, primary, dataUri, overlay, modalHost, garmentUrl, category)
      })
    })

    const generateBtn = container.querySelector('#fitai-generate') as HTMLButtonElement
    generateBtn.addEventListener('click', () => {
      this.runTryOn(container, primary, photoDataUri, overlay, modalHost, garmentUrl, category)
    })
  }

  private async runTryOn(container: HTMLElement, primary: string, photoDataUri: string, overlay: HTMLElement, modalHost: HTMLElement, garmentUrl: string, category: string) {
    container.innerHTML = `
      <div class="fitai-loading">
        <div class="fitai-spinner"></div>
        <div class="fitai-loading-text" id="fitai-status">Starting try-on…</div>
      </div>
    `
    const statusEl = container.querySelector('#fitai-status')!

    try {
      const runRes = await fetch(`${SUPABASE_URL}/functions/v1/fashn-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_image: photoDataUri,
          garment_url: garmentUrl,
          category,
          brand_api_key: this.config.brandApiKey,
        }),
      })

      if (!runRes.ok) {
        const err = await runRes.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error || 'Failed to start try-on')
      }

      const { id: jobId, log_id: logId } = await runRes.json()
      if (!jobId) throw new Error('No job ID returned')

      statusEl.textContent = 'Generating your try-on… (~30s)'

      // Poll for result
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise(r => setTimeout(r, 3000))

        const statusRes = await fetch(`${SUPABASE_URL}/functions/v1/fashn-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: jobId, log_id: logId }),
        })

        if (!statusRes.ok) continue
        const statusData = await statusRes.json()

        if (statusData.status === 'completed') {
          const outputUrl = statusData.output?.[0]
          if (!outputUrl) throw new Error('No output URL')
          this.renderResult(container, primary, outputUrl, overlay, modalHost, garmentUrl, category)
          return
        }

        if (statusData.status === 'failed') {
          throw new Error(statusData.error || 'Try-on failed')
        }

        if (attempt > 5) statusEl.textContent = 'Almost there… hang tight'
      }

      throw new Error('Timed out waiting for result')
    } catch (e: any) {
      container.innerHTML = `
        <div class="fitai-error">${e.message || 'Something went wrong'}</div>
        <button class="fitai-generate-btn" id="fitai-retry" style="background:${primary};color:#fff;">Try Again</button>
      `
      const retry = container.querySelector('#fitai-retry')!
      retry.addEventListener('click', () => {
        this.renderDropzone(container, primary, (dataUri) => {
          this.renderPhotoPreview(container, primary, dataUri, overlay, modalHost, garmentUrl, category)
        })
      })
    }
  }

  private renderResult(container: HTMLElement, primary: string, outputUrl: string, overlay: HTMLElement, modalHost: HTMLElement, garmentUrl: string, category: string) {
    container.innerHTML = `
      <img class="fitai-result-img" src="${outputUrl}" alt="Try-on result">
      <div class="fitai-actions">
        <button id="fitai-tryagain" style="background:transparent;border:1px solid #3a3530;color:#f5efe6;">Try Another</button>
        <button id="fitai-download" style="background:${primary};border:none;color:#fff;">Download</button>
      </div>
    `

    const tryAgain = container.querySelector('#fitai-tryagain')!
    tryAgain.addEventListener('click', () => {
      this.renderDropzone(container, primary, (dataUri) => {
        this.renderPhotoPreview(container, primary, dataUri, overlay, modalHost, garmentUrl, category)
      })
    })

    const download = container.querySelector('#fitai-download')!
    download.addEventListener('click', () => {
      const a = document.createElement('a')
      a.href = outputUrl
      a.download = 'fitai-tryon.jpg'
      a.target = '_blank'
      a.click()
    })
  }

  private closeModal(overlay: HTMLElement, modalHost: HTMLElement) {
    overlay.classList.remove('active')
    setTimeout(() => modalHost.remove(), 300)
  }
}

// Auto-init
(function () {
  const config = getScriptConfig()
  if (!config || !config.brandApiKey) {
    console.error('[FitAI] Missing data-brand-id on script tag')
    return
  }
  
  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FitAIWidget(config).init())
  } else {
    new FitAIWidget(config).init()
  }
})()
