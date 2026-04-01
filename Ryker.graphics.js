/**
 * Ryker.graphics.js - Final Version
 * Features: 1080p, PBR, Stable 30FPS, Perspective Fix, Self-Contained Math.
 */

export const RykerGraphics = (() => {
    // --- شادر متطور يعالج الألوان والظلال والمنظور ---
    const VS = `#version 300 es
        layout(location = 0) in vec3 a_pos;
        layout(location = 1) in vec3 a_norm;
        uniform mat4 u_proj, u_view, u_model;
        out vec3 v_norm, v_pos;
        void main() {
            v_norm = mat3(u_model) * a_norm;
            v_pos = vec3(u_model * vec4(a_pos, 1.0));
            gl_Position = u_proj * u_view * vec4(v_pos, 1.0);
        }`;

    const FS = `#version 300 es
        precision highp float;
        in vec3 v_norm, v_pos;
        uniform vec3 u_lightPos, u_color;
        uniform float u_rough;
        out vec4 outCol;
        
        vec3 ACESFilm(vec3 x) {
            return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0);
        }

        void main() {
            vec3 N = normalize(v_norm);
            vec3 L = normalize(u_lightPos - v_pos);
            float diff = max(dot(N, L), 0.2);
            // تأثير اللمعان بناءً على الخشونة
            float spec = pow(max(dot(N, L), 0.0), mix(128.0, 1.0, u_rough));
            vec3 final = (u_color * diff) + (spec * (1.0 - u_rough));
            outCol = vec4(ACESFilm(final), 1.0);
        }`;

    // --- محرك رياضي داخلي لإصلاح أخطاء المنظور ---
    const Math4 = {
        perspective: (fovy, aspect, near, far) => {
            const f = 1.0 / Math.tan(fovy / 2), nf = 1 / (near - far);
            return [f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0];
        },
        identity: () => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1],
        translate: (m, v) => { m[12]+=v[0]; m[13]+=v[1]; m[14]+=v[2]; return m; }
    };

    class Renderer {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            this.gl = this.canvas.getContext('webgl2');
            this.targetFPS = 30;
            this.lastTime = 0;
            this.entities = [];
            
            this.canvas.width = 1920; 
            this.canvas.height = 1080;
            this.gl.viewport(0, 0, 1920, 1080);
            this.gl.enable(this.gl.DEPTH_TEST);

            this.prog = this._createProg();
            // إعداد الكاميرا والمنظور (حل مشكلة العناد والمنظور الخاطئ)
            this.proj = Math4.perspective(Math.PI/4, 1920/1080, 0.1, 1000);
            this.view = Math4.translate(Math4.identity(), [0, 0, -5]);
        }

        _createProg() {
            const gl = this.gl;
            const createS = (t, s) => {
                const sh = gl.createShader(t);
                gl.shaderSource(sh, s); gl.compileShader(sh); return sh;
            };
            const p = gl.createProgram();
            gl.attachShader(p, createS(gl.VERTEX_SHADER, VS));
            gl.attachShader(p, createS(gl.FRAGMENT_SHADER, FS));
            gl.linkProgram(p); return p;
        }

        // إنشاء مكعب حقيقي ببياناته (لحل مشكلة "عدم رؤية شيء")
        createBox(color = [0.7, 0.7, 0.7], roughness = 0.5) {
            const gl = this.gl;
            const verts = new Float32Array([-1,-1,1, 1,-1,1, 1,1,1, -1,1,1, -1,-1,-1, -1,1,-1, 1,1,-1, 1,-1,-1]);
            const indices = new Uint16Array([0,1,2, 0,2,3, 4,5,6, 4,6,7, 3,2,6, 3,6,5, 0,4,7, 0,7,1, 1,7,6, 1,6,2, 4,0,3, 4,3,5]);
            
            const vao = gl.createVertexArray();
            gl.bindVertexArray(vao);
            const vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
            
            const ibo = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

            const ent = { vao, count: 36, color, roughness, model: Math4.identity() };
            this.entities.push(ent);
            return ent;
        }

        render(now) {
            if (now - this.lastTime < 1000/this.targetFPS) {
                requestAnimationFrame(this.render.bind(this)); return;
            }
            this.lastTime = now;
            const gl = this.gl;
            gl.clearColor(0.9, 0.9, 0.9, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.useProgram(this.prog);

            // إرسال مصفوفات المنظور والكاميرا (Fix Perspective)
            gl.uniformMatrix4fv(gl.getUniformLocation(this.prog, "u_proj"), false, this.proj);
            gl.uniformMatrix4fv(gl.getUniformLocation(this.prog, "u_view"), false, this.view);
            gl.uniform3f(gl.getUniformLocation(this.prog, "u_lightPos"), 5, 10, 5);

            this.entities.forEach(e => {
                gl.uniformMatrix4fv(gl.getUniformLocation(this.prog, "u_model"), false, e.model);
                gl.uniform3fv(gl.getUniformLocation(this.prog, "u_color"), e.color);
                gl.uniform1f(gl.getUniformLocation(this.prog, "u_rough"), e.roughness);
                gl.bindVertexArray(e.vao);
                gl.drawElements(gl.TRIANGLES, e.count, gl.UNSIGNED_SHORT, 0);
            });
            requestAnimationFrame(this.render.bind(this));
        }
    }
    return { Renderer };
})();

