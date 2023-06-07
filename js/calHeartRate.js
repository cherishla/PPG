const Detrend = function (a) {
    this.timeSeries = a;
    this.detrendSignal = function () {
        let dfa = new DFA(timeSeries);
        return dfa.constantDetrend(timeSeries);
     }
};

// const SplineInterpolator = function () {
      

// }
const Butterworth = function (a,b,c) {
    this.order = a;
    this.cutoff = b;
    this.sampling= c;
    this.iirCalculator = new Fili.CalcCascades();
    // get available filters
    this.availableFilters = iirCalculator.available();

    // calculate filter coefficients
    this.iirFilterCoeffs = iirCalculator.lowpass({
        order: a, // cascade 3 biquad filters (max: 12)
        characteristic: 'butterworth',
        Fs: c, // sampling frequency
        Fc: b, // cutoff frequency / center frequency for bandpass, bandstop, 
  });

// create a filter instance from the calculated coeffs
var iirFilter = new Fili.IirFilter(iirFilterCoeffs);
    this.lowPass = function (a) {
        let r; 
        for(let i = 0 ; i< this.order / 2 ; i++){
            let data = iirFilter.simulate(a);
            if(data[0]> 0)
                r = data;
        }
    }
}

const Hamming = function (l) {
    let r = [];
    this.getWindow = function(){
        for (let index = 0; index < l; index++) {
           r.push(WindowFunction.Hamming(l,index));
            
        }
        return r;
    }
};
const FastFourier = function (arr) {
    this.signal = [...arr];
    this.power = Math.log(this.signal.length) / Math.log(2.0);
    this.raised_power = Math.ceil(power);
    this.new_length = parseInt(Math.pow(2.0, raised_power));
    if (new_length != this.signal.length) {
        let zeroArray = Array(new_length - this.signal.length);
        zeroArray.fill(0);
        this.signal = this.signal.concat(zeroArray);
        
    }
    this.ABSTransform = function(){
        this.fft = new FFT(this.signal.length, 44100);
        fft.forward(this.signal);
        let realList =  fft.real;
        let imagList = fft.imag;
        let result = [];
        for (let index = 0; index < this.signal.length; index++) {
           let real = realList[i];
           let imaginary = imagList[i];

           if (Math.abs(real) < Math.abs(imaginary)) {
            if (imaginary == 0.0) {
                result.push(Math.abs(real));
                continue;
            }
            let q = real / imaginary;
            result.push(Math.abs(imaginary) * Math.sqrt(1 + q * q));
        } else {
            if (real == 0.0) {
                result.push(Math.abs(imaginary));
                continue;
            }
            let q = imaginary / real;
            result.push(FastMath.abs(real) * FastMath.sqrt(1 + q * q));
        }
        return result;
        
    }
}
}

const Hanning = function (l) {
    let r = [];
    this.getWindow = function(){
        for (let index = 0; index < l; index++) {
           r.push(WindowFunction.Hanning(l,index));
            
        }
        return r;
    }
}
const Peak = {

}
const Line_t = function (x1, y1, x2, y2) {
    this.p1_x = x1;
    this.p1_y = y1;
    this.p2_x = x2;
    this.p2_y = y2;
    this.getX1 = function () { return this.p1_x; };
    this.getX2 = function () { return this.p2_x; };
    this.getY1 = function () { return this.p1_y; };
    this.getY1 = function () { return this.p2_y; };
    this.setX1 = function (val) { return this.p1_x = val; };
    this.setX2 = function (val) { return this.p2_x = val; };
    this.setY1 = function (val) { return this.p1_y = val; };
    this.setY1 = function (val) { return this.p2_y = val; };

}

const Artifact = function (start, end) {
    this.start = start;
    this.end = end;
}

const sleep = async function (ms) {
    new Promise(res => setTimeout(res, ms));

}
var timestampQ = [],
    upsample_factor = 4;

const new_fs = ppg_fs*upsample_factor;


var calHeartRatenterval;

function calHeartRate() {
    calHeartRatenterval = setInterval(function () { calcHeartRate() }, 100);
}

