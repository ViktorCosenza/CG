// WebGL2 - Scene Graph - Solar System
// from https://webgl2fundamentals.org/webgl/webgl-scene-graph-solar-system-adjusted.html


"use strict"

const {v3, m4} = twgl

function main() {

  /* Initial setup */

  let timeSpeed = 0.001
  let then = 0;
  document.getElementById("speedup")
    .onclick = e => {timeSpeed *= 10; then*=10}
  document.getElementById("speeddown")
    .onclick = e => {timeSpeed *= 0.1; then*=0.1}

  document.getElementById("move").onkeypress =  e => {
    const d = e.which || e.keyCode;
    e.target.value = ""
    switch (d) {
      case 49: /* 1 */
        updateCamera(null, m4.rotateY, 1)
        break
      case 51: /* 3 */
        updateCamera(null, m4.rotateY, -1)
        break
      case 43: /* + */
      case 61: /* = */
        updateCamera([0, -1, 0])
        break
      case 45: /* - */
        updateCamera([0, 1, 0])
        break
      case 97: /* A */
        updateCamera([1, 0, 0])
        break
      case 99: /* C */
        updateCamera(null, m4.rotateZ, -1)
        break
      case 100: /* D */
        updateCamera([-1, 0, 0])
        break  
      case 101: /* E */
        updateCamera(null, m4.rotateX, 1)
        break
      case 113: /* Q */
        updateCamera(null, m4.rotateX, -1)
        break
      case 115: /* S */
        updateCamera([0, 0, 1])
        break
      case 119: /* W */
        updateCamera([0, 0, -1])
        break
      case 122: /* Z */
        updateCamera(null, m4.rotateZ, 1)
        break
      }
  }

  const canvas = document.getElementById("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) throw Error('Browser does not support opengl')

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  twgl.setAttributePrefix("a_");

  var cameraPosition = [0, -250, 0];
  var target = [0, 0, 0];
  var up = [0, 0, 1];
  var cameraMatrix = m4.lookAt(cameraPosition, target, up);
  var viewMatrix = m4.inverse(cameraMatrix);
  var fieldOfViewRadians = degToRad(80);

  var sphereBufferInfo = flattenedPrimitives.createSphereBufferInfo(gl, 10, 12, 6);

  var programInfo = twgl.createProgramInfo(gl, [vs, fs]);
  var sphereVAO = twgl.createVAOFromBufferInfo(gl, programInfo, sphereBufferInfo);
  
  const solarSystem = createSolarSystem()
  const orbitsToDraw = solarSystem.orbits.map(createOrbit)
  const objects = solarSystem.planets

  requestAnimationFrame(drawScene);

  /* Helper Functions */
  function updateCamera(translation=null, rotation=null, direction=1) {
    if (!!translation) 
      m4.translate(
        solarSystem.parent.worldMatrix,
        v3.mulScalar(translation, 10, translation), 
        solarSystem.parent.worldMatrix)
    if (!!rotation)
      rotation(solarSystem.parent.worldMatrix, direction * 0.1, solarSystem.parent.worldMatrix)
  }

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
    const planet = new Node({min:rotation, max:rotation, speed:speed}, children, translation, 0, true)
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
    const sun = createPlanet(
      [0.6, 0.6, 0, 1], 
      [0.4, 0.4, 0, 1],
      2,
      1, 
      0.0005)
    
    const halley = createPlanet(
      [1, 1, 1, 1],
      [0, 0, 0, 1],
      0.1,
      1,
      0.005
    )
          
    const mercury = createPlanet(
      [1, 0, 0, 1],
      [1, 1, 1, 1],
      0.2,
      0.1,
      -0.2
    )
        
    const venus = createPlanet(
      [0.5, 0, 0, 0.1],
      [1, 1, 0, 1],
      0.5,
      0.5,
      -0.5
    )

    const earth = createPlanet(
      [0.2, 0.5, 0.8, 1], 
      [0.8, 0.5, 0.2, 1], 
      0.5,
      1, 
      0.5);

    const moon = createPlanet(
      [0.6, 0.6, 0.6, 1], 
      [0.1, 0.1, 0.1, 1], 
      0.2,
      0.1, 
      -0.01)
    
    const mars = createPlanet(
      [1, 0, 0, 1], [1, 1, 1, 1],
      0.4,
      0.1,
      0.5
    )

    const jupyter = createPlanet(
      [0.6, 0.6, 0.6, 1], [0.4, 0.4, 0, 1],
      1,
      0.1,
      0.1
    )

    const europa = createPlanet(
      [0.6, 0.6, 0.8, 1], [0.4, 0.4, 0, 1],
      0.1,
      0.1,
      0.1
    )

    const titan = createPlanet(
      [0.3, 0.6, 0.6, 1], [0.4, 0.4, 0, 1],
      0.1,
      0.1,
      0.1
    )
    

    const saturn = createPlanet(
      [0.3, 0.3, 0.3, 1], [0.6, 0.4, 0, 1],
      0.5,
      0.1,
      0.1
    )
    
    const saturnRings = (new Array(15).fill(0)).map(e => 
      createPlanet(
        [0, 0, 0, 0], [0, 0, 0, 0], 0, 0, 0
      ))
    
    const uranus = createPlanet(
      [0.1, 0, 1, 1], [0.3, 0.6, 0, 1],
      0.5,
      0.1,
      0.1
    )

    const neptune = createPlanet(
      [0.1, 0, 1, 0.7], [0.3, 0.6, 0, 1],
      0.3,
      0.1,
      0.1
    )

    const pluto = createPlanet(
      [0.1, 0, 1, 1], [0.3, 0.6, 0, 1],
      0.1,
      0.1,
      0.1
    )

    const mercuryOrbit = new Node({min: 30, max: 30, speed:0.04}, [mercury])
    const venusOrbit = new Node({min: 60, max:50, speed:0.02}, [venus])
    
    const moonOrbit = new Node({min:22, max:20, speed:0.019}, [moon])
    const earthOrbit = new Node({min:85, max:80, speed:0.01}, [earth, moonOrbit], [5, 0, 0], degToRad(5))

    const marsOrbit = new Node({min: 160, max: 150, speed:0.01}, [mars], [0, 0, 0], degToRad(-0.5))
    

    const titanOrbit = new Node({min: 35, max: 35, speed:0.05}, [titan], [3, 0, -3], degToRad(3))
    const europaOrbit = new Node({min: 30, max: 26, speed:0.099}, [europa], [0, 0, 3], degToRad(-0.05))
    const jupyterOrbit = new Node({min: 200, max: 190, speed:0.0015}, [jupyter, europaOrbit, titanOrbit], [0, 0, 10], degToRad(-0.05))


    const saturnRingsOrbits = saturnRings.map((el, idx) => new Node({min: idx * 0.5 + 10, max: idx * 0.5 + 10, speed: 0}, [el], [0, 0, 0], degToRad(5), false, 1000))

    const saturnOrbit = new Node({min: 300, max: 280, speed:0.0009}, [saturn, ...saturnRingsOrbits], [0, 0, 10], degToRad(-0.05))
  
    const uranusOrbit = new Node({min: 450, max: 430, speed:0.0005}, [uranus])
    const neptuneOrbit = new Node({min: 500, max: 500, speed:0.00018}, [neptune])
    const plutoOrbit = new Node({min: 600, max: 600, speed:0.00099}, [pluto], [0, 0, 0], degToRad(15))

    const halleyOrbit = new Node({min: 500, max: 150, speed: 0.0005}, [halley], [230, 0, 0], degToRad(30))
    const solarSystem = new Node(
      {min:0, max:0, speed:0.01}, 
      [mercuryOrbit, venusOrbit, earthOrbit, marsOrbit, jupyterOrbit, saturnOrbit, halleyOrbit, uranusOrbit, neptuneOrbit, plutoOrbit, sun]
    )

    return {
      parent: solarSystem,
      planets: [sun, mercury, venus, earth, moon, mars, jupyter, europa, titan, saturn, halley, ...saturnRings, uranus, neptune, pluto],
      orbits: [
        moonOrbit, 
        mercuryOrbit, 
        venusOrbit, 
        earthOrbit, 
        marsOrbit, 
        jupyterOrbit, 
        europaOrbit,
        titanOrbit,
        saturnOrbit, ...saturnRingsOrbits,
        uranusOrbit,
        neptuneOrbit,
        plutoOrbit,
        halleyOrbit]
    }
  }

  function resetCanvas(gl) {
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  function drawScene(time) {
    time *= timeSpeed
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
      const transform = m4.copy(orbit.parent.worldMatrix)
      m4.rotateZ(transform, orbit.tilt, transform)
      m4.translate(transform, v3.mulScalar(orbit.translation, 2), transform)
      orbit.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, transform)
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

function ellipse (min, max, steps=100) {
  let points = []
  let n = 0
  let stepSize = 2/steps
  while (n <= 2) {
    const theta = degToRad(n * 180)
    const x = Math.cos(theta) * max
    const z = Math.sin(theta) * min
    let point = [z, 0, x]
    points.push(point)
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
    const z = Math.sin(theta) * min
    deltaTime = yield [x, 0, z]
    n += speed * deltaTime
  }
}


var Node = function({max, min, speed=0.01}, children=[], translation=[0, 0, 0], tilt=0, isPlanet=false, steps=100) {
  this.parent = null
  this.isPlanet = isPlanet
  this.children = children
  this.tilt = tilt
  this.max = max
  this.min = min
  this.speed = speed
  this.translation = [...translation]

  this.localMatrix = m4.identity()
  this.worldMatrix = m4.identity()
  this.children.map(child => { child.parent = this })

  this.orbit = ellipse(this.min, this.max, steps)
  this.ellipseGenerator = interpolateEllipse(this.max, this.min, this.speed) 

  this.tick = (recursive=true, deltaTime) => {
    if(this.isPlanet) {
      const rotation = m4.rotationY(this.speed * deltaTime)
      m4.multiply(rotation, this.localMatrix, this.localMatrix)
    } else {
      const {value} = this.ellipseGenerator.next(deltaTime)
      const [x, y, z] = value
      const currentPosition = m4.getAxis(this.localMatrix, 3)
      const translateVector = v3.subtract([x, y, z], currentPosition)
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
  if (matrix) {
    const transformed = m4.copy(matrix)
    m4.rotateZ(transformed, this.tilt, transformed)
    m4.translate(transformed, this.translation, transformed)
    m4.multiply(transformed, this.localMatrix, this.worldMatrix)
  }
  this.children.map(child => child.updateWorldMatrix(this.worldMatrix))
}

function degToRad(d) {
  return d * Math.PI / 180;
}

main();