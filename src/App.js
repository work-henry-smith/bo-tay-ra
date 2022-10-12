import './App.css';
import {useEffect, useRef, useState} from 'react';
// import {Howl} from 'howler';
// import soundURL from './assets/hey_sondn.mp3';

// var sound = new Howl({
//   src: [soundURL]
// });
// sound.play();

const NOT_TOUCH_LABEL = 'not_touch';
const TOUCHED_LABEL = 'touched';
const TRAINING_TIMES = 50;
const TOUCHED_CONFIDENCE = 0.8;

const tf = require('@tensorflow/tfjs');
const mobilenet = require('@tensorflow-models/mobilenet');
const knnClassifier = require('@tensorflow-models/knn-classifier');

function App() {

  const video = useRef();
  const classifier = useRef();
  const mobilenetModule = useRef();

  const [touched, setTouched] = useState(false);

  const init = async() => {
    await setUpCamera();
    classifier.current = knnClassifier.create();
    mobilenetModule.current = await mobilenet.load();
  };

  const setUpCamera = () => {

    return new Promise((resolve, reject) => {

      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
      
      if (navigator.getUserMedia) {
        navigator.getUserMedia({video:true}, stream => {
          video.current.srcObject = stream;
          video.current.addEventListener('loadeddata', resolve);
        }, error => reject(error))
      } else {
        reject();
      }
    })
  };

  const train = async label => {
    for (let i = 0; i < TRAINING_TIMES; ++i) {;
      console.log(`Progress ${parseInt((i+1)/TRAINING_TIMES*100)}%`);
      await training(label);
    }
  };

  const training = label => {
    return new Promise(async resolve => {
      const embedding = mobilenetModule.current.infer(
        video.current,
        true
      );

      classifier.current.addExample(embedding, label);
      await sleep(100);
      resolve();
    })
  };

  const run = async () => {
    const embedding = mobilenetModule.current.infer(
      video.current,
      true
    );

    const result = await classifier.current.predictClass(embedding);

    if (result.label === TOUCHED_LABEL && result.confidences[result.label] > TOUCHED_CONFIDENCE) {
      setTouched(true);
    } else {
      setTouched(false);
    }

    await sleep(200);

    run();
  }

  const sleep = (ms=0) => {
    return new Promise(resolve => setTimeout(resolve,ms))
  };

  useEffect(() => {
    init();
    return () => {}
  },[]);
  
  return (
    <div className="main">
      <video ref={video} className='video' autoPlay />

      <div className='control'>
        <button className='btn' onClick={() => train(NOT_TOUCH_LABEL)}>Train 1</button>
        <button className='btn' onClick={() => train(TOUCHED_LABEL)}>Train 2</button>
        <button className='btn' onClick={() => run()}>Run</button>
      </div>
    </div>
  );
}

export default App;