function calcHeartRate(){
    
        if (abortTraining) {
            clearInterval(calHeartRatenterval);
        }

        if (start_cal == false) {

            //     //Sleeping part may lead to timing problems
            //     try {
            //         await sleep(100);
            //     }catch {}
        } else {

            start_cal = false;
            if (dataQ.length <= sliding_window_size) return;

            try {

                let total_point = PPGTime * 60 * ppg_fs;

                if (dataQ.length > sliding_window_size && windowStartIdx < total_point - sliding_window_size) {

                    let contain_arti = false,
                        cor_freq = [],
                        cor_freq_ctr = 0,
                        windowed_PPG_b = toArray(dataQ, windowStartIdx, windowEndIdx, 0);


                    windowed_ppg_str = arrayToString(windowed_PPG_b);

                    let d2 = new Detrend(windowed_PPG_b, "constant"),
                        windowed_PPG = d2.detrendSignal();

                    //Interpolate to 500Hz to lower the error of HRV calculation
                    let upsampled_PPG_x = [];
                    for (let qq = 0; qq < windowed_PPG.length; qq++) {
                        upsampled_PPG_x[qq] = qq * upsample_factor;
                    }


                    let splineIinterpolator_ppg = new SplineInterpolator();
                    let calibrantInterpolator_ppg = splineIinterpolator_ppg.interpolate(upsampled_PPG_x, windowed_PPG);

                    let up_ppg = [];
                    let up_x = [];
                    for (let i = 0; i < up_ppg.length - upsample_factor; i++) {
                        up_x[i] = i;
                        up_ppg[i] = calibrantInterpolator_ppg.value(i);
                    }


                    //Lowpass filter
                    let butterworthLowPass2 = new Butterworth();
                    butterworthLowPass2.lowPass(20, new_fs, 5);
                    for (let j = 0; j < up_ppg.length; j++) {
                        up_ppg[j] = butterworthLowPass2.filter(up_ppg[j]);
                    }

                    //Sliding window
                    IMS();


                    //Collect positive alpha line
                    let pos_alpha_line = collectPositiveLine();

                    let firstLine = 0;
                    //Get first major peak
                    for (let lineCtr = 1; lineCtr + 1 < pos_alpha_line.length; lineCtr++) {
                        last_amp = pos_alpha_line[lineCtr - 1].getY2();
                        this_amp = pos_alpha_line[lineCtr].getY2();
                        next_amp = pos_alpha_line[lineCtr + 1].getY2();
                        if (this_amp >= next_amp && this_amp >= last_amp) {
                            firstLine = lineCtr;
                            break;
                        }
                    }


                    major_pks_arrlst = [];
                    minor_pks_arrlst = [];
                    artifact_arrlst = [];

                    const min_RR_interval = 9 * upsample_factor;
                    const max_RR_interval = 35 * upsample_factor;
                    //Calcalate the minor peaks metrics
                    let heading_artifact = true;
                    let artifact_start = true;
                    let artifact_start_idx = 0;
                    let artifact_end_idx = 0;
                    let amp_thres = 10;
                    for (let lineCtr = firstLine; lineCtr + 6 < pos_alpha_line.length;) {

                        let amp0 = pos_alpha_line[lineCtr].getY2();
                        let amp1 = pos_alpha_line[lineCtr + 1].getY2();
                        let amp2 = pos_alpha_line[lineCtr + 2].getY2();
                        let amp3 = pos_alpha_line[lineCtr + 3].getY2();
                        let amp4 = pos_alpha_line[lineCtr + 4].getY2();
                        let amp5 = pos_alpha_line[lineCtr + 5].getY2();
                        let amp6 = pos_alpha_line[lineCtr + 6].getY2();
                        let peak_distance1 = pos_alpha_line[lineCtr + 2].getX2() - pos_alpha_line[lineCtr].getX2();
                        let peak_distance2 = pos_alpha_line[lineCtr + 3].getX2() - pos_alpha_line[lineCtr].getX2();
                        let peak_distance3 = pos_alpha_line[lineCtr + 4].getX2() - pos_alpha_line[lineCtr].getX2();
                        let peak_distance4 = pos_alpha_line[lineCtr + 5].getX2() - pos_alpha_line[lineCtr].getX2();

                        if (amp0 > amp1 && amp2 > amp1 && amp2 > amp3
                            && ((amp2 - amp3) > amp_thres) && ((amp2 - amp1) > amp_thres)
                            && peak_distance1 > min_RR_interval && peak_distance1 < max_RR_interval) {
                            //pos_alpha_line.get(lineCtr+2) is a major peak, pos_alpha_line.get(lineCtr+1) is a minor peak
                            if (heading_artifact) heading_artifact = false;
                            let major_peak = new Line_t(pos_alpha_line[lineCtr + 1].getX1(), pos_alpha_line[lineCtr + 1].getY1()
                                , pos_alpha_line[lineCtr + 2].getX2(), pos_alpha_line[lineCtr + 2].getY2());
                            let minor_peak = new Line_t(pos_alpha_line[lineCtr + 1].getX1(), pos_alpha_line[lineCtr + 1].getY1()
                                , pos_alpha_line[lineCtr + 1].getX2(), pos_alpha_line[lineCtr + 1].getY2());

                            major_pks_arrlst.push(major_peak);
                            minor_pks_arrlst.push(minor_peak);


                            if (artifact_start == false) {
                                artifact_end_idx = pos_alpha_line[lineCtr + 2].getX2();
                                artifact_start = true;
                                let found_arti = new Artifact(preseInt(artifact_start_idx), preseInt(artifact_end_idx));
                                artifact_arrlst.push(found_arti);

                                //System.out.println("+++++++1artifact found in :"+(int) artifact_start_idx+" to "+(int)artifact_end_idx);
                            }
                            //System.out.println("x,y is a peak1:"+pos_alpha_line.get(lineCtr+2).getX2()+","+pos_alpha_line.get(lineCtr+2).getY2());


                            if (major_pks_arrlst.length > 1 && major_pks_arrlst[major_pks_arrlst.length - 1].getX2() > artifact_end_idx) {
                                let dif = major_pks_arrlst[major_pks_arrlst.length - 1].getX2() - major_pks_arrlst[major_pks_arrlst.length - 2].getX2();
                                cor_freq[cor_freq_ctr++] = (dif * 1000) / new_fs;

                            }

                            lineCtr += 2;

                        } else if (amp0 > amp1 && amp3 > amp2 && amp3 > amp1 && amp3 > amp4
                            && ((amp3 - amp4) > amp_thres) && ((amp3 - amp2) > amp_thres)
                            && peak_distance2 > min_RR_interval && peak_distance2 < max_RR_interval) {
                            //
                            if (heading_artifact) heading_artifact = false;
                            let major_peak = new Line_t(pos_alpha_line[lineCtr + 1].getX1(), pos_alpha_line[lineCtr + 1].getY1()
                                , pos_alpha_line[lineCtr + 3].getX2(), pos_alpha_line[lineCtr + 3].getY2());
                            let minor_peak = new Line_t(pos_alpha_line[lineCtr + 1].getX1(), pos_alpha_line[lineCtr + 1].getY1()
                                , pos_alpha_line[lineCtr + 1].getX2(), pos_alpha_line[lineCtr + 1].getY2());

                            major_pks_arrlst.push(major_peak);
                            minor_pks_arrlst.push(minor_peak);

                            if (artifact_start == false) {
                                artifact_end_idx = pos_alpha_line[lineCtr + 3].getX2();
                                artifact_start = true;
                                let found_arti = new Artifact(parseInt(artifact_start_idx), parseInt(artifact_end_idx));
                                artifact_arrlst.push(found_arti);

                                //System.out.println("+++++++2artifact found in :"+(int) artifact_start_idx+" to "+(int)artifact_end_idx);
                            }

                            //System.out.println("x,y is a peak2:"+pos_alpha_line.get(lineCtr+3).getX2()+","+pos_alpha_line.get(lineCtr+3).getY2());

                            if (major_pks_arrlst.length > 1 && major_pks_arrlst[major_pks_arrlst.length - 1].getX2() > artifact_end_idx) {
                                let dif = major_pks_arrlst[major_pks_arrlst.length - 1].getX2() - major_pks_arrlst[major_pks_arrlst.length - 2].getX2();
                                cor_freq[cor_freq_ctr++] = (dif * 1000) / new_fs;

                            }

                            lineCtr += 3;
                        } else if (amp0 > amp1 && amp4 > amp2 && amp4 > amp3 && amp4 > amp1 && amp4 > amp5
                            && ((amp4 - amp5) > amp_thres) && ((amp4 - amp3) > amp_thres)
                            && peak_distance3 > min_RR_interval && peak_distance3 < max_RR_interval) {
                            if (heading_artifact) heading_artifact = false;

                            let major_peak = new Line_t(pos_alpha_line[lineCtr + 1].getX1(), pos_alpha_line[lineCtr + 1].getY1()
                                , pos_alpha_line[lineCtr + 4].getX2(), pos_alpha_line[lineCtr + 4].getY2());
                            let minor_peak = new Line_t(pos_alpha_line[lineCtr + 1].getX1(), pos_alpha_line[lineCtr + 1].getY1()
                                , pos_alpha_line[lineCtr + 1].getX2(), pos_alpha_line[lineCtr + 1].getY2());

                            major_pks_arrlst.push(major_peak);
                            minor_pks_arrlst.push(minor_peak);

                            if (artifact_start == false) {
                                artifact_end_idx = pos_alpha_line[lineCtr + 4].getX2();
                                artifact_start = true;
                                let found_arti = new Artifact(paseInt(artifact_start_idx), parseInt(artifact_end_idx));
                                artifact_arrlst.push(found_arti);

                                // System.out.println("+++++++3artifact found in :"+(int) artifact_start_idx+" to "+(int)artifact_end_idx);
                            }

                            //System.out.println("x,y is a peak3:"+pos_alpha_line.get(lineCtr+4).getX2()+","+pos_alpha_line.get(lineCtr+4).getY2());

                            if (major_pks_arrlst.length > 1 && major_pks_arrlst[major_pks_arrlst.length - 1].getX2() > artifact_end_idx) {
                                let dif = major_pks_arrlst[major_pks_arrlst.length - 1].getX2() - major_pks_arrlst[major_pks_arrlst.length - 2].getX2();
                                cor_freq[cor_freq_ctr++] = (dif * 1000) / new_fs;

                            }

                            lineCtr += 4;
                        } else if (amp0 > amp1 && amp5 > amp1 && amp5 > amp2 && amp5 > amp3 && amp5 > amp4 && amp5 > amp6
                            && ((amp5 - amp6) > amp_thres) && ((amp5 - amp4) > amp_thres)
                            && peak_distance4 > min_RR_interval && peak_distance4 < max_RR_interval) {
                            if (heading_artifact) heading_artifact = false;
                            let major_peak = new Line_t(pos_alpha_line[lineCtr + 1].getX1(), pos_alpha_line[lineCtr + 1].getY1()
                                , pos_alpha_line[lineCtr + 5].getX2(), pos_alpha_line[lineCtr + 5].getY2());
                            let minor_peak = new Line_t(pos_alpha_line[lineCtr + 1].getX1(), pos_alpha_line[lineCtr + 1].getY1()
                                , pos_alpha_line[lineCtr + 1].getX2(), pos_alpha_line[lineCtr + 1].getY2());

                            major_pks_arrlst.push(major_peak);
                            minor_pks_arrlst.push(minor_peak);



                            if (artifact_start == false) {
                                artifact_end_idx = pos_alpha_line[lineCtr + 5].getX2();
                                artifact_start = true;
                                let found_arti = new Artifact(parseInt(artifact_start_idx), parseInt(artifact_end_idx));
                                artifact_arrlst.push(found_arti);

                                // System.out.println("+++++++4artifact found in :"+(int) artifact_start_idx+" to "+(int)artifact_end_idx);
                            }

                            //System.out.println("x,y is a peak4:"+pos_alpha_line.get(lineCtr+5).getX2()+","+pos_alpha_line.get(lineCtr+5).getY2());

                            if (major_pks_arrlst.length > 1 && major_pks_arrlst[major_pks_arrlst.length - 1].getX2() > artifact_end_idx) {
                                let dif = major_pks_arrlst[major_pks_arrlst.length - 1].getX2() - major_pks_arrlst[major_pks_arrlst.length - 2].getX2();
                                cor_freq[cor_freq_ctr++] = (dif * 1000) / new_fs;


                            }

                            lineCtr += 5;
                        } else {
                            if (heading_artifact == false) {
                                if (artifact_start && major_pks_arrlst.length > 0) {
                                    artifact_start = false;
                                    artifact_start_idx = major_pks_arrlst[major_pks_arrlst.length - 1].getX2();
                                }

                                //artifact_arrlst.push(found_arti);

                            }

                            lineCtr++;
                        }
                    }
                    let containArtimorethan0 = false;
                    let containArtimorethan1 = false;
                    let containArtimorethan2 = false;

                    //Artifact detection
                    //artifact_arrlst0 for detecting artifact that caused by large amplitude ppg
                    let artifact_arrlst0 = [];
                    let arti0_str = "";
                    let amp_arr = [];

                    for (let xx = 0; xx < major_pks_arrlst.length; xx++) {
                        let amp = major_pks_arrlst[xx].getY2() - major_pks_arrlst[xx].getY1();
                        amp_arr[xx] = amp;
                        //System.out.println("xx:"+xx);
                        //System.out.println("amp:"+amp);
                    }
                    let mean_amp_arr = calculateMean(amp_arr);
                    let std_amp_arr = calculateStdev(amp_arr);
                    //System.out.println("amp mean:"+mean_amp_arr);
                    //System.out.println("amp std:"+std_amp_arr);
                    let thres_amp_arr = (mean_amp_arr + 3 * std_amp_arr) * 1.2;
                    //System.out.println("thres_amp_arr:"+thres_amp_arr);
                    let rewrite_peak_amp = false;
                    for (let xx = 0; xx < amp_arr.length; xx++) {
                        //if(s == windowSeeIdx)System.out.println("amp_arr[xx]:"+amp_arr[xx]);

                        if (amp_arr[xx] > thres_amp_arr) {
                            //System.out.println("{{{{{Amp of peak is to large:"+xx);
                            if (xx == 0) {
                                major_pks_arrlst[xx].setY1(major_pks_arrlst[xx + 1].getY1());
                                major_pks_arrlst[xx].setY2(major_pks_arrlst[xx + 1].getY2());
                                //System.out.println("Set the "+xx+ "peak Y2 to "+major_pks_arrlst.get(xx+1).p2_y);

                            } else {
                                major_pks_arrlst[xx].setY1(major_pks_arrlst[xx - 1].getY1());
                                major_pks_arrlst[xx].setY2(major_pks_arrlst[xx - 1].getY2());
                                //System.out.println("Set the "+xx+ "peak Y2 to "+major_pks_arrlst.get(xx-1).p2_y);
                            }
                            rewrite_peak_amp = true;

                            let large_amp_arti = new Artifact(parseInt(major_pks_arrlst[xx].getX1()), parseInt(major_pks_arrlst[xx].getX2()));
                            arti0_str += "[" + Double.toString(major_pks_arrlst[xx].getX1()) + "," + Double.toString(major_pks_arrlst[xx].getX2()) + "], ";
                            artifact_arrlst0.push(large_amp_arti);
                            containArtimorethan0 = true;

                        }
                        //System.out.println("xx:"+xx);
                        //System.out.println("amp_arr[xx]:"+amp_arr[xx]);

                    }

                    artilist0_str = arti0_str;

                    //Check the number of the peaks in 64 windows
                    //System.out.println("major_pks_arrlst.length:"+major_pks_arrlst.length);
                    if (major_pks_arrlst.length < (int)(window_time / 3)) {

                        return;
                    }
                    if (major_pks_arrlst.length > (int)(window_time * 2.5)) {

                        return;
                    }

                    let p_m_loc = [];
                    let pks_m_intensities = [];

                    for (let ht = 0; ht < minor_pks_arrlst.length; ht++) {
                        p_m_loc[ht] = minor_pks_arrlst[ht].getX2();
                        pks_m_intensities[ht] = minor_pks_arrlst[ht].getY2();
                    }
                    let points_m_RIIV = parseInt((p_m_loc[p_m_loc.length - 1] - p_m_loc[0]) * 1000 / new_fs);
                    //Prevent the leading zero
                    let start_m_idx = parseInt(p_m_loc[0]) * parseInt(1000 / new_fs);

                    let RImV_X = linspace(p_m_loc[0], p_m_loc[p_m_loc.length - 1], points_m_RIIV);
                    let splineIinterpolator_m_RIIV = new SplineInterpolator();
                    let calibrantInterpolator_m_RIIV = splineIinterpolator_m_RIIV.interpolate(p_m_loc, pks_m_intensities);
                    let interpolate_RImV_Result = [];
                    for (let i = 0; i < RImV_X.length; i++) {
                        interpolate_RImV_Result[i] = calibrantInterpolator_m_RIIV.value(RImV_X[i]);
                    }
                    //System.out.println("start_idx:"+start_idx);
                    //System.out.println("points_RIIV:"+points_RIIV);
                    if (start_m_idx > points_m_RIIV) {
                        //System.out.println("start_idx>points_RIIV Error!! ");
                        return;
                    }

                    let cut_interpolate_RImV_Result = interpolate_RImV_Result.slice(start_m_idx, points_m_RIIV);
                    let cut_interpolate_RImV_X = interpolate_RImV_Result.slice(start_m_idx, points_m_RIIV);

                    let filtered_interpolate_RImV_Result = [];
                    //Lowpass before downsampling to avoid aliasing
                    let butterworthLowPass_RImV = new Butterworth();
                    butterworthLowPass_RImV.lowPass(20, 1000, 2);
                    for (let j = 0; j < cut_interpolate_RImV_Result.length; j++) {
                        filtered_interpolate_RImV_Result[j] = butterworthLowPass_RImV.filter(cut_interpolate_RImV_Result[j]);
                    }

                    let cut_RImV_length = cut_interpolate_RImV_X.length;
                    //Down sampling to 4Hz
                    let RImV_4Hz_X = [];
                    let RImV_4Hz_Y = [];
                    for (let i = 0; (i * 250) < cut_RImV_length; i++) {
                        RImV_4Hz_X[i] = cut_interpolate_RImV_X[i * 250];
                        RImV_4Hz_Y[i] = filtered_interpolate_RImV_Result[i * 250];
                    }




                    //Respiratory-induced intensity variation (RIIV) waveforms
                    let p_loc = [];
                    let pks_intensities = [];
                    for (let ht = 0; ht < major_pks_arrlst.length; ht++) {
                        p_loc[ht] = major_pks_arrlst[ht].getX2();
                        pks_intensities[ht] = major_pks_arrlst[ht].getY2();
                    }
                    let points_RIIV = parseInt((p_loc[p_loc.length - 1] - p_loc[0]) * 1000 / new_fs);
                    //Prevent the leading zero
                    let start_idx = parseInt(p_loc[0]) * parseInt(1000 / new_fs);

                    let RIIV_X = linspace(p_loc[0], p_loc[p_loc.length - 1], points_RIIV);
                    let splineIinterpolator_RIIV = new SplineInterpolator();
                    let calibrantInterpolator_RIIV = splineIinterpolator_RIIV.interpolate(p_loc, pks_intensities);
                    let interpolate_RIIV_Result = new double[RIIV_X.length];
                    for (let i = 0; i < RIIV_X.length; i++) {
                        interpolate_RIIV_Result[i] = calibrantInterpolator_RIIV.value(RIIV_X[i]);
                    }
                    //System.out.println("start_idx:"+start_idx);
                    //System.out.println("points_RIIV:"+points_RIIV);
                    if (start_idx > points_RIIV) {
                        //System.out.println("start_idx>points_RIIV Error!! ");
                        return;
                    }



                    let cut_interpolate_RIIV_Result = interpolate_RIIV_Result.slice(start_idx, points_RIIV);
                    let cut_interpolate_RIIV_X = RIIV_X.slice(start_idx, points_RIIV);

                    let filtered_interpolate_RIIV_Result = [];
                    //Lowpass before downsampling to avoid aliasing
                    let butterworthLowPass_RIIV = new Butterworth();
                    butterworthLowPass_RIIV.lowPass(20, 1000, 2);
                    for (let j = 0; j < cut_interpolate_RIIV_Result.length; j++) {
                        filtered_interpolate_RIIV_Result[j] = butterworthLowPass_RIIV.filter(cut_interpolate_RIIV_Result[j]);
                    }

                    //Down sampling to 4Hz
                    let cut_RIIV_length = cut_interpolate_RIIV_X.length;
                    let RIIV_4Hz_X = [];
                    let RIIV_4Hz_Y = [];
                    for (let i = 0; (i * 250) < cut_RIIV_length; i++) {
                        RIIV_4Hz_X[i] = cut_interpolate_RIIV_X[i * 250];
                        RIIV_4Hz_Y[i] = filtered_interpolate_RIIV_Result[i * 250];
                    }

                    let temp_riiv_str = "";
                    for (let se = 0; se < RIIV_4Hz_Y.length; se++) temp_riiv_str += RIIV_4Hz_Y[se] + ", ";
                    RIIV_sliding_window_str = temp_riiv_str;

                    //Respiratory-induced amplitude variation  (RIAV) waveforms
                    let RIAV_X = RIIV_X;
                    let points_RIAV = points_RIIV;
                    let pks_amplitude = new double[major_pks_arrlst.length];
                    for (let ht = 0; ht < major_pks_arrlst.length; ht++) pks_amplitude[ht] = major_pks_arrlst[ht].getY2() - major_pks_arrlst[ht].getY1();
                    let splineIinterpolator_RIAV = new SplineInterpolator();
                    let calibrantInterpolator_RIAV = splineIinterpolator_RIAV.interpolate(p_loc, pks_amplitude);
                    let interpolate_RIAV_Result = new double[RIAV_X.length];
                    for (let i = 0; i < RIAV_X.length; i++) {
                        interpolate_RIAV_Result[i] = calibrantInterpolator_RIAV.value(RIAV_X[i]);
                    }




                    let cut_interpolate_RIAV_Result = interpolate_RIAV_Result.slice(start_idx, points_RIAV);
                    let cut_interpolate_RIAV_X = RIAV_X.slice(start_idx, points_RIAV);

                    let filtered_interpolate_RIAV_Result = new double[cut_interpolate_RIAV_Result.length];

                    //Lowpass before downsampling to avoid aliasing
                    let butterworthLowPass_RIAV = new Butterworth();
                    butterworthLowPass_RIAV.lowPass(20, 1000, 2);
                    for (let j = 0; j < cut_interpolate_RIAV_Result.length; j++) {
                        filtered_interpolate_RIAV_Result[j] = butterworthLowPass_RIAV.filter(cut_interpolate_RIAV_Result[j]);
                    }

                    let cut_RIAV_length = cut_interpolate_RIAV_X.length;
                    //Down sampling to 4Hz
                    let RIAV_4Hz_X = new double[(cut_RIAV_length / 250) + 1];
                    let RIAV_4Hz_Y = new double[(cut_RIAV_length / 250) + 1];
                    for (let i = 0; (i * 250) < cut_RIAV_length; i++) {
                        RIAV_4Hz_X[i] = cut_interpolate_RIAV_X[i * 250];
                        RIAV_4Hz_Y[i] = filtered_interpolate_RIAV_Result[i * 250];
                    }

                    let temp_riav_str = "";
                    for (let se = 0; se < RIAV_4Hz_Y.length; se++) temp_riav_str += RIAV_4Hz_Y[se] + ", ";
                    RIAV_sliding_window_str = temp_riav_str;



                    let f_loc = [];
                    let frequencies = [];

                    let min_interval = parseInt(0.24 * new_fs);
                    //artifact_arrlst1 for detecting artifact that caused by irregular ppg waveform (not quite senitive)
                    let artifact_arrlst1 = [];
                    let arti1_str = "";

                    //artifact_arrlst2 for detecting artifact that caused by invalid RR intervals (very sensitive)
                    let artifact_arrlst2 = [];
                    let arti2_str = "";

                    if (artifact_arrlst.length > 0) {

                        //Artifact aggregation by time
                        let temp_start = artifact_arrlst[0].start_loc;
                        let temp_end = artifact_arrlst[0].end_loc;
                        for (let aa = 0; aa < artifact_arrlst.length - 1; aa++) {
                            if ((artifact_arrlst[aa + 1].start_loc - artifact_arrlst[aa].end_loc) / new_fs < 5) {

                                temp_end = artifact_arrlst[aa + 1].end_loc;
                            } else {
                                //System.out.println("append artifact:"+temp_start+" to "+temp_end+" as arti");
                                let agg_arti = new Artifact(temp_start, temp_end);
                                if (Math.abs(temp_start - temp_start) / new_fs > 3) {
                                    //System.out.println("@@@@arti_acc_time > 3");
                                    containArtimorethan1 = true;
                                }
                                artifact_arrlst1.push(agg_arti);
                                temp_start = artifact_arrlst[aa + 1].start_loc;
                                temp_end = artifact_arrlst[aa + 1].end_loc;
                            }
                        }
                        //System.out.println("append artifact:"+temp_start+" to "+temp_end+" as arti");
                        let agg_arti = new Artifact(temp_start, temp_end);
                        if (Math.abs(temp_start - temp_start) / new_fs > 3) {
                            //System.out.println("@@@@arti_acc_time > 3");
                            containArtimorethan1 = true;
                        }
                        artifact_arrlst1.push(agg_arti);

                        for (let ee = 0; ee < artifact_arrlst1.length; ee++) arti1_str += "[" + Double.toString(artifact_arrlst1[ee].start_loc) + "," + Double.toString(artifact_arrlst1[ee].end_loc) + "], ";


                        for (let ht = 0; ht < frequencies.length; ht++) {
                            frequencies[ht] = (major_pks_arrlst[ht + 1].getX2() - major_pks_arrlst[ht].getX2()) * 1000 / new_fs;
                            f_loc[ht] = major_pks_arrlst[ht].getX2();
                            if (ht > 0) {
                                if (frequencies[ht] < frequencies[ht - 1] * 0.5 || frequencies[ht] < min_interval) {
                                    //System.out.println("@@@f_loc[ht-1]: "+f_loc[ht-1]+" to "+f_loc[ht]+" is artifact(< min interval)");
                                    //System.out.println("@@@frequencies[ht] is artifact:"+frequencies[ht]);
                                    let found_arti = new Artifact(parseInt(f_loc[ht - 1]), parseInt(f_loc[ht]));
                                    artifact_arrlst2.push(found_arti);
                                    containArtimorethan2 = true;
                                }
                            }
                            //if(s == windowSeeIdx)System.out.println("frequencies[ht]:"+frequencies[ht]);
                        }

                        for (let ee = 0; ee < artifact_arrlst2.length; ee++) arti2_str += "[" + (artifact_arrlst2[ee].start_loc) + "," + artifact_arrlst2[ee].end_loc + "], ";

                    } else { //Without any problem
                        for (let ht = 0; ht < frequencies.length; ht++) {
                            frequencies[ht] = (major_pks_arrlst[ht + 1].getX2() - major_pks_arrlst[ht].getX2()) * 1000 / new_fs;
                            f_loc[ht] = major_pks_arrlst[ht].getX2();
                        }
                    }

                    artilist1_str = arti1_str;
                    artilist2_str = arti2_str;

                    let non_zero_freq = pruneZero(frequencies);
                    let non_zero_f_loc = pruneZero(f_loc);

                    //Correct the wrong RR intervals
                    let freqMean = calculateMean(non_zero_freq);
                    let freqStd = calculateStdev(non_zero_freq);
                    let freqThresUpper = freqMean + (4 * freqStd);
                    let freqThresLower = freqMean - (4 * freqStd);
                    for (let sde = 0; sde < non_zero_freq.length; sde++) {
                        if (non_zero_freq[sde] > freqThresUpper || non_zero_freq[sde] < freqThresLower) {
                            if (sde == 0 && non_zero_freq[1] != 0) {
                                if (non_zero_freq[1] > freqThresUpper || non_zero_freq[1] < freqThresLower) {
                                    non_zero_freq[0] = non_zero_freq[1] = non_zero_freq[2];
                                } else {
                                    non_zero_freq[0] = non_zero_freq[1];
                                }

                            }
                            if (sde == non_zero_freq.length - 1 && non_zero_freq[non_zero_freq.length - 2] != 0) {
                                if (non_zero_freq[non_zero_freq.length - 2] > freqThresUpper || non_zero_freq[non_zero_freq.length - 2] < freqThresLower) {
                                    non_zero_freq[non_zero_freq.length - 1] = non_zero_freq[non_zero_freq.length - 2] = non_zero_freq[non_zero_freq.length - 3];
                                } else {
                                    non_zero_freq[non_zero_freq.length - 1] = non_zero_freq[non_zero_freq.length - 2];
                                }
                            }
                            if (sde != non_zero_freq.length - 1 && sde != 0) {

                                non_zero_freq[sde] = (non_zero_freq[sde + 1] + non_zero_freq[sde - 1]) / 2;
                                non_zero_f_loc[sde] = (non_zero_f_loc[sde + 1] + non_zero_f_loc[sde - 1]) / 2;


                            }
                            //System.out.println("non_zero_freq[sde]:"+non_zero_freq[sde]);
                        }
                    }

                    let temp_rrlist_str = "";
                    for (let se = 0; se < non_zero_freq.length; se++) temp_rrlist_str += non_zero_freq[se] + ", ";
                    rrlist_str = temp_rrlist_str;

                    let std_rrlistx = calculateStdev(non_zero_freq);
                    //Log.d("TAG", "std_rrlistx:"+std_rrlistx );
                    //Log.d("TAG", "mXPoint:"+mXPoint );
                    if ((windowStartIdx == 50 || windowStartIdx == 25) && mXPoint > 0) {
                        let std_rrlist = calculateStdev(non_zero_freq);
                        SDNN_remeasure_str = Double.toString(std_rrlist);
                        //Log.d("TAG", "std_rrlist: " + SDNN_remeasure_str);
                        let age = 20;
                        try {
                            age = Integer.parseInt(usrAge);
                        } catch {
                            age = 20;
                        }


                        if (age > 75) {
                            normal_sdnn_upper = 84.8;
                        } else {
                            if (age > 65 && age <= 75) {
                                normal_sdnn_upper = 78.1;
                            } else {
                                if (age > 55 && age <= 65) {
                                    normal_sdnn_upper = 75.41;
                                } else {
                                    if (age > 45 && age <= 55) {
                                        normal_sdnn_upper = 76.63;
                                    } else {
                                        if (age > 35 && age <= 45) {
                                            normal_sdnn_upper = 80.1;
                                        } else {
                                            if (age > 25 && age <= 35) {
                                                normal_sdnn_upper = 83.86;
                                            } else {
                                                if (age > 18 && age <= 25) {
                                                    normal_sdnn_upper = 85.72;
                                                } else {
                                                    normal_sdnn_upper = 85.72;
                                                }

                                            }

                                        }

                                    }

                                }

                            }

                        }

                        //normal_sdnn_upper = 55;
                        //Log.d("TAG", "normal_sdnn_upper:"+normal_sdnn_upper );
                        //Log.d("TAG", "std_rrlist(in if):"+std_rrlist );
                        if (std_rrlist > normal_sdnn_upper) {
                            playMusic("warningmesg.mp3")
                            init_error = true;

                        }


                    }

                    //Log.d("TAG", "age: " + age);
                    //Log.d("TAG", "usrAge: " + usrAge);
                    //Log.d("TAG", "normal_sdnn_upper: " + normal_sdnn_upper);
                    //Respiratory-induced frequency variation (RIFV) waveforms
                    let points_RIFV = parseInt((non_zero_f_loc[non_zero_f_loc.length - 1] - non_zero_f_loc[0]) * 1000 / new_fs);
                    let splineIinterpolator_RIFV = new SplineInterpolator();


                    let RIFV_X = linspace(non_zero_f_loc[0], non_zero_f_loc[non_zero_f_loc.length - 1], points_RIFV);
                    let calibrantInterpolator_RIFV = splineIinterpolator_RIFV.interpolate(non_zero_f_loc, non_zero_freq);
                    let interpolate_RIFV_Result = [];
                    for (let i = 0; i < points_RIFV; i++) {
                        interpolate_RIFV_Result[i] = calibrantInterpolator_RIFV.value(RIFV_X[i]);
                    }

                    let cut_interpolate_RIFV_Result = interpolate_RIFV_Result.slice(start_idx, points_RIFV);
                    let cut_interpolate_RIFV_X = RIFV_X.slice(start_idx, points_RIFV);
                    let filtered_interpolate_RIFV_Result = [];
                    //Lowpass before downsampling to avoid aliasing
                    let butterworthLowPass_RIFV = new Butterworth();
                    butterworthLowPass_RIFV.lowPass(20, 1000, 2);
                    for (let j = 0; j < cut_interpolate_RIFV_Result.length; j++) {
                        filtered_interpolate_RIFV_Result[j] = butterworthLowPass_RIFV.filter(cut_interpolate_RIFV_Result[j]);
                    }

                    let cut_RIFV_length = cut_interpolate_RIFV_X.length;
                    //Down sampling to 4Hz
                    let RIFV_4Hz_X = [];
                    let RIFV_4Hz_Y = [];
                    for (let i = 0; (i * 250) < cut_RIFV_length; i++) {
                        RIFV_4Hz_X[i] = cut_interpolate_RIFV_X[i * 250];
                        RIFV_4Hz_Y[i] = filtered_interpolate_RIFV_Result[i * 250];
                    }

                    let temp_rifv_str = "";
                    for (let se = 0; se < RIFV_4Hz_Y.length; se++) temp_rifv_str += RIFV_4Hz_Y[se] + ", ";
                    RIFV_sliding_window_str = temp_rifv_str;



                    let padding_num = 768;
                    const freqBin = 4 / (double)(FFT_window_size + padding_num);
                    const upperFreqIdx = 23;

                    let RIAV_brs = [],
                        RIIV_brs = [],
                        RIFV_brs = [],
                        sum_brs = [],
                        RIAV_brs_ctr = 0,
                        RIIV_brs_ctr = 0,
                        RIFV_brs_ctr = 0;

                    maxIdx_RIAV = 0, maxIdx_RIIV = 0, maxIdx_RIFV = 0;



                    last_five_val_HF_ctr = last_five_val_HF_ctr % 5;
                    last_five_val_LF_ctr = last_five_val_LF_ctr % 5;


                    let convert_artifact_arrlst0 = [];
                    let convert_artifact_arrlst1 = [];
                    let convert_artifact_arrlst2 = [];

                    for (let gan = 0; gan < artifact_arrlst0.length; gan++) {
                        let start_loc0 = (((artifact_arrlst0[gan].start_loc * parseInt(1000 / new_fs)) - start_idx) / 250) - 2;
                        let end_loc0 = (((artifact_arrlst0[gan].end_loc * parseInt(1000 / new_fs)) - start_idx) / 250) - 2;

                        let c_a0 = new Artifact(start_loc0, end_loc0);
                        convert_artifact_arrlst0.push(c_a0);
                        //artifact_arrlst0[gan].start_loc
                    }

                    for (let gan = 0; gan < artifact_arrlst1.length; gan++) {
                        let start_loc1 = (((artifact_arrlst1[gan].start_loc * parseInt(1000 / new_fs)) - start_idx) / 250) - 2;
                        let end_loc1 = (((artifact_arrlst1[gan].end_loc * parseInt(1000 / new_fs)) - start_idx) / 250) - 2;

                        let c_a1 = new Artifact(start_loc1, end_loc1);
                        convert_artifact_arrlst1.push(c_a1);
                        //artifact_arrlst0[gan].start_loc
                    }

                    for (let gan = 0; gan < artifact_arrlst2.length; gan++) {
                        let start_loc2 = (((artifact_arrlst2[gan].start_loc * parseInt(1000 / new_fs)) - start_idx) / 250) - 2;
                        let end_loc2 = (((artifact_arrlst2[gan].end_loc * parseInt(1000 / new_fs)) - start_idx) / 250) - 2;

                        let c_a2 = new Artifact(start_loc2, end_loc2);
                        convert_artifact_arrlst2.push(c_a2);
                        //artifact_arrlst0[gan].start_loc
                    }

                    let power_RIFV_arr = [];
                    let ctr_power_RIFV_arr = 0;
                    let power_RIAV_arr = [];
                    let ctr_power_RIAV_arr = 0;

                    let RIFV_std_arr = [];
                    let RIFV_mean_arr = [];
                    let ctr_of_std = 0;
                    let ctr_of_mean = 0;
                    let skip_window = false;

                    //SDNN_thres_str = Double.toString(RIFV_SDNN_thres);

                    //for UI debugging
                    let RIFV_str = "";
                    let RIIV_str = "";
                    let RIAV_str = "";

                    //for firebase debugging
                    let fire_RIFV_SDNN_str = "";

                    let fire_ROI_lower_idx_str = "";


                    let fire_RIFV_bpm_str = "";
                    let fire_RIIV_bpm_str = "";
                    let fire_RIAV_bpm_str = "";

                    let fire_skip_window_str = "";


                    let fire_RIFV_power_each_window_thres_str = "";
                    let fire_RIAV_power_each_window_thres_str = "";

                    let timings = "";

                    //find subwindow from the last of the signal
                    for (let x = RIAV_4Hz_Y.length, y = RIIV_4Hz_Y.length, z = RIFV_4Hz_Y.length
                        ; x > 24 + FFT_window_size && y > 24 + FFT_window_size && z > 24 + FFT_window_size
                        ; x -= (FFT_window_size / 8), y -= (FFT_window_size / 8), z -= (FFT_window_size / 8)) {

                        let window_timing = (x / 4) + (windowStartIdx / 25);
                        timings = timings + window_timing + ",";

                        let RIIV_4Hz_Y_subwindow2 = RIIV_4Hz_Y.slice(z - FFT_window_size, z);
                        let RImV_4Hz_Y_subwindow2 = RImV_4Hz_Y.slice(z - FFT_window_size, z);
                        let RIFV_4Hz_Y_subwindow2 = RIFV_4Hz_Y.slice(z - FFT_window_size, z);
                        let RIFV_std_x = calculateStdev(RIFV_4Hz_Y_subwindow2);
                        let RIFV_mean_x = calculateMean(RIFV_4Hz_Y_subwindow2);
                        if (windowStartIdx == 0 || windowStartIdx == 25) {
                            if (RIFV_std_x > 65) {
                                //Need to remesure the breathing
                                continue;
                            }
                        } else {
                            if (RIFV_std_x > 200) {

                                continue;
                            }
                        }

                        RIFV_std_arr[ctr_of_std++] = RIFV_std_x;
                        RIFV_mean_arr[ctr_of_mean++] = RIFV_mean_x;

                        let br_lower_bound = 7; //bpm
                        let ROI_lower = parseInt((br_lower_bound / 60) / freqBin);
                        let br_upper_bound = 22; //bpm
                        let ROI_upper = parseInt((br_upper_bound / 60) / freqBin);



                        if (containArtimorethan0 && convert_artifact_arrlst0.length > 0) {
                            for (let ssg = 0; ssg < convert_artifact_arrlst0.length; ssg++) {
                                let arti_start_idx_loc = convert_artifact_arrlst0[ssg].start_loc;
                                let arti_end_idx_loc = convert_artifact_arrlst0[ssg].end_loc;
                                if ((arti_start_idx_loc < z && arti_start_idx_loc > (z - FFT_window_size)) || (arti_end_idx_loc < z && arti_end_idx_loc > (z - FFT_window_size))
                                    || ((arti_end_idx_loc > z) && (arti_start_idx_loc < (z - FFT_window_size)))) {
                                    fire_skip_window_str += "skip by exceed amp thres, ";
                                    skip_window = true;
                                }

                            }
                            if (skip_window) {

                                skip_window = false;
                                //System.out.println("from "+(z-FFT_window_size)+" to "+z);
                                continue;
                            }
                        }


                        if (containArtimorethan1 && convert_artifact_arrlst1.length > 0) {
                            for (let ssg = 0; ssg < convert_artifact_arrlst1.length; ssg++) {
                                let arti_start_idx_loc = convert_artifact_arrlst1[ssg].start_loc;
                                let arti_end_idx_loc = convert_artifact_arrlst1[ssg].end_loc;
                                if ((arti_start_idx_loc < z && arti_start_idx_loc > (z - FFT_window_size)) || (arti_end_idx_loc < z && arti_end_idx_loc > (z - FFT_window_size))
                                    || ((arti_end_idx_loc > z) && (arti_start_idx_loc < (z - FFT_window_size)))) {
                                    fire_skip_window_str += "skip by irregular pulse, ";
                                    skip_window = true;
                                }

                            }
                            if (skip_window) {

                                skip_window = false;
                                continue;
                            }
                        }

                        if (containArtimorethan2 && convert_artifact_arrlst2.length > 0) {
                            for (let ssg = 0; ssg < convert_artifact_arrlst2.length; ssg++) {
                                let arti_start_idx_loc = convert_artifact_arrlst2[ssg].start_loc;
                                let arti_end_idx_loc = convert_artifact_arrlst2[ssg].end_loc;
                                if ((arti_start_idx_loc < z && arti_start_idx_loc > (z - FFT_window_size)) || (arti_end_idx_loc < z && arti_end_idx_loc > (z - FFT_window_size))
                                    || ((arti_end_idx_loc > z) && (arti_start_idx_loc < (z - FFT_window_size)))) {
                                    fire_skip_window_str += "skip by invalid RR, ";
                                    skip_window = true;
                                }

                            }
                            if (skip_window) {

                                skip_window = false;
                                continue;
                            }
                        }

                        fire_skip_window_str += "ok, ";

                        //Sample 64s FFT window
                        let RIAV_4Hz_Y_subwindow1 = RIAV_4Hz_Y.slice(x - FFT_window_size, x);
                        let RIIV_4Hz_Y_subwindow1 = RIIV_4Hz_Y.slice(y - FFT_window_size, y);
                        let RIFV_4Hz_Y_subwindow1 = RIFV_4Hz_Y.slice(z - FFT_window_size, z);



                        //Detrend
                        let dPower = 5;
                        let d_1RIAV = new Detrend(RIAV_4Hz_Y_subwindow1, dPower);
                        let RIAV_4Hz_Y_subwindow = d_1RIAV.detrendSignal();
                        let d_1RIIV = new Detrend(RIIV_4Hz_Y_subwindow1, dPower);
                        let RIIV_4Hz_Y_subwindow = d_1RIIV.detrendSignal();
                        let d_1RIFV = new Detrend(RIFV_4Hz_Y_subwindow1, dPower);
                        let RIFV_4Hz_Y_subwindow = d_1RIFV.detrendSignal();



                        //Normalization of RIIV
                        let RIIV_max = findMax(RIIV_4Hz_Y_subwindow);
                        let RIIV_min = findMin(RIIV_4Hz_Y_subwindow);
                        let normalized_RIIV_4Hz_Y_subwindow = [];
                        for (let nr = 0; nr < RIIV_4Hz_Y_subwindow.length; nr++) {
                            normalized_RIIV_4Hz_Y_subwindow[nr] = (RIIV_4Hz_Y_subwindow[nr] - RIIV_min) / (RIIV_max - RIIV_min);
                        }

                        let n_RIIV = new Detrend(normalized_RIIV_4Hz_Y_subwindow, "constant");
                        let d_norm_RIIV_sub = n_RIIV.detrendSignal();

                        //Normalization of RIAV
                        let RIAV_max = findMax(RIAV_4Hz_Y_subwindow);
                        let RIAV_min = findMin(RIAV_4Hz_Y_subwindow);
                        let normalized_RIAV_4Hz_Y_subwindow = [];
                        for (let nr = 0; nr < RIAV_4Hz_Y_subwindow.length; nr++) {
                            normalized_RIAV_4Hz_Y_subwindow[nr] = (RIAV_4Hz_Y_subwindow[nr] - RIAV_min) / (RIAV_max - RIIV_min);
                        }

                        let n_RIAV = new Detrend(normalized_RIAV_4Hz_Y_subwindow, "constant");
                        let d_norm_RIAV_sub = n_RIAV.detrendSignal();

                        //Normalization of RIFV
                        let RIFV_max = findMax(RIFV_4Hz_Y_subwindow);
                        let RIFV_min = findMin(RIFV_4Hz_Y_subwindow);
                        let normalized_RIFV_4Hz_Y_subwindow = [];
                        for (let nr = 0; nr < RIFV_4Hz_Y_subwindow.length; nr++) {
                            normalized_RIFV_4Hz_Y_subwindow[nr] = (RIFV_4Hz_Y_subwindow[nr] - RIFV_min) / (RIFV_max - RIFV_min);
                        }

                        let n_RIFV = new Detrend(normalized_RIFV_4Hz_Y_subwindow, "constant");
                        let d_norm_RIFV_sub = n_RIFV.detrendSignal();



                        let d_RIAV = new Detrend(RIAV_4Hz_Y_subwindow, "constant");
                        let d_RIAV_sub = d_RIAV.detrendSignal();
                        let d_RIIV = new Detrend(RIIV_4Hz_Y_subwindow, "constant");
                        let d_RIIV_sub = d_RIIV.detrendSignal();
                        let d_RIFV = new Detrend(RIFV_4Hz_Y_subwindow, "constant");
                        let d_RIFV_sub = d_RIFV.detrendSignal();

                        //Apply Hamming window
                        let H_window_pt = new Hamming(FFT_window_size);
                        let H_window = H_window_pt.getWindow();
                        for (let a = 0; a < FFT_window_size; a++) {
                            d_RIAV_sub[a] = d_RIAV_sub[a] * H_window[a];
                            d_RIIV_sub[a] = d_RIIV_sub[a] * H_window[a];
                            d_RIFV_sub[a] = d_RIFV_sub[a] * H_window[a];

                            d_norm_RIAV_sub[a] = d_norm_RIAV_sub[a] * H_window[a];
                            d_norm_RIIV_sub[a] = d_norm_RIIV_sub[a] * H_window[a];
                            d_norm_RIFV_sub[a] = d_norm_RIFV_sub[a] * H_window[a];
                        }

                        let zero_pad_d_RIAV_sub = zeroPad(d_RIAV_sub, padding_num);
                        let zero_pad_d_RIIV_sub = zeroPad(d_RIIV_sub, padding_num);
                        let zero_pad_d_RIFV_sub = zeroPad(d_RIFV_sub, padding_num);

                        let zero_pad_d_norm_RIAV_sub = zeroPad(d_norm_RIAV_sub, padding_num);
                        let zero_pad_d_norm_RIIV_sub = zeroPad(d_norm_RIIV_sub, padding_num);
                        let zero_pad_d_norm_RIFV_sub = zeroPad(d_norm_RIFV_sub, padding_num);

                        //Get FFT result
                        let fft_result_RIAV = new FastFourier(zero_pad_d_RIAV_sub);
                        let fft_result_RIIV = new FastFourier(zero_pad_d_RIIV_sub);
                        let fft_result_RIFV = new FastFourier(zero_pad_d_RIFV_sub);

                        let fft_norm_result_RIAV = new FastFourier(zero_pad_d_norm_RIAV_sub);
                        let fft_norm_result_RIIV = new FastFourier(zero_pad_d_norm_RIIV_sub);
                        let fft_norm_result_RIFV = new FastFourier(zero_pad_d_norm_RIFV_sub);

                        fft_result_RIAV.transform();
                        fft_result_RIIV.transform();
                        fft_result_RIFV.transform();

                        fft_norm_result_RIAV.transform();
                        fft_norm_result_RIIV.transform();
                        fft_norm_result_RIFV.transform();

                        let FFT_RIAV_Result_pt = fft_result_RIAV.getComplex(false);
                        let FFT_RIIV_Result_pt = fft_result_RIIV.getComplex(false);
                        let FFT_RIFV_Result_pt = fft_result_RIFV.getComplex(false);

                        let FFT_norm_RIAV_Result_pt = fft_norm_result_RIAV.getComplex(false);
                        let FFT_norm_RIIV_Result_pt = fft_norm_result_RIIV.getComplex(false);
                        let FFT_norm_RIFV_Result_pt = fft_norm_result_RIFV.getComplex(false);

                        let RIAV_Result = new double[FFT_RIAV_Result_pt.length];
                        let RIIV_Result = new double[FFT_RIIV_Result_pt.length];
                        let RIFV_Result = new double[FFT_RIFV_Result_pt.length];

                        let RIAV_norm_Result = new double[FFT_norm_RIAV_Result_pt.length];
                        let RIIV_norm_Result = new double[FFT_norm_RIIV_Result_pt.length];
                        let RIFV_norm_Result = new double[FFT_norm_RIFV_Result_pt.length];

                        for (let i = 0; i < FFT_window_size; i++) {
                            RIAV_Result[i] = FFT_RIAV_Result_pt[i].abs();
                            RIIV_Result[i] = FFT_RIIV_Result_pt[i].abs();
                            RIFV_Result[i] = FFT_RIFV_Result_pt[i].abs();

                            RIAV_norm_Result[i] = FFT_norm_RIAV_Result_pt[i].abs();
                            RIIV_norm_Result[i] = FFT_norm_RIIV_Result_pt[i].abs();
                            RIFV_norm_Result[i] = FFT_norm_RIFV_Result_pt[i].abs();
                        }

                        //////
                        let lowerbpm = 10;
                        let upperbpm = 25;
                        let lowerIdx = parseInt(lowerbpm / (60 * freqBin));
                        let upperIdx = parseInt(upperbpm / (60 * freqBin));

                        //Select (10-25 bpm)
                        let sel_RIIV = RIIV_norm_Result.slice(lowerIdx, upperIdx);
                        let sel_RIAV = RIAV_norm_Result.slice(lowerIdx, upperIdx);
                        let sel_RIFV = RIFV_norm_Result.slice(lowerIdx, upperIdx);

                        //Sum of FFT coefficient
                        let sum_sel_RIIV = arrSum(sel_RIIV);
                        let sum_sel_RIAV = arrSum(sel_RIAV);
                        let sum_sel_RIFV = arrSum(sel_RIFV);

                        let dx = new Detrend(RImV_4Hz_Y_subwindow2, "constant");
                        let d_RImV_4Hz_Y_subwindow2 = dx.detrendSignal();



                        let butterworthLowPassx = new Butterworth();
                        butterworthLowPassx.lowPass(20, 4, 0.33);
                        for (let j = 0; j < RImV_4Hz_Y_subwindow2.length; j++) {
                            d_RImV_4Hz_Y_subwindow2[j] = butterworthLowPassx.filter(d_RImV_4Hz_Y_subwindow2[j]);
                        }



                        let wsize = 5;
                        let s_RImV_4Hz_Y_subwindow = new Smooth(d_RImV_4Hz_Y_subwindow2, wsize);
                        let s_RImV_sub = s_RImV_4Hz_Y_subwindow.smoothSignal();

                        let s_RIFV_4Hz_Y_subwindow = new Smooth(RIFV_4Hz_Y_subwindow2, wsize);
                        let s_RIFV_sub = s_RIFV_4Hz_Y_subwindow.smoothSignal();

                        let s_RIFV_out =  FindPeak(s_RIFV_sub);

                        let s_RImV_out = FindPeak(s_RImV_sub);
                        let s_RImV_peaks = s_RImV_out.getPeaks();
                        let s_RImV_outHeight = s_RImV_out.getHeights();
                        let s_RImV_outWidth = s_RImV_out.getWidth();
                        let s_RImV_outProminence = s_RImV_out.getProminence();
                        let s_RImV_outPromData = s_RImV_out.getProminenceData();

                        let RIIV_pks_ctr = 0;
                        let f_s_RIIV_peaks = s_RImV_out.filterByWidth(0.0, 20.0);


                        let RIFV_pks_ctr = 0;
                        let f_s_RIFV_peaks = s_RIFV_out.filterByWidth(0.0, 20.0);



                        if (f_s_RIIV_peaks.length <= 10 && (f_s_RIFV_peaks.length <= 10)) {
                            for (let g = 0; g < s_RImV_peaks.length; g++) {
                                let pro_wid = (s_RImV_outPromData[2][g] - s_RImV_outPromData[1][g]) / 4;
                                if (pro_wid >= 10 && pro_wid <= 35 && s_RImV_outWidth[g] > 10) RIIV_pks_ctr++;
                            }
                        }

                        power_RIFV_arr[ctr_power_RIFV_arr++] = sum_sel_RIFV;
                        power_RIAV_arr[ctr_power_RIAV_arr++] = sum_sel_RIAV;

                        fire_RIFV_power_each_window_thres_str += Double.toString(sum_sel_RIFV) + ", ";
                        fire_RIAV_power_each_window_thres_str += Double.toString(sum_sel_RIAV) + ", ";

                        //////
                        let RIFV_std = calculateStdev(RIFV_4Hz_Y_subwindow1);
                        fire_RIFV_SDNN_str += RIFV_std + ", ";
                        if ((RIFV_std > RIFV_SDNN_thres && RIFV_SDNN_thres != 0)
                            || (RIFV_power_thres > 0 && sum_sel_RIFV < RIFV_power_thres
                                || (RIIV_pks_ctr >= 1 && RIIV_pks_ctr <= 6))) {
                            br_lower_bound = 1.85; //bpm

                            ROI_lower = parseInt((br_lower_bound / 60) / freqBin);

                        } else {
                            br_lower_bound = 7; //bpm
                            ROI_lower = parseInt((br_lower_bound / 60) / freqBin);;
                        }

                        let post_time = 1444;//23*60+64
                        if (window_timing >= post_time) {
                            br_lower_bound = 7;
                            ROI_lower = parseInt((br_lower_bound / 60) / freqBin);;
                        } else {
                            if (window_timing >= 180) {
                                br_lower_bound = 1.85; //

                                ROI_lower = parseInt((br_lower_bound / 60) / freqBin);
                            } else {
                                br_lower_bound = 7;
                                ROI_lower = parseInt((br_lower_bound / 60) / freqBin);;
                            }
                        }

                        fire_ROI_lower_idx_str += ROI_lower + ", ";


                        maxIdx_RIAV = findMaxIndexInHalfArr(RIAV_Result, ROI_lower, ROI_upper);
                        maxIdx_RIIV = findMaxIndexInHalfArr(RIIV_Result, ROI_lower, ROI_upper);
                        maxIdx_RIFV = findMaxIndexInHalfArr(RIFV_Result, ROI_lower, ROI_upper);

                        //Get FFT result
                        let fft_result_RIFV_sub = new FastFourier(RIFV_4Hz_Y_subwindow);

                        fft_result_RIFV_sub.transform();


                        //Find breathing rate
                        let RIAV_br_result = (parseFloat(maxIdx_RIAV)) * freqBin * 60;
                        RIAV_brs[RIAV_brs_ctr] = RIAV_br_result;
                        RIAV_brs_ctr++;
                        let RIIV_br_result = (parseFloat(maxIdx_RIIV)) * freqBin * 60;
                        RIIV_brs[RIIV_brs_ctr] = RIIV_br_result;
                        RIIV_brs_ctr++;
                        let RIFV_br_result = (parseFloat(maxIdx_RIFV)) * freqBin * 60;
                        RIFV_brs[RIFV_brs_ctr] = RIFV_br_result;
                        RIFV_brs_ctr++;

                        RIFV_str = RIFV_str + RIFV_br_result + " ";
                        RIIV_str = RIIV_str + RIIV_br_result + " ";
                        RIAV_str = RIAV_str + RIAV_br_result + " ";

                        fire_RIFV_bpm_str += RIFV_br_result + ", ";
                        fire_RIIV_bpm_str += RIIV_br_result + ", ";
                        fire_RIAV_bpm_str += RIAV_br_result + ", ";


                    }//End of the for loop of sampling 64s FFT window

                    //Log.d("TAG", "timings: " + timings);
                    //Log.d("TAG", "ROI lower: " + fire_ROI_lower_idx_str);

                    let valid_power_RIFV = power_RIFV_arr.slice(0, ctr_power_RIFV_arr);
                    let valid_power_RIAV = power_RIAV_arr.slice(0, ctr_power_RIAV_arr);
                    if (windowStartIdx == 0 || windowStartIdx == 25) {
                        let mean_valid_power_RIFV = calculateMean(valid_power_RIFV);
                        let std_valid_power_RIFV = calculateStdev(valid_power_RIFV);
                        let mean_valid_power_RIAV = calculateMean(valid_power_RIAV);
                        let std_valid_power_RIAV = calculateStdev(valid_power_RIAV);

                        RIFV_power_thres = mean_valid_power_RIFV - 2.5 * std_valid_power_RIFV;
                        RIAV_power_thres = mean_valid_power_RIAV - 2.5 * std_valid_power_RIAV;



                    }

                    RIFV_power_thres_str = RIFV_power_thres;
                    RIAV_power_thres_str = RIAV_power_thres;

                    let valid_RIFV_std = RIFV_std_arr.slice(0, ctr_of_std);
                    let valid_RIFV_mean = RIFV_mean_arr.slice(0, ctr_of_mean);
                    let mean_RIFV_std = calculateMean(valid_RIFV_std);   //SDNN
                    let mean_RIFV_mean = calculateMean(valid_RIFV_mean); //BPM
                    if (windowStartIdx == 0 || windowStartIdx == 25) {
                        let std_RIFV_std = calculateStdev(valid_RIFV_std);

                        //RIFV_SDNN_thres = mean_RIFV_std+3*std_RIFV_std;


                        let temp_val = [];
                        let ctr_temp_val = 0;
                        ///System.out.println("========");

                        let temp_thres = mean_RIFV_std + 2 * std_RIFV_std;
                        for (let wer = 0; wer < valid_RIFV_std.length; wer++) {
                            if (valid_RIFV_std[wer] < temp_thres) {
                                temp_val[ctr_temp_val++] = valid_RIFV_std[wer];
                            }
                        }

                        let temp_arr = temp_val.slice(0, ctr_temp_val);
                        let temp_mean = calculateMean(temp_arr);
                        let temp_std = calculateStdev(temp_arr);
                        //System.out.println("temp_mean:"+temp_mean);
                        //System.out.println("temp_std:"+temp_std);
                        let temp_thres2 = temp_mean + 3 * temp_std;
                        RIFV_SDNN_thres = temp_thres2;
                        //System.out.println("new thres:"+temp_thres2);

                        //If the N too small
                        if (ctr_of_std < 3) {
                            //System.out.println("Too less window to calculate SDNN thres");
                            RIFV_SDNN_thres = 45;
                        }

                    }
                    //RIFV_SDNN_thres = 45;

                    SDNN_thres_str = Double.toString(RIFV_SDNN_thres);
                    debugging_probe4 = SDNN_thres_str;

                    //Handle SDNN calculation if there aren't any 64s FFT window availible
                    if (ctr_of_std != 0) {
                        SDNN = mean_RIFV_std;

                        //BPM = (int)(60000/mean_RIFV_mean);
                    }

                    //debugging_probe5 = RIFV_str;
                    //debugging_probe6 = RIIV_str;
                    //debugging_probe7 = RIAV_str;

                    fft_window_SDNN_str = fire_RIFV_SDNN_str;

                    fft_window_ROI_lower_Idx_str = fire_ROI_lower_idx_str;


                    fft_window_RIFV_bpm_str = fire_RIFV_bpm_str;
                    fft_window_RIIV_bpm_str = fire_RIIV_bpm_str;
                    fft_window_RIAV_bpm_str = fire_RIAV_bpm_str;

                    skip_window_str = fire_skip_window_str;

                    RIFV_power_each_window_thres_str = fire_RIFV_power_each_window_thres_str;
                    RIAV_power_each_window_thres_str = fire_RIAV_power_each_window_thres_str;

                    //Merge the Breathing rates into one array to calculate mean and std.
                    let total_BR_num = (RIAV_brs_ctr + RIIV_brs_ctr + RIFV_brs_ctr);
                    let merged_BR_arr = [];
                    let merged_BR_arr_ctr = 0;

                    for (let t = 0; t < RIAV_brs_ctr; t++) {

                        merged_BR_arr[merged_BR_arr_ctr] = RIAV_brs[t];
                        merged_BR_arr_ctr++;
                    }


                    for (let t = 0; t < RIIV_brs_ctr; t++) {

                        merged_BR_arr[merged_BR_arr_ctr] = RIIV_brs[t];
                        merged_BR_arr_ctr++;
                    }

                    for (let t = 0; t < RIFV_brs_ctr; t++) {

                        merged_BR_arr[merged_BR_arr_ctr] = RIFV_brs[t];
                        merged_BR_arr_ctr++;
                    }

                    let local_mean_BR = calculateMean(merged_BR_arr);
                    let local_std_BR = calculateStdev(merged_BR_arr);

                    //Exclude outlier
                    let acceptable_br_ctr = 0;
                    let sum_of_br = 0;
                    for (let p = 0; p < RIAV_brs_ctr; p++) {
                        if (Math.abs(RIAV_brs[p] - local_mean_BR) / local_std_BR > 3) continue;
                        if (Math.abs(RIIV_brs[p] - local_mean_BR) / local_std_BR > 3) continue;
                        if (Math.abs(RIFV_brs[p] - local_mean_BR) / local_std_BR > 3) continue;
                        acceptable_br_ctr++;
                        sum_of_br += (RIAV_brs[p] + RIIV_brs[p] + RIFV_brs[p]) / 3.0;
                    }

                    //Moving average the final breathing rate
                    let br = 0;

                    if (val_ctr > 4) val_ctr = 0;
                    if (RIAV_brs_ctr > 0 && RIIV_brs_ctr > 0 && RIFV_brs_ctr > 0) {

                        if (windowStartIdx < 100) {
                            breathRate = parseFloat(sum_of_br / parseFloat(acceptable_br_ctr));
                            last_five_BR[val_ctr++] = breathRate;
                        } else {

                            last_five_BR[val_ctr] = sum_of_br / parseFloat(acceptable_br_ctr);
                            breathRate = calculateMean(last_five_BR);
                            last_five_BR[val_ctr++] = breathRate;

                        }
                    }




                    let FRF = breathRate / 60;

                    //debugging_probe2 = Double.toString(FRF);

                    let rr_list = non_zero_freq;

                    let rr_x = [];
                    let sum = 0;
                    for (let i = 0; i < rr_list.length; i++) {
                        sum += rr_list[i];
                        rr_x[i] = sum;
                    }



                    let rr_x_new = linspace(paeseInt(rr_x[0]), paeseInt(rr_x[rr_x.length - 1]), paeseInt(rr_x[rr_x.length - 1]));
                    let datalen = rr_x_new.length;
                    //for(int i=0; i<10; i++)System.out.println("rr_x_new:"+rr_x_new[i]);

                    let splineIinterpolator_RR = new SplineInterpolator();
                    let calibrantInterpolator_RR = splineIinterpolator_RR.interpolate(rr_x, rr_list);
                    let rr_interp = [];
                    for (let i = 0; i < rr_x_new.length; i++) {
                        rr_interp[i] = calibrantInterpolator_RR.value(rr_x_new[i]);
                    }

                    //for(int i=rr_interp.length-10; i<rr_interp.length-1; i++)System.out.println("rr_interp:"+rr_interp[i]);

                    let Han_window = new Hanning(rr_x_new.length);
                    let Han_window_d = Han_window.getWindow();



                    let windowed_data = [];

                    for (let i = 0; i < rr_x_new.length; i++) windowed_data[i] = rr_interp[i] * Han_window_d[i];

                    let Fs = 1000;

                    let fft_result = new FastFourier(windowed_data);

                    fft_result.transform();
                    let fft_com = fft_result.getComplex(false);
                    //System.out.println("fft_result.length:"+fft_com.length);
                    let nfft = fft_com.length;
                    //System.out.println("nfft:"+nfft);

                    let fft_abs_square = [];
                    for (let i = 0; i < fft_abs_square.length; i++) {
                        fft_abs_square[i] = Math.pow(fft_com[i].abs(), 2);
                    }
                    //for(int i=0; i<10; i++)System.out.println("fft_abs_square[i]:"+fft_abs_square[i]);

                    let factor = 0;
                    for (let i = 0; i < Han_window_d.length; i++) factor += Math.pow(Han_window_d[i], 2);

                    for (let i = 0; i < fft_abs_square.length; i++) {
                        fft_abs_square[i] /= factor;
                    }

                    let numPts = nfft / 2 + 1;
                    let mx = fft_abs_square.slice(0, numPts - 1);


                    //System.out.println("mx.length:"+mx.length);
                    let Pxx = [];
                    for (let i = 1; i < mx.length; i++) {
                        mx[i] *= 2;
                        Pxx[i] = mx[i] / 1000;
                    }
                    //System.out.println("numPts-1:"+(numPts-1));
                    let Fx = linspace(0.0, parseFloat(numPts - 1) * Fs / nfft, (numPts - 1));

                    let lf_lower = 0.04;
                    let lf_upper = 0.15;
                    let hf_lower = FRF * 0.65;
                    let hf_upper = FRF * 1.35;

                    if (FRF >= 0.13) {
                        hf_lower = 0.15;
                        hf_upper = 0.4;
                    }
                    //double hf_lower = 0.15;
                    //double hf_upper = 0.4;

                    let lf_lower_idx = 0;
                    let lf_upper_idx = 0;
                    let hf_lower_idx = 0;
                    let hf_upper_idx = 0;

                    for (let i = 0; i < Fx.length; i++) {
                        if (Fx[i] < lf_lower) lf_lower_idx = i + 1;
                        if (Fx[i] < lf_upper) lf_upper_idx = i + 1;
                        if (Fx[i] < hf_lower) hf_lower_idx = i + 1;
                        if (Fx[i] < hf_upper) hf_upper_idx = i + 1;
                    }

                    let lf_range_Fx2 = Fx.slice(lf_lower_idx, lf_upper_idx);
                    let lf_range_Pxx2 = Pxx.slice(lf_lower_idx, lf_upper_idx);
                    //debugging_probe3 = Double.toString(lf_range_Pxx2[0]);
                    let lf = trapzIntegral(lf_range_Pxx2, Fx[1]);

                    let hf_range_Fx2 = Fx.slice(hf_lower_idx, hf_upper_idx);
                    let hf_range_Pxx2 = Pxx.slice(hf_lower_idx, hf_upper_idx);
                    //for(int k=0; k<hf_range_Pxx2.length; k++)System.out.println("hf_range_Pxx2[k]:"+hf_range_Pxx2[k]);
                    HF = trapzIntegral(hf_range_Pxx2, Fx[1]);

                    //double lf_hf = LF/HF;

                    //System.out.println("Fx[1]:"+Fx[1]);

                    if (!(containArtimorethan1 || containArtimorethan2 && (artifact_arrlst1.length > 0 || artifact_arrlst2.length > 0))) {
                        HF = trapzIntegral(hf_range_Pxx2, Fx[1]);
                        BPM = (double)(major_pks_arrlst.length - 1) * 60 * ppg_fs * upsample_factor / (major_pks_arrlst[major_pks_arrlst.length - 1].getX2() - major_pks_arrlst[0].getX2());
                    }


                    //BPM = 60000/calculateMean(non_zero_freq);

                }
            } catch {

            }

            if (endPointer > windowEndIdx) {
                windowStartIdx += 25;
                windowEndIdx += 25;
            }




        }
    
}

