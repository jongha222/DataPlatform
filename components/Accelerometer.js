import React, {useEffect, useState} from 'react';
import {
  accelerometer,
  setUpdateIntervalForType, //업데이트 간격 설정 함수
  SensorTypes, //센서 타입 정의 함수
} from 'react-native-sensors';

const Accelerometer = ({onData}) => {
  //onData는 가속도계 데이터를 부모 컴포넌트로 전달
  const [data, setData] = useState({x: 0, y: 0, z: 0});
  //data라는 상태 변수를 초기값으로 정의, setData는 상태 업데이트 하는 함수
  useEffect(() => {
    if (setUpdateIntervalForType && SensorTypes && accelerometer) {
      //각각의 변수가 정의 되었는지 확인
      setUpdateIntervalForType(SensorTypes.accelerometer, 1000);
      //업데이트 간격 1000밀리초로 설정

      const subscription = accelerometer.subscribe(
        ({x, y, z}) => {
          const sensorData = {x, y, z};
          setData(sensorData);
          onData(sensorData);
        },
        error => console.log('Accelerometer error:', error),
      );

      return () => subscription.unsubscribe();
    } else {
      console.log('Sensors module not available');
    }
  }, [onData]);

  return null;
};

export default Accelerometer;
