import { WebGLRenderTarget } from 'three'

import PostProcess from './PostProcess'

import GrayScalePass from './GrayScalePass'
import GreenPass from './GreenPass'
import BluePass from './BluePass'
import OutPass from './OutPass'

export default class PostProcessPipeline {
  constructor({ renderer, scene, camera }) {
    this.renderer = renderer

    this.scene = scene

    this.camera = camera

    this.passes = null

    this.sceneRenderTarget = new WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    )
  }

  createPasses() {
    this.passes = {
      // grayScale: new GrayScalePass(),
      // green: new GreenPass(),
      // blue: new BluePass(),
      out: new OutPass()
    }
  }

  createPostProcess() {
    this.postProcess = new PostProcess({
      renderer: this.renderer,
      passes: this.passes
    })
  }

  render() {
    const origin = this.renderer.getRenderTarget()

    this.renderer.setRenderTarget(this.sceneRenderTarget)

    this.renderer.render(this.scene, this.camera)

    this.postProcess.render({
      texture: this.sceneRenderTarget.texture
    })

    this.renderer.setRenderTarget(origin)
  }

  resize(values) {
    // console.log(values);
    this.sceneRenderTarget.setSize(window.innerWidth, window.innerHeight)

    if (this.postProcess) {
      this.postProcess.resize(values)
    }
  }
}
