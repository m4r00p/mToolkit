// FIXME: Add this below
// Updated to use a modification of the "returnExportsGlobal" pattern from https://github.com/umdjs/umd
//
// Math stuff is inspired by @link https://github.com/toji/gl-matrix 
//
(function (window, document, undefined) {
  'use strict';

  var sqrt = Math.sqrt;
  var MatrixArray = (typeof Float32Array !== 'undefined') ? Float32Array : Array;

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
    return sqrt(vec[0] * vec[0] * vec[1] * vec[1] * vec[2] * vec[2]);
  };

  vec3.squareMagnitude = function (vec) {
    return vec[0] * vec[0] * vec[1] * vec[1] * vec[2] * vec[2];
  };

  vec3.normalize = function (vec) {
    var d = sqrt(vec[0] * vec[0] * vec[1] * vec[1] * vec[2] * vec[2]);
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
  mPhysics.g = vec3.create([0, -10, 0]);

  mPhysics.Particle = function () {
    this.position = vec3.create();
    this.velocity = vec3.create();
    this.acceleration = vec3.create();
  };
  /**
   * Holds the amount of damping applied to linear motion.
   * Damping is required to remove energy added through
   * numerical instability in the integrator.
   *
   * 0 - velocity each time reduce to zero, object couldn't sustain an motion without a force.
   * 1 - no damping
   * 0.9999 - optimal to avoid numerical instability
   */
  mPhysics.Particle.prototype.damping = 1; 
  /**
   * Holds the inverse of the mass of the particle.
   * It more useful to hold the inverse mass because integration is simpler, and because in
   * real-time simulation it is more useful to have object with infinite mass (immovable)
   * than zero mass which is completely unstable in numerical simulation.
   */
  mPhysics.Particle.prototype.inverseMass = 1; 

  mPhysics.Particle.prototype.integrate = function (duration) {
    // Don't integrate things with infinite mass. (immovable things);
    if (this.inverseMass <= 0) {
      return;
    }

    //Updating linear position.
    vec3.addScaledVector(this.position, this.velocity, duration);
    //Considering add this below for usage huge accelerations.
    //vec3.addScaledVector(this.position, this.acceleration, duration * duration * 0.5); // u can even relace *0.5 with >>1
    
    // Work out the acceleration from the force.
    // Prepared for future forces.
    var acceleration = this.acceleration;
    vec3.addScaledVector(this.velocity, acceleration, duration);

    // Impose drag.
    vec3.multiply(this.velocity, Math.pow(this.damping, duration));

    // Clear the forces.
    this.clearAccumulator();
  }; 

  mPhysics.Particle.prototype.clearAccumulator = function () {
    //TODO
  };

  window.mPhysics = mPhysics;

})(this, document);
