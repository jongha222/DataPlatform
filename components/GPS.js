import React, {useEffect} from 'react';
import Geolocation from 'react-native-geolocation-service';
// Android에서 위치 권한을 요청하고 플랫폼 별 조건을 처리하는 데 필요
import {PermissionsAndroid, Platform} from 'react-native';

//위치 데이터를 부모 컴포넌트에 전달하는 콜백 함수, 위치 업데이트 간격(10000밀리초)
const GPS = ({onLocation, interval = 10000}) => {
  //위치 권한 요청하는 함수
  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      //PermissionsAndroid.RESULTS.GRANTED : 사용자가 권한을 허용 함
      //PermissionsAndroid.RESULTS.DENIED : 사용자가 권한을 거부 함
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the location');
      } else {
        console.log('Location permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    const getCurrentLocation = () => {
      Geolocation.getCurrentPosition(
        position => {
          console.log(position);
          onLocation(position.coords);
        },
        error => {
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    };

    // 위치 권한 요청
    requestLocationPermission().then(() => {
      // 초기 위치 데이터 수집
      getCurrentLocation();

      // 주기적으로 위치 데이터를 수집
      const intervalId = setInterval(getCurrentLocation, interval);

      // 컴포넌트 언마운트 시 interval 정리
      return () => clearInterval(intervalId);
    });
  }, [onLocation, interval]);

  return null;
};

export default GPS;
