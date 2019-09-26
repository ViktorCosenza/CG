// WebGL - Multiple Objects - Manual
// from https://webglfundamentals.org/webgl/webgl-multiple-objects-manual.html


  "use strict";

function degToRad(d) {
    return d * Math.PI / 180;
}

var fieldOfViewRadians = degToRad(60);
let cos = 0
let sin = 0
let xtrans = 0
let ytrans = 0
let ztrans = 0
let scale = 1
const setSin = (event, ui) => { sin = degToRad(ui.value) }
const setCos = (event, ui) => { cos = degToRad(ui.value) }

const setXTranslate = (event, ui) => { xtrans = ui.value - 180 }
const setYTranslate = (event, ui) => { ytrans = ui.value - 180 }
const setZTranslate = (event, ui) => { ztrans = ui.value - 180 }

const setScale = (event, ui) => {scale = ui.value / 100}

const updateUI = (fn, drawer) => (...args) => {
  fn(...args)
  drawer()
}

const makeSlider = (id, fn, max) => webglLessonsUI.setupSlider(id, {slide: fn, max: max });

let startPos = {}
const setStartAnimation = () => {
  startPos = {
    startSin: sin,
    startCos: cos,
    startxt: xtrans,
    startyt: ytrans,
    startzt: ztrans,
    scale: scale
  }
  console.log(startPos)
}

let finalPos = {}
const setFinalPos = () => {
   finalPos = {
    startSin: sin,
    startCos: cos,
    startxt: xtrans,
    startyt: ytrans,
    startzt: ztrans,
    scale: scale
  }
  console.log(finalPos)
}

let buttonIsClicked = false
const steps = 10;
const computeAnimationPosition =  counter => {
  let newPosition = {}
  Object.keys(startPos)
    .map(key => {
      const startP = startPos[key]
      const endP = finalPos[key]
     const res = startP + counter * (endP - startP)/(steps - 1)
      newPosition[key] = res
    })
  return newPosition
}

const time = 0
let now = 0
let then = 0
let deltaTime
var cameraPosition = [0, 0, 100];
var target = [0, 0, 0];
var up = [0, 1, 0];
var cubeXRotation   =  sin;
var cubeYRotation   =  cos;
let counter = 0
let currentAnimationTime = 0
const totalAnimationTime = 10

const startAnimationLoop = 
    (gl, 
     programInfo, 
     cubeBufferInfo, 
     cubeTranslation, 
     cubeUniforms, 
     computeMatrix) => time => {
  const now = time * 0.001
  deltaTime = now - then
  then = now
  currentAnimationTime += deltaTime * totalAnimationTime
  const position = computeAnimationPosition(currentAnimationTime)
  const sin = position.startSin
  const cos = position.startCos
  const xtrans = position.startxt
  const ytrans = position.startyt
  const ztrans = position.startzt
  const scale = position.scale
  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
  var projectionMatrix =
      m4.perspective(fieldOfViewRadians, aspect, 1, 2000)

  var cameraMatrix = m4.lookAt(cameraPosition, target, up)
  var viewMatrix = m4.inverse(cameraMatrix)
  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix)
 
  gl.useProgram(programInfo.program)
  webglUtils.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo)
  
  cubeTranslation   = [xtrans, ytrans, ztrans]
  cubeUniforms.u_matrix = computeMatrix(
    viewProjectionMatrix,
    cubeTranslation,
    sin,
    cos,
    scale
  )
  webglUtils.setUniforms(programInfo, cubeUniforms)
  gl.drawArrays(gl.TRIANGLES, 0, cubeBufferInfo.numElements)
  if (currentAnimationTime > totalAnimationTime) currentAnimationTime = 0
  if (currentAnimationTime < totalAnimationTime) 
    requestAnimationFrame(
      startAnimationLoop(
        gl, 
        programInfo, 
        cubeBufferInfo, 
        cubeTranslation, 
        cubeUniforms, 
        computeMatrix
    ))
}


function main() {
  /** @type {HTMLCanvasElement} */
  var canvas = document.getElementById("canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) return
  
  const drawer = () => { drawScene(0) }
  
  makeSlider('#sinCube', updateUI(setSin, drawer), 360)
  makeSlider('#cosCube', updateUI(setCos, drawer), 360)
  makeSlider('#xtranslate', updateUI(setXTranslate, drawer), 360)
  makeSlider('#ytranslate', updateUI(setYTranslate, drawer), 360)
  makeSlider('#ztranslate', updateUI(setZTranslate, drawer), 360)
  makeSlider('#scale', updateUI(setScale, drawer), 100)



  var createFlattenedVertices = (gl, vertices) => 
    webglUtils.createBufferInfoFromArrays(
      gl,
      primitives.makeRandomVertexColors(
        primitives.deindexVertices(vertices),
        {
          vertsPerColor: 6,
          rand: (ndx, channel) => channel < 3 ? ((128 + Math.random() * 128) | 0) : 255
        }
      )
    );

  var cubeBufferInfo   = createFlattenedVertices(gl, primitives.createCubeVertices(20));

  var programInfo = webglUtils.createProgramInfo(gl, ["3d-vertex-shader", "3d-fragment-shader"]);
  
  var cubeUniforms = {
    u_colorMult: [1, 0.5, 0.5, 1],
    u_matrix: m4.identity(),
  };
  
  var cubeTranslation   = [xtrans, ytrans, ztrans];
  function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation, scale) {
    var matrix = m4.translate(viewProjectionMatrix,
        translation[0],
        translation[1],
        translation[2]);
    matrix = m4.xRotate(matrix, xRotation)
    matrix = m4.yRotate(matrix, yRotation)
    matrix = m4.scale(matrix, scale, scale, scale)
    return matrix   
  }
  
  const animationButton = document.getElementById('animation-controller')
  animationButton.onclick = () => {
    if (buttonIsClicked) {
    setFinalPos()
    requestAnimationFrame(
      startAnimationLoop(
        gl, 
        programInfo, 
        cubeBufferInfo, 
        cubeTranslation, 
        cubeUniforms,
        computeMatrix))
      }
      else setStartAnimation()
    buttonIsClicked = !buttonIsClicked
  }

  drawScene(0)
  
  function drawScene(time) {
    time *= 0.0005;
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix =
        m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    var cameraPosition = [0, 0, 100];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    var cubeXRotation   =  sin;
    var cubeYRotation   =  cos;
    gl.useProgram(programInfo.program);

    // ------ Draw the cube --------
    webglUtils.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);

    cubeTranslation   = [xtrans, ytrans, ztrans];

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation,
        scale);

    webglUtils.setUniforms(programInfo, cubeUniforms);
    gl.drawArrays(gl.TRIANGLES, 0, cubeBufferInfo.numElements);
  }
}

main();
