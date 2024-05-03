import Component from '@js/class/Component'
import each from 'lodash/each'
import GSAP from 'gsap'
import { TextureLoader } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

const modelPass = '/model/hand-bone.glb'
// const env = '/textures/environment-map.jpg'
const env = '/textures/hologram-map.webp'

export default class Preloader extends Component {
  constructor() {
    super({
      element: '.preloader',
      elements: {
        loading: '.preloader__loading',
        text: '.preloader__text',
        assets: '.preloader__assets'
      }
    })

    window.TEXTURES = {}

    this.length = 0

    this.createLoader()
  }

  createLoader() {
    this.assets = [...this.elements.assets.querySelectorAll('img')]

    this.totalAssetsLength = this.assets.length

    this.textureLoader = new TextureLoader()

    this.dracoLoader = new DRACOLoader()

    this.dracoLoader.setDecoderPath('/draco/')

    this.gltfLoader = new GLTFLoader()

    this.gltfLoader.setDRACOLoader(this.dracoLoader)

    const modelPromise = new Promise((resolve, reject) => {
      this.gltfLoader.load(
        modelPass,
        model => {
          window.DRACO_MODEL = model
          resolve()
        },
        undefined,
        error => {
          reject(error)
        }
      )
    })

    const envPromise = new Promise((resolve, reject) => {
      this.textureLoader.load(
        env,
        texture => {
          window.ENV_TEXTURE = texture
          resolve()
        },
        undefined,
        error => {
          reject(error)
        }
      )
    })

    const imagePromises = this.assets.map(imageDOM => {
      return new Promise((resolve, reject) => {
        const image = new Image()

        const id = imageDOM.getAttribute('data-id')

        image.crossOrigin = 'anonymous'

        image.src = imageDOM.getAttribute('data-src')

        image.onload = () => {
          const texture = this.textureLoader.load(image.src)

          texture.needsUpdate = true

          window.TEXTURES[id] = texture

          this.onAssetLoaded()

          resolve()
        }

        image.onerror = error => {
          reject(error)
        }
      })
    })

    Promise.all([modelPromise, ...imagePromises, envPromise]).then(() => {
      this.onLoaded()
    })
  }

  onAssetLoaded() {
    this.length += 1

    const percent = this.length / this.totalAssetsLength

    this.elements.text.innerHTML = `${Math.round(percent * 100)}%`

    // if (this.length === this.totalAssetsLength) {
    //   this.onLoaded()
    // }
  }

  onLoaded() {
    return new Promise(resolve => {
      this.emit('completed')
      this.destroy()
      resolve()
    })
  }

  /**
   * destroy
   */

  destroy() {
    this.element.parentNode.removeChild(this.element)
  }
}
