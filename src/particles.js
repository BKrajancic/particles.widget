// Floating particles effect
// Heavily modified from https://github.com/JulianLaval/canvas-particle-network

"use strict" // Does this do anything?
const TPI = 2.0 * Math.PI

function randomSelect(list) {
  // NB: Math.random is always less than 1.0
  return list[Math.floor(Math.random() * list.length)]
}

class Drift {

  constructor (maxVelocity) {
    this.limV = maxVelocity
    this.step = 0
    this.dx = 0.0
    this.dy = 0.0
  }

  changeDirection(step) {

  }

  update(rand) {

  }

  drift(x, y) {
    return [0.2, 0.2]
  }

}

class Particle {
  constructor (parent) {
    this.parent = parent
    this.x = Math.random() * parent.limx
    this.y = Math.random() * parent.limy
    this.vx = (Math.random() - 0.5) * parent.opts.velocity
    this.vy = (Math.random() - 0.5) * parent.opts.velocity
    this.size = Math.random() * 3.5 + 0.5
    this.vs = 0
    this.color = randomSelect(parent.opts.colors)
  }

  update(rand, drift) {
    const ddrift = drift.drift(this.x, this.y)
    this.x = (this.x + this.vx + ddrift[0]) % this.parent.limx
    this.y = (this.y + this.vy + ddrift[1]) % this.parent.limy

    // Size change
    if (this.size < this.parent.opts.sizeMin) this.vs += rand * this.parent.opts.sizeScale
    else if (this.size > this.parent.opts.sizeMax) this.vs -= rand * this.parent.opts.sizeScale
    else this.vs += (rand - 0.5) * this.parent.opts.sizeScale

    this.size += this.vs
    if (this.size < 0) this.size = 0
  }

  draw() {
    const ctx = this.parent.ctx
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, TPI)
    ctx.fill()
  }
}

class ParticleNetwork {
  constructor (elementId, options) {
    this.opts = options

    this.canvasDiv = document.getElementById(elementId)
    this.canvasDiv.size = {
      'width': this.canvasDiv.offsetWidth,
      'height': this.canvasDiv.offsetHeight
    }

    // Create canvas & context - Also not sure why this can't just be HTML
    this.canvas = document.createElement('canvas')
    this.canvasDiv.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')
    this.canvas.width = this.canvasDiv.size.width
    this.canvas.height = this.canvasDiv.size.height
    this.setStyles(this.canvasDiv, { 'position': 'relative' })
    this.setStyles(this.canvas, {
      'z-index': '-1',
      'position': 'relative'
    })

    this.limx = this.canvas.width
    this.limy = this.canvas.height

    this.drift = new Drift()

    // Initialize particles
    this.particles = []
    this.numParticles = Math.round(this.canvas.width * this.canvas.height / this.opts.sparsity)
    this.run = false
    this.fade = 0

    for (let i = 0; i < this.numParticles; i++)
      this.particles.push(new Particle(this))

    this.boundUpdate = this.update.bind(this)
  }

  update() {
    const np = this.vizCount
    let ctx = this.ctx
    const rand = Math.random()

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const frameFade = this.fade < this.opts.fadeFrames ? this.fade / this.opts.fadeFrames : 1.0

    for (let i = 0; i < this.numParticles; i++) {
      const pi = this.particles[i]
      pi.update(rand, this.drift)
      for (let j = this.numParticles - 1; j > i; j--) {
        const pj = this.particles[j]

        // what fun would that be?
        if (pj.color == pi.color) continue

        const distanceIsh = Math.abs(pi.x - pj.x) + Math.abs(pi.y - pj.y)
        if (distanceIsh > this.opts.range) continue

        const sqrtAlpha = (this.opts.range - distanceIsh) / this.opts.range
        ctx.globalAlpha = sqrtAlpha * sqrtAlpha * frameFade
        pi.draw()
        pj.draw()
      }
    }

    if (this.run) {
      if (this.fade < this.opts.fadeFrames) this.fade++
    } else {
      if (this.fade > 0) this.fade--
    }

    if (this.fade > 0) {
      setTimeout(this.boundUpdate, this.opts.updateMs)
    }
  }

  start() {
    if (!this.run) {
      this.run = true
      this.update()
    }
  }

  stop() {
    this.run = false
  }

  setStyles(div, styles) {
    for (let property in styles) {
      div.style[property] = styles[property]
    }
  }
}