function IMS() {
    let one_line = []; //P1(x,y), P2(x,y)
    let lines = [[]];
    let alpha = [];
    //IMS algorithm
    let seg = 1;
    let l = 1;
    let segInLine = 1;
    let arti_loc_arr = [];
    let arti_loc_arr_ptr = 0;
    one_line[0] = seg;
    one_line[1] = up_ppg[seg];
    one_line[2] = seg + 1;
    one_line[3] = up_ppg[seg + 1];
    lines[l] = one_line;
    alpha[l] = up_ppg[seg + 1] - up_ppg[seg];
    //System.out.println("alpha[l]: "+alpha[l]);
    l = l + 1;
    seg = seg + 1;
    while (seg + 1 < up_ppg.length) {
        let line2 = [];
        line2[0] = seg;
        line2[1] = up_ppg[seg];
        line2[2] = seg + 1;
        line2[3] = up_ppg[seg + 1];
        lines[l] = line2;
        alpha[l] = up_ppg[seg + 1] - up_ppg[seg];

        let horizontal_point_count = 1;
        if (alpha[l] == 0) {
            if (seg + 1 + horizontal_point_count < up_ppg.length) {
                while (up_ppg[seg + 1 + horizontal_point_count] - up_ppg[seg + 1] == 0) {
                    horizontal_point_count++;
                    //System.out.println("****seg+1+horizontal_point_count: "+(seg+1+horizontal_point_count));
                    if ((seg + 1 + horizontal_point_count >= up_ppg.length - 5)) {

                        break;
                    }
                }
            }

        }

        if (alpha[l] * alpha[l - 1] > 0 || (alpha[l] == 0 && (horizontal_point_count <= 1000))) {   //have the same sign:  merge
            let line3 = [];
            line3[0] = seg - segInLine;
            line3[1] = up_ppg[seg - segInLine];
            line3[2] = seg + 1;
            line3[3] = up_ppg[seg + 1];
            alpha[l - 1] = (up_ppg[seg + 1] - up_ppg[seg - segInLine]) / (segInLine + 1);
            lines[l - 1] = line3;
            seg = seg + 1;
            segInLine = segInLine + 1;

        } else {
            if (alpha[l - 1] != 0 && alpha[l] == 0 && (horizontal_point_count > 100)) {
                contain_arti = true;
                //arti_loc_arr[arti_loc_arr_ptr] = s+seg;
                arti_loc_arr_ptr++;

            }

            l = l + 1;
            seg = seg + 1;
            segInLine = 1;

        }
    }

}

