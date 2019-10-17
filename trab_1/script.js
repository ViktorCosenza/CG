// WebGL2 - Scene Graph - Solar System
// from https://webgl2fundamentals.org/webgl/webgl-scene-graph-solar-system-adjusted.html


"use strict"


function main() {
  const canvas = document.getElementById("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) throw Error('Browser does not support opengl')

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  twgl.setAttributePrefix("a_");

  var cameraPosition = [0, -200, 0];
  var target = [0, 0, 0];
  var up = [0, 0, 1];
  var cameraMatrix = m4.lookAt(cameraPosition, target, up);
  var viewMatrix = m4.inverse(cameraMatrix);
  var fieldOfViewRadians = degToRad(90);

  var sphereBufferInfo = flattenedPrimitives.createSphereBufferInfo(gl, 10, 12, 6);
  var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
  var sphereVAO = twgl.createVAOFromBufferInfo(gl, programInfo, sphereBufferInfo);

  const sunNode = createPlanet([0.6, 0.6, 0, 1], [0.4, 0.4, 0, 1], 1, 0.005)
  const earthNode = createPlanet([0.2, 0.5, 0.8, 1], [0.8, 0.5, 0.2, 1], 0.5, 0.5);
  const moonNode = createPlanet([0.6, 0.6, 0.6, 1], [0.1, 0.1, 0.1, 1], 0.1, -0.01)

  const mercury = createPlanet([1, 1, 1, 1], [0.5, 0.5, 0.5, 0.5], 0.5, -0.5)
  const mercuryOrbit = new Node(0.01, [mercury])
  
  const moonOrbitNode = new Node(0, [moonNode]);
  const earthOrbitNode = new Node(0.05, [earthNode, moonOrbitNode], 0.5);
  const solarSystemNode = new Node(0.0, [earthOrbitNode, mercuryOrbit, sunNode]);

  earthOrbitNode.localMatrix = m4.translation(100, 0, 0)
  moonOrbitNode.localMatrix = m4.translation(30, 0, 0)
  mercuryOrbit.localMatrix = m4.translation(30, 0, 0)

  var objects = [
    sunNode,
    earthNode,
    moonNode,
    mercury
  ];

  var objectsToDraw = [
    sunNode.drawInfo,
    earthNode.drawInfo,
    moonNode.drawInfo,
    mercury.drawInfo
  ];

    requestAnimationFrame(drawScene);

  /* Functions */
  function createPlanet (color, colorMult, scale, rotation, children=[]) {
    const planet = new Node(rotation, children)
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

  function resetCanvas(gl) {
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  function drawScene(time) {
    time *= 0.001;
    resetCanvas(gl)    

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    /* Tick objects */
    solarSystemNode.tick(true)
    solarSystemNode.updateWorldMatrix();
    objects.forEach(function(object) {
        object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.worldMatrix);
    });

    twgl.drawObjectList(gl, objectsToDraw);
    requestAnimationFrame(drawScene);
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

var Node = function(rotation=0, children, eccentricity=0) {
  this.children = children
  
  this.eccentricity = eccentricity
  this.major = 1
  this.minor = this.major * Math.sqrt(1 - Math.pow(eccentricity, 2))
  this.distance = this.eccentricity * this.major

  this.rotation = rotation
  this.localMatrix = m4.identity();
  this.worldMatrix = m4.identity();
  this.tick = (recursive=true) => {
    let transform = m4.yRotation(this.rotation)
    let dot = twgl.v3.dot(twgl.m4.getAxis(this.localMatrix, 0), [1, 0, 0])
    let angle = dot / (twgl.v3.length(twgl.m4.getAxis(this.localMatrix, 0)))
    //if (this.eccentricity != 0) console.log(angle)
    let x_translate = this.major * Math.cos(degToRad(angle)) - this.eccentricity
    let y_translate = this.major * Math.sqrt(1-Math.pow(this.eccentricity, 2)) * Math.sin(angle)
    twgl.m4.translate(transform, [x_translate, y_translate, 0], transform)
    m4.multiply(transform, this.localMatrix, this.localMatrix)
    if (recursive) this.children.map(child => child.tick(recursive))
  }
}

Node.prototype.updateWorldMatrix = function(matrix) {
  if (matrix) m4.multiply(matrix, this.localMatrix, this.worldMatrix)
  else        m4.copy(this.localMatrix, this.worldMatrix)
  this.children.map(child => child.updateWorldMatrix(this.worldMatrix))
}

function degToRad(d) {
  return d * Math.PI / 180;
}



main();