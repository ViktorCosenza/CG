// WebGL - Multiple Objects - Manual
// from https://webglfundamentals.org/webgl/webgl-multiple-objects-manual.html


  "use strict";

function degToRad(d) {
    return d * Math.PI / 180;
}

let cos = 0
let sin = 0

let cosCircle = 0
let sinCircle = 0

let cosCone = 0
let sinCone = 0

const setSin = (event, ui) => {
  sin = degToRad(ui.value)
}

const setCos = (event, ui) => {
  cos = degToRad(ui.value)
}

const updateUI = (fn, drawer) => (...args) => {
  fn(...args)
  drawer()
}

const makeSlider = (id, fn, max) =>  
  webglLessonsUI.setupSlider(id, {slide: fn, max: max });

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.getElementById("canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) return
  
  const drawer = () => {
    drawScene(0)
  }
  
  makeSlider('#sinCube', updateUI(setSin, drawer), 360)
  makeSlider('#cosCube', updateUI(setCos, drawer), 360)

  var createFlattenedVertices = function(gl, vertices) {
    return webglUtils.createBufferInfoFromArrays(
        gl,
        primitives.makeRandomVertexColors(
            primitives.deindexVertices(vertices),
            {
              vertsPerColor: 6,
              rand: function(ndx, channel) {
                return channel < 3 ? ((128 + Math.random() * 128) | 0) : 255;
              }
            })
      );
  };

  var sphereBufferInfo = createFlattenedVertices(gl, primitives.createSphereVertices(10, 12, 6));
  var cubeBufferInfo   = createFlattenedVertices(gl, primitives.createCubeVertices(20));
  var coneBufferInfo   = createFlattenedVertices(gl, primitives.createTruncatedConeVertices(10, 0, 20, 12, 1, true, false));

  // setup GLSL program
  var programInfo = webglUtils.createProgramInfo(gl, ["3d-vertex-shader", "3d-fragment-shader"]);


  var cameraAngleRadians = degToRad(0);
  var fieldOfViewRadians = degToRad(60);
  var cameraHeight = 50;

  // Uniforms for each object.
  var sphereUniforms = {
    u_colorMult: [0.5, 1, 0.5, 1],
    u_matrix: m4.identity(),
  };
  var cubeUniforms = {
    u_colorMult: [1, 0.5, 0.5, 1],
    u_matrix: m4.identity(),
  };
  var coneUniforms = {
    u_colorMult: [0.5, 0.5, 1, 1],
    u_matrix: m4.identity(),
  };
  var sphereTranslation = [  0, 0, 0];
  var cubeTranslation   = [-40, 0, 0];
  var coneTranslation   = [ 40, 0, 0];

  function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation) {
    var matrix = m4.translate(viewProjectionMatrix,
        translation[0],
        translation[1],
        translation[2]);
    matrix = m4.xRotate(matrix, xRotation);
    return m4.yRotate(matrix, yRotation);
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

    var sphereXRotation =  sinCircle;
    var sphereYRotation =  cosCircle;
    
    var cubeXRotation   =  sin;
    var cubeYRotation   =  cos;
    
    var coneXRotation   =  sinCone;
    var coneYRotation   =  cosCone;

    gl.useProgram(programInfo.program);

    // Setup all the needed attributes.
    webglUtils.setBuffersAndAttributes(gl, programInfo, sphereBufferInfo);

    // ------ Draw the cube --------
    webglUtils.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);

    cubeUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        cubeTranslation,
        cubeXRotation,
        cubeYRotation);

    webglUtils.setUniforms(programInfo, cubeUniforms);
    gl.drawArrays(gl.TRIANGLES, 0, cubeBufferInfo.numElements);
  }
}

main();