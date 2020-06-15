// #package js/main

// #include math
// #include WebGL.js
// #include Ticker.js
// #include Camera.js
// #include OrbitCameraController.js
// #include Volume.js
// #include renderers
// #include tonemappers
// #include EventEmitter.js

class RenderingContext extends EventEmitter {

    constructor(options) {
        super();

        this._render = this._render.bind(this);

        this._webglcontextlostHandler = this._webglcontextlostHandler.bind(this);
        this._webglcontextrestoredHandler = this._webglcontextrestoredHandler.bind(this);
        Object.assign(this, {
            _resolution: 512,
            _filter: 'nearest'
        }, options);

        Object.assign(this, {
            _resolution: 512,
            _filter: 'linear'
        }, options);


        this._canvas = document.createElement('canvas');
        this._canvas.addEventListener('webglcontextlost', this._webglcontextlostHandler);
        this._canvas.addEventListener('webglcontextrestored', this._webglcontextrestoredHandler);

        this._initGL();

        this._camera = new Camera();
        this._camera.position.z = 1.5;
        this._camera.fovX = 0.3;
        this._camera.fovY = 0.3;
        this._camera.updateMatrices();

        this._cameraController = new OrbitCameraController(this._camera, this._canvas);

        this._idVolume = new Volume(this._gl);
        this._dataVolume = new Volume(this._gl);
        this._scale = new Vector(1, 1, 1);
        this._translation = new Vector(0, 0, 0);
        this._isTransformationDirty = true;
        this._updateMvpInverseMatrix();
    }

    // ============================ WEBGL SUBSYSTEM ============================ //

    _initGL() {
        const contextSettings = {
            alpha: false,
            depth: false,
            stencil: false,
            antialias: false,
            preserveDrawingBuffer: true,
        };

        this._contextRestorable = true;

        this._gl = this._canvas.getContext('webgl2-compute', contextSettings);
        if (this._gl) {
            this._hasCompute = true;
        } else {
            this._hasCompute = false;
            this._gl = this._canvas.getContext('webgl2', contextSettings);
        }
        const gl = this._gl;
        this._extLoseContext = gl.getExtension('WEBGL_lose_context');
        this._extColorBufferFloat = gl.getExtension('EXT_color_buffer_float');

        if (!this._extColorBufferFloat) {
            console.error('EXT_color_buffer_float not supported!');
        }

        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        this._environmentTexture = WebGL.createTexture(gl, {
            width: 1,
            height: 1,
            data: new Uint8Array([255, 255, 255, 255]),
            format: gl.RGBA,
            internalFormat: gl.RGBA, // TODO: HDRI & OpenEXR support
            type: gl.UNSIGNED_BYTE,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            min: gl.LINEAR,
            max: gl.LINEAR
        });

        this._program = WebGL.buildPrograms(gl, {
            quad: SHADERS.quad
        }, MIXINS).quad;


        this._clipQuad = WebGL.createClipQuad(gl);
    }

    _webglcontextlostHandler(e) {
        if (this._contextRestorable) {
            e.preventDefault();
        }
    }

    _webglcontextrestoredHandler(e) {
        this._initGL();
    }

    resize(width, height) {
        this._canvas.width = width;
        this._canvas.height = height;
        this._camera.resize(width, height);
    }

    setIDVolume(reader) {
        if (this._idVolume) {
            this._idVolume.destroy();
        }

        this._idVolume = new Volume(this._gl, reader);
        this._idVolume.readMetadata({
            onData: () => {
                this._idVolume.readModality('id', {
                    onLoad: () => {
                        this._idVolume.setFilter('nearest');
                        if (this._renderer) {
                            this._renderer.setIDVolume(this._idVolume);
                            if (this._idVolume.ready && this._dataVolume.ready) {
                                this.startRendering();
                            }
                        }
                    }
                });
            }
        });
    }

    setDataVolume(reader) {
        if (this._dataVolume) {
            this._dataVolume.destroy();
        }

        this._dataVolume = new Volume(this._gl, reader);
        this._dataVolume.readMetadata({
            onData: () => {
                this._dataVolume.readModality('data', {
                    onLoad: () => {
                        this._dataVolume.setFilter(this._filter);
                        if (this._renderer) {
                            this._renderer.setDataVolume(this._dataVolume);
                            if (this._idVolume.ready && this._dataVolume.ready) {
                                this.startRendering();
                            }
                        }
                    }
                });
            }
        });
    }

