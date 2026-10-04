/**
 * @format
 */

import { AppRegistry } from 'react-native';
// TODO(L2-01): Import and call `registerGlobals()` from '@livekit/react-native' BEFORE anything else runs.
//   It installs WebRTC globals (RTCPeerConnection, MediaStream…) that livekit-client expects to exist.
//   Common mistake: forgetting it → "ReferenceError: Property 'RTCPeerConnection' doesn't exist" / "WebRTC isn't detected".
// @sol-start L2-01 blank
import { registerGlobals } from '@livekit/react-native';
registerGlobals();
// @sol-end
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
