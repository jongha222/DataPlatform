import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  SensorTypes,
  setUpdateIntervalForType,
  accelerometer,
  gyroscope,
  magnetometer,
  barometer,
} from 'react-native-sensors';
import {map, filter} from 'rxjs/operators';

const App = () => {
  const [pressure, setPressure] = useState(null);

  useEffect(() => {
    // 센서 업데이트 간격 설정 (밀리초 단위)
    setUpdateIntervalForType(SensorTypes.barometer, 1000); // 1초 간격

    // 바로미터(기압계) 데이터 구독
    const subscription = barometer
      .pipe(map(({pressure}) => pressure))
      .subscribe(
        pressure => setPressure(pressure),
        error => console.log('The sensor is not available'),
      );

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Current Pressure: {pressure ? `${pressure} hPa` : 'N/A'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
});

export default App;
