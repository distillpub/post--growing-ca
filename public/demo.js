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


    const canvas = $('#c');
    const gl = canvas.getContext("webgl");
    canvas.width = 96*6;
    canvas.height = 96*6;
  
    let demo;
    const modelDir = 'webgl_models8/';
    let target = '🦎';
    let experiment = 'ex3';

    async function updateModel() {
      const r = await fetch(`${modelDir}/${experiment}_${target}.json`);
      const model = await r.json();
      if (!demo) {
        demo = createCA(gl, model);
        // $('#visMode').innerHTML = demo.visModes.map(s=>`<option value="${s}">${s}</option>`).join();
        $('#resetButton').onclick = demo.reset;
        requestAnimationFrame(render);
      } else {
        demo.setWeights(model);
        demo.reset();
      }
      $$('#emojiSelector *').forEach(e=>{
        e.style.backgroundColor = e.id==target?'Gold':'';
      });
      $$('#experimentSelector *').forEach(e=>{
        e.style.backgroundColor = e.id<=experiment?'Gold':'';
      });

    }
    updateModel();
  
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
    }
    $('#experimentSelector').onclick = async e=>{
      experiment = e.target.id;
      updateModel();
    }
  
    function getMousePos(e) {
      const [w, h] = demo.gridSize;
      const x = Math.floor(e.offsetX / canvas.clientWidth * w);
      const y = Math.floor(e.offsetY / canvas.clientHeight * h);
      return [x, y];
    }
  
    let doubleClick = false;
    function onClick(x, y) {

    }


    canvas.onmousedown = e => {
      e.preventDefault();
      if (!demo)
        return;
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
      if (!demo)
        return;
      if (e.buttons == 1) {
        const [x, y] = getMousePos(e);
        demo.paint(x, y, 8, 'clear');
      }
    }
  
    canvas.addEventListener("touchmove", e=>{
      if (!demo)
        return;
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
  
    let lastDrawTime;
    let stepsPerFrame = 1;
  
    function render(time) {
      if (!demo)
        return;
      if  (!isInViewport(canvas)) {
        requestAnimationFrame(render);
        return;
      }
  
      let stepN = 1;
      if ($('#throttle').checked && lastDrawTime) {
        if (time - lastDrawTime < 18) {
          stepsPerFrame += 1;
        } else {
          stepsPerFrame = Math.max(1, stepsPerFrame-1);
        }
        stepN = stepsPerFrame;
      }
      lastDrawTime = time;
      
      demo.setAngle($('#angle').value);
      for (let i=0; i<stepN; ++i) {
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