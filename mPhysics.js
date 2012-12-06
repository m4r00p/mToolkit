// FIXME: Add this below
// Updated to use a modification of the "returnExportsGlobal" pattern from https://github.com/umdjs/umd
//
// Math stuff is inspired by @link https://github.com/toji/gl-matrix 
//
(function (window, document, undefined) {
  'use strict';

  var sqrt = Math.sqrt;
  var MatrixArray = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
  var uid = function () {
    /* 0x10000 - 65536 */
    return Math.floor(Math.random() * 0x10000).toString(16) 
    + Math.floor(Math.random() * 0x10000).toString(16);
  };


  var mPhysics = {};
  var vec2 = mPhysics.vec2 = {}; 
  var vec3 = mPhysics.vec3 = {}; 
  var vec4 = mPhysics.vec4 = {}; 
  var mat2 = mPhysics.mat2 = {}; 
  var mat3 = mPhysics.mat3 = {}; 
  var mat4 = mPhysics.mat4 = {}; 
  var quat = mPhysics.quat = {}; 

  vec2.create = function () { return new MatrixArray(2); }; 
  vec4.create = function () { return new MatrixArray(3); }; 
  mat2.create = function () { return new MatrixArray(4); }; 
  mat3.create = function () { return new MatrixArray(9); }; 
  mat4.create = function () { return new MatrixArray(16); }; 
  quat.create = function () { return new MatrixArray(4); }; 

  vec3.create = function (vec) {
    var dest = new MatrixArray(3);

    if (vec) {
      dest[0] = vec[0];
      dest[1] = vec[1];
      dest[2] = vec[2];
    } else {
      dest[0] = dest[1] = dest[2] = 0;
    }

    return dest;
  }; 

  vec3.invert = function (vec) {
    vec[0] = -vec[0];
    vec[1] = -vec[1];
    vec[2] = -vec[2];
    return vec;
  };

  vec3.magnitude = function (vec) {
    return sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
  };

  vec3.squareMagnitude = function (vec) {
    return vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2];
  };

  vec3.normalize = function (vec) {
    var d = sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
    d = 1 / d;
    if (d > 0) {
      vec[0] *= d;
      vec[1] *= d;
      vec[2] *= d;
    }
    return vec;
  };

  vec3.multiply = function (vec, value) {
    vec[0] *= value;
    vec[1] *= value;
    vec[2] *= value;
    return vec;
  };

  vec3.add = function (vecA, vecB) {
    vecA[0] += vecB[0];
    vecA[1] += vecB[1];
    vecA[2] += vecB[2];
    return vecA;
  };

  vec3.subtract = function (vecA, vecB) {
    vecA[0] -= vecB[0];
    vecA[1] -= vecB[1];
    vecA[2] -= vecB[2];
    return vecA;
  };

  vec3.addScaledVector = function (vecA, vecB, scale) {
    vecA[0] += vecB[0] * scale;
    vecA[1] += vecB[1] * scale;
    vecA[2] += vecB[2] * scale;
    return vecA;
  };

  vec3.componentProduct = function (vecA, vecB) {
    var vec = vec3.create();
    vec[0] = vecA[0] * vecB[0];
    vec[1] = vecA[1] * vecB[1];
    vec[2] = vecA[2] * vecB[2];
    return vec;
  };

  vec3.componentProductUpdate = function (vecA, vecB) {
    vecA[0] *= vecB[0];
    vecA[1] *= vecB[1];
    vecA[2] *= vecB[2];
    return vecA;
  };

  vec3.scalarProduct = function (vecA, vecB) {
     return vecA[0] * vecB[0] + vecA[1] * vecB[1] + vecA[2] * vecB[2];
  };

  vec3.vectorProduct = function (vecA, vecB) {
    var vec = vec3.create();
    vec[0] = vecA[1] * vecB[2] - vecA[2] * vecB[1];
    vec[1] = vecA[2] * vecB[0] - vecA[0] * vecB[2];
    vec[2] = vecA[0] * vecB[1] - vecA[1] * vecB[0];
    return vec;
  };

  /**
   * Acceleration due to gravity on Earth.
   */
  mPhysics.gravity = vec3.create([0, -10, 0]);

  mPhysics.Particle = function () {
    this.position = vec3.create();
    this.velocity = vec3.create();
    this.acceleration = vec3.create();

    this.forceAccumulator = vec3.create();
  };
  /**
   * Holds the amount of damping applied to linear motion.
   * Damping is required to remove energy added through
   * numerical instability in the integrator.
   *
   * 0 - velocity each time reduce to zero, object couldn't sustain an motion without a force.
   * 1 - no damping
   * 0.999 - optimal to avoid numerical instability
   */
  mPhysics.Particle.prototype.damping = 0.999; 
  /**
   * Holds the inverse of the mass of the particle.
   * It more useful to hold the inverse mass because integration is simpler, and because in
   * real-time simulation it is more useful to have object with infinite mass (immovable)
   * than zero mass which is completely unstable in numerical simulation.
   */
  mPhysics.Particle.prototype.inverseMass = 1; 

  mPhysics.Particle.prototype.hasFiniteMass = function () {
    return this.inverseMass > 0;
  };

  mPhysics.Particle.prototype.getMass = function () {
    return 1 / this.inverseMass;
  };

  mPhysics.Particle.prototype.integrate = function (duration) {
    // Don't integrate things with infinite mass. (immovable things);
    if (this.inverseMass <= 0) {
      return;
    }
    /*
    console.log('--------------------------------------------------------------------');
    console.log('position:     ' + this.position[0] +' ' + this.position[1] + ' ' + this.position[2]);
    console.log('velocity:     ' + this.velocity[0] +' ' + this.velocity[1] + ' ' + this.velocity[2]);
    console.log('acceleration: ' + this.acceleration[0] +' ' + this.acceleration[1] + ' ' + this.acceleration[2]);
    console.log('force:        ' + this.forceAccumulator[0] +' ' + this.forceAccumulator[1] + ' ' + this.forceAccumulator[2]);
    /**/

    //Updating linear position.
    vec3.addScaledVector(this.position, this.velocity, duration); // p += v * t;
    //Considering add this below for usage huge accelerations.
    //vec3.addScaledVector(this.position, this.acceleration, duration * duration * 0.5); // u can even relace *0.5 with >>1
    
    // Work out the acceleration from the force.
    var acceleration = vec3.create(this.acceleration);
    vec3.addScaledVector(acceleration, this.forceAccumulator, this.inverseMass); // a += f / m;

    // Update linear velocity from the acceleration.
    vec3.addScaledVector(this.velocity, acceleration, duration); // v += a * t;

    // Impose drag.
    vec3.multiply(this.velocity, Math.pow(this.damping, duration)); // v = v * damping ^ t;

    // Clear the forces.
    this.clearAccumulator();
  }; 


  /**
   * Adds the given force to the particle to be applied once at the next iteration only.
   */
  mPhysics.Particle.prototype.addForce = function (vec) {
    vec3.add(this.forceAccumulator, vec);
  };

  /**
   * Clears the forces applied to the particle. This will be called automatically after each integration step.
   */
  mPhysics.Particle.prototype.clearAccumulator = function () {
    this.forceAccumulator[0] = 0;
    this.forceAccumulator[1] = 0;
    this.forceAccumulator[2] = 0;
  };


  mPhysics.ParticleForceRegistry = function () {
    this.particles = {};
    this.forces = {};
  };
  /**
   * Registers the given for generato to apply the given particle.
   */
  mPhysics.ParticleForceRegistry.prototype.add = function (particle, forceGenerator) {
    var particles = this.particles;
    var forces = this.forces;
    var keys = Object.keys(particles);
    var hash = null;

    // Check if particle currently exists in Registry
    for (var i = 0, leni = keys.length; i < leni; ++i) {
      if (particles[keys[i]] === particle) {
        hash = keys[i];
        break;
      } 
    }

    if (hash === null) {
      // Generate hashes until it not exists
      while (particle[hash = uid()]) {}
 
      particles[hash] = particle;
      forces[hash] = [];
    }
    
    forces[hash].push(forceGenerator);
  };

  mPhysics.ParticleForceRegistry.prototype.remove = function (particle, forceGenerator) {
    var particles = this.particles;
    var forces = this.forces;
    var keys = Object.keys(particles);
    var hash = null;

    // Check if particle currently exists in Registry
    for (var i = 0, leni = keys.length; i < leni; ++i) {
      if (particles[keys[i]] === particle) {
        hash = keys[i];
        break;
      } 
    }

    if (hash === null) {
      console.warn('Given particle does not exists in Registry!');
    }

    var particleForces = forces[hash];

    for (var i = 0, leni = particleForces.length; i < leni; ++i) {
      if (particleForces[i] === forceGenerator) {
        particleForces[i].splice(i, 1); // remove one entry so move back is required
        i -= 1; // move back one step to besure that all items are checked
      }
    }
  };

  mPhysics.ParticleForceRegistry.prototype.clear = function () {
    this.particles = {};
    this.forces = {};
  };

  mPhysics.ParticleForceRegistry.prototype.updateForces = function (duration) {
    var particles = this.particles;
    var forces = this.forces;
    var keys = Object.keys(particles);
    var hash = null;
    var particleForces = null;

    // Check if particle currently exists in Registry
    for (var i = 0, leni = keys.length, particle; i < leni; ++i) {
      hash = keys[i];
      particle = particles[hash];
      if (particle) {
        particleForces = forces[hash];

        for (var j = 0, lenj = particleForces.length; j < lenj; ++j) {
          particleForces[j].updateForce(particle, duration);
        }
      } 
    }
  };

  /**
   * Forces generators
   */
  mPhysics.ParticleForceGenerator = function () {};
  mPhysics.ParticleForceGenerator.prototype.updateForce = function (particle, duration) {};

  /**
   * Gravity force generator
   */
  mPhysics.ParticleGravity = function (gravity) {
    this.gravity = vec3.create(gravity);
  };

  mPhysics.ParticleGravity.prototype.updateForce = function (particle, duration) {
    //Do not apply to things with infinite mass.
    if (!particle.hasFiniteMass()) {
      return;
    }
    // Compute the mass-scaled force 
    var force = vec3.multiply(vec3.add(vec3.create(), this.gravity), particle.getMass()); 
    // Apply force to particle
    particle.addForce(force)
  };

  /**
   * Drag force generator
   */
  mPhysics.ParticleDrag = function (k1, k2) {
    /** holds the velocity drag coefficient. */
    this.k1 = k1;
    /** Holds the velocity squared drag coefficient. */
    this.k2 = k2;
  };

  mPhysics.ParticleDrag.prototype.updateForce = function (particle, duration) {
    var force = vec3.create(particle.velocity); 

    // Calculate the total drag coefficient.
    var drag = vec3.magnitude(force);
    drag = this.k1 * drag + this.k2 * drag * drag;

    // Calculate the final force and apply it.
    vec3.normalize(force);
    vec3.multiply(force, -drag);
    particle.addForce(force);
  };

  /**
   * Spring force generator
   */
  mPhysics.ParticleSpring = function (particle, springConstant, restLength) {
    this.particle = particle;
    this.springConstant = springConstant;
    this.restLength = restLength;
  };

  mPhysics.ParticleSpring.prototype.updateForce = function (particle, duration) {
    // Calculate the vector of the spring
    var force = vec3.create(particle.position); 
    vec3.subtract(force, this.particle.position);

    // Calculate the magnitude of the force.
    var magnitude = vec3.magnitude(force);
    magnitude = Math.abs(magnitude - this.restLength);
    magnitude *= this.springConstant;

    // Calculate the final force and apply it.
    vec3.normalize(force);
    vec3.multiply(force, -magnitude);
    particle.addForce(force);
  };

  /**
   * Anchored spring force generator
   */
  mPhysics.ParticleAnchoredSpring = function (anchor, springConstant, restLength) {
    this.anchor = anchor;
    this.springConstant = springConstant;
    this.restLength = restLength;
  };

  mPhysics.ParticleAnchoredSpring.prototype.updateForce = function (particle, duration) {
    // Calculate the vector of the spring
    var force = vec3.create(particle.position); 
    vec3.subtract(force, this.anchor);

    // Calculate the magnitude of the force.
    var magnitude = vec3.magnitude(force);
    magnitude = (this.restLength - magnitude) * this.springConstant;

    // Calculate the final force and apply it.
    vec3.normalize(force);
    vec3.multiply(force, magnitude);

    particle.addForce(force);
  };

  /**
   * Anchored bungee spring force generator
   */
  mPhysics.ParticleAnchoredBungee = function (anchor, springConstant, restLength) {
    this.anchor = anchor;
    this.springConstant = springConstant;
    this.restLength = restLength;
  };

  mPhysics.ParticleAnchoredBungee.prototype.updateForce = function (particle, duration) {
    // Calculate the vector of the spring
    var force = vec3.create(particle.position); 
    vec3.subtract(force, this.anchor);

    // Calculate the magnitude of the force.
    var magnitude = vec3.magnitude(force);
    if (magnitude <= this.restLength) {
      return;
    }

    magnitude = (this.restLength - magnitude) * this.springConstant;

    // Calculate the final force and apply it.
    vec3.normalize(force);
    vec3.multiply(force, magnitude);
    particle.addForce(force);
  };

  /**
   * Buoyancy force generator
   */
  mPhysics.ParticleBuoyancy = function (maxDepth, volume, waterHeight, liquidDensity) {
    this.maxDepth = maxDepth;
    this.volume = volume;
    this.waterHeight = waterHeight;
    this.liquidDensity = liquidDensity || 1000;
    // normal water 1000 kg m^3
    // ocean water  1020 kg m^3
    // dead see     1250 kg m^3
  };

  mPhysics.ParticleBuoyancy.prototype.updateForce = function (particle, duration) {
    // Calcualte the submersion depth.
    var depth = particle.position[1];

    // Check if we-re out of the water.
    if (depth >= this.waterHeight + this.maxDepth) {
      return;
    }

    var force = vec3.create();

    //Check if we're at maximum depth.
    if (depth <= this.waterHeight - this.maxDepth) {
      force[1] = this.liquidDensity * volume;
    } else {
      force[1] = this.liquidDensity * volume * (depth - this.maxDepth - this.waterHeight) / 2 * this.maxDepth;
    }

    particle.addForce(force)
  };

  /**
   * Anchored Fake spring force generator
   * @see page 107
   */
  mPhysics.ParticleAnchoredFakeSpring = function (anchor, springConstant, damping) {
    this.anchor = anchor;
    this.springConstant = springConstant;
    this.damping = damping;
  };

  /**
   * @see page 107
   */
  mPhysics.ParticleAnchoredFakeSpring.prototype.updateForce = function (particle, duration) {
    // Check that we do not have infinite mass.
    if (!particle.hasFiniteMass()) {
      return;
    }

    // Calculate the relative position of the particle to the anchor.
    var position = vec3.create(particle.position);
    vec3.subtract(position, this.anchor);

    // Calculate the constants and check that they are in bounds.
    var gamma = 0.5 * Math.sqrt(4 * this.springConstant - this.damping *  this.damping);
    if (gamma == 0) {
      return;
    }

    var c = vec3.add(vec3.multiply(vec3.create(position), (this.damping/ (2 * gamma))),
    vec3.multiply(vec3.create(particle.velocity), 1/gamma));

    //Calcualte the target position.
    var target = vec3.add(vec3.multiply(vec3.create(position), Math.cos(gamma * duration)),
    vec3.multiply(c, Math.sin(gamma * duration)));

    vec3.multiply(target, Math.exp(-0.5 * duration * this.damping));

    // Calculate the resulting acceleration, and therefore the force.
    var acceleration = vec3.subtract(vec3.multiply(vec3.subtract(target, position), 1 / duration * duration),
    vec3.multiply(vec3.create(particle.velocity), duration));

    particle.addForce(vec3.multiply(acceleration, particle.getMass()));
  };


  window.mPhysics = mPhysics;

})(this, document);
