;(function(){

    var _count = 0;
    function when(cond, func) {
        if(!!cond()) {
            // console.log("[when]", _count);
            func();
        } else {
            _count++;
            setTimeout(()=>when(cond,func), 100);
        }
    };
var Z = {
    createdCallback: function() {
        var init = () => {
        if(!!this.initialized) return;

        if(!player) throw new Error("<caffo-player> not ready before <sorbetto-spektrum>");
        var audioElement = player.audioElement;
        if(!audioElement) throw new Error("<sorbetto-spektrum> must wrap an <audio>");

        if(!this.querySelector("canvas")) this.appendChild(document.importNode(this.template.content, true));
        var canvas = this.querySelector("canvas");
        var that = this;
        function resizeFn() {
            canvas.width = 0;
            canvas.height = 0;

            var rect = that.getBoundingClientRect();

            canvas.width = rect.width;
            canvas.height = rect.height;
        }
        resizeFn();
        this.resizeFn = resizeFn;
        window.addEventListener("resize", function() {
            that.resizeFn();
        });

        var canvasCtx = canvas.getContext("2d");
        var audioCtx = new AudioContext();
        window.addEventListener("click", () => audioCtx.resume());
        var source = audioCtx.createMediaElementSource(audioElement);
        var analyser = audioCtx.createAnalyser();
        analyser.smoothingTimeConstant = 0;
        var dataArray = new Uint8Array(256);

        this.bars = 64;
        this.padX = 1;
        this.padY = 1;
        this.blocksize = 1;

        var that = this;

        var interval = 256/this.bars;
        var cycle = 0;

        var peaks = [];
        for(var i = 0; i < this.bars; i++) {
            peaks[i] = 0;
        }

        var peakCycles = [];
        function spektrum() {
            // chrome is a "good" browser
            var cs = getComputedStyle(that);

            canvasCtx.fillStyle = cs.backgroundColor;
            canvasCtx.fillRect(0,0,canvas.width,canvas.height);

            canvasCtx.fillStyle = cs.color;
            var w = (canvas.width-that.padX*that.bars)/that.bars;
            var h = canvas.height;
            var sum = 0;
            var interval = 256/that.bars;
            for(var i = 0, j = 0; i < 256; i++) {
                sum += (256-dataArray[i])/256;
                if(++cycle >= interval) {
                    var x = j*w + that.padX*j;
                    peak = 1 - sum/interval;
                    var y = peak*h;
                    for(var yy = 0; yy < y; yy+=that.blocksize+that.padY) {
                        canvasCtx.fillRect(x, h - yy, w, that.blocksize);
                    }
                    if(peak > peaks[j]) {
                        peaks[j] = peak;
                        peakCycles[j] = 0;
                    } else {
                        peakCycles[j]++;
                        if(peakCycles[j] >= 15) {
                            peaks[j] *= 0.98;
                            peaks[j] -= 0.005;
                        }
                        if(peaks[j] < 0.0000001) peaks[j] = 0;
                    }
                    canvasCtx.fillStyle = cs.borderColor || that.style.borderColor || 'red';
                    canvasCtx.fillRect(x, ((1-peaks[j])*h), w, that.blocksize);
                    canvasCtx.fillStyle = cs.color;
                    j++;
                    sum = cycle = 0;
                }
            }
        }

        analyser.fftSize = 2048;
        var bufferLength = analyser.frequencyBinCount;
        var oscDataArray = new Uint8Array(bufferLength);

        function oscilliscope() {
            // chrome is a "good" browser
            var cs = getComputedStyle(that);

            canvasCtx.fillStyle = cs.backgroundColor;
            canvasCtx.fillRect(0,0,canvas.width,canvas.height);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = cs.color;

            canvasCtx.beginPath();

            var sliceWidth = canvas.width * 1.0 / bufferLength;
            var x = 0;

            for(var i = 0; i < bufferLength; i++) {
                var v = oscDataArray[i] / 128.0;
                var y = v * canvas.height/2;
                if(i===0) {
                    canvasCtx.moveTo(x,y);
                } else {
                    canvasCtx.lineTo(x,y);
                }
                x+=sliceWidth;
            }
            canvasCtx.lineTo(canvas.width, canvas.height/2);
            canvasCtx.stroke();
        }

        var animations = [
            spektrum,
            oscilliscope,
            function(){} /* no-op */
        ];

        var animationIndex = 0;

        this.addEventListener('click', function() {
            if(++animationIndex > animations.length-1) animationIndex = 0;
            if(audioElement.paused) {
              if(!canvas.width || !canvas.height) resizeFn();

              canvasCtx.clearRect(0,0,canvas.width,canvas.height);
              animations[animationIndex]();

              requestRender();
            }
        });

        var lastUpdate = 0;
        var frameRate = 1000/60;
        var then = new Date();
        function requestRender() {
            let now = new Date();
            lastUpdate += now-then;
            then = now;
            if(lastUpdate >= frameRate) {
                lastUpdate -= frameRate;
                requestAnimationFrame(draw);
            }
        }

        function draw() {
            if(audioElement.paused) {
              audioElement.addEventListener("play", draw);
              return;
            }
            analyser.getByteTimeDomainData(oscDataArray);
            analyser.getByteFrequencyData(dataArray);
            if(!canvas.width || !canvas.height) resizeFn();

            canvasCtx.clearRect(0,0,canvas.width,canvas.height);
            animations[animationIndex]();

            requestRender();
        }
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        draw();

        Object.defineProperty(this, "state", {
            get: function() {
                return {
                    animationIndex
                };
            },
            set: function(st) {
                if(st.animationIndex > 0 && st.animationIndex < animations.length) {
                    animationIndex = st.animationIndex;
                }
            }
        });
        this.initialized = true;
        };
        when(()=>!!player, init);
    },
    attachedCallback: function() {
        // if(!this.initialized) this.connectedCallback();
        if(!!this.resizeFn) this.resizeFn();
    }
};

Register("SorbettoSpektrum", "sorbetto-spektrum", Z, " <canvas></canvas> ");
})();
