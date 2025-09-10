import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View, ViewProps } from 'react-native';
import { PixelRatio } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import uuid from 'react-native-uuid';
import WebView from 'react-native-webview';
import { XoaltService } from './XoaltService.ts';

type XoaltViewProps = ViewProps & {
  width: number;
  height: number;
  prebidId: string;
};

const fetchBanner = async (width: number, height: number, prebidId: string) => {
  const headers = new Headers();
  headers.append('Content-Type', 'application/json');

  const id = uuid.v4();

  const raw = {
    id,
    imp: [
      {
        id: uuid.v4(),
        instl: 0,
        clickbrowser: 1,
        secure: 1,
        banner: { format: [{ w: width, h: height }] },
        ext: { prebid: { storedrequest: { id: prebidId } } },
      },
    ],
    app: {
      name: DeviceInfo.getApplicationName(),
      bundle: DeviceInfo.getBundleId(),
      ver: `${DeviceInfo.getVersion()}:${DeviceInfo.getBuildNumber()}`,
      publisher: { id: XoaltService.getPublisherId() },
      ext: {
        data: { page: ['home'] },
        prebid: { source: 'prebid-mobile', version: '' },
      },
    },
    device: {
      ua: 'XoaltSDK/1.0 (ReactNative)',
      os: DeviceInfo.getSystemName(),
      ifa: DeviceInfo.getUniqueIdSync(),
    },
    regs: { ext: { gdpr: 0 } },
    user: {},
    source: { tid: id },
    ext: {
      prebid: {
        storedrequest: { id: XoaltService.getPublisherId() },
        cache: { bids: {} },
        targeting: {},
      },
    },
  };

  const requestOptions = {
    method: 'POST',
    headers,
    body: JSON.stringify(raw),
  };

  const response = await fetch('https://hb.xoalt.com/x-simb/', requestOptions);
  const result = await response.json();

  console.log(result);

  const seatBid = result.seatbid[0];

  if (!seatBid) {
    return null;
  }

  const bid = seatBid.bid[0];

  if (!bid) {
    return null;
  }

  return bid.adm;
};

export function XoaltView(props: XoaltViewProps) {
  const [html, setHtml] = React.useState(null);

  const injected = useMemo(
    () => `
          (function() {
            let vp = document.querySelector('meta[name=viewport]');
            
            if (!vp) {
              vp = document.createElement('meta');
              vp.setAttribute('name', 'viewport');
              document.head.appendChild(vp);
            }
            
            const ww = window.innerWidth;
            var mw = ${props.width};
            var ratio =  ww / mw - 1;
            
            vp.setAttribute('content', 'initial-scale=' + ratio + ', maximum-scale=' + ratio + ', minimum-scale=' + ratio + ', user-scalable=no, width=' + ww);
          })();
          
          true;
        `,
    [props.width],
  );

  useEffect(() => {
    fetchBanner(props.width, props.height, props.prebidId).then(_html => {
      setHtml(_html);
    });
  }, [props.width, props.height, props.prebidId]);

  const handleNavigation = (request: any) => {
    const url = request.url;
    if (url.startsWith(XoaltService.getDiscoveryDomain())) {
      XoaltService.onClickBanner({ url, prebidId: props.prebidId });

      return false;
    }

    return true;
  };

  const handleOpenWindow = (event: any) => {
    const url = event.nativeEvent.targetUrl as string;
    if (url.startsWith(XoaltService.getDiscoveryDomain())) {
      XoaltService.onClickBanner({ url, prebidId: props.prebidId });

      return false;
    }
  };

  if (!html) {
    return null;
  }

  return (
    <View
      style={{
        width: props.width / PixelRatio.get(),
        height: props.height / PixelRatio.get(),
        ...styles.container,
      }}
    >
      <WebView
        style={{
          ...styles.webView,
        }}
        originWhitelist={['*']}
        source={{ html, baseUrl: '' }}
        userAgent={'XoaltSDK/1.0 (ReactNative)'}
        onShouldStartLoadWithRequest={handleNavigation}
        onOpenWindow={handleOpenWindow}
        injectedJavaScript={injected}
        scalesPageToFit={true} // Android: fit content to WebView
        javaScriptEnabled
        automaticallyAdjustContentInsets={false}
        contentMode="mobile" // iOS: use mobile viewport rules
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { maxWidth: Dimensions.get('window').width },
  webView: { flex: 1 },
});
