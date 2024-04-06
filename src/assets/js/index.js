import each from 'lodash/each'
import normalizeWheel from 'normalize-wheel'

import BreakpointsObserver from '@js/class/BreakpointsObserver'

import Canvas from '@js/webgl'

import Preloader from '@js/component/Preloader'
import DrawerNavigation from '@js/component/DrawerNavigation'

import Home from '@js/pages/Home/Home'

const assets = document.querySelectorAll('.preloader img')

class App {
  constructor() {
    this.createBreakPoint()

    this.createContent()

    this.createPreloader()

    this.createCanvas()

    this.createNavigation()

    this.createPages()

    this.addEventListeners()

    this.addLinkListeners()

    this.update()

    this.onResize()
  }

  createContent() {
    this.content = document.querySelector('.content')

    this.template = this.content.getAttribute('data-template')
  }

  createCanvas() {
    this.canvas = new Canvas({
      template: this.template,
      dom: document.querySelector('#webgl'),
      device: this.device
    })
  }

  createPreloader() {
    this.preloader = new Preloader()

    this.preloader.once('completed', () => {
      this.onPreloaded()
    })
  }

  createBreakPoint() {
    this.breakPoint = new BreakpointsObserver()

    this.device = this.breakPoint.currentDevice
  }

  /**
   * preloader
   * */

  onPreloaded() {
    this.onResize()

    this.canvas.onPreloaded()

    this.page.show()
  }

  createNavigation() {
    this.navigation = new DrawerNavigation()
  }

  createPages() {
    this.pages = {
      home: new Home()
    }

    this.page = this.pages[this.template]

    this.page.create()
  }

  // Listeners
  addEventListeners() {
    window.addEventListener('popstate', event => {
      this.onPopState(event)
    })

    window.addEventListener('mousedown', event => {
      this.onTouchDown(event)
    })

    window.addEventListener('mousemove', event => {
      this.onTouchMove(event)
    })

    window.addEventListener('mouseup', event => {
      this.onTouchUp(event)
    })

    window.addEventListener('touchstart', event => {
      this.onTouchDown(event)
    })

    window.addEventListener('touchmove', event => {
      this.onTouchMove(event)
    })

    window.addEventListener('touchend', event => {
      this.onTouchUp(event)
    })

    window.addEventListener('wheel', event => {
      this.onWheel(event)
    })

    window.addEventListener('resize', event => {
      this.onResize(event)
    })
  }

  /**
   * events
   */

  onResize() {
    this.device = this.breakPoint.currentDevice

    if (this.page && this.page.onResize) {
      this.page.onResize()
    }

    setTimeout(() => {
      const newWidth = window.innerWidth

      const widthDifference = Math.abs(this.currentWidth - newWidth)

      if (widthDifference <= 0.1) {
        this.resizeFlag = false
      } else {
        this.resizeFlag = true
      }
    }, 10)

    if (this.canvas && this.canvas.onResize && this.resizeFlag === true) {
      this.canvas.onResize(this.device)
    }
  }

  onTouchDown(event) {
    if (this.canvas && this.canvas.onTouchDown) {
      this.canvas.onTouchDown(event)
    }
  }

  onTouchMove(event) {
    if (this.page && this.canvas.onTouchMove) {
      this.canvas.onTouchMove(event)
    }
  }

  onTouchUp(event) {
    if (this.canvas && this.canvas.onTouchUp) {
      this.canvas.onTouchUp(event)
    }
  }

  onWheel(event) {
    const normalizedWheel = normalizeWheel(event)

    if (this.canvas && this.canvas.update) {
      this.canvas.onWheel(normalizedWheel)
    }

    if (this.page && this.page.update) {
      this.page.onWheel(normalizedWheel)
    }
  }

  /**
   * link
   */
  addLinkListeners() {
    const links = document.querySelectorAll('a')

    each(links, link => {
      link.onclick = event => {
        const { href } = link

        event.preventDefault()

        this.onChange({ url: href })
      }
    })
  }

  /**
   * page transition
   */
  onPopState() {
    this.onChange({
      url: window.location.pathname,
      push: false
    })
  }

  async onChange({ url, push = true }) {
    if (this.onChanging) {
      return //I'm worrying that this method is gonna be called multiplex times and is's bring some trouble for the user interface.
    }

    this.onChanging = true

    this.canvas.onChangeStart(this.template)

    await this.page.hide()

    const request = await window.fetch(url)

    if (request.status === 200) {
      const html = await request.text()

      const perser = new DOMParser()

      const doc = perser.parseFromString(html, 'text/html')

      const title = doc.querySelector('title').innerText

      if (title) {
        document.title = title
      }

      const metaDescription = doc.querySelector('meta[name="description"]')

      this.updateMetaDescription(metaDescription)

      const div = document.createElement('div')

      if (push) {
        window.history.pushState({}, '', url)
      }

      div.innerHTML = html

      const divContent = div.querySelector('.content')

      this.template = divContent.getAttribute('data-template')

      this.content.setAttribute('data-template', this.template)

      // this.navigation.onChange(this.template)

      this.content.innerHTML = divContent.innerHTML

      this.canvas.onChangeEnd(this.template)

      this.page = this.pages[this.template]

      this.page.create()

      this.onResize()

      this.page.show()

      this.addLinkListeners() //q I'm worrying that this method is called multiplex times and it's not necessary to call it again and again. Just it's gonna make trouble for the browser.

      this.onChanging = false
    } else {
      console.log('error')

      this.onChanging = false
    }
  }

  updateMetaDescription(metaDescriptionContent) {
    let currentMetaDescription = document.querySelector(
      'meta[name="description"]'
    )

    if (currentMetaDescription) {
      currentMetaDescription.setAttribute('content', metaDescriptionContent)
    } else {
      currentMetaDescription = document.createElement('meta')

      currentMetaDescription.setAttribute('name', 'description')

      currentMetaDescription.setAttribute('content', metaDescriptionContent)

      document.head.appendChild(currentMetaDescription)
    }
  }

  /**
   * update
   */
  update() {
    if (this.page && this.page.update) {
      this.page.update()
    }

    if (this.canvas && this.canvas.update) {
      this.canvas.update(this.page.scroll)
    }

    this.frame = window.requestAnimationFrame(() => {
      this.update()
    })
  }
}

new App()
