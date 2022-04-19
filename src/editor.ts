import { format_byte } from '@beenotung/tslib/format'
import {
  dataURItoBlob,
  ISize,
  resizeImage,
  resizeWithRatio,
  toImage,
} from '@beenotung/tslib/image'

let { round } = Math

let form = document.querySelector('#inputs') as HTMLFormElement
let urlInput = document.querySelector(
  'input.source[type="url"]',
) as HTMLInputElement
let fileInput = document.querySelector(
  'input.source[type="file"]',
) as HTMLInputElement
let originalSize = document.querySelector('.original.size') as HTMLSpanElement
let outputSize = document.querySelector('.output.size') as HTMLSpanElement
let inputs = document.querySelector('#inputs') as HTMLDivElement
let outputs = document.querySelector('#outputs') as HTMLDivElement
let scaled = document.querySelector('img.scaled') as HTMLImageElement
let fixedSize = document.querySelector('img.fixed-size') as HTMLImageElement

let vh = 0
function checkInputSize() {
  vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', vh + 'px')
  document.body.style.setProperty(
    '--inputs-height',
    inputs.getBoundingClientRect().height + 'px',
  )
}
checkInputSize()
window.addEventListener('resize', checkInputSize)

let sourceImage: HTMLImageElement
let mode = 'smooth'
let size = 100
let quality = 100

let W = 1
let H = 1

let file: File | undefined
urlInput.addEventListener('change', async () => {
  let url = urlInput.value.trim()
  if (!url) return
  try {
    let res = await fetch('https://images.weserv.nl/?url=' + url)
    let blob = await res.blob()
    let ext = blob.type.split('/').pop()
    file = new File([blob], 'image.' + ext)
    drawImage()
  } catch (error) {
    console.error(error)
    alert(String(error))
  }
})
fileInput.addEventListener('change', () => {
  file = fileInput.files?.[0]
  drawImage()
})
window.addEventListener('resize', drawImage)

async function drawImage() {
  if (!file) return
  originalSize.textContent = `(${format_byte(file.size)})`
  sourceImage = await toImage(file)
  W = sourceImage.naturalWidth
  H = sourceImage.naturalHeight
  let rect = outputs.getBoundingClientRect()
  let size: ISize
  if (W > H) {
    outputs.classList.add('v')
    size = resizeWithRatio(
      { width: W, height: H },
      { width: rect.width, height: rect.height / 2 },
      'with_in',
    )
  } else {
    outputs.classList.remove('v')
    size = resizeWithRatio(
      { width: W, height: H },
      { width: rect.width / 2, height: rect.height },
      'with_in',
    )
  }
  originalSize.textContent = `${W}x${H} (${format_byte(file.size)})`
  fixedSize.style.width = size.width + 'px'
  fixedSize.style.height = size.height + 'px'
  draw()
}
let sizeInputs = document.querySelectorAll<HTMLInputElement>('[name="size"]')
let qualityInputs =
  document.querySelectorAll<HTMLInputElement>('[name="quality"]')

sizeInputs.forEach(input => {
  input.value = size.toString()
  input.addEventListener('input', () => {
    size = input.valueAsNumber
    sizeInputs.forEach(e => {
      if (e != input) {
        e.value = input.value
      }
    })
    draw()
  })
})
qualityInputs.forEach(input => {
  input.value = quality.toString()
  input.addEventListener('input', () => {
    quality = input.valueAsNumber
    qualityInputs.forEach(e => {
      if (e != input) {
        e.value = input.value
      }
    })
    draw()
  })
})
form.addEventListener('submit', e => {
  e.preventDefault()
})
form.addEventListener('change', e => {
  let input = e.target as HTMLInputElement
  if (input.name == 'imageMode') {
    mode = input.value
    scaled.style.imageRendering = mode
    fixedSize.style.imageRendering = mode
  }
})
form.imageMode.value = mode

function draw() {
  if (!sourceImage) return
  let w = round((W * size) / 100)
  let h = round((H * size) / 100)
  let dataUrl = resizeImage(sourceImage, w, h, 'image/jpeg', quality / 100)
  let blob = dataURItoBlob(dataUrl)
  outputSize.textContent = `${w}x${h} (${format_byte(blob.size)})`
  scaled.src = dataUrl
  scaled.width = w
  scaled.height = h
  fixedSize.src = dataUrl
}
