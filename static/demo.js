/**
 * @fileoverview Description of this file.
 */


const vs_code = `
    attribute vec4 position;
    varying vec2 uv;
    void main() {
        uv = position.xy*0.5 + 0.5;
        gl_Position = position;
    }
`
const TENSOR_FIELDS = `
    vec2 size;
    vec2 gridSize;
    float depth, packedDepth;`;

const PREFIX = `
    precision highp float;

    struct BufferInfo {
        ${TENSOR_FIELDS}
    };
    struct InputInfo {
        ${TENSOR_FIELDS}
        sampler2D tex;
    };

    uniform BufferInfo u_output;

    const float PI = 3.14159265358979;

    const float _S = 127.0/255.0;
    vec4 _pack(vec4 v) {
        return atan(v)/PI + _S;
    }
    vec4 unpack(vec4 v) {
        return tan((v-_S)*PI);
    }

    vec2 getOutputXY() {
        return mod(gl_FragCoord.xy, u_output.size);
    }
    float getOutputChannel() {
        vec2 xy = floor(gl_FragCoord.xy/u_output.size);
        return xy.y*u_output.gridSize.x+xy.x;
    }

    vec4 sampleTensor(InputInfo tensor, vec2 pos, float ch) {
        vec2 p = pos/tensor.size;
        ch += 0.5;
        float tx = floor(mod(ch, tensor.gridSize.x));
        float ty = floor(ch / tensor.gridSize.x);
        p += vec2(tx, ty);
        return unpack(texture2D(tensor.tex, p/tensor.gridSize));
    }

    void setOutput(vec4 v) {
        gl_FragColor = _pack(v);
    }
`;

const PROGRAMS = {
    paint: `
    uniform vec2 u_pos;
    uniform float u_r;
    uniform float u_brush;

    void main() {
        vec2 xy = getOutputXY();
        if (length(xy-u_pos+0.5)>=u_r) 
          discard;
        vec4 result = vec4(0.0);
        if (u_brush>0.5) {
            float ch = getOutputChannel();
            result = vec4(vec3(float(ch>0.5)), 1.0);
        }
        setOutput(result);
    }`,
    perception: `
    uniform InputInfo u_input;

    void main() {
        vec2 xy = getOutputXY();
        float ch = getOutputChannel();
        float filterIdx = floor(ch/u_input.packedDepth);
        float inputCh = mod(ch, u_input.packedDepth);
        if (filterIdx == 0.0) {
            setOutput(sampleTensor(u_input, xy, inputCh));
        } else {
            vec2 dx = (filterIdx == 1.0) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec2 dy = vec2(dx.y, dx.x);
            vec4 v = (sampleTensor(u_input, xy+dx, inputCh)-sampleTensor(u_input, xy-dx, inputCh))*2.0+
                    sampleTensor(u_input, xy+dx+dy, inputCh)-sampleTensor(u_input, xy-dx+dy, inputCh)+
                    sampleTensor(u_input, xy+dx-dy, inputCh)-sampleTensor(u_input, xy-dx-dy, inputCh);
            setOutput(v / 8.0);
        }
    }`,
    layer: `
    uniform InputInfo u_input;
    uniform sampler2D u_weightTex;
    
    uniform float u_relu;
    
    const float MAX_PACKED_DEPTH = 32.0;
    
    
    void main() {
      vec2 xy = getOutputXY();
      float ch = getOutputChannel();
      if (ch >= u_output.packedDepth)
          return;
    
      float dy = 1.0/(u_input.depth+1.0);
      vec2 p = vec2((ch+0.5)/u_output.packedDepth, dy*0.5);
      vec4 result = vec4(0.0);
      for (float i=0.0; i < MAX_PACKED_DEPTH; i+=1.0) {
          vec4 inVec = sampleTensor(u_input, xy, i);
          result += inVec.x * texture2D(u_weightTex, p); p.y += dy;
          result += inVec.y * texture2D(u_weightTex, p); p.y += dy;
          result += inVec.z * texture2D(u_weightTex, p); p.y += dy;
          result += inVec.w * texture2D(u_weightTex, p); p.y += dy;
          if (i+1.5>u_input.packedDepth) {
              break;
          }
      }
      result += texture2D(u_weightTex, p);  // bias
      setOutput(u_relu > 0.5 ? max(result, 0.0) : result);
    }`,
    dropout: `
    uniform InputInfo u_input;
    uniform float u_seed, u_udpateProbability;
    varying vec2 uv;
    
    // "Hash without Sine" by David Hoskins (https://www.shadertoy.com/view/4djSRW)
    float hash13(vec3 p3) {
      p3  = fract(p3 * .1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    
    void main() {
      vec2 xy = getOutputXY();
      vec4 result = unpack(texture2D(u_input.tex, uv));
      result *=  float(hash13(vec3(xy, u_seed)) <= u_udpateProbability);
      setOutput(result);
    }`,
    update: `
    uniform InputInfo u_state;
    uniform InputInfo u_update;
    varying vec2 uv;
    
    void main() {
      vec2 xy = getOutputXY();
      float preMaxAlpha=0.0, postMaxAlpha=0.0;
      for (float y=-1.0; y<=1.0; ++y)
      for (float x=-1.0; x<=1.0; ++x) {
          float preAlpha = sampleTensor(u_state, xy+vec2(x, y), 0.0).a;
          float updateAlpha = sampleTensor(u_update, xy+vec2(x, y), 0.0).a;
          float postAlpha = preAlpha+updateAlpha;
          preMaxAlpha = max(preAlpha, preMaxAlpha);
          postMaxAlpha = max(postAlpha, postMaxAlpha);
      }
      if (min(preMaxAlpha, postMaxAlpha) < 0.1) {
          setOutput(vec4(0.0));
          return;
      }
      vec4 state = unpack(texture2D(u_state.tex, uv));
      vec4 update = unpack(texture2D(u_update.tex, uv));
      setOutput(state + update);
    }`,
    vis: `
    uniform InputInfo u_input;
    uniform float u_raw;
    varying vec2 uv;
    void main() {
        vec2 xy = vec2(uv.x, 1.0-uv.y);
        if (u_raw > 0.5) {
            gl_FragColor = texture2D(u_input.tex, xy);
            gl_FragColor.a = 1.0;
        } else {
            xy *= u_input.size;    
            vec4 rgba = sampleTensor(u_input, xy, 0.0);
            gl_FragColor = 1.0-rgba.a + rgba;
        }
    }`
}

