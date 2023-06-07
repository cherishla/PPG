window.Send = SendDataBytes;




const DataPoint = function (x, y) {
    this.x = x;
    this.y = y;
    this.getX = function () { return this.x };
    this.getY = function () { return this.y };
    this.toString = function () { return `[${this.x}/${this.y}]` };
}
const SerialDataSize = 90060;
const updateEveryXPoint = 25;
const windowSize = 1024; //因為在資料點數達1024前是每次加256算一次，因此如需改windowSize，則handleInputData()必須修正
const window_time = 170;
const ppg_fs = 25;
const normal_breathing_time = 180;
const normal_breathing_size = (normal_breathing_time * ppg_fs);
const sliding_window_size = (window_time * ppg_fs);

const DataParams = function (val) {
    this.selectedPara = val;
    switch (val) {
        case "SDNN":
            this.PPGTime = 1;
            this.postRecordPPGTime = 0;
            this.inhale_time = 0;
            this.exhale_time = 0;
            this.feedback_time = 10;
            this.init_val = 40;
            this.input_init_val = 40;
            this.target_val = 60;
            break;
        case "HF":
            this.PPGTime = 1;
            this.postRecordPPGTime = 0;
            this.inhale_time = 0;
            this.exhale_time = 0;
            this.feedback_time = 10;
            this.init_val = 500;
            this.input_init_val = 500;
            this.target_val = 2000;
            break;
        default:
            this.PPGTime = 1;
            this.postRecordPPGTime = 0;
            this.inhale_time = 0;
            this.exhale_time = 0;
            this.feedback_time = 5;
            this.init_val = 6;
            this.input_init_val = 6;
            this.target_val = 3;
            break;
    }
    this.getPPGTime = function () {
        return this.PPGTime + this.postRecordPPGTime;
    }
    this.trigger_val = Math.abs(this.target_val - this.init_val) / this.feedback_time;
    this.post_start_mpoint = this.PPGTime * 60 * ppg_fs;
    this.finish_mpoint = (this.getPPGTime() * 60 * ppg_fs) - 5;
    this.changeType = function (val) {
        switch (val) {
            case "SDNN":
                this.feedback_time = 10;
                this.init_val = 40;
                this.input_init_val = 40;
                this.target_val = 60;
                break;
            case "HF":
                this.feedback_time = 10;
                this.init_val = 500;
                this.input_init_val = 500;
                this.target_val = 2000;
                break;
            default:
                this.feedback_time = 5;
                this.init_val = 6;
                this.input_init_val = 6;
                this.target_val = 3;

                break;
        }
        this.selectedPara = val;
        return this;
    }
    this.getValue = function () {
        return {
            PPGTime: this.PPGTime,
            postRecordPPGTime: this.postRecordPPGTime,
            inhale_time: this.inhale_time,
            exhale_time: this.exhale_time,
            feedback_time: this.feedback_time,
            init_val: this.init_val,
            input_init_val: this.input_init_val,
            target_val: this.target_val
        };
    }
}

