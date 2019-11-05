function lerp ( x, y, t ) {
  return ( 1 - t ) * x + t * y;
}

function noEase (u) {
  return u
}




/*
  TODO:
    - [ ] on window loose focus we'll need to pause all the tweens...
*/

class LilTweenManager {

  constructor () {
    this._stopped = true
    this.tweens = []
    this.updateFunc = this.update.bind(this)
  }

  start() {
    if(this._stopped){
      this._stopped = false
      this.update()
    }
  }

  stop() {
    this._stopped = true
  }

  update(time=performance.now()) {


    if(!this._stopped) {

      for(var i=this.tweens.length-1; i>=0; i--) {

        this.tweens[i].update(time)

        if(this.tweens[i]._stopped) {
          this.removeTweenByIndex(i)
        }
      }

      window.requestAnimationFrame( this.updateFunc );
    }

  }

  addTween( tween ) {
    this.tweens.push(tween)
  }

  removeTweenByIndex(index) {
    this.tweens.splice( index, 1 );
  }

  removeTween( tween ) {

    var index = this.tweens.indexOf( tween )
    if (index !== -1) {
      this.tweens.splice( index, 1 );
    }

  }
}

const manager = new LilTweenManager()



class LilTween {

  constructor(options={}) {
    Object.assign(this, {
      _chainedTweens: [],
      _endTime: 0,
      _manage: true,
      _started: false,
      _startTime: 0,
      _stopped: true,
      _useRAF: false,
      _isReversed: false,
      autoReverse: false,
      delay: 0,
      duration: 300,
      ease: noEase,
      from: 0,
      loop: false,
      onEnd: null,
      onStart: null,
      onUpdate: null,
      to: 1,
      value: 0
    }, options)

    this.value = this.from

    // add it to the Manager
    if(this._manage){
      manager.addTween(this)
    }
  }

  start(startDelay = 0) {

    this._startTime = startDelay + this.delay + performance.now()

    if(this._manage){
      if(this._useRAF) {
        this._rAF()
      } else {
        if(this._stopped) {
          // if it's stopped it's probably been removed from the manager
          // so I'm assuming we need to add it again, this might cause
          // duplicate tweens in our array but I'm not sure yet
          manager.addTween(this)
        }
        manager.start()
      }
    }

    this._stopped = false
  }

  stop() {
    this._stopped = true
  }

  update(t = performance.now()) {

    if (this._stopped) {

      // nothing

    } else if(t < this._startTime) {

      // sit tight

    } else if(t >= this._startTime + this.duration) {

      // this needs to stop
      this._stopped = true
      this._started = false
      var u = 1

      this.value = lerp(this.from, this.to, this.ease(this._isReversed ? 1 - u : u))

      // callbacks
      if(this.onUpdate) {
        this.onUpdate(this.value, u, this)
      }
      if(this.onEnd) {
         this.onEnd(this.value, this)
      }

      // chaining
      this._chainedTweens.forEach( t => {
        t.start()
      })

      //
      if(this.autoReverse) {

        this._isReversed = !this._isReversed
        // var swapper = this.from
        // this.from = this.to
        // this.to = swapper
      }

      if(this.loop) {
        this.start()
        this._startTime = t + this.delay// <-- hack to compensate for a single frame (16.66ms) delay
      }

    } else {

      // start things off if need be
      if(!this._started) {
        this._started = true
        if(this.onStart) this.onStart( this.from, this )
      }

      // UPDATE
      var elapsedTime = t - this._startTime
      var u = elapsedTime / this.duration
      this.value = lerp(this.from, this.to, this.ease(this._isReversed ? 1 - u : u))

      if(this.onUpdate) {
        this.onUpdate( this.value, u, this )
      }

    }

    if(this._useRAF && !this._stopped) {
      this._rAF()
    }
  }

  chain (tween) {
    this._chainedTweens.push(tween)
    return this
  }

  _rAF() {
    window.requestAnimationFrame( this.update.bind(this) );
  }

}


export {LilTween, manager as LilTweenManager}

