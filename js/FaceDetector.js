class FaceDetector {
    constructor(videoStream, canvas, options = {}) {
        this.options = {
            useTiny: (options.useTiny !== undefined) ? options.useTiny : false,
            buffer_len: (options.buffer_len !== undefined) ? options.buffer_len : 15,
            buffer_thresh: (options.buffer_thresh !== undefined) ? options.buffer_thresh : 0.015, // 0.010,
            jaw_thresh: (options.jaw_thresh !== undefined) ? options.jaw_thresh : 5
        }
        this.stream = videoStream
        this.outCanvas = canvas

        this.cur_result = null
        this.poses_count = 0
        this.nose_buffer = []

        this.initialized = false
        this.nose_normal = 0.08
        this.changePage = false

        this.controller = null

        this.movingTimer = null
        this.movingPage = false

    }

    async loadModels() {
        faceapi.loadSsdMobilenetv1Model('./models')
        faceapi.loadFaceLandmarkModel('./models')
        faceapi.loadTinyFaceDetectorModel('./models')
        faceapi.loadFaceLandmarkTinyModel('./models')
    }

    async detectFaceLandmarks() {
        if (this.options.useTiny)
            return await faceapi.detectSingleFace(this.outCanvas, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks(true)
        else
            return await faceapi.detectSingleFace(this.outCanvas).withFaceLandmarks()
    }

    initStream() {
        let self = this
        self.scenes = 0
        const faceCanvas = $("#faceImg")
            setInterval(function (){
            self.scenes += 1
            self.outCanvas.getContext('2d').drawImage(self.stream, 0, 0, self.outCanvas.width, self.outCanvas.height)
            if (self.scenes %= 7 !== 0) {
                // consider only one scene every 7
                faceapi.draw.drawFaceLandmarks(self.outCanvas, faceapi.resizeResults(self.cur_result, { width: self.outCanvas.width, height: self.outCanvas.height }))
                return
            }
            self.detectFaceLandmarks().then(function ( result){
                if (result === undefined || result.detection === undefined){
                    faceCanvas.css("border-color","#ff4b4b")
                    return
                }
                faceCanvas.css("border-color","#4dff4d")
                self.cur_result = result
                let face = faceapi.resizeResults(result, { width: self.outCanvas.width, height: self.outCanvas.height })

                faceapi.draw.drawFaceLandmarks(self.outCanvas, face)

                const point_1 = result.landmarks.positions[0]
                const point_17 = result.landmarks.positions[16]
                const point_34 = result.landmarks.positions[33]
                const point_31 = result.landmarks.positions[30]

                const zygomas_dist = Math.sqrt( Math.pow(point_1.x - point_17.x , 2) + Math.pow(point_1.y - point_17.y , 2)  )
                const nose_len = Math.sqrt( Math.pow(point_34.x - point_31.x , 2) + Math.pow(point_34.y - point_31.y , 2)  )
                const nose_ratio = nose_len / zygomas_dist

                if (self.poses_count < self.options.buffer_len)
                    self.nose_buffer.push(nose_ratio)
                else
                    self.nose_buffer[self.poses_count % self.options.buffer_len] = nose_ratio
                self.poses_count += 1

                self.checkBuffer()
            })
        }, 50)
    }

    checkBuffer() {
        let self = this
        if (self.poses_count < self.options.buffer_len)
            return
        const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length
        if (self.poses_count === self.options.buffer_len) {
            self.nose_normal = avg(self.nose_buffer)
            self.options.buffer_thresh = 0.12 * self.nose_normal
            console.log("nose_normal " + self.nose_normal)
            console.log("buffer_thresh" + self.options.buffer_thresh)
        }

        $("td p").removeClass("action_selected")

        if (self.controller === null)
            return

        const buf_avg = avg(self.nose_buffer)

        // Controllo la distannza in Y degli occhi, se è maggiore di una certa soglia guardo per un cambio pagina
        // Altrimenti controllo il nose buffer

        const point_1 = self.cur_result.landmarks.positions[0]
        const point_17 = self.cur_result.landmarks.positions[16]
        const point_42 = self.cur_result.landmarks.positions[41] // left bottom eye point
        const point_47 = self.cur_result.landmarks.positions[46] // right bottom eye point
        // const point_38 = self.cur_result.landmarks.positions[37] // left top eye point
        // const point_44 = self.cur_result.landmarks.positions[43] // right top eye point
        const point_49 = self.cur_result.landmarks.positions[48] // left mouth point
        const point_4 = self.cur_result.landmarks.positions[3] // left top jaw point
        const point_55 = self.cur_result.landmarks.positions[54] // right mouth point
        const point_14 = self.cur_result.landmarks.positions[13] // right top jaw point

        const zygomas_dist = Math.sqrt(Math.pow(point_1.x - point_17.x, 2) + Math.pow(point_1.y - point_17.y, 2))
        const eye_y_dist = Math.abs(point_42.y - point_47.y)
        const jaw_left_y_dist = Math.abs(point_49.x - point_4.x)
        const jaw_right_y_dist = Math.abs(point_55.x - point_14.x)
        const eye_y_ratio = eye_y_dist / zygomas_dist
        // const jaw_left_y_ratio = jaw_left_y_dist / zygomas_dist
        // const jaw_right_y_ratio = jaw_right_y_dist / zygomas_dist


        // console.log("this.changePage " + this.changePage)
        // console.log("jaw_left_y_dist " + jaw_left_y_dist + " | jaw_right_y_dist " + jaw_right_y_dist)
        if (self.movingPage)
            return
        if (eye_y_ratio > 10 * self.options.buffer_thresh) {
            // ZOOM
            self.movingPage = true
            self.movingTimer = setTimeout(function(){
                self.movingPage = false
            }, 1000)
            console.log(eye_y_ratio)
            // let page = self.controller.currPage
            // page = (point_42.y < point_47.y) ? page - 1 : page + 1

            let zoomOut = (point_42.y < point_47.y)


            self.controller.zoom(zoomOut)
        }
        else if (!this.changePage && jaw_left_y_dist < self.options.jaw_thresh){
            // Watching left page - 1
            self.movingPage = true
            self.movingTimer = setTimeout(function(){
                self.movingPage = false
            }, 1000)
            console.log("Change page left")
            let page = self.controller.currPage
            $("#scrollLeftTD p").addClass("action_selected")
            page = (page > 1) ? page - 1 : 1
            self.controller.renderPage(page)

        }
        else if (!this.changePage && jaw_right_y_dist < self.options.jaw_thresh){
            // Watching right
            self.movingPage = true
            self.movingTimer = setTimeout(function(){
                self.movingPage = false
            }, 1000)
            console.log("Change page right")
            let page = self.controller.currPage + 1
            $("#scrollRightTD p").addClass("action_selected")
            self.controller.renderPage(page)
        }
        else
        {
            const speed = - (self.nose_normal - buf_avg) / (self.options.buffer_thresh/2)
            // Check buffer of noise len
            if (Math.abs( self.nose_normal - buf_avg ) < self.options.buffer_thresh){
                console.log("scroll(speed) "+speed +" <--- self.nose_normal - buf_avg " + (self.nose_normal - buf_avg))
                return
            }

            console.log(" ---> scroll(speed) "+speed +" <--- self.nose_normal - buf_avg " + (self.nose_normal - buf_avg))
            self.controller.scroll(speed)
        }



    }
}