var ShowData = {
    maxSDNN: 0,
    minBR: 0,
    maxHF: 0,
    SDNNData: null,
    HFData: null,
    BRData: null,
    HRData: null
}
var Queue_Index_Front = 0,
    Queue_Index_Rear = 0,
    SerialData_Queue = [],
    TempSize = [],
    dataQ = [], //windowed_PPG_b
    mXPoint = 0,
    mXPointPara = 170,
    TempSize,
    dataPointCount = 0,
    post_start_mpoint,
    finish_mpoint,
    fillWindowPhase,
    startPointer,
    endPointer,
    start_cal,
    voice_ctr = 0,
    ringIdx = 0,
    SDNNDataSeries = [], //SDNN
    HRDataSeries = [], //HRData for record
    HFDataSeries = [], //HF
    BRDataSeries = [], //breathRate
    current2 = new Date(), // now date
    ticking_enable = false,
    BPM,
    SDNN,
    HF = 0,
    breathRate = 0,
    SDNN_thres_str, //calcHeart firebase
    SDNN_remeasure_str, //calcHeart firebase
    windowed_ppg_str, //calcHeart firebase
    artilist0_str, //calcHeart firebase
    artilist1_str, //calcHeart firebase
    artilist2_str, //calcHeart firebase
    rrlist_str, //calcHeart firebase,
    fft_window_SDNN_str,//calcHeart firebase,
    fft_window_RIIV_bpm_str,//calcHeart firebase,
    fft_window_RIAV_bpm_str,//calcHeart firebase,
    fft_window_RIFV_bpm_str,//calcHeart firebas
    skip_window_str,//calcHeart firebase
    exhale_ctr = 0,
    inhale_ctr = 0,
    G_Series = [],
    G_Series2 = [],
    Scale = 150,
    abortTraining,
    Time_GET = 0,//chart
    Min_Time_GET = 0, //chart
    Min_Time_Flag = 0, //chart;
    Stop_Flag = false,
    selectedPara, //SDNN | HF | Breathing rate
    SerialFlag = false, // if usb connect then true;
    error_flag = false,
    sig_small = false,
    keep_thread_running,
    windowStartIdx = 0,
    windowEndIdx = parseInt(sliding_window_size),
    SizeIndex = 0,
    slidingWindowIsFull;

;

function SendDataBytes(bytes, size) {

    pushData(bytes, size);
    updateGraph(size);
}

function pushData(bytes, size) {
    //8 bytes
    for (let i = 0; i < size; i++) {
        if (Queue_Index_Front == (SerialDataSize - 1))
            Queue_Index_Front = 0;
        SerialData_Queue[Queue_Index_Rear++] = bytes[i];
    }
}

function updateGraph(size) {
    if (abortTraining) return;


    AppedSeriesData(size);

    //LALA TO SET CHART
    let max = mXPoint;
    let min = mXPoint - (Scale * 3)

    Time_GET = parseInt(mXPoint / 25 - Min_Time_Flag) % 60;

    if (mXPoint >= 25) {
        if (mXPoint % 1500 == 0) {
            Min_Time_GET = parseInt(mXPoint / 1500);
            Min_Time_Flag = (Min_Time_GET * 60);
        }
    }
    if (mXPoint >= (params.PPGTime * 1500)) {
        Stop_Flag = true;
    }


    // 發送訊息
    // TODO: 有需要從android 產生method 來call
    //ShowMessage(1, appData);
    // Message uiMessage = mHandler.obtainMessage(1, appData);
    // uiMessage.sendToTarget();
}

// 合併每 2Bytes 的資料
function AppedSeriesData(size) {
    queueData = [[]]; //double [[1,2]]
    if (size % 2 != 0) {
        TempSize[SizeIndex] = size;
    }
    for (let i = 0; i < (size + TempSize[0] - 1) / 2; i++) {
        let data = parseInt(PopSerialData() << 8); //左方8個bit
        let data2 = parseInt(PopSerialData());    //右方8個bit

        if (data2 < 0)
            data2 += 256;

        queueData = [[(data + data2), 0.0]];

        let series = new DataPoint(mXPoint++, (data + data2))
        G_Series.push(series);
        ExtendTraces("ppg", series);

        if (G_Series > 400)
            G_Series = G_Series.slice(-400);
        dataQ.push(queueData);
        dataPointCount++;
    }

    if (SizeIndex > 0 && (TempSize[0] + size) % 2 != 0) {
        SizeIndex = 0;
        TempSize = [1, 0];
    }
    else if (SizeIndex > 0 && (TempSize[0] + size) % 2 == 0) {
        SizeIndex = -1;
        TempSize = [0, 0];
    }



    // document.getElementById("test").innerHTML += list.join(',');
    handleInputData();
    SizeIndex++;
}

var cnt = 0;
function ExtendTraces(id, data) {
    if (!Stop_Flag) {
        Plotly.extendTraces(id, { y: [[data.getY()]] }, [0]);
        cnt++
        if (cnt > 500) {
            Plotly.relayout(id, {
                xaxis: {
                    range: [cnt - 500, cnt]
                }
            });
        }
    }
}

