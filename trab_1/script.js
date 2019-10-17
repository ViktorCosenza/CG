// WebGL2 - Scene Graph - Solar System
// from https://webgl2fundamentals.org/webgl/webgl-scene-graph-solar-system-adjusted.html


"use strict"


function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.getElementById("canvas");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  twgl.setAttributePrefix("a_");

  var sphereBufferInfo = flattenedPrimitives.createSphereBufferInfo(gl, 10, 12, 6);
  var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
  var sphereVAO = twgl.createVAOFromBufferInfo(gl, programInfo, sphereBufferInfo);


  var fieldOfViewRadians = degToRad(90);

  var objectsToDraw = [];
  var objects = [];

  var solarSystemNode = new Node();
  var earthOrbitNode = new Node();
  var moonOrbitNode = new Node();
  earthOrbitNode.localMatrix = m4.translation(100, 0, 0);
  moonOrbitNode.localMatrix = m4.translation(30, 0, 0);

  const sunNode = createPlanet([0.6, 0.6, 0, 1], [0.4, 0.4, 0, 1], 1)
  const earthNode = createPlanet([0.2, 0.5, 0.8, 1], [0.8, 0.5, 0.2, 1], 0.5);
  const moonNode = createPlanet([0.6, 0.6, 0.6, 1], [0.1, 0.1, 0.1, 1], 0.1)
  
  // connect the celetial objects
  sunNode.setParent(solarSystemNode);
  earthOrbitNode.setParent(solarSystemNode);
  earthNode.setParent(earthOrbitNode);
  moonOrbitNode.setParent(earthOrbitNode);
  moonNode.setParent(moonOrbitNode);

  const orbits = [earthOrbitNode, moonOrbitNode]

  var objects = [
    sunNode,
    earthNode,
    moonNode,
  ];

  var objectsToDraw = [
    sunNode.drawInfo,
    earthNode.drawInfo,
    moonNode.drawInfo,
  ];

  requestAnimationFrame(drawScene);

  /* Functions */
  function createPlanet (color, colorMult, scale) {
    const planet = new Node();
    planet.localMatrix = m4.scaling(scale, scale, scale)
    planet.drawInfo = {
      uniforms: {
        u_colorOffset: color,  
        u_colorMult:   colorMult,
      },
      programInfo: programInfo,
      bufferInfo: sphereBufferInfo,
      vertexArray: sphereVAO,
    }
    return planet
  }

  function drawScene(time) {
    time *= 0.001;

    twgl.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);


    // Clear the canvas AND the depth buffer.
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix =
        m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    var cameraPosition = [0, -200, 0];
    var target = [0, 0, 0];
    var up = [0, 0, 1];
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);
    var viewMatrix = m4.inverse(cameraMatrix);
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    m4.multiply(m4.yRotation(0.01), earthOrbitNode.localMatrix, earthOrbitNode.localMatrix);
    m4.multiply(m4.yRotation(0.01), moonOrbitNode.localMatrix, moonOrbitNode.localMatrix);

    m4.multiply(m4.yRotation(0.005), sunNode.localMatrix, sunNode.localMatrix);
    m4.multiply(m4.yRotation(0.5), earthNode.localMatrix, earthNode.localMatrix);
    m4.multiply(m4.yRotation(-0.01), moonNode.localMatrix, moonNode.localMatrix);

    solarSystemNode.updateWorldMatrix();
    objects.forEach(function(object) {
        object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.worldMatrix);
    });
    twgl.drawObjectList(gl, objectsToDraw);
    
    requestAnimationFrame(drawScene);
  }

  function computeSpin() {
    
  }
}

/* Boilerplate */

var vs = `#version 300 es
in vec4 a_position;
in vec4 a_color;
uniform mat4 u_matrix;
out vec4 v_color;
void main() {gl_Position = u_matrix * a_position;v_color = a_color;}`

var fs = `#version 300 es
precision mediump float;
in vec4 v_color;
uniform vec4 u_colorMult;
uniform vec4 u_colorOffset;
out vec4 outColor;
void main() {outColor = v_color * u_colorMult + u_colorOffset;}`

var Node = function() {
  this.children = [];
  this.localMatrix = m4.identity();
  this.worldMatrix = m4.identity();
};

Node.prototype.setParent = function(parent) {
  // remove us from our parent
  if (this.parent) {
    var ndx = this.parent.children.indexOf(this);
    if (ndx >= 0) {
      this.parent.children.splice(ndx, 1);
    }
  }

  // Add us to our new parent
  if (parent) {
    parent.children.push(this);
  }
  this.parent = parent;
};

Node.prototype.updateWorldMatrix = function(matrix) {
  if (matrix) {
    // a matrix was passed in so do the math
    m4.multiply(matrix, this.localMatrix, this.worldMatrix);
  } else {
    // no matrix was passed in so just copy.
    m4.copy(this.localMatrix, this.worldMatrix);
  }

  // now process all the children
  var worldMatrix = this.worldMatrix;
  this.children.forEach(function(child) {
    child.updateWorldMatrix(worldMatrix);
  });
};


function degToRad(d) {
  return d * Math.PI / 180;
}



main();