import { createCA } from './ca.js'

function isInViewport(element) {
  var rect = element.getBoundingClientRect();
  var html = document.documentElement;
  var w = window.innerWidth || html.clientWidth;
  var h = window.innerHeight || html.clientHeight;
  return rect.top < h && rect.left < w && rect.bottom > 0 && rect.right > 0;
}

export function createDemo(divId) {
    const root = document.getElementById(divId);
    const $ = q=>root.querySelector(q);
    const $$ = q=>root.querySelectorAll(q);
  
    let demo;
    const modelDir = 'webgl_models8/';
    let target = '🦎';
    let experiment = 'ex3';
    let paused = false;

    const canvas = $('#c');
    const gl = canvas.getContext("webgl");
    canvas.width = 96*6;
    canvas.height = 96*6;

    function updateUI() {
      $$('#emojiSelector *').forEach(e=>{
        e.style.backgroundColor = e.id==target?'Gold':'';
      });
      $$('#experimentSelector *').forEach(e=>{
        e.style.backgroundColor = e.id<=experiment?'Gold':'';
      });
      $('#play').style.display = paused? "inline" : "none";
      $('#pause').style.display = !paused? "inline" : "none";
      const speed = parseInt($('#speed').value);
      $('#speedLabel').innerHTML = 'speed: '+
          ['1/60 x', '1/10 x', '1/2 x', '1x', '2x', '4x', '<b>full throttle !!!</b>'][speed+3];

    }

    function initUI() {
      $('#playPause').onclick = ()=>{
        paused = !paused;
        updateUI();
      };
      $('#resetButton').onclick = demo.reset;
      $('#speed').onchange = updateUI;
      $('#speed').oninput = updateUI;
      $('#experimentSelector').onclick = e=>{
        experiment = e.target.id;
        updateModel();
      };
      const modelSel = $('#emojiSelector');
      for (let c of '😀💥👁🦎🐠🦋🐞🕸🥨🎄') {
        modelSel.innerHTML += `<span id="${c}">${c}</span>`;
      }
      modelSel.innerHTML += `<span id="planarian">planarian</span>`;
      modelSel.onclick = async e => {
        target = e.target.innerText;
        if (target == 'planarian') {
          experiment = 'ex3';
        }
        updateModel();
      };

      let doubleClick = false;

      canvas.onmousedown = e => {
        e.preventDefault();
        const [x, y] = getMousePos(e);
        if (e.buttons == 1) {
          if (doubleClick) {
            demo.paint(x, y, 1, 'seed');
            doubleClick = false;
          } else {
            doubleClick = true;
            setTimeout(()=>{
              doubleClick = false;
            }, 300);
            demo.paint(x, y, 8, 'clear');
          }
        }
      }
      canvas.onmousemove = e => {
        e.preventDefault();
        if (e.buttons == 1) {
          const [x, y] = getMousePos(e);
          demo.paint(x, y, 8, 'clear');
        }
      }
    
      canvas.addEventListener("touchmove", e=>{
        const ox = e.target.offsetLeft;
        const oy = e.target.offsetTop;
        for (const t of e.touches) {
          const mx = t.pageX - ox;
          const my = t.pageY - oy;
          const [w, h] = demo.gridSize;
          const x = Math.floor(mx / canvas.clientWidth * w);
          const y = Math.floor(my / canvas.clientHeight * h);
          demo.paint(x, y, 8, 'clear');
        }
      }, false);
      updateUI();
    }

    async function updateModel() {
      const r = await fetch(`${modelDir}/${experiment}_${target}.json`);
      const model = await r.json();
      if (!demo) {
        demo = createCA(gl, model);
        initUI();        
        requestAnimationFrame(render);
      } else {
        demo.setWeights(model);
        demo.reset();
      }
      updateUI();
    }
    updateModel();
  
  
    function getMousePos(e) {
      const [w, h] = demo.gridSize;
      const x = Math.floor(e.offsetX / canvas.clientWidth * w);
      const y = Math.floor(e.offsetY / canvas.clientHeight * h);
      return [x, y];
    }
  
    let lastDrawTime = 0;
    let stepsPerFrame = 1;
    let frameCount = 0;
  
    function render(time) {
      if  (!isInViewport(canvas)) {
        requestAnimationFrame(render);
        return;
      }
  
      if (!paused) {
        const speed = parseInt($("#speed").value);
        if (speed <= 0) {  // slow down by skipping steps
          const skip = [1, 2, 10, 60][-speed];
          stepsPerFrame = (frameCount % skip) ? 0 : 1;
          frameCount += 1;
        } else if (speed > 0) { // speed up by making more steps per frame
          const interval = time - lastDrawTime;
          stepsPerFrame += interval<20.0 ? 1 : -1;
          stepsPerFrame = Math.max(1, stepsPerFrame);
          stepsPerFrame = Math.min(stepsPerFrame, [1, 2, 4, Infinity][speed])
        }
      } else {
        stepsPerFrame = 0;
      }
      lastDrawTime = time;

      demo.setAngle($('#angle').value);
      for (let i=0; i<stepsPerFrame; ++i) {
        demo.step();
      }
      twgl.bindFramebufferInfo(gl);
      demo.draw();
      
      $("#status").innerText = `Step ${demo.getStepCount()}`;
      const ips = demo.fps();
      if (ips)
        $("#status").innerText += ` (${ips} step/sec)`;
      requestAnimationFrame(render);
    }
}