// 將 Queue 裡的資料 pop出來
function PopSerialData() {
    if (Queue_Index_Front == (SerialDataSize - 1))
        Queue_Index_Front = 0;
    return SerialData_Queue[Queue_Index_Front++];
}

//觸發聲音、更新Firebase
function handleInputData() {
    musicSetting();
    start_cal = true;
    //Triggering for FFT
    if (slidingWindowIsFull) {
        endPointer = dataPointCount - 1;
        if (dataPointCount >= windowSize) {
            startPointer = 0;
            slidingWindowIsFull = false;
            dataPointCount = 0;
        }
        else {
            fillWindowPhase++;
        }
    } else {
        if (dataPointCount >= updateEveryXPoint) {
            startPointer = startPointer + dataPointCount;
            endPointer = endPointer + dataPointCount;
            dataPointCount = 0;

            let paraData = [[]]; //double

            if (BPM) {
                paraData = [[BPM, 0]];
                HRDataSeries.push(paraData);
            }

            if (sig_small && mXPoint < 4500) {
                playMusic("signal_small.mp3")
                sig_small = false;
            }

            // let header = userName + "_" + selectedPara + "_" + PPGTime + "min" + "_" + nowDate();
            let header = "123";

            if (SDNN) {

                paraData = [[SDNN, 0]];
                SDNNDataSeries.push(paraData);
                firebase_SDNN();

            }
            if (HF) {
                paraData = [[HF, 0]];
                HFDataSeries.push(paraData);

                Upload_Firebase2(header, "hf", HF.toSTring());
            }

            if (!(params.postRecordPPGTime > 0 && mXPoint > post_start_mpoint) && (mXPoint > normal_breathing_size)) {
                if (ticking_enable) {
                    playMusic("onetick.mp3");
                }
                if (params.inhale_time != 0 && params.exhale_time != 0) {
                    if (exhale_ctr % (params.exhale_time) == 0) {
                        exhale_ctr = 0;
                        if (inhale_ctr == 0 && mXPoint >= (normal_breathing_size + 500)) {
                            playMusic("inhale.mp3");
                        }
                        inhale_ctr++;
                    }
                    if (inhale_ctr % (params.inhale_time + 1) == 0) {
                        inhale_ctr = 0;
                        if (exhale_ctr == 0 && mXPoint >= (normal_breathing_size + 500)) {
                            playMusic("exhale.mp3");
                        }

                        exhale_ctr++;
                    }
                }

            }

            if (breathRate) {

                BRDataSeries.push([[breathRate, 0]]);
                let br_str = Double.toString(breathRate);
                Upload_Firebase2(header, "br", `${breathRate}`);

            }
            let valueToPlot = 0;
            switch (selectedPara) {
                case "SDNN":
                    valueToPlot = SDNN;
                    break;
                case "HF":
                    valueToPlot = HF;
                    break;
                default:
                    valueToPlot = breathRate;
                    break;
            }

            G_Series2.push(new DataPoint(mXPointPara, valueToPlot));
            if (G_Series2.length > 200) {
                G_Series2 = G_Series2.slice(-200);
            }

            if (selectedPara == "SDNN" || selectedPara == "HF") {
                if (trigger_val > 0 && mXPoint > 4500 && valueToPlot > init_val && ((valueToPlot - init_val) >= trigger_val) && voice_ctr < params.feedback_time && error_flag == false) {
                    ring();
                    init_val += trigger_val;
                }
            }
            //Reference
            //Effects of slow breathing rate on heart rate variability and arterial baroreflex sensitivity in essential hypertension
            if (selectedPara == "Breathing rate") {
                if (trigger_val > 0 && mXPoint > 4500 && valueToPlot <= init_val && (((init_val + trigger_val) - valueToPlot) >= trigger_val) && voice_ctr < params.feedback_time && error_flag == false) {
                    ring();
                    init_val -= trigger_val;
                }
            }
        }
    }
}


function playMusic(fileName) {
    const music = new Audio(`./music/${fileName}`);
    music.play();
}