    setEnvironmentMap(image) {
        WebGL.createTexture(this._gl, {
            texture: this._environmentTexture,
            image: image
        });
    }

    setFilter(filter) {
        this._filter = filter;
        if (this._dataVolume) {
            this._dataVolume.setFilter(filter);
            if (this._renderer) {
                this._renderer.reset();
            }
        }
    }

    chooseRenderer(renderer) {
        if (this._renderer) {
            this._renderer.destroy();
        }
        const rendererClass = this._getRendererClass(renderer);
        this._renderer = new rendererClass(this._gl, this._idVolume, this._dataVolume, this._environmentTexture);

        if (this._toneMapper) {
            this._toneMapper.setTexture(this._renderer.getTexture());
        }
        this._isTransformationDirty = true;
    }

    chooseToneMapper(toneMapper) {
        if (this._toneMapper) {
            this._toneMapper.destroy();
        }
        const gl = this._gl;
        let texture;
        if (this._renderer) {
            texture = this._renderer.getTexture();
        } else {
            texture = WebGL.createTexture(gl, {
                width: 1,
                height: 1,
                data: new Uint8Array([255, 255, 255, 255]),
            });
        }
        const toneMapperClass = this._getToneMapperClass(toneMapper);
        this._toneMapper = new toneMapperClass(gl, texture);
    }

    getCanvas() {
        return this._canvas;
    }

    getRenderer() {
        return this._renderer;
    }

    getToneMapper() {
        return this._toneMapper;
    }

    _updateMvpInverseMatrix() {
        if (!this._camera.isDirty && !this._isTransformationDirty) {
            return;
        }

        this._camera.isDirty = false;
        this._isTransformationDirty = false;
        this._camera.updateMatrices();

        const centerTranslation = new Matrix().fromTranslation(-0.5, -0.5, -0.5);
        const volumeTranslation = new Matrix().fromTranslation(
            this._translation.x, this._translation.y, this._translation.z);
        const volumeScale = new Matrix().fromScale(
            this._scale.x, this._scale.y, this._scale.z);

        const mvp = new Matrix();
        mvp.multiply(volumeScale, centerTranslation);
        mvp.multiply(volumeTranslation, mvp);
        mvp.multiply(this._camera.transformationMatrix, mvp);
        mvp.transpose();
        const mvpit = mvp.clone().inverse();

        if (this._renderer) {
            this._renderer.setMvpMatrix(mvp);
            this._renderer.setMvpInverseMatrix(mvpit);
            this._renderer.reset();
        }
    }
    _render() {
        const gl = this._gl;
        if (!gl || !this._renderer || !this._toneMapper) {
            return;
        }

        this._updateMvpInverseMatrix();

        this._renderer.render();
        this._toneMapper.render();

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        const program = this._program;
        gl.useProgram(program.program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
        const aPosition = program.attributes.aPosition;
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._toneMapper.getTexture());
        gl.uniform1i(program.uniforms.uTexture, 0);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

        gl.disableVertexAttribArray(aPosition);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    getScale() {
        return this._scale;
    }

    setScale(x, y, z) {
        this._scale.set(x, y, z);
        this._isTransformationDirty = true;
    }

    getTranslation() {
        return this._translation;
    }

    setTranslation(x, y, z) {
        this._translation.set(x, y, z);
        this._isTransformationDirty = true;
    }

    getResolution() {
        return this._resolution;
    }

    setResolution(resolution) {
        if (this._renderer) {
            this._renderer.setResolution(resolution);
        }
        if (this._toneMapper) {
            this._toneMapper.setResolution(resolution);
            if (this._renderer) {
                this._toneMapper.setTexture(this._renderer.getTexture());
            }
        }
    }

    startRendering() {
        Ticker.add(this._render);
    }

    stopRendering() {
        Ticker.remove(this._render);
    }

    hasComputeCapabilities() {
        return this._hasCompute;
    }

    _getRendererClass(renderer) {
        switch (renderer) {
            case 'mip': return MIPRenderer;
            case 'iso': return ISORenderer;
            case 'eam': return EAMRenderer;
            case 'mcs': return MCSRenderer;
            case 'mcm': return MCMRenderer;
            case 'mcc': return MCCRenderer;
            case 'dos': return DOSRenderer;
        }
    }

    _getToneMapperClass(toneMapper) {
        switch (toneMapper) {
            case 'range': return RangeToneMapper;
            case 'reinhard': return ReinhardToneMapper;
            case 'artistic': return ArtisticToneMapper;
        }
    }

}
