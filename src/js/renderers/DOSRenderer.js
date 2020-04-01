// #package js/main

// #include ../math
// #include ../WebGL.js
// #include AbstractRenderer.js

class DOSRenderer extends AbstractRenderer {

constructor(gl, volume, environmentTexture, options) {
    super(gl, volume, environmentTexture, options);

    Object.assign(this, {
        steps          : 10,
        slices         : 200,
        occlusionScale : 0.01,
        occlusionDecay : 0.9,
        visibility     : 0.9,
        _depth         : 1,
        _minDepth      : -1,
        _maxDepth      : 1
    }, options);

    this._programs = WebGL.buildPrograms(gl, {
        integrate : SHADERS.DOSIntegrate,
        render    : SHADERS.DOSRender,
        reset     : SHADERS.DOSReset
    }, MIXINS);

    this._compute = null;
    this._attrib = gl.createBuffer();
    this._layout = [];
    this._mask = gl.createTexture();
}

destroy() {
    const gl = this._gl;
    Object.keys(this._programs).forEach(programName => {
        gl.deleteProgram(this._programs[programName].program);
    });

    super.destroy();
}

calculateDepth() {
    const vertices = [
        new Vector(0, 0, 0),
        new Vector(0, 0, 1),
        new Vector(0, 1, 0),
        new Vector(0, 1, 1),
        new Vector(1, 0, 0),
        new Vector(1, 0, 1),
        new Vector(1, 1, 0),
        new Vector(1, 1, 1)
    ];

    let minDepth = 1;
    let maxDepth = -1;
    let mvp = this._mvpMatrix.clone().transpose();
    for (const v of vertices) {
        mvp.transform(v);
        const depth = Math.min(Math.max(v.z / v.w, -1), 1);
        minDepth = Math.min(minDepth, depth);
        maxDepth = Math.max(maxDepth, depth);
    }

    return [minDepth, maxDepth];
}

setVolume(volume) {
    super.setVolume(volume);

    const gl = this._gl;
    const modality = volume._currentModality;

    this._mask = WebGL.createTexture(gl, {
        texture        : this._mask,
        target         : gl.TEXTURE_3D,
        width          : modality.width,
        height         : modality.height,
        depth          : modality.depth,
        type           : gl.UNSIGNED_BYTE,
        format         : gl.RGBA,
        internalFormat : gl.RGBA,
        min            : gl.LINEAR,
        mag            : gl.LINEAR,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        wrapR          : gl.CLAMP_TO_EDGE,
    });
}

setAttributes(attributes, layout) {
    WebGL.createBuffer(this._gl, {
        buffer : this._attrib,
        data   : attributes
    });
    this._layout = layout;
    this._rebuildAttribCompute();
}

_rebuildAttribCompute() {
    const gl = this._gl;

    if (this._compute) {
        gl.deleteProgram(this._compute.program);
    }

    const members = [];
    for (const attrib of this._layout) {
        members.push(attrib.type + ' ' + attrib.name + ';');
    }

    const instance = members.join('\n');
    const rules = [].join('\n');

    this._compute = WebGL.buildPrograms(gl, {
        compute  : SHADERS.AttribCompute
    }, { instance, rules }).compute;
}

_recomputeMask() {
    const gl = this._gl;

    const program = this._compute;
    gl.useProgram(program.program);

    const dimensions = this._volume._currentModality.dimensions;
    gl.uniform3i(program.uniforms.imageSize, dimensions.width, dimensions.height, dimensions.depth);

    gl.bindImageTexture(0, this._volume, 0, false, 0, gl.READ_ONLY, gl.R32UI);
    gl.bindImageTexture(0, this._mask, 0, false, 0, gl.WRITE_ONLY, gl.RGBA8);

    const groupsX = dimensions.width / 8;
    const groupsY = dimensions.height / 8;
    const groupsZ = dimensions.depth;
    gl.dispatchCompute(groupsX, groupsY, groupsZ);
}

_resetFrame() {
    const gl = this._gl;

    const [minDepth, maxDepth] = this.calculateDepth();
    this._minDepth = minDepth;
    this._maxDepth = maxDepth;
    this._depth = minDepth;

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1
    ]);

    const program = this._programs.reset;
    gl.useProgram(program.program);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_integrateFrame() {
    const gl = this._gl;

    const program = this._programs.integrate;
    gl.useProgram(program.program);

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1
    ]);

    gl.activeTexture(gl.TEXTURE2);
    gl.uniform1i(program.uniforms.uVolume, 2);
    gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());

    gl.activeTexture(gl.TEXTURE3);
    gl.uniform1i(program.uniforms.uTransferFunction, 3);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

    // TODO: calculate correct blur radius (occlusion scale)
    gl.uniform2f(program.uniforms.uOcclusionScale, this.occlusionScale, this.occlusionScale);
    gl.uniform1f(program.uniforms.uOcclusionDecay, this.occlusionDecay);
    gl.uniform1f(program.uniforms.uVisibility, this.visibility);
    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);

    const depthStep = (this._maxDepth - this._minDepth) / this.slices;
    for (let step = 0; step < this.steps; step++) {
        if (this._depth > this._maxDepth) {
            break;
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(program.uniforms.uColor, 0);
        gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);

        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(program.uniforms.uOcclusion, 1);
        gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[1]);

        gl.uniform1f(program.uniforms.uDepth, this._depth);

        this._accumulationBuffer.use();
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        this._accumulationBuffer.swap();

        this._depth += depthStep;
    }

    // Swap again to undo the last swap by AbstractRenderer
    this._accumulationBuffer.swap();
}

_renderFrame() {
    const gl = this._gl;

    const program = this._programs.render;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);

    gl.uniform1i(program.uniforms.uAccumulator, 0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_getFrameBufferSpec() {
    const gl = this._gl;
    return [{
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    }];
}

_getAccumulationBufferSpec() {
    const gl = this._gl;

    const colorBuffer = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    const occlusionBuffer = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RED,
        internalFormat : gl.R32F,
        type           : gl.FLOAT
    };

    return [
        colorBuffer,
        occlusionBuffer
    ];
}

}
