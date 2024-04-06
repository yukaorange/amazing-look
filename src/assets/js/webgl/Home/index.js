import map from 'lodash/map'
import GSAP from 'gsap'

import * as THREE from 'three'

import Human from './human'

export default class Home {
  constructor({ scene, sizes, device }) {
    this.scene = scene

    this.sizes = sizes

    this.device = device

    this.x = {
      current: 0,
      target: 0,
      lerp: 0.1
    }

    this.y = {
      current: 0,
      target: 0,
      lerp: 0.1
    }

    this.scrollCurrent = {
      //necessary to memolize touchstart position.
      x: 0,
      y: 0
    }

    this.scroll = {
      x: 0,
      y: 0
    }

    this.speed = {
      current: 0,
      target: 0,
      lerp: 0.1
    }

    this.createHuman()

    this.scene.add(this.human.modelScene)

    this.onResize({
      sizes: this.sizes,
      device: this.device
    })

    this.show()
  }

  createHuman() {
    this.human = new Human({
      sizes: this.sizes,
      device: this.device
    })
  }

  /**
   * animate
   */

  show() {
    this.human.show()
  }

  hide() {
    this.human.hide()
  }

  /**
   * events
   */
  onResize(values) {
    if (this.human) {
      this.human.onResize(values)
    }
  }

  onTouchDown({ x, y }) {
    this.speed.target = 1
    this.scrollCurrent.x = this.scroll.x
    this.scrollCurrent.y = this.scroll.y
  }

  onTouchMove({ x, y }) {
    const xDistance = x.start - x.end
    const yDistance = y.start - y.end

    this.x.target = this.scrollCurrent.x - xDistance
    this.y.target = this.scrollCurrent.y - yDistance
  }

  onTouchUp({ x, y }) {
    this.speed.target = 0
  }

  onWheel({ pixelX, pixelY }) {
    this.x.target -= pixelX
    this.y.target -= pixelY
  }

  /**
   * update
   */
  update({ scroll, time }) {
    if (!this.human) return

    this.human.update({
      scroll: scroll,
      time: time
    })
  }

  /**
   * destroy
   */
  destroy() {
    this.scene.remove(this.human.mesh)
  }
}
