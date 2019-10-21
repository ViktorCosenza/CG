// WebGL2 - Scene Graph - Solar System
// from https://webgl2fundamentals.org/webgl/webgl-scene-graph-solar-system-adjusted.html


"use strict"

const {v3, m4} = twgl

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

  const sunNode = createPlanet(
    [0.6, 0.6, 0, 1], 
    [0.4, 0.4, 0, 1],
    1, 
    0.005)
  const earthNode = createPlanet(
    [0.2, 0.5, 0.8, 1], 
    [0.8, 0.5, 0.2, 1], 
    1, 
    0.5);
  const moonNode = createPlanet(
    [0.6, 0.6, 0.6, 1], 
    [0.1, 0.1, 0.1, 1], 
    0.1, 
    -0.01)

  const moonOrbitNode = new Node({min:50, max:40, speed:0.1}, [moonNode], [0, 0, 100])
  const earthOrbitNode = new Node({min:200, max:150, speed:0.01}, [earthNode, moonOrbitNode], [100, 0, 0])
  const solarSystemNode = new Node({min:0, max:0, speed:0.1}, [earthOrbitNode, sunNode])

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

  var orbits = earthOrbitNode
  var orbitProgram = twgl.createProgramInfo(gl, [vertexShaderOrbit, fragmentShaderOrbit])
  
  var orbitsToDraw = {
    active:true,
    type: gl.LINES,
    programInfo: orbitProgram,
    bufferInfo: createOrbit(orbits),
  }
  requestAnimationFrame(drawScene);

  /* Functions */
  function createOrbit(node) {
    const flattened = node.orbit.flat(Infinity)
    return twgl.createBufferInfoFromArrays(gl, {
      position: {
        numComponents: 3,
         data: flattened.map(el => el/200), 
      },
      color: {
        numComponents: 4,
        data: new Array(16).fill(1),
        data: new Array(flattened.length * 4).fill(1)
      }
    })
  }
  
  function createPlanet (color, colorMult, scale, rotation, children=[]) {
    const planet = new Node({min:rotation, max:rotation}, children)
    planet.localMatrix = m4.scaling([scale, scale, scale])
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
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  let then = 0;
  function drawScene(time) {
    time *= 0.01
    const deltaTime = time - then;
    then = time
    resetCanvas(gl)    
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
    const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
    
    /* Tick objects */
    solarSystemNode.tick(true, deltaTime)
    solarSystemNode.updateWorldMatrix();
    objects.forEach(function(object) {
        object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.worldMatrix);
    });

    //orbitsToDraw.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, orbitsTo.world)
    
    twgl.drawObjectList(gl, objectsToDraw)
    twgl.drawObjectList(gl, [orbitsToDraw])

    requestAnimationFrame(drawScene);
  }
}

/* Boilerplate */

var vs = `#version 300 es
in vec4 a_position;
in vec4 a_color;
uniform mat4 u_matrix;
out vec4 v_color;
void main() {
  gl_Position = u_matrix * a_position;
  v_color = a_color;}`

var vertexShaderOrbit = `#version 300 es
in vec4 a_position;
in vec4 a_color;
out vec4 v_color;

void main() {
  gl_Position = a_position;
  v_color = a_color;
}`

var fragmentShaderOrbit = `#version 300 es
precision mediump float;
out vec4 outColor;
in vec4 v_color;

void main() {
  outColor = v_color;
}
`

var fs = `#version 300 es
precision mediump float;
in vec4 v_color;
uniform vec4 u_colorMult;
uniform vec4 u_colorOffset;
out vec4 outColor;
void main() {
  outColor = v_color * u_colorMult + u_colorOffset;}`

function ellipse (min, max, steps=100) {
  let points = []
  let n = 0
  let stepSize = 2/steps
  while (n <= 2) {
    const theta = degToRad(n * 180)
    const x = Math.cos(theta) * max
    const y = Math.sin(theta) * min
    points.push([y, x, 0])
    n += stepSize
  }
  return points
}

function* interpolateEllipse (min, max, speed) {
  let n = 0
  let deltaTime = 0
  while (true) {
    n = n % 2
    const theta = degToRad(n * 180)
    const x = Math.cos(theta) * max
    const y = Math.sin(theta) * min
    deltaTime = yield [x, y]
    n += speed * deltaTime
  }
}

var Node = function({max, min, speed=0.01}, children=[], translation=[0, 0, 0]) {
  this.parent = null
  this.children = children
  this.children.map(child => { child.parent = this })
  this.localMatrix = m4.identity()
  this.translation = translation
  m4.translate(this.localMatrix, this.translation, this.localMatrix)

  this.worldMatrix = m4.identity()
  this.max = max
  this.min = min
  this.speed = speed
  this.orbit = ellipse(this.min, this.max)
  this.ellipseGenerator = interpolateEllipse(this.max, this.min, this.speed) 
  this.tick = (recursive=true, deltaTime) => {
    const {value} = this.ellipseGenerator.next(deltaTime)
    const [x, z] = value
    const currentPosition = m4.getAxis(this.localMatrix, 3)
    const translateVector = v3.subtract([x, 0, z], currentPosition)
    m4.translate(
      this.localMatrix,
      translateVector,
      this.localMatrix
    )
    if (recursive) this.children.map(child => child.tick(recursive, deltaTime))
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