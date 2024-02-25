
SCREEN_SIZE = 512

function setup() {
	cnv = createCanvas(SCREEN_SIZE, SCREEN_SIZE, WEBGL);
    dartPos = createVector(0, 0, 0);
    for(let i=0; i< mod.uvs.length; i++) {
        mod.uvs[i][1] = 1.-mod.uvs[i][1];
    }
    cam = createCamera();
    cnv.id("globe");
}

function rotateVectorAroundPoint(vector, origin, angle) {
  // Translate vector and origin to new origin
  let translatedVector = p5.Vector.sub(vector, origin);
  
  // Perform rotation around new origin
  let newX = translatedVector.x * cos(angle) - translatedVector.z * sin(angle);
  let newY = translatedVector.x * sin(angle) + translatedVector.z * cos(angle);
  
  // Translate vector back to original position
  newX += origin.x;
  newY += origin.z;
  
  return createVector(newX, vector.y, newY);
}

function preload() {
  img = loadImage('./assets/cylinderical.png');
  dart_tex = loadImage('./assets/dart.png');
  mod = loadModel('./assets/dart.obj', true);

//   img2 = loadImage('maps/mp4shift.png');
//   myShader = loadShader('shaders/shader.vert', 'shaders/shader.frag');
//   shaderTexture = createGraphics(512, 512, WEBGL);

//   theShader = loadShader('texture.vert','texture.frag');
}


rotX = 0
rotY = 0

state = "held"

// dartPos = {x: 0, y: 0, z: 0}
dartSpeedY = 0
G = 2000.
DART_SPEED_Z = 6000

globeSpeedInit = 1.5    ;
globeSpeed = globeSpeedInit;
globeAngle = 0;
GLOBE_DAMP = 0.95


function draw() {
    background(250);
    smooth();
    push();
    globePos = createVector(0, 900, -1800);
    cam.lookAt(globePos.x, globePos.y, globePos.z, 0, 1, 0);
    dt = 0.01
    texture(img);
    r = 1000
    d = 128
    noStroke();
    if (state == "impacted") {
        globeSpeed = globeSpeed * GLOBE_DAMP;
    }
    globeAngle += dt * globeSpeed;
    translate(globePos.x, globePos.y, globePos.z);
    rotateY(globeAngle);
    sphere(r, d, d)
    pop();
    push();
    if (state == "impacted") {
        l = -globeSpeed * dt;
        dartPos = rotateVectorAroundPoint(dartPos, globePos, l);
    }
    translate(dartPos.x, dartPos.y, dartPos.z);
    rotateX(-PI*1.1/2);
    rotateX(-dartSpeedY / DART_SPEED_Z);
    if (state == "held") {
       dartPos.y = 0
       dartPos.x = mouseX - SCREEN_SIZE / 2;
       dartPos.y = mouseY - SCREEN_SIZE / 2 + 150;
       dartSpeedY = -dartPos.y * 10;
    }
    else if (state == "throwing") {
           dartSpeedY -= dt * G
           dartPos.y -= dartSpeedY * dt;
           dartPos.z -= dt*DART_SPEED_Z 

           diff = p5.Vector.sub(globePos, dartPos)
           if (diff.mag() < r + 50) {
               state = "impacted"
               element = document.getElementById("country")
               diff = p5.Vector.sub(globePos, dartPos)
               latitude = Math.asin(diff.y / diff.mag()) * (180 / Math.PI) - 5; 
               longitude = -(Math.atan2(diff.z, diff.x) + globeAngle - Math.PI/2)* (180 / Math.PI);
               n = 360;
               longitude = ((longitude % n) + n) % n;
               if (longitude > 180) {
                  print("converting")
                  longitude = 180 - longitude
               }
               print(`${latitude},${longitude}`)
               url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}%2C${longitude}&key=dcf69a2cb8584cf79951519003b29276`
               fetch(url).then(
                (response) => {
                    response.json().then(
                        (response) => {
                            if (response.status.code == 402) {
                                alert("Well done reddit, you used up the API limit! Wait till tomorrow to try again!")
                            }
                            code = response.results[0].components.country_code
                            print(response.rate.remaining)
                            if (code != undefined) {
                                code = code.toUpperCase();
                                console.log(code);
                                element.value = code;
                            }
                            else {
                                state = "held"

                                dartPos = createVector(0, 0, 0);
                                dartSpeedY = 0
                                globeSpeed = globeSpeedInit;
                                globeAngle = 0;
                            }
                        }
                    );
                }
               )
        
           }
    } else if (state == "impacted") {
        rotateY(l * dt)
    }

    texture(dart_tex)
    model(mod);
    pop();
}
function mousePressed() {
    if (state == "held") {
        state = "throwing"
    }
}