function decodeArray(s, arrayType) {
    const data = atob(s);
    const buf = new Uint8Array(data.length);
    for (var i=0; i<data.length; ++i) {
        buf[i] = data.charCodeAt(i);
    }
    return new arrayType(buf.buffer);
}


export function createDemo(gl, layerWeights) {
    const ext = gl.getExtension('OES_texture_half_float');

    function createPrograms() {
        const res = {};
        for (const name in PROGRAMS) {
            const fs_code = PREFIX + PROGRAMS[name];
            res[name] = twgl.createProgramInfo(gl, [vs_code, fs_code]);
        }
        return res;
    }

    function createTensor(h, w, depth) {
        const packedDepth = Math.ceil(depth / 4);
        const gridW = Math.ceil(Math.sqrt(packedDepth));
        const gridH = Math.floor((packedDepth + gridW - 1) / gridW);
        const texW = w * gridW, texH = h * gridH;

        const attachments = [{ minMag: gl.NEAREST }];
        const fbi = twgl.createFramebufferInfo(gl, attachments, texW, texH);
        const tex = fbi.attachments[0];
        return { fbi, w, h, depth, gridW, gridH, packedDepth, tex, _type: 'tensor' };
    }

    function setTensorUniforms(uniforms, name, tensor, isInput) {
        uniforms[name + '.size'] = [tensor.w, tensor.h];
        uniforms[name + '.gridSize'] = [tensor.gridW, tensor.gridH];
        uniforms[name + '.depth'] = tensor.depth;
        uniforms[name + '.packedDepth'] = tensor.packedDepth;
        if (name != 'u_output') {
            uniforms[name + '.tex'] = tensor.tex;
        }
    }

    function runLayer(program, output, inputs) {
        inputs = inputs || {};
        const uniforms = {};
        for (const name in inputs) {
            const val = inputs[name];
            if (val._type == 'tensor') {
                setTensorUniforms(uniforms, name, val);
            } else {
                uniforms[name] = val;
            }
        }
        setTensorUniforms(uniforms, 'u_output', output);

        twgl.bindFramebufferInfo(gl, output.fbi);
        gl.useProgram(program.program);
        twgl.setBuffersAndAttributes(gl, program, quad);
        twgl.setUniforms(program, uniforms);
        twgl.drawBufferInfo(gl, quad);
    }

    function createLayerTexture(params) {
        const src = params.data || decodeArray(params.data_b64, Uint16Array);
        return twgl.createTexture(gl, {
            minMag: gl.NEAREST, type: ext.HALF_FLOAT_OES,
            width: params.out_ch / 4, height: params.in_ch + 1, src: src
        });
    }

    const progs = createPrograms();
    const quad = twgl.createBufferInfoFromArrays(gl, {
        position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    });
    

    const CHANNEL_N = 16;
    const w = 128, h = 128;
    let stateBuf = createTensor(h, w, CHANNEL_N);
    let newStateBuf = createTensor(h, w, CHANNEL_N);
    const perceptionBuf = createTensor(h, w, CHANNEL_N*3);
    const hiddenBuf = createTensor(h, w, 128);
    const updateBuf = createTensor(h, w, CHANNEL_N);
    const maskedUpdateBuf = createTensor(h, w, CHANNEL_N);
    
    let layerTex1 = createLayerTexture(layerWeights[0]);
    let layerTex2 = createLayerTexture(layerWeights[1]);

    reset();

    function paint(x, y, r, brush) {
        runLayer(progs.paint, stateBuf, {
            u_pos: [x, y], u_r: r,
            u_brush: {clear: 0.0, seed: 1.0}[brush],
        });
    }

    function reset() {
        paint(0, 0, w+h, 'clear');
        paint(w/2, h/2, 1, 'seed');
    }

    function step() {
        runLayer(progs.perception, perceptionBuf, {'u_input': stateBuf});
        runLayer(progs.layer, hiddenBuf, {'u_input': perceptionBuf, u_weightTex: layerTex1, u_relu: 1.0});
        runLayer(progs.layer, updateBuf, {'u_input': hiddenBuf, u_weightTex: layerTex2, u_relu: 0.0});
        runLayer(progs.dropout, maskedUpdateBuf, {'u_input': updateBuf, 'u_seed': Math.random()*1000, 'u_udpateProbability': 0.5});
        runLayer(progs.update, newStateBuf, {'u_state': stateBuf, 'u_update': maskedUpdateBuf});
        [stateBuf, newStateBuf] = [newStateBuf, stateBuf]
    }

    const visModes = ['color', 'state', 'perception', 'hidden', 'update', 'maskedUpdate'];

    function draw(visMode) {
        visMode = visMode || 'color';
        gl.useProgram(progs.vis.program);
        twgl.setBuffersAndAttributes(gl, progs.vis, quad);
        const uniforms = {u_raw: 0.0}
        let inputBuf = stateBuf;
        if (visMode != 'color') {
            inputBuf = {stateBuf, perceptionBuf, hiddenBuf, updateBuf, maskedUpdateBuf}[visMode+'Buf'];
            uniforms.u_raw = 1.0;
        }
        setTensorUniforms(uniforms, 'u_input', inputBuf);
        twgl.setUniforms(progs.vis, uniforms);
        twgl.drawBufferInfo(gl, quad);
    }

    function setWeights(layerWeights) {
        gl.deleteTexture(layerTex1);
        gl.deleteTexture(layerTex2);
        layerTex1 = createLayerTexture(layerWeights[0]);
        layerTex2 = createLayerTexture(layerWeights[1]);
    }

    function flush() {
        // gl.flush/finish don't seem to do anything, so reading a single 
        // pixel from the state buffer to flush the GPU command pipeline
        const a = new Uint8Array(4);
        twgl.bindFramebufferInfo(gl, stateBuf.fbi);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, a);
    }

    return {reset, step, draw, flush, setWeights, paint, visModes};
}