function collectPositiveLine() {
    pre_pos_alpha_line = [];
    for (let lineCtr = 0; lineCtr < l - 1; lineCtr++) {
        if (alpha[lineCtr] > 0) {
            let pos_line = new Line_t(lines[lineCtr][0], lines[lineCtr][1], lines[lineCtr][2], lines[lineCtr][3]);
            pre_pos_alpha_line.push(pos_line);
        }
    }

    //Correct positive alpha
    let pro = 0.05,
        pos_alpha_line = [];
    for (let lineCtr = 0; lineCtr < pre_pos_alpha_line.length - 1; lineCtr++) {
        let prePosLine = pre_pos_alpha_line[lineCtr],
            prePosLine_1 = pre_pos_alpha_line[lineCtr + 1];

        if (prePosLine.getY1() < prePosLine_1.getY1()
            && prePosLine.getY2() < prePosLine_1.getY2()
            && prePosLine.getY2() > prePosLine_1.getY1()
            && ((prePosLine.getY2() - prePosLine_1.getY1()) / (prePosLine_1.getY2() - pprePosLine.getY1())) < pro
        ) {
            //System.out.println("Fix line at: "+pre_pos_alpha_line.get(lineCtr).p1_x);

            let new_pos_line = new Line_t(prePosLine.getX1(), prePosLine.getY1(), prePosLine_1.getX2(), prePosLine_1.getY2());
            pos_alpha_line.push(new_pos_line);
            lineCtr++;

        } else {
            pos_alpha_line.push(prePosLine);
        }
    }
    return pos_alpha_line;
}
function calculateMean(numArray) {
    let sum = 0.0;
    let length = numArray.length;
    for (let num of numArray) {
        sum += num;
    }
    let mean = sum / length;
    return mean;
} //teste

