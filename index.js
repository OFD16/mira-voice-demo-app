/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { registerGlobals } from '@livekit/react-native';
// L2-01: installs WebRTC globals (RTCPeerConnection, MediaStream…) that livekit-client expects to exist.
// Must run before the app renders/connects. Forgetting it → "WebRTC isn't detected".
registerGlobals();
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
