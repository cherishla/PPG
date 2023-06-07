const smooth = function (s, wsize) {

    this.signal = s;
    this.smoothing_kernel =Array(wsize);
    this.setKernel = function() {
        let scaling_factor;
        
        scaling_factor = 1.0 / this.smoothing_kernel.length;
        this.smoothing_kernel.fill(scaling_factor);
    }

    this.smoothSignal = function (){
        let c = new CrossCorrelation(this.signal, this.smoothing_kernel);
        let output = c.crossCorrelate();
        return output;
    }
    
    if (wsize > s.length) {
        throw new Error("Kernel cannot be greater than signal.");
    } else {
        this.setKernel();
    }

   
    scaling_factor = 1.0 / sum(this.smoothing_kernel);
    scaleInPlace(scaling_factor, this.smoothing_kernel);
}

const sum = (list)=>{
   return list.reduce((a, b) => a + b, 0)
}

const scaleInPlace = (val, arr)=> {
    for (let i = 0; i < arr.length; i++) {
        arr[i] *= val;
    }
}

const convolve = (vec1, vec2) => {
    if (vec1.length === 0 || vec2.length === 0) {
      throw new Error("Vectors can not be empty!");
    }
    const volume = vec1;
    const kernel = vec2;
    let displacement = 0;
    const convVec = [];
  
    for (let i = 0; i < volume.length; i++) {
      for (let j = 0; j < kernel.length; j++) {
        if (displacement + j !== convVec.length) {
          convVec[displacement + j] =
            convVec[displacement + j] + volume[i] * kernel[j];
        } else {
          convVec.push(volume[i] * kernel[j]);
        }
      }
      displacement++;
    }
  
    return convVec;
  };

const CrossCorrelation = function (a, window) {
    this.signal = a;
    this.kernel = window;
    this.autocorr = false;
    this.crossCorrelate = function(){
        this.kernel = this.kernel.reverse();
        let c1 = new Convolution(this.signal, this.kernel);
        output = c1.convolve();
        return output;
    }
};

const Convolution = function (a, window){
    this.signal = a;
    this.kernel = window;
    this.output = null;
    this.convolve = function(){
        let temp = convolve(this.signal, this.kernel);
        let iterator;
        let i;
        this.output = Array(this.signal.length - this.kernel.length + 1);
        iterator = this.kernel.length - 1;

        for(i = 0; i < this.output.length; ++i) {
            this.output[i] = temp[iterator];
            ++iterator;
        }
        return this.output;
    }

}