function linspace(min, max, points) {
    let d = [];
    for (let i = 0; i < points; i++) {
        d[i] = min + i * (max - min) / (points - 1);
    }
    return d;
} //te

function pruneZero(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        if (arr[i] != 0) {
            return arr.slice(0, i + 1);
        }

    }
    return arr;
}

function calculateStdev(numArray) {
    let sum = 0.0, standardDeviation = 0.0;
    let length = numArray.length;
    let mean = calculateMean(numArray);
    for (let num of numArray) {
        standardDeviation += Math.pow(num - mean, 2);
    }
    return Math.sqrt(standardDeviation / (length - 1));
} //tested

function findMax(arr) {
    let mean = calculateMean(arr);
    let std = calculateStdev(arr);
    let tempVal = -1000000;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > tempVal && Math.abs(arr[i] - mean) / std < 2) {
            tempVal = arr[i];

        }
    }
    return tempVal;
}

function findMin(arr) {
    let mean = calculateMean(arr);
    let std = calculateStdev(arr);
    let tempVal = 1000000;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] < tempVal && Math.abs(arr[i] - mean) / std < 2) {
            tempVal = arr[i];

        }
    }
    return tempVal;
}

function arrSum(arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return sum;
}

function zeroPad(arr, zeroNum) {
    pad_arr = new double[arr.length + zeroNum];

    for (let i = 0; i < pad_arr.length; i++) {
        if (i < arr.length) pad_arr[i] = arr[i];
        else pad_arr[i] = 0;
    }
    return pad_arr;
}


function arrSum(arr) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
    }
    return sum;
}

function findMaxIndexInHalfArr(arr, startIdx, endIdx) {
    let tempVal = 0;
    let tempIdx = 0;

    for (let i = startIdx; i < endIdx; i++) {
        if (arr[i] > tempVal) {
            tempVal = arr[i];
            tempIdx = i;
        }
    }

    return tempIdx;
}

function trapzIntegral(amp, unit) {
    let integral = 0;
    for (let i = 0; i < amp.length - 1; i++) {
        integral = integral + ((amp[i] + amp[i + 1]) * unit / 2);
    }
    return integral;
} // tested