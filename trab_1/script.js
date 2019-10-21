// WebGL2 - Scene Graph - Solar System
// from https://webgl2fundamentals.org/webgl/webgl-scene-graph-solar-system-adjusted.html


"use strict"

const {v3, m4} = twgl

function main() {

  /* Initial setup */
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
  
  const solarSystem = createSolarSystem()
  const orbitsToDraw = solarSystem.orbits.map(createOrbit)
  const objects = solarSystem.planets

  requestAnimationFrame(drawScene);

  /* Helper Functions */
  function createOrbit(node) {
    const flattened = node.orbit.flat(Infinity)
    const bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      position: {
        numComponents: 3,
         data: flattened.map(el => el), 
      },
      color: {
        numComponents: 4,
        data: new Array(16).fill(1),
        data: new Array(flattened.length * 4).fill(1)
      }
    })
    node.drawInfo = {
      uniforms: {
        u_colorOffset: [1, 1, 1, 1],
        u_colorMult: [1, 1, 1, 1]
      },
      active:true,
      type:gl.LINES,
      programInfo: programInfo,
      bufferInfo: bufferInfo
    }
    return node
  }
  
  function createPlanet (color, colorMult, scale, rotation, speed, translation=[0,0,0], children=[]) {
    const planet = new Node({min:rotation, max:rotation, speed:speed}, children, translation, true)
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

  function createSolarSystem () { 
    /* TODO: AUTOMATIZE THIS CHILD PUTTING THING... */
    const sun = createPlanet(
      [0.6, 0.6, 0, 1], 
      [0.4, 0.4, 0, 1],
      0.5,
      1, 
      0.0005)
    const earth = createPlanet(
      [0.2, 0.5, 0.8, 1], 
      [0.8, 0.5, 0.2, 1], 
      0.5,
      1, 
      0.1);

    const moon = createPlanet(
      [0.6, 0.6, 0.6, 1], 
      [0.1, 0.1, 0.1, 1], 
      0.2,
      0.1, 
      -0.01)
    
    const venus = createPlanet(
      [0.5, 0, 0, 0.1],
      [1, 1, 0, 1],
      0.5,
      0.1,
      -0.2
    )
    
    const mercury = createPlanet(
      [1, 0, 0, 1],
      [1, 1, 1, 1],
      0.2,
      0.1,
      -0.2
    )

    const mercuryOrbit = new Node({min: 30, max: 30, speed:0.01}, [mercury])
    const venusOrbit = new Node({min: 60, max:50, speed:0.005}, [venus])
    
    const moonOrbit = new Node({min:22, max:20, speed:0.01}, [moon])
    const earthOrbit = new Node({min:100, max:85, speed:0.001}, [earth, moonOrbit], [0, 0, 0])

    const solarSystem = new Node({min:0, max:0, speed:0.01}, [mercuryOrbit, venusOrbit, earthOrbit, sun])

    return {
      parent: solarSystem,
      planets: [sun, venus, earth, moon, mercury],
      orbits: [moonOrbit, earthOrbit, venusOrbit, mercuryOrbit]
    }
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
    solarSystem.parent.tick(true, deltaTime)
    solarSystem.parent.updateWorldMatrix();
    objects.forEach(function(object) {
        object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.worldMatrix);
    });

    orbitsToDraw.forEach(orbit => {
      orbit.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, orbit.parent.worldMatrix)
    })
    
    twgl.drawObjectList(gl, [...objects.map(el => el.drawInfo), ...orbitsToDraw.map(el => el.drawInfo)])

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

var fs = `#version 300 es
precision mediump float;
in vec4 v_color;
uniform vec4 u_colorMult;
uniform vec4 u_colorOffset;
out vec4 outColor;
void main() {
  outColor = v_color * u_colorMult + u_colorOffset;}`

function ellipse (min, max, translation, steps=100) {
  let points = []
  let n = 0
  let stepSize = 2/steps
  while (n <= 2) {
    const theta = degToRad(n * 180)
    const x = Math.cos(theta) * max
    const y = Math.sin(theta) * min
    points.push([
      y + translation[0], 
      0 + translation[1], 
      x + translation[2]])
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

/* TODO: ADD TILT SUPPORT */
var Node = function({max, min, speed=0.01}, children=[], translation=[0, 0, 0], isPlanet=false) {
  this.parent = null
  this.isPlanet = isPlanet
  this.children = children
  this.max = max
  this.min = min
  this.speed = speed
  this.translation = [...translation]

  this.localMatrix = m4.identity()
  this.worldMatrix = m4.identity()
  this.children.map(child => { child.parent = this })


  this.orbit = ellipse(this.min, this.max, this.translation)
  console.log(this.orbit)
  this.ellipseGenerator = interpolateEllipse(this.max, this.min, this.speed) 

  this.tick = (recursive=true, deltaTime) => {
    if(this.isPlanet) {
      const rotation = m4.rotationY(this.speed)
      m4.multiply(rotation, this.localMatrix, this.localMatrix)
    } else {
      const {value} = this.ellipseGenerator.next(deltaTime)
      const [x, z] = value
      const currentPosition = m4.getAxis(this.localMatrix, 3)
      const translateVector = v3.subtract([x, 0, z], currentPosition)
      v3.add(this.translation, translateVector, translateVector)
      
      m4.translate(
        this.localMatrix,
        translateVector,
        this.localMatrix
      )}
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