function musicSetting() {
    //歡迎光臨慢呼吸
    if (dataPointCount == updateEveryXPoint && slidingWindowIsFull == true)
        playMusic("greeting2.mp3");
    if (mXPoint == 575) // 我們將生物回饋的技巧運用在慢呼吸中
        playMusic("intro1_1.mp3");
    if (mXPoint == 900)  // 我們將PPG 相關參數
        playMusic("intro1_2.mp3");
    if (mXPoint == 1600)  // 有關本實驗...
        playMusic("intructions.mp3");
    if (mXPoint == normal_breathing_size) {
        if (params.feedback_time == 0) { //這是慢呼吸開始
            playMusic("m2_control.mp3");
        } else { // 這是慢呼吸開始，會有聲音回饋
            playMusic("m2.mp3");
        }

        init_val = this.params.input_init_val;
    }

    if (params.postRecordPPGTime > 0 && mXPoint == post_start_mpoint) //訓練後三分鐘正式開始
        playMusic("thirdmessage.mp3");
    if (mXPoint == finish_mpoint)  // 訓練結束
        playMusic("finish2.mp3");
}

function ring() {

    voice_ctr++;
    ringIdx = ringIdx % 12;
    ringIdx++;

    playMusic(`singingbowla${ringIdx}.mp3`);
    Toast.makeText(LInflater.getContext(), "觸發音效!", Toast.LENGTH_SHORT).show();
}

function firebase_SDNN() {
    Upload_Firebase2(header, "timestr", nowDate());
    Upload_Firebase2(header, "ppgstr", windowed_ppg_str);
    Upload_Firebase2(header, "config", `Inital value: ${init_Val}, Target value: ${params.target_val}, Feedback time: ${params.feedback_time}`);
    Upload_Firebase2(header, "feedback counter", `${voice_ctr}`);

    //for debugging
    Upload_Firebase2(header, "artilist0_str", artilist0_str);
    Upload_Firebase2(header, "artilist1_str", artilist1_str);
    Upload_Firebase2(header, "artilist2_str", artilist2_str);
    Upload_Firebase2(header, "rrlist_str", rrlist_str);
    Upload_Firebase2(header, "SDNN_thres_str", SDNN_thres_str);
    Upload_Firebase2(header, "SDNN_remeasure_str", SDNN_remeasure_str);
    Upload_Firebase2(header, "fft_window_SDNN_str", fft_window_SDNN_str);
    Upload_Firebase2(header, "fft_window_ROI_lower_Idx_str", fft_window_ROI_lower_Idx_str);
    Upload_Firebase2(header, "fft_window_RIIV_bpm_str", fft_window_RIIV_bpm_str);
    Upload_Firebase2(header, "fft_window_RIAV_bpm_str", fft_window_RIAV_bpm_str);
    Upload_Firebase2(header, "fft_window_RIFV_bpm_str", fft_window_RIFV_bpm_str);
    Upload_Firebase2(header, "skip_window_str", skip_window_str);
    Upload_Firebase2(header, "sdnn", `${SDNN}`);
}

function nowDate() {
    let date = new Date();
    let year = date.getFullYear();
    let month = (date.getMonth() + 1).toString().padStart(2, 0);
    let day = (date.getDate()).toString().padStart(2, 0);
    let hour = (date.getHours()).toString().padStart(2, 0);
    let min = (date.getMinutes()).toString().padStart(2, 0);
    let second = (date.getSeconds()).toString().padStart(2, 0);
    return `${year}-${month}-${day} ${hours}:${min}:${second}`;
}

function Upload_Firebase2(t, s, d) {
    t + - "_web"
    //TODO: 這邊要寫Web版的firebase
    const database = FirebaseDatabase.getInstance();//取得資料庫連結
    const myRef = database.getReference(t);//新增資料節點
    myRef.child(s).push().setValue(d);
}

