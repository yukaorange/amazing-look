import GSAP from 'gsap'
import { PerspectiveCamera, WebGLRenderer, Scene, Clock } from 'three'

import * as THREE from 'three'

import { Pane } from 'tweakpane'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'

import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'

import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

import { HoloEffect } from './class/HoloEffect'

// import PostProcessPipeline from './class/PostProcessPipeline'

import Home from './Home'

export default class Canvas {
  constructor({ template, dom, device }) {
    this.template = template

    this.container = dom

    this.device = device

    this.x = {
      start: 0,
      end: 0
    }

    this.y = {
      start: 0,
      end: 0
    }

    this.time = {
      current: 0,
      previous: 0,
      delta: 0
    }

    this.createRenderer()

    this.createScene()

    this.createCamera()

    this.createControls()

    this.createClock()

    // this.createPostProcessPipeline()
    this.createPostProcess()

    this.createPane()

    this.onResize(this.device)
  }

  createRenderer() {
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: true
    })

    this.renderer.setClearColor(0x050505, 1)

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping

    this.renderer.setSize(window.innerWidth, window.innerHeight)

    this.container.appendChild(this.renderer.domElement)
  }

  createScene() {
    this.scene = new Scene()
  }

  createCamera() {
    const fov = 45
    const aspect = window.innerWidth / window.innerHeight
    const near = 0.1
    const far = 1000

    this.camera = new PerspectiveCamera(fov, aspect, near, far)

    this.camera.position.set(-1.5, 1.5, 5)
  }

  createEnvironment() {
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer)

    this.pmremGenerator.compileEquirectangularShader()

    this.generatedEnvMap = this.pmremGenerator.fromEquirectangular(
      window.ENV_TEXTURE
    )

    window.ENV_MAP = this.generatedEnvMap.texture

    this.scene.envitonment = window.ENV_MAP

    this.pmremGenerator.dispose()
  }

  createPane() {
    this.pane = new Pane()

    this.PARAMS = {
      exposure: 1,
      threshold: 0.5,
      bloomStrength: 1.5,
      bloomRadius: 0.4,
      progress: 0
    }

    this.pane
      .addBinding(this.PARAMS, 'exposure', {
        min: 0,
        max: 3,
        step: 0.01
      })
      .on('change', value => {
        this.renderer.toneMappingExposure = value.value
      })

    this.pane
      .addBinding(this.PARAMS, 'threshold', {
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', value => {
        this.bloomPass.threshold = value.value
      })

    this.pane
      .addBinding(this.PARAMS, 'bloomStrength', {
        min: 0,
        max: 3,
        step: 0.01
      })
      .on('change', value => {
        this.bloomPass.strength = value.value
      })

    this.pane
      .addBinding(this.PARAMS, 'bloomRadius', {
        min: 0,
        max: 1,
        step: 0.01
      })
      .on('change', value => {
        this.bloomPass.radius = value.value
      })

    // this.pane
    //   .addBinding(this.PARAMS, 'progress', {
    //     min: 0,
    //     max: 1,
    //     step: 0.01
    //   })
    //   .on('change', value => {
    //     this.holoEffect.uniforms.uProgress.value = value.value
    //   })

    this.pane.containerElem_.style.display = 'none'
  }

  createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
  }

  createClock() {
    this.clock = new Clock()
  }

  /**
   * postprocess
   */

  // createPostProcessPipeline() {
  //   this.postProcessPipeline = new PostProcessPipeline({
  //     renderer: this.renderer,
  //     scene: this.scene,
  //     camera: this.camera
  //   })

  //   this.postProcessPipeline.createPasses()

  //   this.postProcessPipeline.createPostProcess()
  // }

  createPostProcess() {
    this.renderScene = new RenderPass(this.scene, this.camera)

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.5,
      0.5,
      0.08
    )

    this.holoEffect = new ShaderPass(HoloEffect)

    this.composer = new EffectComposer(this.renderer)

    this.composer.addPass(this.renderScene)

    this.composer.addPass(this.bloomPass)

    this.composer.addPass(this.holoEffect)
  }

  /**home */
  createHome() {
    this.home = new Home({
      scene: this.scene,
      sizes: this.sizes,
      device: this.device
    })
  }

  destroyHome() {
    this.home.destroy()
  }

  /**
   * events
   */

  onPreloaded() {
    this.createEnvironment()

    this.onChangeEnd(this.template)
  }

  onChangeStart(template) {
    if (this.template !== template && template !== 'home') {
      this.home.hide()
    }

    this.template = template
  }

  onChangeEnd(template) {
    if (template == 'home') {
      this.createHome()
    } else {
      this.destroyHome()
    }
  }

  onResize(device) {
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    this.composer.setSize(window.innerWidth, window.innerHeight)

    const aspect = window.innerWidth / window.innerHeight

    const fov = this.camera.fov * (Math.PI / 180) // default camera.fov = 45deg. result fov is in radians. (1/4 PI rad)

    const height = 2 * Math.tan(fov / 2) * this.camera.position.z //z = 5 is setted at this.createCamera

    const width = height * aspect //To fit clip space to screen.

    this.sizes = {
      //Calclated viewport space sizes.
      height: height,
      width: width
    }

    const values = {
      sizes: this.sizes,
      device: device
    }

    if (this.home) {
      this.home.onResize(values)
    }

    if (this.postProcessPipeline) {
      this.postProcessPipeline.resize(values)
    }

    this.camera.aspect = aspect

    this.camera.updateProjectionMatrix()
  }

  onTouchDown(event) {
    this.isDown = true

    this.x.start = event.touches ? event.touches[0].clientX : event.clientX
    this.y.start = event.touches ? event.touches[0].clientY : event.clientY

    const values = {
      x: this.x,
      y: this.y
    }

    if (this.about) {
      this.about.onTouchDown(values)
    }

    if (this.collections) {
      this.collections.onTouchDown(values)
    }

    if (this.detail) {
      this.detail.onTouchDown(values)
    }

    if (this.home) {
      this.home.onTouchDown(values)
    }
  }

  onTouchMove(event) {
    if (!this.isDown) return

    const x = event.touches ? event.touches[0].clientX : event.clientX
    const y = event.touches ? event.touches[0].clientY : event.clientY

    this.x.end = x
    this.y.end = y

    const values = {
      x: this.x,
      y: this.y
    }

    if (this.about) {
      this.about.onTouchMove(values)
    }

    if (this.collections) {
      this.collections.onTouchMove(values)
    }

    if (this.detail) {
      this.detail.onTouchMove(values)
    }

    if (this.home) {
      this.home.onTouchMove(values)
    }
  }

  onTouchUp(event) {
    this.isDown = false

    const x = event.changedTouches
      ? event.changedTouches[0].clientX
      : event.clientX
    const y = event.changedTouches
      ? event.changedTouches[0].clientY
      : event.clientY

    this.x.end = x
    this.y.end = y

    const values = {
      x: this.x,
      y: this.y
    }

    if (this.about) {
      this.about.onTouchUp(values)
    }

    if (this.collections) {
      this.collections.onTouchUp(values)
    }

    if (this.detail) {
      this.detail.onTouchUp(values)
    }

    if (this.home) {
      this.home.onTouchUp(values)
    }
  }

  onWheel({ pixelX, pixelY }) {
    if (this.collections) {
      // if (this.transition && this.transition.isTransitioning) return;

      this.collections.onWheel({ pixelX, pixelY })
    }

    if (this.home) {
      this.home.onWheel({ pixelX, pixelY })
    }
  }

  /**loop */

  update(scroll) {
    if (this.home) {
      this.home.update({
        scroll: scroll,
        time: this.time
      })
    }

    this.time.delta = this.clock.getDelta()

    this.time.previous = this.time.current

    this.time.current += this.time.delta

    this.holoEffect.uniforms.uTime.value = this.time.current

    // this.renderer.render(this.scene, this.camera)
    this.composer.render(this.scene, this.camera)
  }
}