function VarReset() {
    inhale_ctr = 0;
    exhale_ctr = 0;
    error_flag = false;
    //TODO : check exists
    //arti_detected = false;
    sig_small = false;
    //TODO : check exists
    //sig_big = false;
    HF = 0;
    SDNN = 0;
    RIFV_std = 0;


    // RIFV_power_thres = 0;
    // RIAV_power_thres = 0;
    // RIFV_SDNN_thres = 0;
    // RIFV_normal_slow_power_thres = 0;
    // RIIV_normal_slow_thres = 0;
    // RIAV_normal_slow_thres = 0;
    // brSDNNCtr = 0;
    //br_SDNN = 0;
    // timeStampsCtr = 0;
    Stop_Flag = false;
    //ptr = 0;
    // dataPointCtr = 0;
    // tempMax = 0;
    windowStartIdx = 0;
    windowEndIdx = parseInt(sliding_window_size);
    // feedbackBase = 10;
    // first_window = true;
    // numOfsubwin = 8;

    setButtonEnable(true);
    dataQ = [];
    HRDataSeries = [];
    SDNNDataSeries = [];
    HFDataSeries = [];
    BRDataSeries = [];
    start_cal = false;
    // sliding_window_enable = false;
    startPointer = 0;
    endPointer = 0;
    // recievedDataPoint = 1024;
    dataPointCount = 0;
    slidingWindowIsFull = true;
    // Preview_Flag = false; 沒用到
    BPM = 0;
    fillWindowPhase = 0;
    // time_tv.setText("0");

}

function finishAndUpload() {
    setTimeout(function () {
        if (Stop_Flag && mXPoint) {
            mXPoint = 0;
            keep_thread_running = false;
            alert("測量完畢，更新訓練紀錄!")

            if (HFDataSeries.getQSize() > 0 && BRDataSeries.getQSize() > 0 && SDNNDataSeries.getQSize() > 0) {
                let hf_arr = toArray(HFDataSeries, 0, HFDataSeries.length - 1, 0);
                let br_arr = toArray(BRDataSeries, 0, BRDataSeries.getQSize() - 1, 0);
                let sdnn_arr = toArray(SDNNDataSeries, 0, SDNNDataSeries.getQSize() - 1, 0);
                let hr_arr = toArray(HRDataSeries, 0, HRDataSeries.getQSize() - 1, 0);

                ShowData.maxSDNN = Math.round(findMaxVal(sdnn_arr) * 100.0) / 100.0;
                ShowData.minBR = Math.round(findMinVal(br_arr) * 100.0) / 100.0;
                ShowData.maxHF = Math.round(findMaxVal(hf_arr) * 100.0) / 100.0;
                ShowData.SDNNData = sdnn_arr;
                ShowData.HFData = hf_arr;
                ShowData.BRData = br_arr;
                ShowData.HRData = hr_arr;
            }
            VarReset();
        }
    }, 1000);
}

function toArray(data, start, end, index) {
    let size = end - start + 1;
    arr = [];

    for (let i = start, j = 0; i <= end; i++, j++) {
        peek = data[i];
        arr[j] = peek[0][index];

    }

    return arr;
}

function findMaxVal(arr) {
    let tempVal = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > tempVal) {
            tempVal = arr[i];
        }
    }
    return tempVal;
}


function ResetGraph() {
    // reset chart
    /* 
    graph:
        minX = 0
        maxX = 5
        maxY=1000
        minY = 200
        setYAxisBoundsManual = true,
        setHighlightZeroLines = false

    */

    G_Series = [];
    G_Series2 = [];

    mXPoint = 0;
    mXPointPara = 170;
    Time_GET = 0;
    Min_Time_GET = 0;
    Min_Time_Flag = 0;

    Queue_Index_Rear = 0;
    Queue_Index_Front = 0;

    SerialData_Queue = [];

    TempSize[0] = 0;
    TempSize[1] = 0;
    SizeIndex = 0;
}

//將資料轉成字串以便上傳
function arrayToString(a) {
    let ans = "";
    let l = a.length;
    for (let j = 0; j < l; j++) {
        ans = ans + a[j] + ',';
    }
    ans = '[' + ans + ']';
    return ans;
}

